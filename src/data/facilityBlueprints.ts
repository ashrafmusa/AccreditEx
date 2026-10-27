import { LocalizedString } from "@/types";

export type FacilityBlueprintType =
  | "hospital"
  | "clinic"
  | "laboratory"
  | "lab"
  | "pharmacy"
  | "group"
  | "other";

export type OrganizationScaleMode = "small" | "medium" | "enterprise";

export type AccreditationProgramKey =
  | "cbahi"
  | "jci"
  | "cap_iso15189"
  | "dnv_iso9001"
  | "doh_dha"
  | "ashk"
  | "other";

export interface BlueprintDepartment {
  name: LocalizedString;
  description: LocalizedString;
}

export interface BlueprintChecklistItem {
  standardId: string;
  category: string;
  item: string;
  actionPlan: string;
  requiredEvidence: string[];
}

export interface BlueprintPolicyDocument {
  documentNumber: string;
  name: LocalizedString;
  type: "Policy" | "Procedure";
  category: string;
  content: LocalizedString;
}

export interface FacilityBlueprint {
  type: FacilityBlueprintType;
  label: LocalizedString;
  recommendedPrograms: AccreditationProgramKey[];
  departments: BlueprintDepartment[];
  starterPolicies: BlueprintPolicyDocument[];
}

export const ORGANIZATION_SCALE_MODES: Array<{
  id: OrganizationScaleMode;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  governanceBadgeEn: string;
  governanceBadgeAr: string;
}> = [
  {
    id: "small",
    labelEn: "Small Facility (1–25 Staff)",
    labelAr: "منشأة صغيرة (١–٢٥ موظفاً)",
    descriptionEn:
      "Express governance: streamlined 1-step document approval and unified readiness checklist.",
    descriptionAr:
      "حوكمة سريعة: اعتماد مستندات بخطوة واحدة وقائمة جاهزية موحدة.",
    governanceBadgeEn: "Express Governance",
    governanceBadgeAr: "حوكمة سريعة",
  },
  {
    id: "medium",
    labelEn: "Mid-Size Facility (25–200 Staff)",
    labelAr: "منشأة متوسطة (٢٥–٢٠٠ موظف)",
    descriptionEn:
      "Departmental governance: department heads, internal audit cycles, and competency tracking.",
    descriptionAr:
      "حوكمةالأقسام: رؤساء أقسام، دورات تدقيق داخلي، وتتبع الكفاءات.",
    governanceBadgeEn: "Departmental Governance",
    governanceBadgeAr: "حوكمة الأقسام",
  },
  {
    id: "enterprise",
    labelEn: "Large Hospital / Multi-Facility Group (200+ Staff)",
    labelAr: "مستشفى كبير / مجموعة متعددة الفروع (+٢٠٠ موظف)",
    descriptionEn:
      "Enterprise governance: multi-stage committee sign-offs, cross-branch benchmarking, and full tracer suite.",
    descriptionAr:
      "حوكمة مؤسسية: اعتمادات متعددة المراحل، مقارنة الفروع، ونظام المتتبعات الشامل.",
    governanceBadgeEn: "Enterprise Network Mode",
    governanceBadgeAr: "الوضع المؤسسي المتقدم",
  },
];

export const PROGRAM_CHECKLIST_TEMPLATES: Record<
  AccreditationProgramKey,
  {
    programCode: string;
    projectTitleEn: string;
    projectTitleAr: string;
    items: BlueprintChecklistItem[];
  }
> = {
  cbahi: {
    programCode: "CBAHI",
    projectTitleEn: "CBAHI Baseline Survey Readiness & Self-Assessment",
    projectTitleAr: "تقييم الجاهزية الأساسي لاعتماد سباهي (CBAHI)",
    items: [
      {
        standardId: "LD.1",
        category: "Leadership & Governance",
        item: "Approved organizational chart, scope of services, and annual quality improvement plan signed by leadership.",
        actionPlan:
          "Upload signed Scope of Services, Organization Chart, and Quality & Patient Safety Plan.",
        requiredEvidence: ["Scope of Services Policy", "Annual Quality Plan"],
      },
      {
        standardId: "IPC.4",
        category: "Infection Prevention & Control",
        item: "Hand hygiene compliance audits, sharps injury protocol, and sterilization/disinfection logs maintained.",
        actionPlan:
          "Attach Infection Control Manual, monthly hand hygiene audit summary, and autoclave validation logs.",
        requiredEvidence: ["Infection Control Policy", "Hand Hygiene Audit Log"],
      },
      {
        standardId: "MM.2",
        category: "Medication Management",
        item: "High-alert medications (LASA), crash cart daily checklists, and narcotic double-lock logs verified.",
        actionPlan:
          "Verify LASA list posting and upload last 30 days of emergency trolley & refrigerator temperature logs.",
        requiredEvidence: ["High-Alert Medication Policy", "Crash Cart Log"],
      },
      {
        standardId: "FMS.5",
        category: "Facility Management & Safety",
        item: "Fire drill records, hazardous materials (HAZMAT/SDS) inventory, and biomedical preventive maintenance (PPM).",
        actionPlan:
          "Conduct quarterly fire drill and upload biomedical equipment calibration certificates.",
        requiredEvidence: ["Fire Safety & Evacuation Plan", "Biomedical PPM Log"],
      },
      {
        standardId: "HRM.3",
        category: "Human Resources & Credentialing",
        item: "100% of clinical staff have verified primary-source licensing (DataFlow/SCFHS), BLS, and signed job descriptions.",
        actionPlan:
          "Audit personnel files for license validity, BLS certification, and annual competency evaluations.",
        requiredEvidence: ["Staff Credentialing Matrix", "BLS Training Log"],
      },
      {
        standardId: "QM.6",
        category: "Quality Management & Patient Safety",
        item: "Incident reporting (OVR), sentinel event policy, and active CAPA / PDCA improvement project documented.",
        actionPlan:
          "Link OVR reporting procedure and at least one completed PDCA quality improvement cycle.",
        requiredEvidence: ["Incident Reporting Policy", "CAPA Register"],
      },
    ],
  },
  jci: {
    programCode: "JCI",
    projectTitleEn: "JCI International Patient Safety & Accreditation Readiness",
    projectTitleAr: "مشروع الجاهزية لاعتماد اللجنة الدولية المشتركة (JCI)",
    items: [
      {
        standardId: "IPSG.1",
        category: "International Patient Safety Goals",
        item: "Patient identification using two unique identifiers prior to medication, blood, or procedures.",
        actionPlan:
          "Upload Patient Identification Policy and observational tracer audit results.",
        requiredEvidence: ["Patient Identification Policy", "IPSG Tracer Audit"],
      },
      {
        standardId: "IPSG.3",
        category: "International Patient Safety Goals",
        item: "Safety of high-alert medications and concentrated electrolytes (standardized labeling & storage).",
        actionPlan:
          "Remove concentrated electrolytes from unauthorized units and attach pharmacy inspection log.",
        requiredEvidence: ["High-Alert Medication Policy", "Pharmacy Audit"],
      },
      {
        standardId: "IPSG.4",
        category: "International Patient Safety Goals",
        item: "Universal Protocol: pre-procedure verification, site marking, and surgical/procedural Time-Out.",
        actionPlan:
          "Audit 20 procedural charts for completed Time-Out documentation.",
        requiredEvidence: ["Safe Surgery / Time-Out Checklist"],
      },
      {
        standardId: "PCI.5",
        category: "Prevention and Control of Infections",
        item: "Evidence-based hand hygiene program and isolation precautions implemented across all clinical areas.",
        actionPlan:
          "Attach WHO 5-Moments observation compliance report and PPE audit.",
        requiredEvidence: ["Hand Hygiene Compliance Report"],
      },
      {
        standardId: "QPS.4",
        category: "Quality Improvement & Patient Safety",
        item: "Adverse events, near-misses, and sentinel events analyzed using Root Cause Analysis (RCA).",
        actionPlan:
          "Document incident reporting workflow and attach RCA/CAPA records.",
        requiredEvidence: ["Adverse Event & RCA Policy"],
      },
      {
        standardId: "SQE.9",
        category: "Staff Qualifications & Education",
        item: "Clinical privileges, primary source verification, and ongoing professional practice evaluation (OPPE).",
        actionPlan:
          "Complete credentialing verification matrix for all medical and nursing staff.",
        requiredEvidence: ["Credentialing & Privileging Policy"],
      },
    ],
  },
  cap_iso15189: {
    programCode: "CAP-ISO15189",
    projectTitleEn: "CAP & ISO 15189 Clinical Laboratory Accreditation Readiness",
    projectTitleAr: "مشروع الجاهزية لاعتماد المختبرات الطبية (CAP / ISO 15189)",
    items: [
      {
        standardId: "COM.01200",
        category: "Document & Quality Management (ISO 15189 §8.2)",
        item: "Laboratory Quality Manual, controlled SOPs, and annual document review by the Laboratory Director.",
        actionPlan:
          "Upload signed Laboratory Quality Manual and verify annual review dates on all analytical SOPs.",
        requiredEvidence: ["Laboratory Quality Manual", "SOP Master Index"],
      },
      {
        standardId: "COM.04000",
        category: "Proficiency Testing / EQA (ISO 15189 §7.3.7)",
        item: "Enrollment in approved Proficiency Testing (PT/EQA) for all regulated analytes with root-cause investigation for any unacceptable score (<80%).",
        actionPlan:
          "Verify PT schedule in LabOps and attach corrective action reports for any PT failures.",
        requiredEvidence: ["PT Enrollment & Evaluation Log"],
      },
      {
        standardId: "COM.30550",
        category: "Internal Quality Control & Westgard Rules",
        item: "Daily IQC run for each quantitative test with documented Westgard rule violation corrective actions prior to releasing patient results.",
        actionPlan:
          "Review Levey-Jennings charts and monthly QC summary signed by section supervisor.",
        requiredEvidence: ["Daily IQC & Westgard Review Log"],
      },
      {
        standardId: "GEN.55500",
        category: "Personnel Competency Assessment (CAP 6-Element)",
        item: "Semiannual (first year) and annual 6-element CAP competency assessments completed for all testing personnel.",
        actionPlan:
          "Complete 6-element CAP competency assessments in Training Hub for all bench technologists.",
        requiredEvidence: ["6-Element Competency Matrix"],
      },
      {
        standardId: "COM.30600",
        category: "Equipment Calibration & Verification (AMR)",
        item: "Instrument calibration, Analytical Measurement Range (AMR) verification every 6 months, and daily temperature/maintenance logs.",
        actionPlan:
          "Log all analyzers in LabOps Equipment tab with current calibration and AMR verification records.",
        requiredEvidence: ["Analyzer Calibration & AMR Log"],
      },
      {
        standardId: "COM.10000",
        category: "Critical Value Reporting & Read-Back",
        item: "Immediate notification of critical results with documented caller, receiver, timestamp, and complete read-back.",
        actionPlan:
          "Audit critical value call log for 95%+ notification within <30 minutes.",
        requiredEvidence: ["Critical Value Reporting SOP", "Critical Call Log"],
      },
    ],
  },
  dnv_iso9001: {
    programCode: "DNV-ISO9001",
    projectTitleEn: "DNV NIAHO & ISO 9001 Quality Management Readiness",
    projectTitleAr: "مشروع الجاهزية لاعتماد DNV ونظام إدارة الجودة ISO 9001",
    items: [
      {
        standardId: "QM.1",
        category: "Quality Management System (ISO 9001 §4–6)",
        item: "Quality Management System scope, process map, risk register, and measurable quality objectives established.",
        actionPlan:
          "Publish QMS Policy, enterprise risk register, and departmental KPI dashboard.",
        requiredEvidence: ["QMS Manual", "Enterprise Risk Register"],
      },
      {
        standardId: "IC.1",
        category: "Infection Control System",
        item: "Facility-wide infection surveillance, environmental rounding, and sterile processing controls.",
        actionPlan:
          "Document monthly infection control committee minutes and rounding findings.",
        requiredEvidence: ["Infection Surveillance Report"],
      },
      {
        standardId: "PE.1",
        category: "Physical Environment & Life Safety",
        item: "Life safety inspections, utility systems management, and medical equipment maintenance.",
        actionPlan:
          "Attach preventive maintenance schedules and emergency power generator test logs.",
        requiredEvidence: ["Facility Safety Inspection Log"],
      },
      {
        standardId: "IA.1",
        category: "Internal Audit & Management Review (ISO 9001 §9.2–9.3)",
        item: "Scheduled internal quality audits, non-conformance CAPAs, and executive management review completed.",
        actionPlan:
          "Schedule annual internal audit plan in Audit Hub and log CAPAs for all findings.",
        requiredEvidence: ["Internal Audit Schedule", "Management Review Minutes"],
      },
    ],
  },
  doh_dha: {
    programCode: "DOH-DHA",
    projectTitleEn: "DOH / DHA Jawda & Clinical Governance Readiness",
    projectTitleAr: "مشروع الجاهزية لمعايير دائرة الصحة وهيئة الصحة (DOH / DHA)",
    items: [
      {
        standardId: "CG.1",
        category: "Clinical Governance & Patient Safety",
        item: "Clinical governance framework, Jawda KPI reporting, and patient rights charter displayed and enforced.",
        actionPlan:
          "Upload Clinical Governance Policy and quarterly Jawda quality indicator submission.",
        requiredEvidence: ["Clinical Governance Policy", "Jawda KPI Report"],
      },
      {
        standardId: "IPC.1",
        category: "Infection Prevention & Sterilization",
        item: "Compliance with national infection control standards, biomedical waste segregation, and CSSD logs.",
        actionPlan:
          "Attach biomedical waste manifest and infection control audit checklist.",
        requiredEvidence: ["Infection Control & Waste Policy"],
      },
      {
        standardId: "HCP.1",
        category: "Healthcare Professional Licensing",
        item: "Active DOH/DHA/MOH professional licenses and malpractice insurance for 100% of clinical staff.",
        actionPlan:
          "Verify license expiry dates in Staff Profiles and set 60-day renewal alerts.",
        requiredEvidence: ["Professional License Register"],
      },
    ],
  },
  ashk: {
    programCode: "ASHK",
    projectTitleEn: "ASHK Healthcare Accreditation Readiness Project",
    projectTitleAr: "مشروع الجاهزية للاعتماد الصحي (ASHK)",
    items: [
      {
        standardId: "ASHK.1",
        category: "Patient-Centered Care & Safety",
        item: "Patient rights, informed consent, and clinical safety protocols documented and audited.",
        actionPlan:
          "Upload Informed Consent Policy and patient satisfaction survey summary.",
        requiredEvidence: ["Patient Rights & Consent Policy"],
      },
      {
        standardId: "ASHK.2",
        category: "Governance & Quality Improvement",
        item: "Continuous quality improvement program, incident reporting, and CAPA tracking active.",
        actionPlan:
          "Establish quarterly quality review and document active CAPA reports.",
        requiredEvidence: ["Quality Improvement Plan"],
      },
    ],
  },
  other: {
    programCode: "GENERAL-QMS",
    projectTitleEn: "Healthcare Accreditation & Audit Readiness Baseline",
    projectTitleAr: "مشروع الجاهزية الأساسي للاعتماد والجودة الصحية",
    items: [
      {
        standardId: "STD.1",
        category: "Governance & Document Control",
        item: "Core organizational policies, scope of services, and document control procedure approved.",
        actionPlan:
          "Approve Document Control Policy and upload organizational chart.",
        requiredEvidence: ["Document Control Policy"],
      },
      {
        standardId: "STD.2",
        category: "Patient Safety & Risk Management",
        item: "Incident reporting system, risk register, and infection control protocols active.",
        actionPlan:
          "Log top 5 operational/clinical risks in Risk Hub and assign mitigation owners.",
        requiredEvidence: ["Risk Management Policy"],
      },
      {
        standardId: "STD.3",
        category: "Staff Competency & Training",
        item: "Mandatory safety training, license verification, and annual competency assessments tracked.",
        actionPlan:
          "Assign mandatory orientation and safety training in Training Hub.",
        requiredEvidence: ["Staff Training Matrix"],
      },
    ],
  },
};

export const FACILITY_BLUEPRINTS: Record<string, FacilityBlueprint> = {
  hospital: {
    type: "hospital",
    label: {
      en: "Hospital / Medical Center",
      ar: "مستشفى / مركز طبي متكامل",
    },
    recommendedPrograms: ["cbahi", "jci", "dnv_iso9001", "doh_dha"],
    departments: [
      {
        name: {
          en: "Quality Management & Patient Safety",
          ar: "إدارة الجودة وسلامة المرضى",
        },
        description: {
          en: "Oversees accreditation readiness, clinical audits, CAPA, and risk management.",
          ar: "الإشراف على الجاهزية للاعتماد، التدقيق الإكلينيكي، الإجراءات التصحيحية، وإدارة المخاطر.",
        },
      },
      {
        name: {
          en: "Emergency & Critical Care",
          ar: "الطوارئ والرعاية الحرجة",
        },
        description: {
          en: "24/7 emergency triage, resuscitation, and intensive care services.",
          ar: "خدمات الفرز الإسعافي والإنعاش والعناية المركزة على مدار الساعة.",
        },
      },
      {
        name: {
          en: "Nursing & Inpatient Services",
          ar: "التمريض وخدمات التنويم",
        },
        description: {
          en: "Inpatient nursing care, medication administration, and clinical documentation.",
          ar: "الرعاية التمريضية للمنومين، إعطاء الأدوية، والتوثيق الإكلينيكي.",
        },
      },
      {
        name: {
          en: "Infection Prevention & Control (IPC)",
          ar: "مكافحة العدوى والتعقيم",
        },
        description: {
          en: "Surveillance, hand hygiene, isolation protocols, and CSSD sterilization.",
          ar: "الترصد الوبائي، نظافة الأيدي، بروتوكولات العزل، والتعقيم المركزي.",
        },
      },
      {
        name: {
          en: "Pharmacy & Medication Safety",
          ar: "الصيدلية وسلامة الأدوية",
        },
        description: {
          en: "Formulary management, high-alert medications (LASA), and clinical pharmacy.",
          ar: "إدارة دليل الأدوية، الأدوية عالية الخطورة، والصيدلة الإكلينيكية.",
        },
      },
      {
        name: {
          en: "Laboratory & Diagnostic Services",
          ar: "المختبر والخدمات التشخيصية",
        },
        description: {
          en: "Clinical pathology, blood bank, and diagnostic imaging.",
          ar: "المختبرات الإكلينيكية، بنك الدم، والأشعة التشخيصية.",
        },
      },
      {
        name: {
          en: "Facility Management & Biomedical Safety (FMS)",
          ar: "إدارة المرافق والسلامة الطبية",
        },
        description: {
          en: "Life safety, fire drills, hazardous materials, and medical equipment PPM.",
          ar: "سلامة المباني، خطط الإخلاء، المواد الخطرة، والصيانة الوقائية للأجهزة الطبية.",
        },
      },
    ],
    starterPolicies: [
      {
        documentNumber: "POL-QMS-001",
        name: {
          en: "Document Control & Records Management Policy",
          ar: "سياسة ضبط الوثائق وإدارة السجلات",
        },
        type: "Policy",
        category: "Quality Management",
        content: {
          en: "1. PURPOSE: Establish standardized creation, review, approval, versioning, and archival of controlled policies and procedures across the facility.\n2. SCOPE: Applies to all clinical and administrative departments.\n3. POLICY: All controlled documents must undergo bi-annual review and carry version history and electronic approval before publication.",
          ar: "١. الغرض: وضع آلية موحدة لإعداد ومراجعة واعتماد وتحديث وحفظ السياسات والإجراءات المعتمدة في المنشأة.\n٢. النطاق: تطبق على جميع الأقسام الطبية والإدارية.\n٣. السياسة: تخضع جميع الوثائق المضبوطة للمراجعة الدورية وتحمل رقم إصدار واعتماد إلكتروني قبل النشر.",
        },
      },
      {
        documentNumber: "POL-IPSG-002",
        name: {
          en: "Patient Identification & Verification Policy",
          ar: "سياسة التعرف الصحيح على المريض",
        },
        type: "Policy",
        category: "Patient Safety",
        content: {
          en: "1. PURPOSE: Ensure accurate patient identification using at least two unique identifiers (Full Name and Medical Record Number / Date of Birth) prior to any clinical intervention, medication administration, or specimen collection.\n2. NEVER use room or bed number as an identifier.",
          ar: "١. الغرض: ضمان التعرف الدقيق على المريض باستخدام معرفين معتمدين على الأقل (الاسم الرباعي ورقم الملف الطبي أو تاريخ الميلاد) قبل أي إجراء طبي أو إعطاء دواء أو سحب عينات.\n٢. يمنع استخدام رقم الغرفة أو السرير لتعريف المريض.",
        },
      },
      {
        documentNumber: "POL-IPC-003",
        name: {
          en: "Infection Prevention, Hand Hygiene & Exposure Control Manual",
          ar: "دليل مكافحة العدوى ونظافة الأيدي والتحكم بالتعرض المهني",
        },
        type: "Procedure",
        category: "Infection Control",
        content: {
          en: "1. PURPOSE: Prevent healthcare-associated infections (HAIs) through strict adherence to WHO 5 Moments for Hand Hygiene, PPE protocols, sharps safety, and sterilization validation.",
          ar: "١. الغرض: الوقاية من العدوى المرتبطة بالرعاية الصحية من خلال الالتزام باللحظات الخمس لنظافة الأيدي ومعدات الوقاية الشخصية وسلامة الأدوات الحادة.",
        },
      },
    ],
  },
  clinic: {
    type: "clinic",
    label: {
      en: "Primary Healthcare Center (PHC) / Polyclinic / Day Surgery",
      ar: "مركز رعاية صحية أولية / مجمع عيادات / جراحة يوم واحد",
    },
    recommendedPrograms: ["cbahi", "jci", "doh_dha"],
    departments: [
      {
        name: {
          en: "Outpatient Clinics & Family Medicine",
          ar: "العيادات الخارجية وطب الأسرة",
        },
        description: {
          en: "Primary care consultations, chronic disease management, and preventive screening.",
          ar: "استشارات الرعاية الأولية، متابعة الأمراض المزمنة، والفحص الوقائي.",
        },
      },
      {
        name: {
          en: "Nursing, Triage & Urgent Care",
          ar: "التمريض والفرز والرعاية العاجلة",
        },
        description: {
          en: "Patient vital signs, triage assessment, crash cart readiness, and procedure rooms.",
          ar: "العلامات الحيوية، تقييم الفرز، جاهزية عربة الطوارئ، وغرف الإجراءات.",
        },
      },
      {
        name: {
          en: "Infection Control & CSSD Sterilization",
          ar: "مكافحة العدوى والتعقيم",
        },
        description: {
          en: "Dental/minor procedure sterilization, hand hygiene audits, and medical waste.",
          ar: "تعقيم أدوات الأسنان والإجراءات البسيطة، تدقيق نظافة الأيدي، والنفايات الطبية.",
        },
      },
      {
        name: {
          en: "Quality, Patient Safety & Administration",
          ar: "الجودة وسلامة المرضى والإدارة",
        },
        description: {
          en: "Staff credentialing, incident reporting, patient satisfaction, and facility safety.",
          ar: "توثيق تراخيص الممارسين، بلاغات الحوادث، رضا المراجعين، وسلامة المنشأة.",
        },
      },
    ],
    starterPolicies: [
      {
        documentNumber: "PHC-POL-001",
        name: {
          en: "Clinic Scope of Services & Patient Rights Policy",
          ar: "سياسة نطاق خدمات المركز وحقوق المراجعين",
        },
        type: "Policy",
        category: "Governance",
        content: {
          en: "Defines the outpatient clinical services, operating hours, emergency transfer agreement, and patient rights & responsibilities.",
          ar: "تحدد هذه السياسة نطاق الخدمات الإكلينيكية بالعيادات، ساعات العمل، اتفاقية النقل الإسعافي، وحقوق ومسؤوليات المرضى.",
        },
      },
      {
        documentNumber: "PHC-PRC-002",
        name: {
          en: "Emergency Cart (Crash Cart) & High-Alert Medication Procedure",
          ar: "إجراء فحص عربة الطوارئ والأدوية عالية الخطورة",
        },
        type: "Procedure",
        category: "Patient Safety",
        content: {
          en: "Daily verification of emergency trolley seal, defibrillator test, oxygen cylinder pressure, and expiry dates of emergency medications.",
          ar: "الفحص اليومي لقفل عربة الطوارئ، اختبار جهاز الصدمات، ضغط أسطوانة الأكسجين، وتواريخ صلاحية أدوية الطوارئ.",
        },
      },
    ],
  },
  laboratory: {
    type: "laboratory",
    label: {
      en: "Medical & Clinical Laboratory",
      ar: "مختبر طبي وتشخيصي",
    },
    recommendedPrograms: ["cap_iso15189", "cbahi", "jci"],
    departments: [
      {
        name: {
          en: "Pre-Analytical, Phlebotomy & Accessioning",
          ar: "مرحلة ما قبل التحليل وسحب واستلام العينات",
        },
        description: {
          en: "Specimen collection, labeling verification, rejection criteria, and transport tracking.",
          ar: "سحب العينات، التحقق من التعريف، معايير رفض العينات، وتتبع النقل.",
        },
      },
      {
        name: {
          en: "Clinical Chemistry & Immunoassay",
          ar: "الكيمياء الحيوية والمناعة",
        },
        description: {
          en: "Automated chemistry analyzers, daily IQC Westgard review, and calibration verification.",
          ar: "أجهزة الكيمياء الآلية، مراجعة ضبط الجودة اليومي (Westgard)، والتحقق من المعايرة.",
        },
      },
      {
        name: {
          en: "Hematology, Coagulation & Blood Bank",
          ar: "أمراض الدم والتخثر وبنك الدم",
        },
        description: {
          en: "CBC, coagulation studies, peripheral smears, and transfusion medicine.",
          ar: "فحوصات الدم الشاملة، السيولة، المسحات الدموية، وخدمات نقل الدم.",
        },
      },
      {
        name: {
          en: "Microbiology & Molecular Diagnostics",
          ar: "الأحياء الدقيقة والتشخيص الجزيئي (PCR)",
        },
        description: {
          en: "Culture, sensitivity, biosafety cabinets, and molecular testing workflows.",
          ar: "المزارع البكتيرية، الحساسية، كبائن السلامة الحيوية، والفحوصات الجزيئية.",
        },
      },
      {
        name: {
          en: "Laboratory Quality Management & Biosafety",
          ar: "إدارة جودة المختبر والسلامة الحيوية",
        },
        description: {
          en: "ISO 15189 / CAP compliance, Proficiency Testing (PT/EQA), and 6-element competency.",
          ar: "الامتثال لمعايير CAP وISO 15189، اختبارات الكفاءة الخارجية (PT/EQA)، وتقييم كفاءة الفنيين.",
        },
      },
    ],
    starterPolicies: [
      {
        documentNumber: "LAB-QM-001",
        name: {
          en: "Laboratory Quality Manual (ISO 15189 & CAP Aligned)",
          ar: "دليل جودة المختبر الطبي (متوافق مع ISO 15189 و CAP)",
        },
        type: "Policy",
        category: "Quality Management",
        content: {
          en: "Defines the Laboratory Quality Management System across pre-analytical, analytical, and post-analytical phases, including Document Control, IQC Westgard rules, PT/EQA, and 6-Element Staff Competency.",
          ar: "يحدد نظام إدارة الجودة في المختبر عبر مراحل ما قبل التحليل والتحليل وما بعد التحليل، بما يشمل ضبط الوثائق، قواعد Westgard، اختبارات الكفاءة PT، وتقييم الكفاءة السداسي.",
        },
      },
      {
        documentNumber: "LAB-SOP-002",
        name: {
          en: "Specimen Acceptance, Rejection & Critical Value Reporting SOP",
          ar: "إجراء قبول ورفض العينات والإبلاغ الفوري عن النتائج الحرجة",
        },
        type: "Procedure",
        category: "Operations",
        content: {
          en: "1. Unlabeled or mismatched specimens must be rejected and logged.\n2. Critical values must be communicated to the ordering clinician within 30 minutes with complete read-back verification.",
          ar: "١. يتم رفض وتسجيل أي عينة غير معرفة أو غير مطابقة.\n٢. يجب إبلاغ الطبيب المعالج بالنتائج الحرجة خلال ٣٠ دقيقة مع توثيق إعادة القراءة.",
        },
      },
    ],
  },
};

export function getFacilityBlueprint(type?: string): FacilityBlueprint {
  const normalized = (type || "hospital").toLowerCase();
  if (normalized === "lab" || normalized === "laboratory") {
    return FACILITY_BLUEPRINTS.laboratory;
  }
  if (normalized === "clinic" || normalized === "pharmacy") {
    return FACILITY_BLUEPRINTS.clinic;
  }
  return FACILITY_BLUEPRINTS.hospital;
}
