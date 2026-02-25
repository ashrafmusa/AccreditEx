import React, { useState, useEffect, useCallback, useRef } from "react";

/* ─── SLIDE TYPES ────────────────────────────────────────────────────────── */
interface Slide {
  id: string;
  title: string;
  render: () => React.ReactNode;
}

/* ─── PITCH DECK PAGE ────────────────────────────────────────────────────── */
const PitchDeckPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  /* — Slide definitions — */
  const slides: Slide[] = [
    /* ── 0 · Title ─────────────────────────────────────────────── */
    {
      id: "title",
      title: "Title",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 600px 600px at 50% 50%, rgba(0,137,123,0.12) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 space-y-8">
            <img
              src="/logo.png"
              alt="AccreditEx"
              className="h-20 w-20 rounded-2xl shadow-2xl mx-auto"
            />
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              Accredit<span className="text-teal-400">Ex</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed">
              AI-Native Healthcare Accreditation Platform
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-sm font-semibold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-300" />
              </span>
              From Audit Panic to Continuous Excellence
            </div>
            <div className="flex justify-center gap-8 pt-4">
              {[
                { v: "15+", l: "AI Tools" },
                { v: "240+", l: "Standards" },
                { v: "1,043", l: "Sub-Standards" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl font-black text-white">{s.v}</div>
                  <div className="text-xs text-white/50 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    /* ── 1 · Problem ───────────────────────────────────────────── */
    {
      id: "problem",
      title: "Problem",
      render: () => (
        <div className="flex flex-col justify-center h-full px-12 md:px-20 py-12 bg-white dark:bg-slate-900">
          <SectionBadge icon="⚠️" label="The Problem" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-10">
            The Healthcare Compliance Crisis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {[
              {
                stat: "30%",
                title: "Higher Audit Failure Risk",
                desc: "Human error in documentation is the #1 cause of non-conformities",
                color: "text-red-500",
                border: "border-red-200 dark:border-red-900/30",
              },
              {
                stat: "50%",
                title: "Clinician Burnout Rate",
                desc: "Quality managers spend more time on paperwork than patient safety",
                color: "text-orange-500",
                border: "border-orange-200 dark:border-orange-900/30",
              },
              {
                stat: "$2M+",
                title: "Cost of Non-Compliance",
                desc: "Lost contracts, reputation damage, and patient safety risks",
                color: "text-yellow-600",
                border: "border-yellow-200 dark:border-yellow-900/30",
              },
            ].map((p) => (
              <div
                key={p.stat}
                className={`p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border ${p.border}`}
              >
                <div className={`text-5xl font-black ${p.color} mb-3`}>
                  {p.stat}
                </div>
                <h3 className="text-lg font-bold text-brand-text-primary dark:text-white mb-1">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-400 italic">
            70% of GCC healthcare facilities still rely on spreadsheets, paper
            binders, and siloed emails for accreditation compliance.
          </p>
        </div>
      ),
    },

    /* ── 2 · Solution ──────────────────────────────────────────── */
    {
      id: "solution",
      title: "Solution",
      render: () => (
        <div className="flex flex-col justify-center h-full px-12 md:px-20 py-12 bg-white dark:bg-slate-900">
          <SectionBadge icon="🚀" label="The Solution" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-4">
            AccreditEx AI Platform
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-2xl">
            A comprehensive SaaS platform with 15+ AI-powered tools that
            automates healthcare accreditation — built by a clinical quality
            expert.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: "/pie-chart-svgrepo-com.svg",
                label: "Role-Based Dashboards",
              },
              { icon: "/set-up-svgrepo-com.svg", label: "Project Management" },
              {
                icon: "/document-lock-svgrepo-com.svg",
                label: "Document Control",
              },
              {
                icon: "/trend-analysis-svgrepo-com.svg",
                label: "Risk & CAPA Hub",
              },
              {
                icon: "/vertical-ruler-svgrepo-com.svg",
                label: "Training & Competency",
              },
              {
                icon: "/align-two-columns-svgrepo-com.svg",
                label: "Multi-Department",
              },
              { icon: "/look-up-svgrepo-com.svg", label: "Audit Management" },
              {
                icon: "/calculator-svgrepo-com.svg",
                label: "Calendar & Tasks",
              },
              { icon: "/help-svgrepo-com.svg", label: "AI Assistant" },
              { icon: "/insert-word-svgrepo-com.svg", label: "Doc Generator" },
              {
                icon: "/global-display-svgrepo-com.svg",
                label: "EN↔AR Translation",
              },
              {
                icon: "/scaling-ratio-svgrepo-com.svg",
                label: "Compliance Check",
              },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
              >
                <img
                  src={f.icon}
                  alt={f.label}
                  className="w-7 h-7"
                  loading="lazy"
                />
                <span className="text-sm font-semibold text-brand-text-primary dark:text-white">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    /* ── 3 · Market ────────────────────────────────────────────── */
    {
      id: "market",
      title: "Market",
      render: () => (
        <div className="flex flex-col justify-center h-full px-12 md:px-20 py-12 bg-white dark:bg-slate-900">
          <SectionBadge icon="📈" label="Market Opportunity" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-10">
            A $4.37B Market Ready for Disruption
          </h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-10 mb-10">
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
                className={`w-44 h-44 rounded-full border-[3px] ${m.border} ${m.bg} flex flex-col items-center justify-center text-center p-6`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {m.label}
                </div>
                <div className="text-3xl font-black text-brand-text-primary dark:text-white">
                  {m.value}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {m.desc}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/50 rounded-xl p-5 max-w-2xl mx-auto">
            <p className="text-sm text-teal-700 dark:text-teal-300 font-semibold text-center">
              💡 The Abu Dhabi DoH 2027 mandate for AI-native government creates
              a "buy or fail" window for healthcare facilities.
            </p>
          </div>
        </div>
      ),
    },

    /* ── 4 · Platform Overview ─────────────────────────────────── */
    {
      id: "platform",
      title: "Platform",
      render: () => (
        <div className="flex flex-col justify-center h-full px-12 md:px-20 py-12 bg-white dark:bg-slate-900">
          <SectionBadge icon="🏗️" label="Platform" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-4">
            35+ Pages, Production-Ready
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-2xl">
            Built with React 19, TypeScript, Tailwind CSS v4, Zustand, Firebase
            — and a Python FastAPI AI backend on Render.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { stat: "35+", label: "Pages / Views" },
              { stat: "15+", label: "AI Tools" },
              { stat: "240+", label: "Standards Loaded" },
              { stat: "1,043", label: "Sub-Standards" },
              { stat: "PWA", label: "Offline-First" },
              { stat: "EN/AR", label: "Full Bilingual" },
            ].map((s) => (
              <div
                key={s.label}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center"
              >
                <div className="text-3xl font-black text-teal-600">
                  {s.stat}
                </div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    /* ── 5 · Business Model ────────────────────────────────────── */
    {
      id: "business",
      title: "Business Model",
      render: () => (
        <div className="flex flex-col justify-center h-full px-12 md:px-20 py-12 bg-white dark:bg-slate-900">
          <SectionBadge icon="💳" label="Business Model" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-10">
            Scalable SaaS Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Core",
                price: "$500/mo",
                desc: "Small labs & clinics",
                users: "Up to 10 users",
                features: [
                  "Compliance tracking",
                  "Document management",
                  "Basic AI tools",
                  "Email support",
                ],
              },
              {
                name: "Enterprise",
                price: "$2,000/mo",
                desc: "Hospitals & networks",
                users: "Unlimited users",
                highlight: true,
                features: [
                  "Full AI predictive engine",
                  "Advanced analytics",
                  "Multi-department support",
                  "HIS integration",
                  "Priority support + SLA",
                ],
              },
              {
                name: "Custom",
                price: "Contact Us",
                desc: "Predictive Governance AI",
                users: "Custom deployment",
                features: [
                  "Premium AI features",
                  "Custom integrations",
                  "Dedicated success manager",
                  "On-premise option",
                ],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`p-8 rounded-2xl border text-center ${tier.highlight ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20 shadow-xl relative" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-bold tracking-wider">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-brand-text-primary dark:text-white">
                  {tier.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{tier.desc}</p>
                <div className="text-3xl font-black text-brand-text-primary dark:text-white my-4">
                  {tier.price}
                </div>
                <p className="text-xs text-teal-600 font-semibold mb-4">
                  {tier.users}
                </p>
                <ul className="space-y-2 text-left">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2"
                    >
                      <span className="text-teal-500 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    /* ── 6 · Competitive Advantage ─────────────────────────────── */
    {
      id: "competitive",
      title: "Competition",
      render: () => (
        <div className="flex flex-col justify-center h-full px-12 md:px-20 py-12 bg-white dark:bg-slate-900">
          <SectionBadge icon="🏆" label="Competitive Advantage" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-10">
            Why AccreditEx Wins
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="text-left py-3 px-4 font-bold text-brand-text-primary dark:text-white">
                    Capability
                  </th>
                  <th className="text-center py-3 px-4 font-bold text-teal-600">
                    AccreditEx
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-slate-400">
                    MEG
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-slate-400">
                    RLDatix
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-slate-400">
                    Vastian AI
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    cap: "Practitioner-Built",
                    us: "✓ Full",
                    meg: "✗",
                    rld: "✗",
                    vas: "✗",
                  },
                  {
                    cap: "GCC Templates",
                    us: "✓ DOH/DHA/MOH",
                    meg: "Partial",
                    rld: "✗",
                    vas: "Limited",
                  },
                  {
                    cap: "AI (15+ Tools)",
                    us: "✓ Native",
                    meg: "Basic",
                    rld: "Basic",
                    vas: "✓",
                  },
                  {
                    cap: "Bilingual EN/AR",
                    us: "✓ Full RTL",
                    meg: "✗",
                    rld: "✗",
                    vas: "Partial",
                  },
                  {
                    cap: "PWA / Offline",
                    us: "✓",
                    meg: "✗",
                    rld: "✗",
                    vas: "✗",
                  },
                  {
                    cap: "Pre-loaded Standards",
                    us: "✓ 240+ / 1,043",
                    meg: "✗",
                    rld: "✗",
                    vas: "✗",
                  },
                  {
                    cap: "SME-Affordable",
                    us: "✓ $500/mo",
                    meg: "✗",
                    rld: "✗",
                    vas: "✗",
                  },
                ].map((r) => (
                  <tr
                    key={r.cap}
                    className="border-t border-slate-100 dark:border-slate-700/50"
                  >
                    <td className="py-2.5 px-4 font-semibold text-brand-text-primary dark:text-white">
                      {r.cap}
                    </td>
                    <td className="py-2.5 px-4 text-center text-teal-600 font-bold">
                      {r.us}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-400">
                      {r.meg}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-400">
                      {r.rld}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-400">
                      {r.vas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },

    /* ── 7 · Team ──────────────────────────────────────────────── */
    {
      id: "team",
      title: "Team",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full px-12 md:px-20 py-12 bg-white dark:bg-slate-900 text-center">
          <SectionBadge icon="👤" label="Team" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-10">
            The "Black Belt" Advantage
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-10 border border-slate-200 dark:border-slate-700 max-w-3xl mx-auto">
            <img
              src="/CEO.jpg"
              alt="Ashraf Abu baker Musa Ishag — Founder & CEO"
              className="w-32 h-32 rounded-full object-cover border-4 border-teal-400 shadow-lg flex-shrink-0"
              loading="lazy"
            />
            <div className="text-left">
              <h3 className="text-2xl font-extrabold text-brand-text-primary dark:text-white">
                Ashraf Abu baker Musa Ishag
              </h3>
              <p className="text-teal-600 font-semibold mt-1 mb-4">
                Founder & CEO
              </p>
              <ul className="space-y-2">
                {[
                  "🎓 B.Sc. Medical Lab Science, ISQUA Fellow",
                  "⚡ Six Sigma Black Belt · Google Project Manager",
                  "🏥 Licensed Lab Quality Manager (Oman/Sudan)",
                  "💻 Full-Stack Developer (React, TS, Firebase, AI)",
                  "📝 Published researcher",
                ].map((c) => (
                  <li
                    key={c}
                    className="text-sm text-slate-600 dark:text-slate-300"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-6 max-w-xl">
            A rare blend of clinical expertise, operational excellence, and
            full-stack technical capability — designed the platform from the
            inside of healthcare quality.
          </p>
        </div>
      ),
    },

    /* ── 8 · Roadmap ───────────────────────────────────────────── */
    {
      id: "roadmap",
      title: "Roadmap",
      render: () => (
        <div className="flex flex-col justify-center h-full px-12 md:px-20 py-12 bg-white dark:bg-slate-900">
          <SectionBadge icon="🗺️" label="Roadmap" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-4">
            The Abu Dhabi Vision
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-2xl">
            Strategic roadmap aligned with Abu Dhabi Economic Vision 2030.
          </p>
          <div className="max-w-2xl space-y-8">
            {[
              {
                year: "2026",
                title: "Strategic HQ at ADGM",
                desc: "Establishing AccreditEx AI Lab at Abu Dhabi Global Market",
                icon: "🏛️",
              },
              {
                year: "2026",
                title: "National Integration",
                desc: "API roadmap for Malaffi (UAE Health Information Exchange) integration",
                icon: "🔗",
              },
              {
                year: "2027",
                title: "Local R&D Partnership",
                desc: "Partnering with MBZUAI for R&D and hiring local AI talent",
                icon: "🤖",
              },
              {
                year: "Long-term",
                title: "Global Benchmark",
                desc: "10-Year Golden Visa & making Abu Dhabi the global benchmark for AI-driven clinical safety",
                icon: "🌍",
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
                    {r.icon} {r.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {r.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    /* ── 9 · The Ask ───────────────────────────────────────────── */
    {
      id: "ask",
      title: "The Ask",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full px-12 md:px-20 py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden text-center">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 600px 400px at 50% 50%, rgba(0,137,123,0.15) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 space-y-8 max-w-2xl">
            <SectionBadge icon="🤝" label="The Ask" dark />
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Let's Build the Future of
              <br />
              <span className="text-teal-400">Healthcare Quality</span>
            </h2>
            <p className="text-lg text-white/60 max-w-lg mx-auto leading-relaxed">
              We're seeking strategic investors and partners who share our
              vision of AI-driven continuous clinical excellence across the GCC
              and beyond.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {[
                { label: "Product", value: "Live & Production-Ready" },
                { label: "Standards", value: "240+ Loaded" },
                { label: "AI Tools", value: "15+ Built-In" },
                { label: "Target", value: "5,000+ GCC Facilities" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.08]"
                >
                  <div className="text-xs text-white/50">{s.label}</div>
                  <div className="text-sm font-bold text-white">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a
                href="mailto:ashraf.a.m.ishag@gmail.com"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
              >
                Contact Founder
              </a>
              <a
                href="https://accreditex.web.app"
                className="px-8 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white font-semibold hover:bg-white/15 transition-all"
              >
                Launch App →
              </a>
              <a
                href="https://linkedin.com/in/ashraf-ishag"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 rounded-xl border border-white/20 bg-white/[0.06] text-white font-semibold hover:bg-white/15 transition-all"
              >
                💼 LinkedIn
              </a>
            </div>
            <p className="text-xs text-white/40 pt-2">
              ashraf.a.m.ishag@gmail.com · Seeb, Muscat · Relocating to Abu
              Dhabi 2026
            </p>
          </div>
        </div>
      ),
    },
  ];

  /* — Navigation — */
  const goTo = useCallback(
    (idx: number) => {
      setCurrentSlide(Math.max(0, Math.min(slides.length - 1, idx)));
    },
    [slides.length],
  );

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  /* — Keyboard — */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen();
      }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  /* — Touch — */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  };

  /* — Fullscreen — */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && deckRef.current) {
      deckRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div
      ref={deckRef}
      className="fixed inset-0 bg-white dark:bg-slate-900 flex flex-col select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Toolbar ── */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <a
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-brand-text-primary dark:text-white hover:text-teal-600 transition-colors"
        >
          ← Back to Site
        </a>
        <div className="flex items-center gap-1">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentSlide
                  ? "bg-teal-500 scale-125"
                  : "bg-slate-300 dark:bg-slate-600 hover:bg-teal-400"
              }`}
              title={s.title}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
          <span>
            {currentSlide + 1} / {slides.length}
          </span>
          <button
            onClick={toggleFullscreen}
            className="hover:text-teal-500 transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? "⊙" : "⛶"}
          </button>
        </div>
      </div>

      {/* ── Slide content ── */}
      <div className="flex-1 pt-11">{slides[currentSlide].render()}</div>

      {/* ── Navigation buttons ── */}
      {currentSlide > 0 && (
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-white hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all"
          aria-label="Previous slide"
        >
          ←
        </button>
      )}
      {currentSlide < slides.length - 1 && (
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-white hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all"
          aria-label="Next slide"
        >
          →
        </button>
      )}

      {/* ── Keyboard hint ── */}
      <div className="absolute bottom-3 inset-x-0 z-40 text-center text-[10px] text-slate-400 pointer-events-none">
        Arrow keys · Space · F for fullscreen · Esc to exit
      </div>
    </div>
  );
};

/* ─── SHARED ─────────────────────────────────────────────────────────────── */
const SectionBadge: React.FC<{
  icon: string;
  label: string;
  dark?: boolean;
}> = ({ icon, label, dark }) => (
  <span
    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 w-fit ${
      dark
        ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
        : "bg-teal-500/10 text-teal-600 dark:text-teal-400"
    }`}
  >
    {icon} {label}
  </span>
);

export default PitchDeckPage;
