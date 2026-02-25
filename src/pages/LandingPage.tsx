import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import Globe from "@/components/ui/Globe";
import { LogoIcon } from "@/components/icons";

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
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
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
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <LogoIcon className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold">
            <span className="text-brand-text-primary dark:text-white">Accredit</span>
            <span className="text-brand-primary">Ex</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-primary transition-colors"
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
            href="#pricing"
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-brand-primary text-white hover:bg-indigo-700 shadow-lg shadow-brand-primary/25 transition-all"
          >
            Get Started
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-slate-600 dark:text-slate-300"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 space-y-3 animate-[fadeInUp_0.2s_ease-out]">
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
            onClick={() => { setMobileOpen(false); onLogin(); }}
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
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-cyan-50/30 dark:from-slate-950 dark:via-indigo-950/20 dark:to-cyan-950/10" />

      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, #4f46e5 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }} />

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-24 pb-12">
        {/* Text */}
        <div className="space-y-8 animate-[fadeInUp_0.8s_ease-out]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
            </span>
            AI-Powered Healthcare Accreditation
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-brand-text-primary dark:text-white">
            Accreditation{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-cyan-500">
              Made Simple
            </span>
            <br />
            for Healthcare
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
            AccreditEx streamlines your entire accreditation journey — from gap analysis to survey readiness.
            Manage <strong>JCI, CBAHI, CAP, ISO 15189</strong>, and more with AI-powered tools,
            real-time compliance tracking, and multi-tenant security.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="#pricing"
              className="px-8 py-3.5 rounded-xl bg-brand-primary text-white font-semibold text-base shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:scale-[1.02] transition-all"
            >
              Start Free Trial
            </a>
            <a
              href="/pitch"
              className="px-8 py-3.5 rounded-xl bg-white dark:bg-slate-800 text-brand-text-primary dark:text-white font-semibold text-base shadow-lg border border-slate-200 dark:border-slate-700 hover:border-brand-primary hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              View Pitch Deck
            </a>
          </div>

          {/* Trust badges */}
          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              HIPAA Ready
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
              English & Arabic (RTL)
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              21+ AI Tools
            </div>
          </div>
        </div>

        {/* Globe */}
        <div className="hidden lg:flex items-center justify-center animate-[fadeIn_1.2s_ease-out]">
          <div className="relative w-[550px] h-[550px]">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-cyan-400/20 rounded-full blur-3xl" />
            {globeSettings && (
              <Globe
                width={550}
                height={550}
                {...globeSettings}
                userLocation={{ lat: 23.588, long: 58.3829 }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

/* ─── STATS BAR ──────────────────────────────────────────────────────────── */
const StatsBar: React.FC = () => {
  const stats = [
    { value: "7+", label: "Accreditation Programs" },
    { value: "240+", label: "Pre-loaded Standards" },
    { value: "1,043", label: "Sub-Standards Mapped" },
    { value: "21+", label: "AI-Powered Tools" },
    { value: "35", label: "Integrated Pages" },
  ];

  return (
    <section className="relative py-12 bg-brand-primary">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold text-white">{s.value}</div>
            <div className="text-sm text-indigo-200 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ─── FEATURES SECTION ───────────────────────────────────────────────────── */
const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Multi-Program Accreditation",
    desc: "Manage JCI, CBAHI, DNV, CAP, ISO 15189, NABH, and ISO 9001 programs — all from a single unified platform with cross-standard evidence mapping.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "AI-Powered Document Control",
    desc: "Auto-generate policies, SOPs, and accreditation documents with AI. Full version control, digital signatures, and automated approval workflows.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Real-Time Compliance Tracking",
    desc: "Live dashboards with compliance KPIs, gap analysis, PDCA cycle tracking, and automated escalation workflows with configurable notification chains.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Training & Competency",
    desc: "Built-in LMS with quiz-based training, automated certificate generation, CE credit tracking, skill matrices, and competency gap analysis.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: "Lab Operations Module",
    desc: "CAP assessment tool with 11 disciplines, QC data import, multi-vendor LIMS integration (Orchard, SoftLab, Sunquest), and tracer worksheets.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Enterprise Security",
    desc: "Multi-tenant data isolation, role-based access control, Firebase-backed authentication, and HIPAA-ready architecture with full audit trails.",
  },
];

const Features: React.FC = () => (
  <section id="features" className="py-24 bg-white dark:bg-slate-900">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-brand-primary font-semibold text-sm tracking-wider uppercase mb-3">Platform Capabilities</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
          Everything You Need for Accreditation Success
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          A comprehensive suite of tools designed specifically for healthcare facilities pursuing or maintaining accreditation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f) => (
          <div
            key={f.title}
            className="group p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h3 className="text-lg font-bold text-brand-text-primary dark:text-white mb-2">{f.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── HOW IT WORKS ───────────────────────────────────────────────────────── */
const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Set Up Your Facility",
      desc: "Import your organizational structure, departments, and select the accreditation programs you're pursuing (JCI, CBAHI, CAP, etc.).",
    },
    {
      number: "02",
      title: "AI Gap Analysis",
      desc: "Our AI scans your current documentation against 1,043+ sub-standards and generates a prioritized action plan with estimated timelines.",
    },
    {
      number: "03",
      title: "Track & Collaborate",
      desc: "Assign tasks, generate documents with AI, monitor compliance in real-time, and prepare for surveys with mock assessment tools.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-brand-primary font-semibold text-sm tracking-wider uppercase mb-3">Getting Started</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
            Three Steps to Accreditation Readiness
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.number} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-brand-primary/30 to-transparent -translate-x-8 z-0" />
              )}
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="text-5xl font-black text-brand-primary/10 mb-4">{s.number}</div>
                <h3 className="text-xl font-bold text-brand-text-primary dark:text-white mb-3">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── SUPPORTED PROGRAMS ─────────────────────────────────────────────────── */
const Programs: React.FC = () => {
  const programs = [
    { name: "JCI", full: "Joint Commission International", color: "bg-blue-500" },
    { name: "CBAHI", full: "Saudi Central Board for Accreditation", color: "bg-emerald-500" },
    { name: "DNV", full: "Det Norske Veritas Healthcare", color: "bg-sky-500" },
    { name: "CAP", full: "College of American Pathologists", color: "bg-amber-500" },
    { name: "ISO 15189", full: "Medical Laboratory Standard", color: "bg-violet-500" },
    { name: "NABH", full: "National Accreditation Board for Hospitals", color: "bg-rose-500" },
    { name: "ISO 9001", full: "Quality Management Systems", color: "bg-teal-500" },
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-brand-primary font-semibold text-sm tracking-wider uppercase mb-3">Comprehensive Coverage</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
            7+ Accreditation Programs Supported
          </h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Pre-loaded with standards, crosswalks, and evidence mapping for major international and regional programs.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {programs.map((p) => (
            <div
              key={p.name}
              className="group flex items-center gap-3 px-6 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-brand-primary/30 hover:shadow-lg transition-all cursor-default"
            >
              <div className={`w-3 h-3 rounded-full ${p.color}`} />
              <div>
                <div className="font-bold text-brand-text-primary dark:text-white text-sm">{p.name}</div>
                <div className="text-xs text-slate-400">{p.full}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── PRICING SECTION ────────────────────────────────────────────────────── */
const pricingTiers = [
  {
    name: "Starter",
    desc: "Perfect for small clinics and labs beginning their accreditation journey.",
    price: "$299",
    period: "/month",
    highlight: false,
    features: [
      "1 Accreditation Program",
      "Up to 25 Users",
      "Document Control Hub",
      "Basic Compliance Dashboard",
      "Email Support",
      "5 AI Document Generations / mo",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    desc: "For mid-size hospitals managing multiple accreditation programs.",
    price: "$799",
    period: "/month",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Up to 3 Accreditation Programs",
      "Up to 100 Users",
      "Full Document Control + AI Generation",
      "Risk & Audit Management",
      "Training & Competency LMS",
      "Real-Time Analytics Hub",
      "50 AI Document Generations / mo",
      "Priority Support",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    desc: "For large healthcare systems and multi-facility organizations.",
    price: "Custom",
    period: "",
    highlight: false,
    features: [
      "Unlimited Accreditation Programs",
      "Unlimited Users",
      "Multi-Tenant / Multi-Facility",
      "Lab Operations Module (CAP/LIMS)",
      "Workflow Automation",
      "Custom Report Builder",
      "Unlimited AI Generations",
      "Dedicated Account Manager",
      "On-Premise Option Available",
    ],
    cta: "Contact Sales",
  },
];

const Pricing: React.FC = () => (
  <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-950">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-brand-primary font-semibold text-sm tracking-wider uppercase mb-3">Simple Pricing</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
          Plans That Scale With Your Facility
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Start with a 14-day free trial. No credit card required. Upgrade anytime as your accreditation needs grow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {pricingTiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-2xl p-8 border transition-all ${
              tier.highlight
                ? "bg-white dark:bg-slate-800 border-brand-primary shadow-2xl shadow-brand-primary/10 scale-[1.02]"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl"
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-primary text-white text-xs font-semibold">
                {(tier as any).badge}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold text-brand-text-primary dark:text-white">{tier.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tier.desc}</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-extrabold text-brand-text-primary dark:text-white">{tier.price}</span>
              <span className="text-slate-500 dark:text-slate-400">{tier.period}</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <svg className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                tier.highlight
                  ? "bg-brand-primary text-white hover:bg-indigo-700 shadow-lg shadow-brand-primary/25"
                  : "bg-slate-100 dark:bg-slate-700 text-brand-text-primary dark:text-white hover:bg-brand-primary hover:text-white"
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── TESTIMONIALS ───────────────────────────────────────────────────────── */
const testimonials = [
  {
    quote: "AccreditEx reduced our JCI preparation time by 60%. The AI document generation alone saved us months of manual work.",
    name: "Dr. Sarah Al-Rashidi",
    role: "Quality Director",
    org: "Oman National Hospital",
  },
  {
    quote: "The gap analysis feature identified compliance gaps we had been overlooking for years. We achieved CAP accreditation on our first attempt.",
    name: "Dr. Ahmad Mansour",
    role: "Lab Director",
    org: "Gulf Medical Laboratory",
  },
  {
    quote: "Finally, a platform built specifically for healthcare accreditation — not generic project management retrofitted for our needs.",
    name: "Fatima Al-Harthi",
    role: "Accreditation Manager",
    org: "Royal Healthcare Group",
  },
];

const Testimonials: React.FC = () => (
  <section className="py-24 bg-white dark:bg-slate-900">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-brand-primary font-semibold text-sm tracking-wider uppercase mb-3">Trusted by Healthcare Leaders</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary dark:text-white">
          What Our Clients Say
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
          >
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic mb-6">"{t.quote}"</p>
            <div>
              <div className="font-semibold text-brand-text-primary dark:text-white text-sm">{t.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t.role} — {t.org}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── CTA SECTION ────────────────────────────────────────────────────────── */
const CTASection: React.FC = () => (
  <section className="py-24 bg-gradient-to-br from-brand-primary to-indigo-700 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10" style={{
      backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    }} />
    <div className="relative max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
        Ready to Transform Your Accreditation Journey?
      </h2>
      <p className="text-lg text-indigo-200 mb-10 max-w-2xl mx-auto">
        Join healthcare facilities across the Middle East and beyond who trust AccreditEx to streamline their accreditation process.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <a
          href="#pricing"
          className="px-8 py-4 rounded-xl bg-white text-brand-primary font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
        >
          Start Your Free Trial
        </a>
        <a
          href="mailto:sales@accreditex.com"
          className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
        >
          Contact Sales
        </a>
      </div>
    </div>
  </section>
);

/* ─── FOOTER ─────────────────────────────────────────────────────────────── */
const Footer: React.FC = () => (
  <footer className="py-16 bg-slate-900 text-slate-400">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <LogoIcon className="h-7 w-7 text-brand-primary" />
            <span className="text-lg font-bold text-white">
              Accredit<span className="text-brand-primary">Ex</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed">
            AI-powered healthcare accreditation management platform. Empowering hospitals and labs to achieve and maintain accreditation excellence.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
            <li><a href="/pitch" className="hover:text-white transition-colors">Pitch Deck</a></li>
            <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Programs</h4>
          <ul className="space-y-2 text-sm">
            <li><span>JCI Accreditation</span></li>
            <li><span>CBAHI Standards</span></li>
            <li><span>CAP Laboratory</span></li>
            <li><span>ISO 15189</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="mailto:sales@accreditex.com" className="hover:text-white transition-colors">Contact Sales</a></li>
            <li><a href="mailto:support@accreditex.com" className="hover:text-white transition-colors">Support</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">&copy; {new Date().getFullYear()} AccreditEx. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="text-xs">Made with care for healthcare professionals</span>
        </div>
      </div>
    </div>
  </footer>
);

/* ─── LANDING PAGE ───────────────────────────────────────────────────────── */
interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="bg-white dark:bg-slate-900">
      <Navbar onLogin={onLogin} />
      <Hero onLogin={onLogin} />
      <StatsBar />
      <Features />
      <Programs />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
