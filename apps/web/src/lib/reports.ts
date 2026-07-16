import { createHash } from 'node:crypto';
import { jsPDF } from 'jspdf';
import { z } from 'zod';

async function adminClient() {
  const { createAdminClient } = await import('./supabase/admin.ts');
  return createAdminClient();
}

export const REPORT_SECTIONS = ['weight', 'measurements', 'checkins', 'routines', 'appointments'] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];
export type ReportPeriod = { start: string; end: string };
export type EffectiveReportStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'expired';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const validIsoDate = z.string().regex(isoDate).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Informe uma data válida.');
const periodSchema = z.discriminatedUnion('preset', [
  z.object({ preset: z.enum(['7d', '30d', '90d']) }),
  z.object({ preset: z.literal('custom'), start: validIsoDate, end: validIsoDate }),
]);

export const reportRequestSchema = z.object({
  period: periodSchema,
  sections: z.array(z.enum(REPORT_SECTIONS)).min(1, 'Selecione pelo menos uma seção.').max(REPORT_SECTIONS.length),
}).superRefine(({ period }, context) => {
  if (period.preset === 'custom' && period.start > period.end) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'A data inicial deve ser anterior à data final.', path: ['period', 'start'] });
  }
  if (period.preset === 'custom' && new Date(`${period.end}T00:00:00.000Z`).getTime() - new Date(`${period.start}T00:00:00.000Z`).getTime() > 365 * 86_400_000) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'O período personalizado pode ter no máximo 365 dias.', path: ['period', 'end'] });
  }
});

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function resolveReportPeriod(period: z.infer<typeof periodSchema>, now = new Date()): ReportPeriod {
  if (period.preset === 'custom') {
    if (period.start > period.end) throw new Error('A data inicial deve ser anterior à data final.');
    return { start: period.start, end: period.end };
  }
  const days = period.preset === '7d' ? 7 : period.preset === '30d' ? 30 : 90;
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { start: dateKey(start), end: dateKey(end) };
}

export function getEffectiveReportStatus(status: string, expiresAt: string | null, now = new Date()): EffectiveReportStatus {
  if (status === 'ready' && expiresAt && new Date(expiresAt).getTime() <= now.getTime()) return 'expired';
  if (status === 'pending' || status === 'processing' || status === 'ready' || status === 'failed') return status;
  return 'failed';
}

function retentionDays() {
  const configured = Number(process.env.REPORT_RETENTION_DAYS ?? '30');
  return Number.isInteger(configured) && configured >= 1 && configured <= 365 ? configured : 30;
}

function nextDate(date: string) {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + 1);
  return dateKey(result);
}

function formatDate(value: string) {
  const normalized = value.length === 10 ? `${value}T12:00:00.000Z` : value;
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(normalized));
}

function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

type WeightRow = { weight_kg: string | number; measured_at: string };
type MeasurementRow = { measurement_type: string; value_cm: string | number; custom_label: string | null; measured_at: string };
type CheckinRow = { checkin_date: string; hunger_level: number | null; energy_level: number | null; sleep_quality: number | null; activity_level: string | null; water_ml: number | null };
type RoutineRow = { scheduled_at: string; status: string; completed_at: string | null; routine_plans: { user_entered_name: string } | { user_entered_name: string }[] | null };
type AppointmentRow = { starts_at: string; professional_name: string | null; location_type: string | null };

type ReportData = {
  displayName: string;
  weights: WeightRow[];
  measurements: MeasurementRow[];
  checkins: CheckinRow[];
  routines: RoutineRow[];
  appointments: AppointmentRow[];
};

const sectionLabels: Record<ReportSection, string> = {
  weight: 'Peso',
  measurements: 'Medidas',
  checkins: 'Check-ins',
  routines: 'Rotinas',
  appointments: 'Consultas',
};

const measurementLabels: Record<string, string> = {
  waist: 'Cintura', hip: 'Quadril', chest: 'Peito', arm: 'Braço', thigh: 'Coxa', abdomen: 'Abdômen', calf: 'Panturrilha', neck: 'Pescoço',
};

async function loadReportData(userId: string, sections: ReportSection[], period: ReportPeriod): Promise<ReportData> {
  const admin = await adminClient();
  const from = `${period.start}T00:00:00.000Z`;
  const until = `${nextDate(period.end)}T00:00:00.000Z`;
  const wants = (section: ReportSection) => sections.includes(section);
  const [profileResult, weightsResult, measurementsResult, checkinsResult, routinesResult, appointmentsResult] = await Promise.all([
    admin.from('profiles').select('display_name').eq('id', userId).single(),
    wants('weight') ? admin.from('weight_entries').select('weight_kg, measured_at').eq('user_id', userId).gte('measured_at', from).lt('measured_at', until).order('measured_at') : Promise.resolve({ data: [], error: null }),
    wants('measurements') ? admin.from('measurement_entries').select('measurement_type, value_cm, custom_label, measured_at').eq('user_id', userId).gte('measured_at', from).lt('measured_at', until).order('measured_at') : Promise.resolve({ data: [], error: null }),
    wants('checkins') ? admin.from('daily_checkins').select('checkin_date, hunger_level, energy_level, sleep_quality, activity_level, water_ml').eq('user_id', userId).gte('checkin_date', period.start).lte('checkin_date', period.end).order('checkin_date') : Promise.resolve({ data: [], error: null }),
    wants('routines') ? admin.from('routine_events').select('scheduled_at, status, completed_at, routine_plans(user_entered_name)').eq('user_id', userId).gte('scheduled_at', from).lt('scheduled_at', until).order('scheduled_at') : Promise.resolve({ data: [], error: null }),
    wants('appointments') ? admin.from('appointments').select('starts_at, professional_name, location_type').eq('user_id', userId).gte('starts_at', from).lt('starts_at', until).order('starts_at') : Promise.resolve({ data: [], error: null }),
  ]);
  const firstError = [profileResult.error, weightsResult.error, measurementsResult.error, checkinsResult.error, routinesResult.error, appointmentsResult.error].find(Boolean);
  if (firstError || !profileResult.data) throw new Error(firstError?.message ?? 'Perfil não encontrado.');
  return {
    displayName: profileResult.data.display_name,
    weights: (weightsResult.data ?? []) as WeightRow[],
    measurements: (measurementsResult.data ?? []) as MeasurementRow[],
    checkins: (checkinsResult.data ?? []) as CheckinRow[],
    routines: (routinesResult.data ?? []) as RoutineRow[],
    appointments: (appointmentsResult.data ?? []) as AppointmentRow[],
  };
}

function buildPdf(data: ReportData, sections: ReportSection[], period: ReportPeriod) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 16;
  let y = 18;

  const footer = () => {
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setDrawColor(220, 225, 220);
      pdf.line(margin, height - 15, width - margin, height - 15);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 105, 100);
      pdf.text(`Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`, margin, height - 9);
      pdf.text(`Jornada Leve Tecnologia Ltda.  •  Página ${page} de ${pages}`, width - margin, height - 9, { align: 'right' });
    }
  };
  const ensure = (space: number) => {
    if (y + space <= height - 22) return;
    pdf.addPage();
    y = 18;
  };
  const heading = (title: string) => {
    ensure(15);
    pdf.setFillColor(239, 247, 241);
    pdf.roundedRect(margin, y - 6, width - margin * 2, 11, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(35, 92, 58);
    pdf.text(title, margin + 4, y + 1);
    y += 12;
  };
  const paragraph = (text: string, color: [number, number, number] = [55, 60, 55]) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, width - margin * 2) as string[];
    ensure(lines.length * 4.5 + 3);
    pdf.text(lines, margin, y);
    y += lines.length * 4.5 + 3;
  };
  const table = (headers: string[], rows: string[][], widths: number[]) => {
    ensure(12);
    const rowHeight = 7;
    const renderRow = (cells: string[], isHeader: boolean) => {
      ensure(rowHeight);
      let x = margin;
      if (isHeader) { pdf.setFillColor(241, 244, 241); pdf.rect(margin, y - 5, width - margin * 2, rowHeight, 'F'); }
      pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(45, 50, 45);
      cells.forEach((cell, index) => { pdf.text(String(cell).slice(0, 38), x + 1, y); x += widths[index] ?? 25; });
      y += rowHeight;
    };
    renderRow(headers, true);
    rows.forEach((row) => renderRow(row, false));
    y += 3;
  };
  const chart = (values: number[], label: string) => {
    if (values.length < 2) return;
    ensure(45);
    const chartX = margin + 5;
    const chartY = y;
    const chartW = width - margin * 2 - 10;
    const chartH = 32;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    pdf.setDrawColor(215, 220, 215);
    pdf.rect(chartX, chartY, chartW, chartH);
    pdf.setDrawColor(55, 145, 85);
    pdf.setLineWidth(0.8);
    values.forEach((value, index) => {
      if (index === 0) return;
      const previous = values[index - 1] ?? value;
      const x1 = chartX + ((index - 1) / (values.length - 1)) * chartW;
      const x2 = chartX + (index / (values.length - 1)) * chartW;
      const y1 = chartY + chartH - ((previous - min) / span) * chartH;
      const y2 = chartY + chartH - ((value - min) / span) * chartH;
      pdf.line(x1, y1, x2, y2);
    });
    pdf.setFontSize(8);
    pdf.setTextColor(90, 95, 90);
    pdf.text(`${label}: ${formatNumber(min)} a ${formatNumber(max)}`, chartX, chartY + chartH + 5);
    y += chartH + 10;
  };

  pdf.setFillColor(42, 125, 73);
  pdf.circle(margin + 6, y - 2, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('JL', margin + 6, y, { align: 'center' });
  pdf.setTextColor(32, 45, 35);
  pdf.setFontSize(20);
  pdf.text('Jornada Leve', margin + 16, y + 1);
  y += 13;
  pdf.setFontSize(15);
  pdf.text(`Relatório de acompanhamento — ${data.displayName}`, margin, y);
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(85, 90, 85);
  pdf.text(`Período: ${formatDate(period.start)} a ${formatDate(period.end)}`, margin, y);
  y += 10;
  pdf.setFillColor(255, 248, 226);
  pdf.roundedRect(margin, y - 5, width - margin * 2, 17, 2, 2, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(105, 75, 20);
  const disclaimer = 'Relatório gerado pelo usuário. Dados informados pelo próprio. Não substitui orientação médica.';
  pdf.text(pdf.splitTextToSize(disclaimer, width - margin * 2 - 8), margin + 4, y + 1);
  y += 20;

  if (sections.includes('weight')) {
    heading('Peso');
    if (!data.weights.length) paragraph('Nenhum registro de peso encontrado no período.');
    else {
      const values = data.weights.map((row) => Number(row.weight_kg));
      table(['Data', 'Peso', 'Variação'], data.weights.map((row, index) => {
        const value = Number(row.weight_kg);
        const previous = index > 0 ? Number(data.weights[index - 1]?.weight_kg) : null;
        const change = previous === null ? '—' : `${value - previous > 0 ? '+' : ''}${formatNumber(value - previous)} kg`;
        return [formatDate(row.measured_at), `${formatNumber(value)} kg`, change];
      }), [55, 55, 55]);
      chart(values, 'Faixa de peso');
    }
  }
  if (sections.includes('measurements')) {
    heading('Medidas');
    if (!data.measurements.length) paragraph('Nenhum registro de medidas encontrado no período.');
    else {
      table(['Data', 'Medida', 'Valor'], data.measurements.map((row) => [formatDate(row.measured_at), row.custom_label || measurementLabels[row.measurement_type] || row.measurement_type, `${formatNumber(Number(row.value_cm))} cm`]), [55, 70, 40]);
      chart(data.measurements.map((row) => Number(row.value_cm)), 'Faixa das medidas registradas');
    }
  }
  if (sections.includes('checkins')) {
    heading('Check-ins');
    if (!data.checkins.length) paragraph('Nenhum check-in encontrado no período.');
    else {
      const average = (key: 'hunger_level' | 'energy_level' | 'sleep_quality') => {
        const values = data.checkins.map((row) => row[key]).filter((value): value is number => value !== null);
        return values.length ? formatNumber(values.reduce((sum, value) => sum + value, 0) / values.length) : '—';
      };
      paragraph(`${data.checkins.length} check-in(s). Médias: fome ${average('hunger_level')}/5, energia ${average('energy_level')}/5 e sono ${average('sleep_quality')}/5.`);
      table(['Data', 'Fome', 'Energia', 'Sono', 'Água'], data.checkins.map((row) => [formatDate(row.checkin_date), row.hunger_level?.toString() ?? '—', row.energy_level?.toString() ?? '—', row.sleep_quality?.toString() ?? '—', row.water_ml ? `${row.water_ml} ml` : '—']), [43, 27, 30, 27, 38]);
    }
  }
  if (sections.includes('routines')) {
    heading('Rotinas');
    if (!data.routines.length) paragraph('Nenhum evento de rotina encontrado no período.');
    else table(['Data', 'Rotina', 'Status'], data.routines.map((row) => {
      const plan = Array.isArray(row.routine_plans) ? row.routine_plans[0] : row.routine_plans;
      const status = row.status === 'completed' ? 'Concluída' : row.status === 'skipped' ? 'Ignorada' : 'Pendente';
      return [formatDate(row.scheduled_at), plan?.user_entered_name ?? 'Rotina', status];
    }), [55, 75, 35]);
  }
  if (sections.includes('appointments')) {
    heading('Consultas');
    if (!data.appointments.length) paragraph('Nenhuma consulta encontrada no período.');
    else table(['Data', 'Profissional', 'Modalidade'], data.appointments.map((row) => [formatDate(row.starts_at), row.professional_name ?? 'Não informado', row.location_type === 'online' ? 'Online' : row.location_type === 'in_person' ? 'Presencial' : 'Não informada']), [55, 70, 40]);
  }

  ensure(22);
  pdf.setFillColor(248, 249, 248);
  pdf.roundedRect(margin, y, width - margin * 2, 15, 2, 2, 'F');
  y += 6;
  paragraph(disclaimer, [95, 75, 35]);
  footer();
  return Buffer.from(pdf.output('arraybuffer'));
}

async function ensureReportsBucket() {
  const admin = await adminClient();
  const { data, error } = await admin.storage.getBucket('reports');
  if (data) return;
  if (error && !/not found/i.test(error.message)) throw error;
  const { error: createError } = await admin.storage.createBucket('reports', { public: false, fileSizeLimit: 10 * 1024 * 1024, allowedMimeTypes: ['application/pdf'] });
  if (createError && !/already exists/i.test(createError.message)) throw createError;
}

export async function generateReportPdf(userId: string, reportJobId: string, sections: ReportSection[], period: ReportPeriod) {
  const admin = await adminClient();
  const { data: claimed, error: claimError } = await admin.from('report_jobs').update({ status: 'processing' }).eq('id', reportJobId).eq('user_id', userId).eq('status', 'pending').select('id').maybeSingle();
  if (claimError || !claimed) throw new Error(claimError?.message ?? 'Relatório não está pendente.');
  try {
    const data = await loadReportData(userId, sections, period);
    const pdf = buildPdf(data, sections, period);
    const checksum = createHash('sha256').update(pdf).digest('hex');
    const storagePath = `${userId}/${reportJobId}.pdf`;
    await ensureReportsBucket();
    const { error: uploadError } = await admin.storage.from('reports').upload(storagePath, pdf, { contentType: 'application/pdf', upsert: true, cacheControl: '3600' });
    if (uploadError) throw uploadError;
    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + retentionDays());
    const { data: updated, error: updateError } = await admin.from('report_jobs').update({ status: 'ready', storage_path: storagePath, checksum, expires_at: expiresAt.toISOString() }).eq('id', reportJobId).eq('user_id', userId).eq('status', 'processing').select('id').maybeSingle();
    if (updateError || !updated) {
      await admin.storage.from('reports').remove([storagePath]);
      throw updateError ?? new Error('O job foi removido durante a geração.');
    }
    return { storagePath, checksum, expiresAt: expiresAt.toISOString(), size: pdf.byteLength };
  } catch (error) {
    await admin.from('report_jobs').update({ status: 'failed' }).eq('id', reportJobId).eq('user_id', userId);
    throw error;
  }
}

export { sectionLabels };
