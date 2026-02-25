import React, { useState, useEffect, useCallback, useRef } from "react";
import { LogoIcon } from "@/components/icons";

/* ─── TYPES ──────────────────────────────────────────────────────────────── */
interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  bgClass: string;
}

/* ─── HELPER: STAT CARD ──────────────────────────────────────────────────── */
const StatCard: React.FC<{ value: string; label: string; accent?: string }> = ({
  value,
  label,
  accent = "text-brand-primary",
}) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
    <div className={`text-4xl md:text-5xl font-extrabold ${accent}`}>{value}</div>
    <div className="text-sm text-slate-300 mt-2">{label}</div>
  </div>
);

/* ─── HELPER: FEATURE ROW ────────────────────────────────────────────────── */
const FeatureRow: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({
  icon,
  title,
  desc,
}) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-cyan-400">
      {icon}
    </div>
    <div>
      <h4 className="font-semibold text-white text-base">{title}</h4>
      <p className="text-sm text-slate-400 mt-0.5">{desc}</p>
    </div>
  </div>
);

/* ─── SLIDE DEFINITIONS ──────────────────────────────────────────────────── */
const slides: Slide[] = [
  /* Slide 1: Title */
  {
    id: "title",
    title: "",
    bgClass: "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-[fadeInUp_0.6s_ease-out]">
        <LogoIcon className="w-20 h-20 text-brand-primary mb-6" />
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-2">
          Accredit<span className="text-brand-primary">Ex</span>
        </h1>
        <p className="text-xl md:text-2xl text-indigo-300 font-light mt-4 max-w-2xl">
          AI-Powered Healthcare Accreditation Management
        </p>
        <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live at accreditex.web.app
        </div>
      </div>
    ),
  },

  /* Slide 2: The Problem */
  {
    id: "problem",
    title: "The Problem",
    subtitle: "Healthcare accreditation is broken",
    bgClass: "bg-gradient-to-br from-slate-900 to-red-950/30",
    content: (
      <div className="max-w-4xl mx-auto px-8 animate-[fadeInUp_0.6s_ease-out]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[
              {
                stat: "18-24 months",
                label: "Average time to achieve first-time accreditation",
              },
              {
                stat: "40%",
                label: "Of facilities fail their first accreditation survey",
              },
              {
                stat: "$500K+",
                label: "Average cost of accreditation preparation per facility",
              },
            ].map((item) => (
              <div key={item.stat} className="flex items-center gap-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <div className="text-2xl font-extrabold text-red-400 flex-shrink-0 w-28">{item.stat}</div>
                <div className="text-sm text-slate-300">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Key Pain Points</h3>
            {[
              "Manual, paper-based compliance tracking",
              "Fragmented tools — spreadsheets, drives, email",
              "No real-time visibility into compliance gaps",
              "Siloed departments with no cross-standard mapping",
              "Consultant dependency costing $200-500/hour",
              "Evidence collection chaos before survey visits",
            ].map((pain) => (
              <div key={pain} className="flex items-center gap-3 text-sm text-slate-300">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {pain}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  /* Slide 3: The Solution */
  {
    id: "solution",
    title: "The Solution",
    subtitle: "One platform. Complete accreditation management.",
    bgClass: "bg-gradient-to-br from-slate-900 to-indigo-950/50",
    content: (
      <div className="max-w-4xl mx-auto px-8 animate-[fadeInUp_0.6s_ease-out]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureRow
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            title="7+ Accreditation Programs"
            desc="JCI, CBAHI, DNV, CAP, ISO 15189, NABH, ISO 9001 — all pre-loaded with standards and crosswalks."
          />
          <FeatureRow
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            title="21+ AI-Powered Tools"
            desc="Auto-generate policies, SOPs, gap analyses, risk assessments, and audit reports using AI."
          />
          <FeatureRow
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            title="Real-Time Dashboards"
            desc="Live compliance tracking with role-based views for admins, project leads, auditors, and team members."
          />
          <FeatureRow
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            title="Training & Competency LMS"
            desc="Quiz-based training, certificate generation, CE credits, skill matrices, and learning paths."
          />
          <FeatureRow
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
            title="Lab Operations Module"
            desc="CAP assessments, QC data import, LIMS integration, and tracer worksheets for lab compliance."
          />
          <FeatureRow
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>}
            title="English & Arabic (Full RTL)"
            desc="Complete bilingual support with right-to-left layout for Arabic-speaking regions."
          />
        </div>
      </div>
    ),
  },

  /* Slide 4: Market Opportunity */
  {
    id: "market",
    title: "Market Opportunity",
    subtitle: "A massive, underserved market",
    bgClass: "bg-gradient-to-br from-slate-900 to-emerald-950/30",
    content: (
      <div className="max-w-4xl mx-auto px-8 animate-[fadeInUp_0.6s_ease-out]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <StatCard value="$12.5B" label="Global Healthcare Quality Mgmt Market (2026)" accent="text-emerald-400" />
          <StatCard value="14.2%" label="Annual Growth Rate (CAGR)" accent="text-emerald-400" />
          <StatCard value="500K+" label="Hospitals Worldwide" accent="text-cyan-400" />
          <StatCard value="$2.1B" label="Middle East Healthcare IT Market" accent="text-cyan-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h4 className="font-bold text-white mb-4">Initial Target Market</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> GCC Region — 2,000+ hospitals pursuing JCI/CBAHI</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Clinical Laboratories — CAP & ISO 15189 certification</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Multi-facility healthcare groups expanding regionally</li>
            </ul>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h4 className="font-bold text-white mb-4">Expansion Markets</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Southeast Asia — rapid healthcare infrastructure growth</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Africa — WHO accreditation push for quality improvement</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400" /> North America — 6,000+ hospitals maintaining JCI/DNV</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },

  /* Slide 5: Product Demo */
  {
    id: "product",
    title: "The Platform",
    subtitle: "35 integrated pages — built for healthcare",
    bgClass: "bg-gradient-to-br from-slate-900 to-violet-950/30",
    content: (
      <div className="max-w-4xl mx-auto px-8 animate-[fadeInUp_0.6s_ease-out]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Dashboard", desc: "Role-based KPIs", icon: "📊" },
            { name: "Projects", desc: "Accreditation lifecycle", icon: "📁" },
            { name: "Document Control", desc: "AI-powered docs", icon: "📄" },
            { name: "Risk Hub", desc: "ISO 31000 compliant", icon: "⚠️" },
            { name: "Audit Hub", desc: "Survey preparation", icon: "🔍" },
            { name: "Training LMS", desc: "Competency tracking", icon: "🎓" },
            { name: "Analytics", desc: "Real-time insights", icon: "📈" },
            { name: "Accreditation Hub", desc: "Evidence mapping", icon: "✅" },
            { name: "Calendar", desc: "Deadline tracking", icon: "📅" },
            { name: "Lab Operations", desc: "CAP & LIMS", icon: "🔬" },
            { name: "Messaging", desc: "Team collaboration", icon: "💬" },
            { name: "Report Builder", desc: "Custom reports", icon: "📋" },
          ].map((p) => (
            <div
              key={p.name}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-violet-400/30 transition-colors"
            >
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="font-semibold text-white text-sm">{p.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{p.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href="https://accreditex.web.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold shadow-lg hover:bg-indigo-700 transition-colors"
          >
            Try Live Demo
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    ),
  },

  /* Slide 6: Business Model */
  {
    id: "business-model",
    title: "Business Model",
    subtitle: "SaaS subscription — predictable, scalable revenue",
    bgClass: "bg-gradient-to-br from-slate-900 to-blue-950/30",
    content: (
      <div className="max-w-4xl mx-auto px-8 animate-[fadeInUp_0.6s_ease-out]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            {
              tier: "Starter",
              price: "$299/mo",
              target: "Small clinics & labs",
              features: ["1 program", "25 users", "5 AI docs/mo"],
              color: "border-sky-400/30",
            },
            {
              tier: "Professional",
              price: "$799/mo",
              target: "Mid-size hospitals",
              features: ["3 programs", "100 users", "50 AI docs/mo"],
              color: "border-brand-primary",
              highlight: true,
            },
            {
              tier: "Enterprise",
              price: "Custom",
              target: "Healthcare systems",
              features: ["Unlimited", "Multi-tenant", "Dedicated support"],
              color: "border-violet-400/30",
            },
          ].map((t) => (
            <div
              key={t.tier}
              className={`rounded-2xl p-6 border ${t.color} ${
                t.highlight ? "bg-brand-primary/10" : "bg-white/5"
              }`}
            >
              <div className="font-bold text-white text-lg">{t.tier}</div>
              <div className="text-2xl font-extrabold text-white mt-1">{t.price}</div>
              <div className="text-xs text-slate-400 mt-1">{t.target}</div>
              <ul className="mt-4 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center">
            <div className="text-2xl font-extrabold text-blue-400">$15K</div>
            <div className="text-xs text-slate-400 mt-1">Average Annual Revenue per Customer</div>
          </div>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center">
            <div className="text-2xl font-extrabold text-blue-400">85%+</div>
            <div className="text-xs text-slate-400 mt-1">Projected Gross Margin</div>
          </div>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center">
            <div className="text-2xl font-extrabold text-blue-400">95%</div>
            <div className="text-xs text-slate-400 mt-1">Expected Retention Rate</div>
          </div>
        </div>
      </div>
    ),
  },

  /* Slide 7: Competitive Advantage */
  {
    id: "advantage",
    title: "Why AccreditEx Wins",
    subtitle: "Built for healthcare, not adapted from generic tools",
    bgClass: "bg-gradient-to-br from-slate-900 to-amber-950/20",
    content: (
      <div className="max-w-4xl mx-auto px-8 animate-[fadeInUp_0.6s_ease-out]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-brand-primary font-bold">AccreditEx</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Generic QMS</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Consultants</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Pre-loaded Healthcare Standards", true, false, false],
                ["AI Document Generation", true, false, false],
                ["Cross-Standard Evidence Mapping", true, false, true],
                ["Real-Time Compliance Dashboard", true, true, false],
                ["Built-in Training LMS", true, false, false],
                ["Lab Operations (CAP/LIMS)", true, false, false],
                ["Arabic + RTL Support", true, false, true],
                ["Multi-Tenant Architecture", true, true, false],
                ["Cost per Year", "$3.6K–$10K", "$10K–$50K", "$100K+"],
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-3 px-4 text-slate-300">{row[0]}</td>
                  {[1, 2, 3].map((col) => (
                    <td key={col} className="py-3 px-4 text-center">
                      {typeof row[col] === "boolean" ? (
                        row[col] ? (
                          <svg className="w-5 h-5 text-green-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className={col === 1 ? "text-brand-primary font-semibold" : "text-slate-400"}>
                          {row[col] as string}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },

  /* Slide 8: Traction & Roadmap */
  {
    id: "traction",
    title: "Traction & Roadmap",
    subtitle: "Live product. Ready to scale.",
    bgClass: "bg-gradient-to-br from-slate-900 to-teal-950/30",
    content: (
      <div className="max-w-4xl mx-auto px-8 animate-[fadeInUp_0.6s_ease-out]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-white text-lg mb-6">Achieved</h4>
            <div className="space-y-4">
              {[
                { milestone: "Full Platform Built & Deployed", date: "Live", status: "done" },
                { milestone: "35 Integrated Pages", date: "Complete", status: "done" },
                { milestone: "21+ AI Tools Operational", date: "Complete", status: "done" },
                { milestone: "7 Accreditation Programs Loaded", date: "Complete", status: "done" },
                { milestone: "Multi-Tenant Architecture", date: "Complete", status: "done" },
                { milestone: "Firebase + Render.com Deployment", date: "Live", status: "done" },
              ].map((m) => (
                <div key={m.milestone} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{m.milestone}</div>
                  </div>
                  <div className="text-xs text-green-400 font-medium">{m.date}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white text-lg mb-6">Roadmap</h4>
            <div className="space-y-4">
              {[
                { milestone: "First Hospital Pilot (Oman)", date: "Q1 2026", status: "next" },
                { milestone: "Mobile App (iOS/Android)", date: "Q2 2026", status: "planned" },
                { milestone: "GCC Market Expansion", date: "Q3 2026", status: "planned" },
                { milestone: "Offline-first Mode", date: "Q3 2026", status: "planned" },
                { milestone: "API Marketplace for EHR Integration", date: "Q4 2026", status: "planned" },
                { milestone: "SE Asia / Africa Expansion", date: "2027", status: "planned" },
              ].map((m) => (
                <div key={m.milestone} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.status === "next" ? "bg-brand-primary/20" : "bg-slate-700"
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      m.status === "next" ? "bg-brand-primary animate-pulse" : "bg-slate-500"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{m.milestone}</div>
                  </div>
                  <div className={`text-xs font-medium ${
                    m.status === "next" ? "text-brand-primary" : "text-slate-500"
                  }`}>
                    {m.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  /* Slide 9: The Ask */
  {
    id: "ask",
    title: "The Ask",
    bgClass: "bg-gradient-to-br from-slate-900 via-brand-primary/20 to-slate-900",
    content: (
      <div className="max-w-3xl mx-auto px-8 text-center animate-[fadeInUp_0.6s_ease-out]">
        <div className="text-6xl md:text-7xl font-extrabold text-white mb-2">$1.5M</div>
        <div className="text-xl text-indigo-300 mb-10">Seed Round</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { pct: "40%", label: "Product & Engineering", desc: "Mobile app, EHR integrations, offline mode" },
            { pct: "35%", label: "Sales & Marketing", desc: "GCC hospital pilots, trade shows, partnerships" },
            { pct: "25%", label: "Operations", desc: "Customer success, compliance certifications, team" },
          ].map((u) => (
            <div key={u.label} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-extrabold text-brand-primary">{u.pct}</div>
              <div className="text-sm font-semibold text-white mt-2">{u.label}</div>
              <div className="text-xs text-slate-400 mt-1">{u.desc}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <a
            href="mailto:invest@accreditex.com"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-primary text-white font-semibold text-lg shadow-xl shadow-brand-primary/30 hover:bg-indigo-700 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            invest@accreditex.com
          </a>
          <p className="text-sm text-slate-400">
            Live demo available at{" "}
            <a href="https://accreditex.web.app" className="text-brand-primary hover:underline" target="_blank" rel="noopener noreferrer">
              accreditex.web.app
            </a>
          </p>
        </div>
      </div>
    ),
  },
];

/* ─── PITCH DECK PAGE ────────────────────────────────────────────────────── */
const PitchDeckPage: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const totalSlides = slides.length;
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) setCurrent(index);
    },
    [totalSlides]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        window.location.href = "/";
      } else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          containerRef.current?.requestFullscreen();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  // Touch swipe support
  const touchStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    touchStart.current = null;
  };

  const slide = slides[current];

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col ${slide.bgClass} transition-all duration-500`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 z-10">
        <a href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
        </a>

        <div className="flex items-center gap-2 text-white/40 text-sm">
          <span>{current + 1}</span>
          <span>/</span>
          <span>{totalSlides}</span>
        </div>

        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              containerRef.current?.requestFullscreen();
            }
          }}
          className="text-white/40 hover:text-white transition-colors p-2"
          title="Toggle fullscreen (F)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
        {/* Title */}
        {slide.title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">{slide.title}</h2>
            {slide.subtitle && (
              <p className="text-lg text-slate-400 mt-2">{slide.subtitle}</p>
            )}
          </div>
        )}

        {/* Content */}
        <div key={slide.id} className="w-full max-w-6xl">
          {slide.content}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between px-6 py-4 z-10">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? "w-8 h-2 bg-brand-primary"
                  : "w-2 h-2 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === totalSlides - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="hidden md:flex items-center justify-center gap-6 pb-3 text-xs text-white/20">
        <span>← → Navigate</span>
        <span>Space Next</span>
        <span>F Fullscreen</span>
        <span>Esc Exit</span>
      </div>
    </div>
  );
};

export default PitchDeckPage;
