import React, { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import Globe from "@/components/ui/Globe";

/* ─── TYPES ──────────────────────────────────────────────────────────────── */
interface LandingPageProps {
  onLogin: () => void;
}

/* ─── NAVIGATION BAR ─────────────────────────────────────────────────────── */
const Navbar: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "AI Engine", href: "#ai-engine" },
    { label: "Market", href: "#market" },
    { label: "Pricing", href: "#pricing" },
    { label: "Team", href: "#team" },
    { label: "FAQ", href: "#faq" },
    { label: "Pitch Deck", href: "/pitch" },
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="AccreditEx"
            className="h-9 w-9 rounded-lg object-contain group-hover:scale-110 transition-transform"
          />
          <span className="text-xl font-bold">
            <span
              className={
                scrolled
                  ? "text-brand-text-primary dark:text-white"
                  : "text-white"
              }
            >
              Accredit
            </span>
            <span className="text-brand-primary">Ex</span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                scrolled
                  ? "text-slate-600 dark:text-slate-300 hover:text-brand-primary"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={onLogin}
            className="px-5 py-2 text-sm font-semibold rounded-lg border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
          >
            Login
          </button>
          <a
            href="https://accreditex.web.app"
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Launch App →
          </a>
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className={`w-6 h-6 ${scrolled ? "text-slate-600" : "text-white"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 space-y-3">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-primary"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => {
              setMobileOpen(false);
              onLogin();
            }}
            className="block w-full text-center px-4 py-2 text-sm font-semibold rounded-lg border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
          >
            Login
          </button>
        </div>
      )}
    </nav>
  );
};

/* ─── HERO SECTION ───────────────────────────────────────────────────────── */
const Hero: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const appSettings = useAppStore((s) => s.appSettings);
  const globeSettings = appSettings?.globeSettings;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 600px 600px at 20% 50%, rgba(0,137,123,0.12) 0%, transparent 70%), radial-gradient(ellipse 400px 400px at 80% 30%, rgba(21,101,192,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-28 pb-16 w-full">
        <div className="space-y-8 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-sm font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-300" />
            </span>
            AI-Native Healthcare Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
            From Audit Panic
            <br />
            to <span className="text-teal-400">Continuous Excellence</span>
          </h1>

          <p className="text-lg text-white/70 max-w-lg leading-relaxed">
            AccreditEx automates healthcare accreditation with AI-powered
            compliance tracking, real-time risk monitoring, and intelligent
            document management — built by a clinical quality expert.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="#pricing"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold shadow-xl shadow-teal-600/30 hover:shadow-teal-600/50 hover:scale-[1.02] transition-all"
            >
              Start Free Trial →
            </a>
            <a
              href="#features"
              className="px-8 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-all"
            >
              Explore Features ↓
            </a>
          </div>

          {/* Trust badges */}
          <div className="pt-4 flex flex-wrap items-center gap-5 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="text-green-400">●</span> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-400">●</span> SOC 2-ready
              infrastructure
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-400">●</span> HIPAA-aligned
              architecture
            </span>
          </div>

          {/* Hero stats */}
          <div className="flex gap-10 pt-6 border-t border-white/10">
            {[
              { value: "15+", label: "AI-Powered Tools" },
              { value: "240+", label: "Standards Loaded" },
              { value: "1,043", label: "Sub-Standards" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-white">
                  {s.value}
                </div>
                <div className="text-xs text-white/50 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Globe / App Preview */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="relative w-[520px] h-[520px]">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-full blur-3xl" />
            {globeSettings ? (
              <Globe
                width={520}
                height={520}
                {...globeSettings}
                userLocation={{ lat: 23.588, long: 58.3829 }}
              />
            ) : (
              <Globe
                width={520}
                height={520}
                userLocation={{ lat: 23.588, long: 58.3829 }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── TRUST BAR ──────────────────────────────────────────────────────────── */
const TrustBar: React.FC = () => (
  <section className="bg-slate-50 dark:bg-slate-800/50 py-10 border-b border-slate-200 dark:border-slate-700">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[2px] text-slate-400 mb-6">
        Supporting Accreditation Standards From
      </p>
      <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap">
        {[
          { name: "CBAHI", region: "Saudi Arabia", color: "text-teal-600" },
          { name: "JCI", region: "International", color: "text-blue-600" },
          { name: "DOH", region: "Abu Dhabi", color: "text-teal-700" },
          { name: "ISO 15189", region: "Laboratory", color: "text-amber-600" },
          {
            name: "DHA",
            region: "Dubai",
            color: "text-slate-700 dark:text-white",
          },
        ].map((s, i, arr) => (
          <React.Fragment key={s.name}>
            <div className="text-center">
              <div className={`text-xl md:text-2xl font-extrabold ${s.color}`}>
                {s.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {s.region}
              </div>
            </div>
            {i < arr.length - 1 && (
              <div className="hidden md:block w-px h-10 bg-slate-200 dark:bg-slate-600" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </section>
);

/* ─── PROBLEM SECTION ────────────────────────────────────────────────────── */
const ProblemSection: React.FC = () => (
  <section className="py-24 bg-slate-50 dark:bg-slate-900/50" id="problem">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold mb-4">
          ⚠️ The Challenge
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
          The Healthcare Compliance Crisis
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          70% of GCC healthcare facilities still rely on manual spreadsheets,
          paper binders, and siloed emails for accreditation compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            stat: "30%",
            title: "Higher Audit Failure Risk",
            desc: "Human error in documentation is the #1 cause of non-conformities during accreditation surveys.",
            bgColor: "bg-red-50 dark:bg-red-950/20",
            iconColor: "text-red-500",
          },
          {
            stat: "50%",
            title: "Clinician Burnout Rate",
            desc: "Quality managers spend more time on paperwork than actual patient safety improvement.",
            bgColor: "bg-orange-50 dark:bg-orange-950/20",
            iconColor: "text-orange-500",
          },
          {
            stat: "$2M+",
            title: "Cost of Non-Compliance",
            desc: "Lost accreditation means lost contracts, reputation damage, and potential patient safety risks.",
            bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
            iconColor: "text-yellow-600",
          },
        ].map((p) => (
          <div
            key={p.stat}
            className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all"
          >
            <div
              className={`text-4xl md:text-5xl font-black ${p.iconColor} mb-3`}
            >
              {p.stat}
            </div>
            <h3 className="text-lg font-bold text-brand-text-primary dark:text-white mb-2">
              {p.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── FEATURES SECTION ───────────────────────────────────────────────────── */
const featuresList = [
  {
    icon: "/pie-chart-svgrepo-com.svg",
    title: "Role-Based Dashboards",
    desc: "Tailored views for Admins, Project Leads, Auditors, and Team Members with real-time KPIs.",
    subs: [
      "Executive overview with overdue tasks",
      "Compliance trend charts",
      "Department performance analytics",
      "Quality Insights with predictive risk",
    ],
  },
  {
    icon: "/set-up-svgrepo-com.svg",
    title: "Project Management",
    desc: "Full accreditation project lifecycle with checklists, evidence, PDCA cycles, and CAPA tracking.",
    subs: [
      "Template-based project creation",
      "Per-standard compliance checklists",
      "Design controls & audit logs",
      "Mock survey simulations",
    ],
  },
  {
    icon: "/document-lock-svgrepo-com.svg",
    title: "Document Control",
    desc: "Enterprise document management with versioning, approval workflows, and template gallery.",
    subs: [
      "Rich-text editor (EN/AR bilingual)",
      "Version history & comparison",
      "Multi-step approval chains",
      "Template gallery (SOP, Policy, etc.)",
    ],
  },
  {
    icon: "/trend-analysis-svgrepo-com.svg",
    title: "Risk & CAPA Hub",
    desc: "Integrated risk register, incident reporting, CAPA management, and effectiveness tracking.",
    subs: [
      "Risk matrix visualization",
      "Incident severity categorization",
      "Root cause analysis (5 Whys)",
      "CAPA closure decision engine",
    ],
  },
  {
    icon: "/vertical-ruler-svgrepo-com.svg",
    title: "Training & Competency",
    desc: "Complete training management with quizzes, certificates, and competency gap tracking.",
    subs: [
      "Training programs with quizzes",
      "Auto-generated certificates",
      "Competency library & gap reports",
      "AI-powered training recommendations",
    ],
  },
  {
    icon: "/align-two-columns-svgrepo-com.svg",
    title: "Multi-Department",
    desc: "Hospital-wide project support with AI-powered department assignment and per-department analytics.",
    subs: [
      "AI auto-assign departments to standards",
      "Department compliance breakdown",
      "Cross-department collaboration",
      "HIS integration support",
    ],
  },
  {
    icon: "/look-up-svgrepo-com.svg",
    title: "Audit Management",
    desc: "Plan, conduct, and track internal audits with findings, mock surveys, and readiness scoring.",
    subs: [
      "Audit plan scheduler",
      "Finding severity classification",
      "Mock survey pass/fail analysis",
      "Assessor report pack generation",
    ],
  },
  {
    icon: "/calculator-svgrepo-com.svg",
    title: "Calendar & Tasks",
    desc: "Unified calendar aggregating all deadlines with personal task queues and notifications.",
    subs: [
      "Month, agenda & year views",
      "My Tasks with overdue alerts",
      "Real-time messaging center",
      "In-app notifications",
    ],
  },
  {
    icon: "/global-display-svgrepo-com.svg",
    title: "Standards Library",
    desc: "Pre-loaded accreditation programs (CBAHI, JCI, DOH) with 240+ standards and 1,043 sub-standards.",
    subs: [
      "Cross-standard mapping",
      "Evidence reuse suggestions",
      "Bulk import/export",
      "Bilingual support (EN/AR)",
    ],
  },
];

const Features: React.FC = () => (
  <section id="features" className="py-24 bg-white dark:bg-slate-900">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold mb-4">
          🏗️ Platform
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
          Everything You Need for Accreditation
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          A comprehensive platform covering every aspect of healthcare quality
          management — from standards tracking to team training.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuresList.map((f) => (
          <div
            key={f.title}
            className="group p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-teal-400/30 hover:shadow-xl transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            <img
              src={f.icon}
              alt={f.title}
              className="w-10 h-10 mb-4"
              loading="lazy"
            />
            <h3 className="text-lg font-bold text-brand-text-primary dark:text-white mb-2">
              {f.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              {f.desc}
            </p>
            <ul className="space-y-1">
              {f.subs.map((s) => (
                <li
                  key={s}
                  className="text-xs text-slate-400 dark:text-slate-500 pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-teal-500 before:font-bold"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── AI ENGINE SECTION ──────────────────────────────────────────────────── */
const aiTools = [
  {
    icon: "💬",
    title: "AI Assistant",
    desc: "Context-aware floating chatbot available throughout the app for instant guidance.",
  },
  {
    icon: "📝",
    title: "Document Generator",
    desc: "Generate compliant SOPs, policies, reports, and checklists from templates using AI.",
  },
  {
    icon: "🔎",
    title: "Gap Analysis",
    desc: "Analyze compliance gaps and get AI-generated action plans for non-compliant items.",
  },
  {
    icon: "📊",
    title: "Analytics Insights",
    desc: "AI analyzes your KPIs and generates executive summaries with recommendations.",
  },
  {
    icon: "🎯",
    title: "Root Cause Analysis",
    desc: "5 Whys and Fishbone analysis to identify root causes of non-compliance.",
  },
  {
    icon: "🔄",
    title: "PDCA Improvement",
    desc: "AI-powered recommendations for each Plan-Do-Check-Act cycle stage.",
  },
  {
    icon: "🛡️",
    title: "Risk Assessment",
    desc: "Automated risk scoring with mitigation recommendations and priority actions.",
  },
  {
    icon: "✍️",
    title: "Content Improvement",
    desc: "Improves clarity, structure, grammar, and professionalism of existing documents.",
  },
  {
    icon: "🌐",
    title: "Translation (EN↔AR)",
    desc: "Translates healthcare documents between English and Arabic preserving formatting.",
  },
  {
    icon: "✅",
    title: "Compliance Check",
    desc: "Analyzes documents against specific standards and returns compliance scores.",
  },
  {
    icon: "🏢",
    title: "Dept Auto-Assignment",
    desc: "AI maps standards to the most responsible hospital department automatically.",
  },
  {
    icon: "🎓",
    title: "Training Advisor",
    desc: "Suggests training programs based on role, department, and competency gaps.",
  },
];

const AIEngine: React.FC = () => (
  <section id="ai-engine" className="py-24 bg-slate-900 text-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/15 text-teal-400 text-sm font-semibold mb-4">
          🤖 AI Engine
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold">
          15+ AI-Powered Tools Built In
        </h2>
        <p className="mt-4 text-white/60 max-w-2xl mx-auto">
          Not just a chatbot — a comprehensive AI system trained on healthcare
          accreditation that actively helps your team at every step.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {aiTools.map((t) => (
          <div
            key={t.title}
            className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-teal-500/[0.08] hover:border-teal-500/20 hover:-translate-y-1 transition-all"
          >
            <div className="text-3xl mb-4">{t.icon}</div>
            <h3 className="text-sm font-bold text-white mb-1.5">{t.title}</h3>
            <p className="text-xs text-white/60 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── MARKET OPPORTUNITY ─────────────────────────────────────────────────── */
const MarketSection: React.FC = () => (
  <section id="market" className="py-24 bg-slate-50 dark:bg-slate-900/50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold mb-4">
          📈 Market
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
          A $4.37B Market Ready for Disruption
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          The Abu Dhabi DoH 2027 mandate for AI-native government creates a "buy
          or fail" window for healthcare facilities.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center gap-10 mb-12">
        {[
          {
            label: "TAM",
            value: "$38.5B",
            desc: "Global Health Software",
            border: "border-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950/20",
          },
          {
            label: "SAM",
            value: "$4.37B",
            desc: "Compliance & Quality (2026)",
            border: "border-teal-500",
            bg: "bg-teal-50 dark:bg-teal-950/20",
          },
          {
            label: "SOM",
            value: "5,000+",
            desc: "GCC Healthcare Facilities",
            border: "border-amber-500",
            bg: "bg-amber-50 dark:bg-amber-950/20",
          },
        ].map((m) => (
          <div
            key={m.label}
            className={`w-52 h-52 rounded-full border-[3px] ${m.border} ${m.bg} flex flex-col items-center justify-center text-center p-6 hover:scale-105 transition-transform`}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {m.label}
            </div>
            <div className="text-3xl md:text-4xl font-black text-brand-text-primary dark:text-white">
              {m.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── COMPETITIVE ADVANTAGE ──────────────────────────────────────────────── */
const CompetitiveSection: React.FC = () => {
  const rows = [
    { cap: "Practitioner-Built", us: "✓ Full", meg: "✗", rld: "✗", vas: "✗" },
    {
      cap: "GCC Regional Templates",
      us: "✓ DOH/DHA/MOH",
      meg: "Partial",
      rld: "✗",
      vas: "Limited",
    },
    {
      cap: "AI-Continuous Auditing",
      us: "✓ 15+ AI Tools",
      meg: "Basic",
      rld: "Basic",
      vas: "✓",
    },
    {
      cap: "Bilingual (EN/AR)",
      us: "✓ Full RTL",
      meg: "✗",
      rld: "✗",
      vas: "Partial",
    },
    { cap: "PWA / Offline-First", us: "✓", meg: "✗", rld: "✗", vas: "✗" },
    {
      cap: "Pre-loaded Standards",
      us: "✓ 240+ / 1,043 Sub",
      meg: "✗",
      rld: "✗",
      vas: "✗",
    },
    {
      cap: "Affordable for SMEs",
      us: "✓ From $500/mo",
      meg: "✗",
      rld: "✗",
      vas: "✗",
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold mb-4">
            🏆 Advantage
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
            Why AccreditEx Wins
          </h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Practitioner-built, region-first, AI-native — designed specifically
            for GCC healthcare compliance.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                <th className="text-left py-4 px-5 font-bold text-brand-text-primary dark:text-white">
                  Capability
                </th>
                <th className="text-center py-4 px-5 font-bold text-teal-600">
                  AccreditEx
                </th>
                <th className="text-center py-4 px-5 font-medium text-slate-400">
                  MEG
                </th>
                <th className="text-center py-4 px-5 font-medium text-slate-400">
                  RLDatix
                </th>
                <th className="text-center py-4 px-5 font-medium text-slate-400">
                  Vastian AI
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.cap}
                  className="border-t border-slate-100 dark:border-slate-700/50"
                >
                  <td className="py-3.5 px-5 font-semibold text-brand-text-primary dark:text-white">
                    {r.cap}
                  </td>
                  <td className="py-3.5 px-5 text-center text-teal-600 font-bold">
                    {r.us}
                  </td>
                  <td className="py-3.5 px-5 text-center text-slate-400">
                    {r.meg}
                  </td>
                  <td className="py-3.5 px-5 text-center text-slate-400">
                    {r.rld}
                  </td>
                  <td className="py-3.5 px-5 text-center text-slate-400">
                    {r.vas}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

/* ─── PRICING SECTION ────────────────────────────────────────────────────── */
const pricingTiers = [
  {
    name: "Core",
    desc: "Per facility · Small labs & clinics",
    price: "$500",
    period: "/mo",
    highlight: false,
    features: [
      "Up to 10 users",
      "Compliance tracking",
      "Document management",
      "Basic AI tools",
      "Email support",
    ],
    cta: "Get Started",
    ctaHref: "https://accreditex.web.app",
  },
  {
    name: "Enterprise",
    desc: "Per facility · Hospitals & networks",
    price: "$2,000",
    period: "/mo",
    highlight: true,
    badge: "MOST POPULAR",
    features: [
      "Unlimited users",
      "Full AI predictive engine",
      "Advanced analytics",
      "Multi-department support",
      "HIS integration",
      "Priority support + SLA",
      "API access",
    ],
    cta: "Start Free Trial",
    ctaHref: "https://accreditex.web.app",
  },
  {
    name: "Custom",
    desc: "Predictive Governance AI Add-On",
    price: "Contact Us",
    period: "",
    highlight: false,
    features: [
      "Premium AI features",
      "High-throughput centers",
      "Custom integrations",
      "Dedicated success manager",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    ctaHref: "mailto:ashraf.a.m.ishag@gmail.com",
  },
];

const Pricing: React.FC = () => (
  <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-900/50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold mb-4">
          💳 Pricing
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
          Scalable SaaS Pricing
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Enterprise-grade data management with seamless scaling — built so your
          compliance data grows with you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
        {pricingTiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-2xl p-8 border text-center transition-all ${
              tier.highlight
                ? "bg-white dark:bg-slate-800 border-teal-500 shadow-2xl shadow-teal-500/15 scale-[1.04]"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl"
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 text-white text-[11px] font-bold tracking-wider">
                {tier.badge}
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-brand-text-primary dark:text-white">
                {tier.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {tier.desc}
              </p>
            </div>
            <div className="mb-6">
              <span
                className={`font-black text-brand-text-primary dark:text-white ${tier.period ? "text-5xl" : "text-3xl"}`}
              >
                {tier.price}
              </span>
              <span className="text-slate-400">{tier.period}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-left">
              {tier.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700/50 pb-2.5"
                >
                  <span className="text-teal-500 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <a
              href={tier.ctaHref}
              className={`block w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                tier.highlight
                  ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg hover:shadow-xl"
                  : "bg-slate-100 dark:bg-slate-700 text-brand-text-primary dark:text-white hover:bg-teal-500 hover:text-white"
              }`}
            >
              {tier.cta}
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── TEAM SECTION ───────────────────────────────────────────────────────── */
const TeamSection: React.FC = () => (
  <section id="team" className="py-24 bg-white dark:bg-slate-900">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold mb-4">
          👤 Team
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
          The "Black Belt" Advantage
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          A rare blend of clinical expertise, operational excellence, and
          full-stack technical capability.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10 bg-white dark:bg-slate-800 rounded-2xl p-10 border border-slate-200 dark:border-slate-700 shadow-lg max-w-4xl mx-auto">
        <img
          src="/CEO.jpg"
          alt="Ashraf Abu baker Musa Ishag — Founder & CEO"
          className="w-36 h-36 rounded-full object-cover border-4 border-teal-400 shadow-lg shadow-teal-500/20 flex-shrink-0"
          loading="lazy"
        />
        <div>
          <h3 className="text-2xl font-extrabold text-brand-text-primary dark:text-white">
            Ashraf Abu baker Musa Ishag
          </h3>
          <p className="text-teal-600 font-semibold mt-1 mb-5">Founder & CEO</p>
          <ul className="space-y-2.5">
            {[
              "🎓 B.Sc. Medical Laboratory Science, ISQUA Fellow",
              "⚡ Six Sigma Black Belt · Google Project Manager",
              "🏥 Licensed Lab Quality Manager (Oman/Sudan)",
              "💻 Full-Stack Developer (React, TypeScript, Firebase, AI)",
              "📝 Published researcher",
            ].map((c) => (
              <li
                key={c}
                className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-4xl mx-auto">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-7 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-brand-text-primary dark:text-white mb-2">
            🎯 Unique Positioning
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Designed by a clinical quality professional who understands
            healthcare compliance from the inside — not just software developers
            adapting generic tools.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-7 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-brand-text-primary dark:text-white mb-2">
            👥 Advisory Board
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Assembling an advisory board of clinical and technical mentors from
            the GCC healthcare sector. Currently exploring pilot partnerships
            with leading hospitals.
          </p>
        </div>
      </div>
    </div>
  </section>
);

/* ─── ROADMAP ────────────────────────────────────────────────────────────── */
const RoadmapSection: React.FC = () => (
  <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold mb-4">
          🗺️ Roadmap
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
          The Abu Dhabi Vision
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Strategic roadmap aligned with Abu Dhabi Economic Vision 2030.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {[
          {
            year: "2026",
            title: "Strategic HQ at ADGM",
            desc: "Establishing AccreditEx AI Lab at Abu Dhabi Global Market",
          },
          {
            year: "2026",
            title: "National Integration",
            desc: "API roadmap for Malaffi (UAE Health Information Exchange) integration",
          },
          {
            year: "2027",
            title: "Local R&D Partnership",
            desc: "Partnering with MBZUAI for R&D and hiring local AI talent",
          },
          {
            year: "Long-term",
            title: "Global Benchmark",
            desc: "10-Year Golden Visa & making Abu Dhabi the global benchmark for AI-driven clinical safety",
          },
        ].map((r, i) => (
          <div
            key={i}
            className="flex gap-6 pl-8 relative border-l-[3px] border-teal-500"
          >
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-teal-500" />
            <div className="min-w-[80px]">
              <span className="text-teal-600 font-bold">{r.year}</span>
            </div>
            <div>
              <h4 className="font-bold text-brand-text-primary dark:text-white">
                {r.title}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {r.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── FAQ SECTION ────────────────────────────────────────────────────────── */
const faqs = [
  {
    q: "What accreditation standards does AccreditEx support?",
    a: "AccreditEx comes pre-loaded with 240+ standards and 1,043 sub-standards covering CBAHI (Saudi Arabia), JCI (International), DOH Abu Dhabi, and ISO 15189 (Laboratory). New standards can be imported in bulk. Cross-standard mapping helps reuse evidence across multiple accreditation bodies.",
  },
  {
    q: "How does the AI engine work?",
    a: "AccreditEx integrates 15+ AI-powered tools directly into every workflow. This includes an AI assistant chatbot, automated gap analysis, document generation, root cause analysis (5 Whys & Fishbone), PDCA improvement suggestions, risk assessment, compliance scoring, EN↔AR translation, and AI-powered department auto-assignment.",
  },
  {
    q: "Is AccreditEx suitable for small clinics or only large hospitals?",
    a: "AccreditEx is designed for all facility sizes. The Core plan ($500/mo) is built for small labs and clinics with up to 10 users. The Enterprise plan ($2,000/mo) adds unlimited users, multi-department support, HIS integration, and advanced AI analytics — ideal for hospitals and healthcare networks.",
  },
  {
    q: "Does it support Arabic and right-to-left (RTL) interfaces?",
    a: "Yes. AccreditEx is fully bilingual (English/Arabic) with complete RTL layout support. The AI translation tool can translate healthcare documents between EN and AR while preserving formatting. This is essential for GCC facilities where regulatory submissions may require Arabic documentation.",
  },
  {
    q: "What makes AccreditEx different from MEG, RLDatix, or Vastian?",
    a: "AccreditEx is the only platform that is: (1) practitioner-built by a clinical quality professional with Six Sigma Black Belt and ISQUA credentials, (2) GCC-first with pre-loaded regional templates for DOH, DHA, MOH, and CBAHI, (3) AI-native with 15+ integrated tools (not bolt-on chatbots), and (4) affordable starting at $500/mo with PWA offline support.",
  },
  {
    q: "Can investors request a demo or pitch deck?",
    a: "Absolutely. You can view the interactive pitch deck at /pitch, or contact founder Ashraf Ishag directly at Ashraf.a.m.ishag@gmail.com to schedule a live demo of the platform.",
  },
];

const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-semibold mb-4">
            ❓ FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Answers to common questions about AccreditEx for healthcare quality
            leaders and decision-makers.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-bold text-brand-text-primary dark:text-white text-base pr-4">
                  {faq.q}
                </span>
                <span
                  className={`text-teal-500 text-xl font-bold transition-transform ${openIdx === i ? "rotate-45" : ""}`}
                >
                  +
                </span>
              </button>
              {openIdx === i && (
                <div className="px-6 pb-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed animate-[fadeInUp_0.3s_ease-out]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── CTA SECTION ────────────────────────────────────────────────────────── */
const CTASection: React.FC = () => (
  <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden text-white">
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 600px 400px at 50% 50%, rgba(0,137,123,0.15) 0%, transparent 70%)",
      }}
    />
    <div className="relative max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-3xl sm:text-5xl font-extrabold mb-6">
        Ready to Transform Healthcare Quality?
      </h2>
      <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
        Join the platform that's moving healthcare from annual audit panic to
        continuous clinical excellence.
      </p>
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <a
          href="https://accreditex.web.app"
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
        >
          Start Free Trial →
        </a>
        <a
          href="mailto:ashraf.a.m.ishag@gmail.com"
          className="px-8 py-4 rounded-xl border border-white/20 bg-white/10 text-white font-semibold hover:bg-white/15 transition-all"
        >
          Contact Founder
        </a>
        <a
          href="/pitch"
          className="px-8 py-4 rounded-xl border border-white/20 bg-white/[0.06] text-white font-semibold hover:bg-white/15 transition-all"
        >
          📥 View Pitch Deck
        </a>
      </div>
      <div className="flex justify-center gap-6 flex-wrap text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="text-green-400">✓</span> 14-day free trial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-green-400">✓</span> No credit card required
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-green-400">✓</span> Setup in under 5 minutes
        </span>
      </div>
      <div className="flex justify-center gap-3 mt-6 flex-wrap">
        {["CBAHI", "JCI", "ISO 15189", "DOH Abu Dhabi", "AI-Native"].map(
          (b) => (
            <span
              key={b}
              className="px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-white/60"
            >
              {b}
            </span>
          ),
        )}
      </div>
    </div>
  </section>
);

/* ─── FOOTER ─────────────────────────────────────────────────────────────── */
const Footer: React.FC = () => (
  <footer className="py-16 bg-slate-900 text-slate-400">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 pb-10 border-b border-white/[0.08]">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <img
              src="/logo.png"
              alt="AccreditEx"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="text-lg font-extrabold text-white">
              AccreditEx
            </span>
          </div>
          <p className="text-sm leading-relaxed">
            AI-Native Healthcare Accreditation Platform. Built by a clinical
            quality expert for healthcare facilities transitioning to continuous
            digital compliance.
          </p>
          <p className="text-sm mt-3">
            📍 Seeb, Muscat | Relocating to Abu Dhabi 2026
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
            Platform
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                Projects
              </a>
            </li>
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                Documents
              </a>
            </li>
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                Risk Hub
              </a>
            </li>
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                Training
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
            AI Tools
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                AI Assistant
              </a>
            </li>
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                Document Generator
              </a>
            </li>
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                Gap Analysis
              </a>
            </li>
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                Risk Assessment
              </a>
            </li>
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                Translation
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
            Contact
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a
                href="mailto:ashraf.a.m.ishag@gmail.com"
                className="hover:text-teal-400 transition-colors"
              >
                ✉️ Email
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/in/ashraf-ishag"
                className="hover:text-teal-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                💼 LinkedIn
              </a>
            </li>
            <li>
              <a
                href="https://accreditex.web.app"
                className="hover:text-teal-400 transition-colors"
              >
                🚀 Launch App
              </a>
            </li>
            <li>
              <a
                href="/pitch"
                className="hover:text-teal-400 transition-colors"
              >
                📊 Pitch Deck
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">© 2026 AccreditEx. All rights reserved.</p>
        <div className="flex items-center gap-2.5">
          {["React", "TypeScript", "Firebase", "AI-Powered"].map((b) => (
            <span
              key={b}
              className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

/* ─── LANDING PAGE ───────────────────────────────────────────────────────── */
const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="bg-white dark:bg-slate-900">
      <Navbar onLogin={onLogin} />
      <Hero onLogin={onLogin} />
      <TrustBar />
      <ProblemSection />
      <Features />
      <AIEngine />
      <MarketSection />
      <CompetitiveSection />
      <Pricing />
      <TeamSection />
      <RoadmapSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
