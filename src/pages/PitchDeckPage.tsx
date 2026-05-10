import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LanguageContext } from "../components/common/LanguageProvider";
import {
    BoltIcon,
    ChartBarIcon,
    ChartPieIcon,
    CheckBadgeIcon,
    CheckIcon,
    CircleStackIcon,
    ExclamationTriangleIcon,
    FlagIcon,
    LightBulbIcon,
    SparklesIcon,
    StarIcon
} from "../components/icons";

type Lang = "en" | "ar";

interface Slide {
  id: string;
  title: string;
  render: () => React.ReactNode;
}

interface PitchCopy {
  back: string;
  deckTitle: string;
  keyboardHint: string;
  languageToggle: string;
  slides: {
    title: {
      badge: string;
      headline: string;
      sub: string;
      valueProps: Array<{ value: string; label: string }>;
    };
    visionMission: {
      badge: string;
      headline: string;
      visionTitle: string;
      visionBody: string;
      missionTitle: string;
      missionBody: string;
      promiseTitle: string;
      promiseBody: string;
    };
    problem: {
      badge: string;
      headline: string;
      points: Array<{ stat: string; title: string; desc: string }>;
      footnote: string;
    };
    solution: {
      badge: string;
      headline: string;
      body: string;
      features: string[];
    };
    market: {
      badge: string;
      headline: string;
      circles: Array<{ label: string; value: string; desc: string }>;
      insight: string;
    };
    business: {
      badge: string;
      headline: string;
      tiers: Array<{
        name: string;
        price: string;
        desc: string;
        points: string[];
        highlight?: boolean;
      }>;
    };
    traction: {
      badge: string;
      headline: string;
      stats: Array<{ value: string; label: string }>;
      roadmap: Array<{ year: string; text: string }>;
    };
    ask: {
      badge: string;
      headline: string;
      body: string;
      useOfFundsTitle: string;
      useOfFunds: Array<{ pct: string; item: string }>;
      ctaPrimary: string;
      ctaSecondary: string;
      contactLine: string;
    };
  };
}

const COPY: Record<Lang, PitchCopy> = {
  en: {
    back: "Back to Site",
    deckTitle: "AccreditEx Investor Deck",
    keyboardHint: "Arrow keys · Space · F for fullscreen · Esc to exit",
    languageToggle: "العربية",
    slides: {
      title: {
        badge: "Investor Pitch",
        headline: "AccreditEx",
        sub: "AI-native healthcare accreditation platform for the GCC and MENA region.",
        valueProps: [
          { value: "19", label: "Integrated Modules" },
          { value: "EN + AR", label: "Bilingual RTL" },
          { value: "28", label: "HIS/LIMS Connectors" },
        ],
      },
      visionMission: {
        badge: "Vision & Mission",
        headline: "Built from real quality pain, not from generic software assumptions.",
        visionTitle: "Vision",
        visionBody:
          "To make healthcare accreditation continuous, data-driven, and trusted across every hospital and lab in our region.",
        missionTitle: "Mission",
        missionBody:
          "Give quality teams one AI-enabled platform to run audits, document control, CAPA, risk, training, and readiness in one workflow.",
        promiseTitle: "Our Promise to Investors",
        promiseBody:
          "AccreditEx turns compliance from an annual panic event into an always-on operational discipline with measurable ROI.",
      },
      problem: {
        badge: "The Problem",
        headline: "Healthcare facilities still manage accreditation with fragmented tools.",
        points: [
          {
            stat: "30%",
            title: "Higher audit failure risk",
            desc: "Manual documentation errors remain a major non-conformity source.",
          },
          {
            stat: "50%",
            title: "Process friction",
            desc: "Quality teams spend excessive time collecting evidence instead of improving care quality.",
          },
          {
            stat: "$2M+",
            title: "Cost of non-compliance",
            desc: "Missed contracts, reputational damage, and operational disruption.",
          },
        ],
        footnote:
          "Most regional providers still use spreadsheets, paper binders, and disconnected emails for critical compliance workflows.",
      },
      solution: {
        badge: "The Solution",
        headline: "One operating system for accreditation excellence.",
        body:
          "AccreditEx unifies readiness, execution, and evidence across governance, quality, and frontline teams.",
        features: [
          "Audit Hub + CAPA + Risk Hub",
          "Document Control + versioning",
          "Training, competency, and tasks",
          "AI assistant for quality workflows",
          "Executive analytics and reporting",
          "Arabic/English full RTL support",
        ],
      },
      market: {
        badge: "Market Opportunity",
        headline: "A mandate-driven market with urgent buying pressure.",
        circles: [
          { label: "TAM", value: "$38.5B", desc: "Global health software" },
          { label: "SAM", value: "$4.37B", desc: "Quality + compliance segment" },
          { label: "SOM", value: "5,000+", desc: "GCC healthcare facilities" },
        ],
        insight:
          "Government and regulator pressure in the GCC is accelerating digital compliance adoption now, not later.",
      },
      business: {
        badge: "Business Model",
        headline: "Recurring SaaS with enterprise expansion paths.",
        tiers: [
          {
            name: "Starter",
            price: "$499/mo",
            desc: "For clinics and labs",
            points: ["Core modules", "Basic AI support", "Bilingual UI"],
          },
          {
            name: "Professional",
            price: "$1,499/mo",
            desc: "For hospitals",
            points: ["All modules", "Advanced analytics", "HIS/LIMS integrations"],
            highlight: true,
          },
          {
            name: "Enterprise",
            price: "Custom",
            desc: "For networks and consultants",
            points: ["White-label", "Dedicated success", "Custom integration roadmap"],
          },
        ],
      },
      traction: {
        badge: "Traction",
        headline: "Live product, clear roadmap, founder-led execution speed.",
        stats: [
          { value: "Live", label: "Production deployment" },
          { value: "295+", label: "React components" },
          { value: "107+", label: "Service functions" },
          { value: "iOS + Android", label: "Mobile support" },
        ],
        roadmap: [
          { year: "2026", text: "Pilot hospitals in GCC" },
          { year: "2027", text: "Consultancy partnerships" },
          { year: "2028", text: "Regional regulatory channels" },
        ],
      },
      ask: {
        badge: "The Ask",
        headline: "Pre-seed round to accelerate pilot acquisition and scale.",
        body:
          "Product is built and deployed. Capital now converts execution into commercial momentum.",
        useOfFundsTitle: "Use of Funds",
        useOfFunds: [
          { pct: "40%", item: "Sales and GCC pilot onboarding" },
          { pct: "30%", item: "Product and integrations" },
          { pct: "20%", item: "Team growth (sales/tech)" },
          { pct: "10%", item: "Legal and market expansion" },
        ],
        ctaPrimary: "Contact Founder",
        ctaSecondary: "Open Product",
        contactLine: "Ashraf.a.m.ishag@gmail.com · Muscat / Abu Dhabi",
      },
    },
  },
  ar: {
    back: "العودة للموقع",
    deckTitle: "عرض أكرديتكس للمستثمرين",
    keyboardHint: "الأسهم · المسافة · F للشاشة الكاملة · Esc للخروج",
    languageToggle: "English",
    slides: {
      title: {
        badge: "عرض استثماري",
        headline: "AccreditEx",
        sub: "منصة ذكية لإدارة اعتماد المنشآت الصحية في الخليج والمنطقة.",
        valueProps: [
          { value: "19", label: "وحدة متكاملة" },
          { value: "AR + EN", label: "ثنائي اللغة RTL" },
          { value: "28", label: "تكامل HIS/LIMS" },
        ],
      },
      visionMission: {
        badge: "الرؤية والرسالة",
        headline: "تم بناء المنصة من واقع تحديات الجودة الحقيقية داخل القطاع الصحي.",
        visionTitle: "الرؤية",
        visionBody:
          "تحويل الاعتماد الصحي إلى عملية مستمرة وموثوقة ومدعومة بالبيانات في كل مستشفى ومختبر.",
        missionTitle: "الرسالة",
        missionBody:
          "تمكين فرق الجودة بمنصة واحدة مدعومة بالذكاء الاصطناعي لإدارة التدقيق والوثائق والمخاطر والتدريب وخطط التحسين.",
        promiseTitle: "وعدنا للمستثمر",
        promiseBody:
          "أكرديتكس يحول الامتثال من ضغط موسمي إلى نظام تشغيلي دائم بنتائج قابلة للقياس.",
      },
      problem: {
        badge: "المشكلة",
        headline: "العديد من المنشآت الصحية ما زالت تدير الاعتماد عبر أدوات متفرقة.",
        points: [
          {
            stat: "30%",
            title: "مخاطر أعلى في نتائج التدقيق",
            desc: "الأخطاء اليدوية في الوثائق تظل سبباً رئيسياً في حالات عدم المطابقة.",
          },
          {
            stat: "50%",
            title: "هدر تشغيلي",
            desc: "فرق الجودة تقضي وقتاً طويلاً في جمع الأدلة بدلاً من تحسين جودة الرعاية.",
          },
          {
            stat: "$2M+",
            title: "تكلفة عدم الامتثال",
            desc: "خسارة عقود وضرر السمعة وتعطل تشغيلي.",
          },
        ],
        footnote:
          "لا تزال النماذج الورقية والجداول المتفرقة والبريد الإلكتروني أدوات أساسية في كثير من مسارات الامتثال.",
      },
      solution: {
        badge: "الحل",
        headline: "نظام تشغيل واحد لتميّز الاعتماد.",
        body:
          "توحّد أكرديتكس جاهزية الاعتماد والتنفيذ وتوثيق الأدلة في سير عمل واحد بين الإدارة والفرق التشغيلية.",
        features: [
          "مركز التدقيق + CAPA + المخاطر",
          "إدارة الوثائق وتتبع الإصدارات",
          "التدريب والكفاءات والمهام",
          "مساعد ذكاء اصطناعي للجودة",
          "تحليلات وتقارير تنفيذية",
          "دعم عربي/إنجليزي كامل مع RTL",
        ],
      },
      market: {
        badge: "فرصة السوق",
        headline: "سوق مدفوع بالأنظمة واللوائح مع حاجة فورية للحلول.",
        circles: [
          { label: "TAM", value: "$38.5B", desc: "سوق البرمجيات الصحية عالمياً" },
          { label: "SAM", value: "$4.37B", desc: "شريحة الجودة والامتثال" },
          { label: "SOM", value: "5,000+", desc: "منشأة صحية في الخليج" },
        ],
        insight:
          "الضغوط التنظيمية والرقابية في الخليج تُسرّع قرارات الشراء الآن وليس لاحقاً.",
      },
      business: {
        badge: "نموذج العمل",
        headline: "نمو SaaS متكرر مع مسار توسع مؤسسي واضح.",
        tiers: [
          {
            name: "Starter",
            price: "$499/شهرياً",
            desc: "للعيادات والمختبرات",
            points: ["الوحدات الأساسية", "ذكاء اصطناعي أساسي", "واجهة ثنائية اللغة"],
          },
          {
            name: "Professional",
            price: "$1,499/شهرياً",
            desc: "للمستشفيات",
            points: ["كل الوحدات", "تحليلات متقدمة", "تكاملات HIS/LIMS"],
            highlight: true,
          },
          {
            name: "Enterprise",
            price: "حسب الطلب",
            desc: "للشبكات والاستشاريين",
            points: ["هوية بيضاء", "نجاح عملاء مخصص", "تكاملات مخصصة"],
          },
        ],
      },
      traction: {
        badge: "التقدم",
        headline: "منتج حي، خارطة واضحة، وسرعة تنفيذ عالية.",
        stats: [
          { value: "Live", label: "منصة تشغيلية" },
          { value: "295+", label: "مكوّن React" },
          { value: "107+", label: "دوال خدمات" },
          { value: "iOS + Android", label: "دعم الجوال" },
        ],
        roadmap: [
          { year: "2026", text: "مستشفيات تجريبية في الخليج" },
          { year: "2027", text: "شراكات استشارية" },
          { year: "2028", text: "قنوات تنظيمية إقليمية" },
        ],
      },
      ask: {
        badge: "التمويل المطلوب",
        headline: "جولة ما قبل البذرة لتسريع اكتساب العملاء والتوسع.",
        body:
          "المنتج جاهز ومُشغّل. الاستثمار الآن يحول الجاهزية التقنية إلى نمو تجاري سريع.",
        useOfFundsTitle: "استخدام التمويل",
        useOfFunds: [
          { pct: "40%", item: "المبيعات وتجارب المستشفيات" },
          { pct: "30%", item: "المنتج والتكاملات" },
          { pct: "20%", item: "بناء الفريق" },
          { pct: "10%", item: "التوسع القانوني والسوقي" },
        ],
        ctaPrimary: "تواصل مع المؤسس",
        ctaSecondary: "عرض المنتج",
        contactLine: "Ashraf.a.m.ishag@gmail.com · مسقط / أبوظبي",
      },
    },
  },
};

const PitchDeckPage: React.FC = () => {
  const { lang: appLang } = useContext(LanguageContext);
  const [deckLang, setDeckLang] = useState<Lang>(appLang === "ar" ? "ar" : "en");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const copy = COPY[deckLang];
  const isRtl = deckLang === "ar";

  useEffect(() => {
    setDeckLang(appLang === "ar" ? "ar" : "en");
  }, [appLang]);

  const slides: Slide[] = useMemo(
    () => [
      {
        id: "title",
        title: copy.slides.title.badge,
        render: () => (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,137,123,0.3),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(0,137,123,0.2),transparent_50%)]" />
            <div className="relative z-10 space-y-6 max-w-3xl">
              <img src="/logo.png" alt="AccreditEx" className="h-20 w-20 rounded-2xl shadow-2xl mx-auto" />
              <SectionBadge icon={<StarIcon className="w-4 h-4" />} label={copy.slides.title.badge} dark />
              <h1 className="text-5xl md:text-7xl font-black tracking-tight">{copy.slides.title.headline}</h1>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed">{copy.slides.title.sub}</p>
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
                {copy.slides.title.valueProps.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/15 bg-white/5 p-4">
                    <div className="text-2xl font-black text-brand-primary">{item.value}</div>
                    <div className="text-xs text-white/70 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "vision",
        title: copy.slides.visionMission.badge,
        render: () => (
          <SlideShell badge={copy.slides.visionMission.badge} icon={<LightBulbIcon className="w-4 h-4" />}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-8">{copy.slides.visionMission.headline}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <InsightCard title={copy.slides.visionMission.visionTitle} body={copy.slides.visionMission.visionBody} />
              <InsightCard title={copy.slides.visionMission.missionTitle} body={copy.slides.visionMission.missionBody} />
              <InsightCard title={copy.slides.visionMission.promiseTitle} body={copy.slides.visionMission.promiseBody} accent />
            </div>
          </SlideShell>
        ),
      },
      {
        id: "problem",
        title: copy.slides.problem.badge,
        render: () => (
          <SlideShell badge={copy.slides.problem.badge} icon={<ExclamationTriangleIcon className="w-4 h-4" />}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-8">{copy.slides.problem.headline}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {copy.slides.problem.points.map((point) => (
                <div key={point.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6">
                  <div className="text-4xl font-black text-red-500 mb-2">{point.stat}</div>
                  <h3 className="font-bold text-brand-text-primary dark:text-white mb-1">{point.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{point.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400 italic">{copy.slides.problem.footnote}</p>
          </SlideShell>
        ),
      },
      {
        id: "solution",
        title: copy.slides.solution.badge,
        render: () => (
          <SlideShell badge={copy.slides.solution.badge} icon={<SparklesIcon className="w-4 h-4" />}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-3">{copy.slides.solution.headline}</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-3xl">{copy.slides.solution.body}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {copy.slides.solution.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4">
                  <CheckIcon className="w-5 h-5 text-brand-primary shrink-0" />
                  <span className="font-semibold text-brand-text-primary dark:text-white">{feature}</span>
                </div>
              ))}
            </div>
          </SlideShell>
        ),
      },
      {
        id: "market",
        title: copy.slides.market.badge,
        render: () => (
          <SlideShell badge={copy.slides.market.badge} icon={<ChartPieIcon className="w-4 h-4" />}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-8">{copy.slides.market.headline}</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
              {copy.slides.market.circles.map((circle) => (
                <div key={circle.label} className="w-44 h-44 rounded-full border-2 border-brand-primary/30 bg-brand-primary/5 flex flex-col items-center justify-center text-center p-5">
                  <div className="text-xs font-bold text-slate-400 mb-1">{circle.label}</div>
                  <div className="text-3xl font-black text-brand-text-primary dark:text-white">{circle.value}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{circle.desc}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-4">
              <p className="text-sm font-semibold text-brand-primary flex items-center gap-2 justify-center"><BoltIcon className="w-4 h-4" />{copy.slides.market.insight}</p>
            </div>
          </SlideShell>
        ),
      },
      {
        id: "business",
        title: copy.slides.business.badge,
        render: () => (
          <SlideShell badge={copy.slides.business.badge} icon={<CircleStackIcon className="w-4 h-4" />}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-8">{copy.slides.business.headline}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {copy.slides.business.tiers.map((tier) => (
                <div key={tier.name} className={`rounded-2xl border p-6 ${tier.highlight ? "border-brand-primary bg-brand-primary/10 shadow-lg" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}>
                  <h3 className="text-xl font-bold text-brand-text-primary dark:text-white">{tier.name}</h3>
                  <div className="text-3xl font-black text-brand-primary mt-2">{tier.price}</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{tier.desc}</p>
                  <ul className="space-y-2">
                    {tier.points.map((point) => (
                      <li key={point} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <CheckBadgeIcon className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SlideShell>
        ),
      },
      {
        id: "traction",
        title: copy.slides.traction.badge,
        render: () => (
          <SlideShell badge={copy.slides.traction.badge} icon={<ChartBarIcon className="w-4 h-4" />}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-brand-text-primary dark:text-white mb-8">{copy.slides.traction.headline}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {copy.slides.traction.stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
                  <div className="text-2xl font-black text-brand-primary">{stat.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3 max-w-2xl">
              {copy.slides.traction.roadmap.map((item) => (
                <div key={item.year + item.text} className="flex items-center gap-3 rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-3">
                  <span className="text-xs font-bold text-brand-primary w-16 shrink-0">{item.year}</span>
                  <span className="text-sm font-semibold text-brand-text-primary dark:text-white">{item.text}</span>
                </div>
              ))}
            </div>
          </SlideShell>
        ),
      },
      {
        id: "ask",
        title: copy.slides.ask.badge,
        render: () => (
          <div className="flex flex-col items-center justify-center h-full px-8 md:px-16 py-10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white text-center">
            <SectionBadge icon={<FlagIcon className="w-4 h-4" />} label={copy.slides.ask.badge} dark />
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 max-w-3xl">{copy.slides.ask.headline}</h2>
            <p className="text-base md:text-lg text-white/75 max-w-2xl mb-8">{copy.slides.ask.body}</p>

            <div className="rounded-xl border border-white/20 bg-white/5 p-5 max-w-xl w-full mb-7 text-start">
              <p className="text-xs font-bold tracking-wider text-white/50 uppercase mb-3">{copy.slides.ask.useOfFundsTitle}</p>
              <ul className="space-y-2">
                {copy.slides.ask.useOfFunds.map((line) => (
                  <li key={line.item} className="flex items-center gap-3 text-sm text-white/80">
                    <span className="w-10 shrink-0 font-black text-brand-primary">{line.pct}</span>
                    <span>{line.item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="mailto:ashraf.a.m.ishag@gmail.com" className="px-6 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-primary/90 transition-colors">
                {copy.slides.ask.ctaPrimary}
              </a>
              <a href="https://accreditex.web.app" className="px-6 py-3 rounded-xl border border-white/20 bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors">
                {copy.slides.ask.ctaSecondary}
              </a>
            </div>
            <p className="text-xs text-white/50 mt-4">{copy.slides.ask.contactLine}</p>
          </div>
        ),
      },
    ],
    [copy],
  );

  const goTo = useCallback((idx: number) => {
    setCurrentSlide(Math.max(0, Math.min(slides.length - 1, idx)));
  }, [slides.length]);

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && deckRef.current) {
      deckRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

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
      if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, toggleFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  return (
    <div
      ref={deckRef}
      dir={isRtl ? "rtl" : "ltr"}
      className="fixed inset-0 bg-white dark:bg-slate-900 flex flex-col select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between gap-2 px-3 md:px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <a href="/" className="text-xs md:text-sm font-bold text-brand-text-primary dark:text-white hover:text-brand-primary transition-colors">
          {isRtl ? "→" : "←"} {copy.back}
        </a>

        <div className="hidden md:flex items-center gap-1">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goTo(index)}
              className={`h-2.5 rounded-full transition-all ${index === currentSlide ? "w-8 bg-brand-primary" : "w-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-brand-primary/70"}`}
              title={slide.title}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeckLang((prev) => (prev === "en" ? "ar" : "en"))}
            className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:text-brand-primary"
            title={copy.languageToggle}
          >
            {copy.languageToggle}
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:text-brand-primary"
            title="Fullscreen"
          >
            {isFullscreen ? "⊙" : "⛶"}
          </button>
        </div>
      </div>

      <div className="flex-1 pt-11">{slides[currentSlide].render()}</div>

      {currentSlide > 0 && (
        <button
          onClick={prev}
          className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-white hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all"
          aria-label="Previous slide"
        >
          {isRtl ? "→" : "←"}
        </button>
      )}

      {currentSlide < slides.length - 1 && (
        <button
          onClick={next}
          className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-white hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all"
          aria-label="Next slide"
        >
          {isRtl ? "←" : "→"}
        </button>
      )}

      <div className="absolute bottom-2.5 inset-x-0 z-40 text-center text-[10px] text-slate-400 pointer-events-none">
        {copy.keyboardHint} · {currentSlide + 1}/{slides.length}
      </div>
    </div>
  );
};

const SlideShell: React.FC<{ icon: React.ReactNode; badge: string; children: React.ReactNode }> = ({ icon, badge, children }) => {
  return (
    <div className="h-full px-6 md:px-16 py-10 md:py-12 bg-white dark:bg-slate-900 overflow-y-auto">
      <SectionBadge icon={icon} label={badge} />
      {children}
    </div>
  );
};

const InsightCard: React.FC<{ title: string; body: string; accent?: boolean }> = ({ title, body, accent = false }) => {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-brand-primary/40 bg-brand-primary/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"}`}>
      <h3 className="text-lg font-bold text-brand-text-primary dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{body}</p>
    </div>
  );
};

const SectionBadge: React.FC<{ icon: React.ReactNode; label: string; dark?: boolean }> = ({ icon, label, dark }) => (
  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 w-fit ${dark ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/30" : "bg-brand-primary/10 text-brand-primary"}`}>
    {icon}
    {label}
  </span>
);

export default PitchDeckPage;
