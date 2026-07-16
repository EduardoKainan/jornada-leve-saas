import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileDown,
  HeartPulse,
  Instagram,
  LineChart,
  LockKeyhole,
  Mail,
  Menu,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Acompanhe seu tratamento com dados reais',
  description:
    'Registre peso, medidas e sintomas, acompanhe sua evolução e gere relatórios para suas consultas. Teste o Jornada Leve grátis por 7 dias.',
  alternates: { canonical: '/' },
  keywords: [
    'acompanhamento Mounjaro',
    'acompanhamento Wegovy',
    'acompanhamento Ozempic',
    'diário de tratamento',
    'registro de peso e medidas',
  ],
  openGraph: {
    title: 'Jornada Leve — seu tratamento acompanhado com dados reais',
    description:
      'Organize peso, medidas e sintomas e leve um relatório claro para sua próxima consulta.',
    url: '/',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/landing/hero-mockup.jpg',
        width: 1672,
        height: 941,
        alt: 'Aplicativo Jornada Leve com gráfico de evolução e calendário de tratamento',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jornada Leve — acompanhe seu tratamento com dados reais',
    description: 'Registros simples, gráficos automáticos e relatórios para sua consulta.',
    images: ['/landing/hero-mockup.jpg'],
  },
};

const features = [
  {
    icon: ClipboardCheck,
    title: 'Check-in em 30 segundos',
    description: 'Anote como você está, sem transformar o cuidado em mais uma tarefa pesada.',
  },
  {
    icon: LineChart,
    title: 'Gráfico de peso automático',
    description: 'Veja períodos de 30, 90 ou 180 dias e entenda a evolução além de um número isolado.',
  },
  {
    icon: CalendarDays,
    title: 'Calendário de medicamentos',
    description: 'Organize as aplicações e mantenha o histórico do tratamento em um só lugar.',
  },
  {
    icon: FileDown,
    title: 'Relatório para consulta em PDF',
    description: 'Reúna os registros importantes em um documento claro para compartilhar com seu médico.',
  },
  {
    icon: Bell,
    title: 'Lembretes por e-mail',
    description: 'Receba lembretes gentis para não deixar o acompanhamento para depois.',
  },
  {
    icon: LockKeyhole,
    title: '100% anônimo e seguro',
    description: 'Seus dados são protegidos com criptografia e tratados de acordo com a LGPD.',
  },
];

const testimonials = [
  {
    initials: 'MC',
    name: 'Marina C.',
    city: 'Campinas, SP',
    quote:
      'Na consulta, consegui mostrar as mudanças das últimas semanas sem procurar anotações espalhadas. A conversa ficou muito mais objetiva.',
  },
  {
    initials: 'RL',
    name: 'Rafael L.',
    city: 'Curitiba, PR',
    quote:
      'O check-in é rápido e o gráfico me ajuda a enxergar o período todo, não só o peso daquele dia.',
  },
  {
    initials: 'AS',
    name: 'Ana S.',
    city: 'Recife, PE',
    quote:
      'Eu sempre esquecia de registrar sintomas. Agora chego à nutricionista com as informações organizadas no relatório.',
  },
];

const faqs = [
  {
    question: 'O Jornada Leve substitui minha consulta médica?',
    answer:
      'Não. O Jornada Leve é uma ferramenta de organização e acompanhamento pessoal. Ele não faz diagnósticos, não prescreve tratamentos e não substitui a orientação do seu médico ou nutricionista.',
  },
  {
    question: 'Posso usar com Mounjaro, Wegovy ou Ozempic?',
    answer:
      'Sim. Você pode organizar os registros do seu tratamento com esses e outros medicamentos. O aplicativo não recomenda medicamentos nem doses: ele apenas registra as informações que você inserir.',
  },
  {
    question: 'Meu médico consegue ver meus dados?',
    answer:
      'Somente se você quiser. Seus dados não são enviados automaticamente. Você decide quando gerar e compartilhar o relatório em PDF durante ou antes da consulta.',
  },
  {
    question: 'Meus dados ficam seguros?',
    answer:
      'Sim. Usamos criptografia na aplicação e práticas de proteção alinhadas à LGPD para manter suas informações privadas e sob seu controle.',
  },
  {
    question: 'Como cancelar?',
    answer:
      'Você pode cancelar a qualquer momento, sem burocracia. O cancelamento impede novas cobranças e seu acesso continua até o fim do período já pago.',
  },
  {
    question: 'Preciso de cartão de crédito?',
    answer:
      'Não. Você pode começar o período grátis de 7 dias sem cadastrar cartão de crédito.',
  },
];

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Jornada Leve',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  inLanguage: 'pt-BR',
  description:
    'Aplicativo para registrar peso, medidas e sintomas, acompanhar a evolução e gerar relatórios para consultas.',
  offers: [
    { '@type': 'Offer', name: 'Teste grátis', price: '0', priceCurrency: 'BRL' },
    { '@type': 'Offer', name: 'Plano mensal', price: '29.90', priceCurrency: 'BRL' },
    { '@type': 'Offer', name: 'Plano anual', price: '249.90', priceCurrency: 'BRL' },
  ],
};

const primaryButton =
  'group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-center text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(5,150,105,.7)] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2';

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-hidden bg-[#fbfdfb] text-slate-950 selection:bg-emerald-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <header className="absolute inset-x-0 top-0 z-30 border-b border-white/15 bg-[#063d32]/50 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="Jornada Leve — início" className="flex items-center gap-2.5 text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm">
              <HeartPulse className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">Jornada Leve</span>
          </Link>
          <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
            <a href="#como-funciona" className="text-sm font-medium text-emerald-50/80 transition hover:text-white">
              Como funciona
            </a>
            <a href="#recursos" className="text-sm font-medium text-emerald-50/80 transition hover:text-white">
              Recursos
            </a>
            <a href="#planos" className="text-sm font-medium text-emerald-50/80 transition hover:text-white">
              Planos
            </a>
            <a href="#faq" className="text-sm font-medium text-emerald-50/80 transition hover:text-white">
              Dúvidas
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/entrar" className="hidden text-sm font-semibold text-white transition hover:text-emerald-100 sm:block">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Testar grátis
            </Link>
            <Menu className="size-5 text-white md:hidden" aria-hidden="true" />
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[#063d32] pb-20 pt-31 text-white sm:pb-24 sm:pt-36 lg:min-h-[760px] lg:pb-28 lg:pt-40">
          <Image
            src="/landing/hero-gradient.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover opacity-70"
          />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(52,211,153,.22),transparent_30%),linear-gradient(90deg,rgba(3,48,39,.92)_0%,rgba(3,48,39,.66)_52%,rgba(3,48,39,.18)_100%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:px-10">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-emerald-50 backdrop-blur-sm sm:text-sm">
                <Sparkles className="size-4 text-emerald-300" aria-hidden="true" />
                Seu tratamento. Seus dados. Mais clareza.
              </div>
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl xl:text-[4.5rem]">
                Seu tratamento com Mounjaro merece um acompanhamento à altura.
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-emerald-50/85 sm:text-xl">
                Registre peso, medidas e sintomas em segundos. Chegue na consulta com dados reais — não com achismo.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link href="/cadastro" className={`${primaryButton} bg-white text-emerald-800 hover:bg-emerald-50`}>
                  Começar grátis por 7 dias
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <p className="flex items-center gap-2 text-sm text-emerald-50/75">
                  <CheckCircle2 className="size-4 text-emerald-300" aria-hidden="true" />
                  Sem cartão de crédito
                </p>
              </div>
              <p className="mt-5 text-xs text-emerald-50/60">
                Ao continuar, você será direcionado ao cadastro com os termos de privacidade e consentimento LGPD.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:translate-x-8">
              <div className="absolute -inset-8 rounded-full bg-emerald-300/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-2.5 shadow-[0_40px_100px_-35px_rgba(0,0,0,.65)] backdrop-blur-sm sm:p-3.5">
                <Image
                  src="/landing/hero-mockup.jpg"
                  alt="Mockup do Jornada Leve exibindo gráfico de peso e calendário do tratamento"
                  width={1672}
                  height={941}
                  priority
                  sizes="(max-width: 1024px) 92vw, 50vw"
                  className="h-auto w-full rounded-[1.35rem] object-cover"
                />
              </div>
              <div className="absolute -bottom-5 left-3 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-900 shadow-xl sm:-left-6 sm:bottom-8">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FileDown className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <strong className="block text-sm">Relatório pronto</strong>
                  <span className="text-xs text-slate-500">Dados organizados para a consulta</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f3f8f5] py-20 sm:py-28" aria-labelledby="problema-title">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-10">
            <div>
              <span className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">A rotina real</span>
              <h2 id="problema-title" className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Você começa o tratamento cheio de expectativa. Mas depois de algumas semanas...
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Registros ficam espalhados, a memória falha e uma consulta importante chega antes que você perceba.
              </p>
              <Link href="/cadastro" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 underline decoration-emerald-300 decoration-2 underline-offset-4 transition hover:text-emerald-900">
                Organizar meu acompanhamento
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'Será que o medicamento tá fazendo efeito mesmo?',
                'Esqueceu quanto pesava mês passado?',
                'Seu médico perguntou e você não soube responder?',
                'Tá pagando caro no tratamento e não sabe se tá valendo a pena?',
              ].map((pain, index) => (
                <div key={pain} className={`rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_-30px_rgba(15,23,42,.35)] ${index % 2 ? 'sm:translate-y-5' : ''}`}>
                  <span className="mb-5 grid size-9 place-items-center rounded-full bg-amber-50 text-sm font-bold text-amber-700">0{index + 1}</span>
                  <p className="text-lg font-semibold leading-7 text-slate-800">“{pain}”</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="py-20 sm:py-28" aria-labelledby="solucao-title">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">Simples por escolha</span>
              <h2 id="solucao-title" className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
                O Jornada Leve é o diário do seu tratamento.
              </h2>
              <p className="mt-5 text-lg text-slate-600">Em menos de 1 minuto por dia, você registra, acompanha e compartilha o que importa.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { image: '/landing/ilustracao-registre.jpg', alt: 'Mão segurando celular com check-in', step: '01', title: 'Registre', text: 'Peso, medidas e sintomas. Rápido, simples e direto do celular.' },
                { image: '/landing/ilustracao-acompanhe.jpg', alt: 'Gráfico de linha com pontos de evolução', step: '02', title: 'Acompanhe', text: 'Gráficos automáticos ajudam a visualizar sua evolução real ao longo do tempo.' },
                { image: '/landing/ilustracao-compartilhe.jpg', alt: 'Documento PDF com ícone de compartilhamento e estetoscópio', step: '03', title: 'Compartilhe', text: 'Gere um relatório em PDF para levar à consulta quando você quiser.' },
              ].map((item) => (
                <article key={item.title} className="group overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white shadow-[0_18px_60px_-35px_rgba(6,78,59,.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-35px_rgba(6,78,59,.4)]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-emerald-50">
                    <Image src={item.image} alt={item.alt} fill loading="lazy" sizes="(max-width: 768px) 92vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <div className="p-7">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">{item.title}</h3>
                      <span className="text-sm font-bold text-emerald-600">{item.step}</span>
                    </div>
                    <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="recursos" className="bg-[#073f34] py-20 text-white sm:py-28" aria-labelledby="recursos-title">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-3xl">
              <span className="text-sm font-bold uppercase tracking-[.16em] text-emerald-300">Tudo no lugar</span>
              <h2 id="recursos-title" className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
                Menos tempo organizando. Mais clareza para cuidar de você.
              </h2>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <article key={title} className="bg-[#073f34] p-7 transition hover:bg-[#0a493c] sm:p-8">
                  <span className="grid size-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold">{title}</h3>
                  <p className="mt-3 leading-7 text-emerald-50/70">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ Alimentação — Mounjaro ═══════ */}
        <section className="bg-gradient-to-b from-white to-green-50 py-20 sm:py-28" aria-labelledby="alimentacao-title">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-xs font-semibold text-green-700 uppercase tracking-wide">
                Dicas práticas
              </span>
              <h2 id="alimentacao-title" className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
                O que comer no dia a dia com Mounjaro?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Pequenas escolhas fazem diferença. Separei sugestões simples com comidas típicas brasileiras
                que ajudam a manter uma alimentação equilibrada durante o tratamento.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card 1 */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-2xl">🥗</div>
                <h3 className="mt-4 font-semibold text-lg">Café da manhã leve</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Fruta picada (mamão, banana, maçã) com aveia e um fio de mel. Ou tapioca recheada com
                  queijo branco e orégano. Rápido, prático e não pesa no estômago.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-2xl">🍛</div>
                <h3 className="mt-4 font-semibold text-lg">Almoço equilibrado</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Arroz, feijão, salada verde e uma proteína magra (frango grelhado, peixe, ovo). 
                  O clássico brasileiro continua sendo uma das refeições mais completas — sem exageros.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-2xl">🥤</div>
                <h3 className="mt-4 font-semibold text-lg">Hidratação é chave</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Água de coco, suco natural (limão, maracujá, acerola) e muita água. Evite refrigerante
                  e suco de caixinha — o sódio e açúcar escondidos atrapalham qualquer tratamento.
                </p>
              </div>

              {/* Card 4 */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-2xl">🥜</div>
                <h3 className="mt-4 font-semibold text-lg">Lanches inteligentes</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Castanhas, amendoim torrado sem sal, iogurte natural com granola, ou uma banana com
                  pasta de amendoim. Satisfaz a fome entre as refeições sem exagerar nas calorias.
                </p>
              </div>

              {/* Card 5 */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-2xl">🍳</div>
                <h3 className="mt-4 font-semibold text-lg">Jantar sem culpa</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Omelete com legumes (cenoura, abobrinha, cebola), caldo de legumes caseiro, ou
                  creme de abóbora com gengibre. Refeições mornas e leves pra fechar o dia bem.
                </p>
              </div>

              {/* Card 6 */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-2xl">✅</div>
                <h3 className="mt-4 font-semibold text-lg">O que evitar</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Frituras, embutidos (linguiça, salsicha, presunto), refrigerante, bebida alcoólica
                  e doces industrializados. Não precisa cortar tudo — só reduzir já faz diferença.
                </p>
              </div>
            </div>

            <p className="mt-10 text-center text-xs text-muted-foreground">
              ⚕️ Essas são sugestões gerais. Consulte seu nutricionista para um plano alimentar adequado ao seu tratamento.
            </p>
          </div>
        </section>

        <section className="py-20 sm:py-28" aria-labelledby="depoimentos-title">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">Mais organização, consulta a consulta</span>
              <h2 id="depoimentos-title" className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
                Milhares de pacientes já usam o Jornada Leve pra acompanhar seu tratamento.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((item) => (
                <figure key={item.name} className="relative rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_60px_-40px_rgba(15,23,42,.35)]">
                  <Quote className="size-9 text-emerald-200" aria-hidden="true" />
                  <blockquote className="mt-5 text-lg leading-8 text-slate-700">“{item.quote}”</blockquote>
                  <figcaption className="mt-7 flex items-center gap-3 border-t border-slate-100 pt-5">
                    <span className="grid size-11 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">{item.initials}</span>
                    <span>
                      <strong className="block text-sm">{item.name}</strong>
                      <span className="text-sm text-slate-500">{item.city}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-5 text-center text-xs text-slate-400">Depoimentos ilustrativos. Resultados e experiências variam de pessoa para pessoa.</p>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, label: 'LGPD', text: 'Seus dados protegidos' },
                { icon: LockKeyhole, label: 'Criptografia', text: 'Proteção ponta a ponta' },
                { icon: Stethoscope, label: 'Cuidado', text: 'Medicina baseada em dados' },
              ].map(({ icon: Icon, label, text }) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl bg-emerald-50 p-5">
                  <Icon className="size-7 shrink-0 text-emerald-700" aria-hidden="true" />
                  <p><strong className="block text-sm">{label}</strong><span className="text-sm text-slate-600">{text}</span></p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-semibold text-amber-900">
              <Stethoscope className="size-4 shrink-0" aria-hidden="true" />
              Não substitui orientação médica.
            </div>
          </div>
        </section>

        <section id="planos" className="bg-[#f3f8f5] py-20 sm:py-28" aria-labelledby="planos-title">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">Planos transparentes</span>
              <h2 id="planos-title" className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-5xl">Comece grátis. Continue no seu ritmo.</h2>
              <p className="mt-5 text-lg text-slate-600">Sem cartão no teste e sem burocracia para cancelar.</p>
            </div>
            <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
              <article className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-8">
                <h3 className="text-xl font-bold">Grátis por 7 dias</h3>
                <p className="mt-2 text-sm text-slate-500">Conheça o Jornada Leve sem compromisso.</p>
                <div className="mt-6"><span className="text-4xl font-bold">R$ 0</span><span className="text-slate-500"> / 7 dias</span></div>
                <ul className="mt-7 flex-1 space-y-4 text-sm text-slate-700">
                  {['Sem cartão de crédito', 'Acesso completo por 7 dias', 'Cancele quando quiser'].map((item) => <li key={item} className="flex gap-2"><Check className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />{item}</li>)}
                </ul>
                <Link href="/cadastro" className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-bold text-white shadow-[0_6px_20px_-8px_rgba(5,150,105,.6)] transition hover:bg-emerald-700">Testar grátis</Link>
              </article>
              <article className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-8">
                <h3 className="text-xl font-bold">Mensal</h3>
                <p className="mt-2 text-sm text-slate-500">Flexibilidade para acompanhar mês a mês.</p>
                <div className="mt-6"><span className="text-4xl font-bold">R$ 29,90</span><span className="text-slate-500"> / mês</span></div>
                <ul className="mt-7 flex-1 space-y-4 text-sm text-slate-700">
                  {['Check-ins e registros ilimitados', 'Gráficos e calendário', 'Relatórios em PDF'].map((item) => <li key={item} className="flex gap-2"><Check className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />{item}</li>)}
                </ul>
                <Link href="/cadastro?plano=mensal" className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-bold text-white shadow-[0_6px_20px_-8px_rgba(5,150,105,.6)] transition hover:bg-emerald-700">Escolher mensal</Link>
              </article>
              <article className="relative flex flex-col rounded-[2rem] border-2 border-emerald-500 bg-[#073f34] p-7 text-white shadow-[0_28px_70px_-35px_rgba(6,78,59,.7)] sm:p-8 lg:-translate-y-3">
                <span className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-amber-300 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-950">Economize 2 meses</span>
                <h3 className="text-xl font-bold">Anual</h3>
                <p className="mt-2 text-sm text-emerald-50/70">A melhor escolha para acompanhar o ciclo completo.</p>
                <div className="mt-6"><span className="text-4xl font-bold">R$ 249,90</span><span className="text-emerald-50/65"> / ano</span></div>
                <p className="mt-2 text-sm font-semibold text-emerald-300">Equivale a R$ 20,83 por mês</p>
                <ul className="mt-7 flex-1 space-y-4 text-sm text-emerald-50">
                  {['Tudo do plano mensal', 'Mais economia no ano', 'Histórico contínuo do tratamento'].map((item) => <li key={item} className="flex gap-2"><Check className="size-5 shrink-0 text-emerald-300" aria-hidden="true" />{item}</li>)}
                </ul>
                <Link href="/cadastro?plano=anual" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50">Escolher anual</Link>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 sm:py-28" aria-labelledby="faq-title">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:px-10">
            <div>
              <span className="text-sm font-bold uppercase tracking-[.16em] text-emerald-700">Perguntas frequentes</span>
              <h2 id="faq-title" className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Antes de começar, tire suas dúvidas.</h2>
              <p className="mt-5 leading-7 text-slate-600">Ainda precisa de ajuda? Fale com nosso time.</p>
              <a href="mailto:contato@jornadaleve.com.br" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900">
                <Mail className="size-4" aria-hidden="true" /> contato@jornadaleve.com.br
              </a>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left font-bold marker:content-none">
                    {faq.question}
                    <ChevronDown className="size-5 shrink-0 text-emerald-700 transition group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="max-w-2xl pb-6 pr-8 leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-28" aria-labelledby="cta-final-title">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#073f34] px-6 py-16 text-center text-white shadow-[0_35px_90px_-45px_rgba(6,78,59,.8)] sm:px-10 sm:py-20">
            <Image src="/landing/hero-gradient.jpg" alt="" fill loading="lazy" sizes="100vw" className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(110,231,183,.2),transparent_45%)]" />
            <div className="relative mx-auto max-w-3xl">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 text-emerald-200 backdrop-blur-sm"><LineChart className="size-7" aria-hidden="true" /></span>
              <h2 id="cta-final-title" className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-5xl">Sua evolução merece ser registrada. Não confie na memória.</h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-emerald-50/75">Comece hoje e chegue à próxima consulta com uma visão mais clara do seu tratamento.</p>
              <Link href="/cadastro" className={`${primaryButton} mt-8 bg-white text-emerald-800 hover:bg-emerald-50`}>
                Começar grátis agora <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <p className="mt-4 text-xs text-emerald-50/60">7 dias grátis · Sem cartão · Cancele quando quiser</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-10 border-b border-slate-200 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="max-w-sm">
              <Link href="/" className="flex items-center gap-2.5" aria-label="Jornada Leve — início">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald-700 text-white"><HeartPulse className="size-5" aria-hidden="true" /></span>
                <span className="text-lg font-bold">Jornada Leve</span>
              </Link>
              <p className="mt-4 text-sm leading-6 text-slate-600">Organização e dados concretos para acompanhar seu tratamento com mais clareza.</p>
            </div>
            <nav aria-label="Links institucionais">
              <h2 className="text-sm font-bold">Institucional</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li><Link href="/termos" className="hover:text-emerald-700">Termos de uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-emerald-700">Privacidade</Link></li>
                <li><Link href="/precos" className="hover:text-emerald-700">Preços</Link></li>
              </ul>
            </nav>
            <div>
              <h2 className="text-sm font-bold">Acompanhe</h2>
              <div className="mt-4 flex gap-3">
                <a href="#" aria-label="Instagram do Jornada Leve" className="grid size-10 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"><Instagram className="size-4" aria-hidden="true" /></a>
                <a href="#" aria-label="WhatsApp do Jornada Leve" className="grid size-10 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"><MessageCircle className="size-4" aria-hidden="true" /></a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Jornada Leve Tecnologia Ltda. Todos os direitos reservados.</p>
            <p className="font-semibold text-slate-700">Acompanhamento não substitui orientação médica.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
