export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: "policy" | "procedure" | "report" | "form" | "checklist";
  structure: string[];
}

export const documentTemplates: DocumentTemplate[] = [
  {
    id: "sop-standard",
    name: "Standard Operating Procedure (SOP)",
    description: "Standard template for operational procedures with purpose, scope, and steps.",
    category: "procedure",
    structure: [
      "1. Purpose",
      "2. Scope",
      "3. Definitions",
      "4. Responsibilities",
      "5. Procedure",
      "6. References",
      "7. Attachments"
    ]
  },
  {
    id: "policy-general",
    name: "General Policy",
    description: "Policy document template for organizational rules and guidelines.",
    category: "policy",
    structure: [
      "1. Policy Statement",
      "2. Purpose",
      "3. Scope",
      "4. Definitions",
      "5. Policy Details",
      "6. Roles and Responsibilities",
      "7. Compliance and Enforcement"
    ]
  },
  {
    id: "incident-report",
    name: "Incident Report",
    description: "Template for reporting safety, security, or operational incidents.",
    category: "report",
    structure: [
      "1. Incident Details",
      "2. Involved Parties",
      "3. Description of Event",
      "4. Immediate Actions Taken",
      "5. Witnesses",
      "6. Evidence",
      "7. Corrective Actions Recommended"
    ]
  },
  {
    id: "audit-checklist",
    name: "Internal Audit Checklist",
    description: "Checklist template for conducting internal quality audits.",
    category: "checklist",
    structure: [
      "1. Audit Information",
      "2. Audit Scope",
      "3. Audit Criteria",
      "4. Checklist Items",
      "5. Findings",
      "6. Conclusions",
      "7. Sign-off"
    ]
  },
  {
    id: "meeting-minutes",
    name: "Meeting Minutes",
    description: "Standard template for recording meeting proceedings and actions.",
    category: "report",
    structure: [
      "1. Meeting Details",
      "2. Attendees",
      "3. Agenda Items",
      "4. Key Discussions",
      "5. Decisions Made",
      "6. Action Items",
      "7. Next Meeting"
    ]
  }
];
