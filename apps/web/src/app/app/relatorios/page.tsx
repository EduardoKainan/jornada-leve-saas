import { ReportList } from '@/components/reports/report-list';
import { getEffectiveReportStatus, REPORT_SECTIONS, type ReportSection } from '@/lib/reports';
import { createClient } from '@/lib/supabase/server';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('report_jobs').select('id, period_start, period_end, sections_json, status, expires_at, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100);
  const validSections = new Set<string>(REPORT_SECTIONS);
  const reports = (data ?? []).map((report) => ({
    ...report,
    sections_json: Array.isArray(report.sections_json) ? report.sections_json.filter((section): section is ReportSection => typeof section === 'string' && validSections.has(section)) : [],
    status: getEffectiveReportStatus(report.status, report.expires_at),
  }));
  return <div className="space-y-6"><ReportList reports={reports} loadError={Boolean(error)} /></div>;
}
