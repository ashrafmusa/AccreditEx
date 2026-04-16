/**
 * Compliance Templates Library
 * Pre-configured templates for common healthcare documents
 */

export interface ComplianceTemplate {
    id: string;
    name: string;
    description: string;
    category: 'procedure' | 'policy' | 'guideline' | 'form' | 'checklist';
    content: string; // HTML content
    wordCount?: number;
    requiredSections: string[];
    tags: string[];
    standard: 'JCI' | 'CBAHI' | 'MOH' | 'general';
}

export const complianceTemplates: ComplianceTemplate[] = [
    {
        id: 'template_procedure_basic',
        name: 'Standard Operating Procedure',
        description: 'Template for operational procedures with detailed steps',
        category: 'procedure',
        standard: 'JCI',
        wordCount: 850,
        requiredSections: [
            'Purpose',
            'Scope',
            'Responsibilities',
            'Procedure Steps',
            'Safety Considerations',
            'Documentation',
            'Approval Signature',
        ],
        tags: ['procedure', 'operations', 'staff-training', 'compliance'],
        content: `<h1>Standard Operating Procedure</h1>

<h2>1. Purpose</h2>
<p>State the primary objective of this procedure. Explain why this procedure is necessary and how it contributes to organizational goals and patient safety.</p>

<h2>2. Scope</h2>
<p>Define who this procedure applies to (departments, job titles, staff categories) and in what situations it is applicable.</p>

<h2>3. Definitions</h2>
<p><strong>Key Terms:</strong></p>
<ul>
  <li><strong>Term 1:</strong> Definition</li>
  <li><strong>Term 2:</strong> Definition</li>
</ul>

<h2>4. Responsibilities</h2>
<p>Assign clear roles and responsibilities:</p>
<ul>
  <li><strong>Manager:</strong> Description of role</li>
  <li><strong>Staff:</strong> Description of role</li>
  <li><strong>Quality Officer:</strong> Description of role</li>
</ul>

<h2>5. Procedure Steps</h2>
<p><strong>Shall follow these steps in order:</strong></p>
<ol>
  <li>Step 1: [Description of action and expected outcome]</li>
  <li>Step 2: [Description of action and expected outcome]</li>
  <li>Step 3: [Description of action and expected outcome]</li>
  <li>Step 4: [Description of action and expected outcome]</li>
</ol>

<h2>6. Safety Considerations</h2>
<p>List any safety precautions, infection control measures, or special equipment needed:</p>
<ul>
  <li>Safety measure 1</li>
  <li>Safety measure 2</li>
</ul>

<h2>7. Documentation</h2>
<p>Staff must document completion in [specific system]. Records shall be retained for [time period].</p>

<h2>8. Frequency of Review</h2>
<p>This procedure shall be reviewed annually or when significant process changes occur.</p>

<h2>9. Related Documents</h2>
<ul>
  <li>Policy ABC-123</li>
  <li>Checklist XYZ</li>
</ul>

<h2>10. Approval</h2>
<p><strong>Approved by:</strong> _________________ <strong>Date:</strong> _____________</p>
<p><strong>Effective Date:</strong> _________________ <strong>Version:</strong> 1.0</p>`,
    },

    {
        id: 'template_policy_safety',
        name: 'Patient Safety Policy',
        description: 'Comprehensive patient safety policy addressing organizational commitment',
        category: 'policy',
        standard: 'CBAHI',
        wordCount: 1200,
        requiredSections: [
            'Policy Statement',
            'Scope & Applicability',
            'Policy Objectives',
            'Responsibilities',
            'Implementation Guidelines',
            'Monitoring & Evaluation',
            'Approval',
        ],
        tags: ['patient-safety', 'policy', 'governance', 'compliance', 'quality'],
        content: `<h1>Patient Safety Policy</h1>

<h2>Policy Statement</h2>
<p><strong>The organization is committed to ensuring the highest level of patient safety. All staff shall comply with this policy to prevent adverse events and ensure safe patient care.</strong></p>

<h2>Scope & Applicability</h2>
<p>This policy applies to all staff members, contractors, and volunteers providing patient care or working within the organization.</p>

<h2>Policy Objectives</h2>
<ul>
  <li>Establish a culture of safety and continuous improvement</li>
  <li>Prevent harm and adverse events</li>
  <li>Respond promptly and transparently to incidents</li>
  <li>Learn from incidents and implement corrective actions</li>
</ul>

<h2>Key Principles</h2>
<p>Safety is:</p>
<ul>
  <li><strong>A shared responsibility</strong> involving all staff</li>
  <li><strong>Based on evidence</strong> and best practices</li>
  <li><strong>Continuously monitored</strong> and improved</li>
  <li><strong>Transparent and non-punitive</strong> (when reporting incidents)</li>
</ul>

<h2>Responsibilities</h2>

<h3>Executive Leadership</h3>
<ul>
  <li>Approve and fund safety initiatives</li>
  <li>Ensure organizational culture supports safety</li>
  <li>Monitor safety metrics</li>
</ul>

<h3>Department Managers</h3>
<ul>
  <li>Implement safety policies</li>
  <li>Train staff on safety procedures</li>
  <li>Investigate and report incidents</li>
  <li>Monitor compliance</li>
</ul>

<h3>All Clinical Staff</h3>
<ul>
  <li>Follow safety procedures</li>
  <li>Report incidents and near-misses</li>
  <li>Participate in training</li>
  <li>Support a safety culture</li>
</ul>

<h2>Implementation Guidelines</h2>

<h3>1. Risk Assessment</h3>
<p>All departments shall conduct annual risk assessments and maintain risk registers.</p>

<h3>2. Incident Reporting</h3>
<p>Staff must report all incidents and near-misses within [X hours]. Reports shall be documented in [system].</p>

<h3>3. Investigation & Root Cause Analysis</h3>
<p>Serious incidents shall be investigated within [X days]. Root cause analysis shall be completed using [methodology].</p>

<h3>4. Corrective Actions</h3>
<p>Corrective actions shall address root causes and prevent recurrence.</p>

<h3>5. Training & Education</h3>
<p>All staff shall receive annual patient safety training.</p>

<h2>Monitoring & Evaluation</h2>
<p><strong>Key Performance Indicators:</strong></p>
<ul>
  <li>Incident rate per 1000 patient days</li>
  <li>Percentage of incidents reported</li>
  <li>Time to investigation completion</li>
  <li>Staff training completion rate</li>
</ul>

<p><strong>Review Frequency:</strong> Quarterly safety committee meetings and annual policy review.</p>

<h2>Approval</h2>
<p><strong>Approved by:</strong> _________________ <strong>Date:</strong> _____________</p>
<p><strong>Effective Date:</strong> _________________ <strong>Version:</strong> 1.0</p>`,
    },

    {
        id: 'template_checklist_audit',
        name: 'Compliance Audit Checklist',
        description: 'Template for conducting compliance audits and inspections',
        category: 'checklist',
        standard: 'general',
        wordCount: 400,
        requiredSections: [
            'Audit Objectives',
            'Audit Scope',
            'Audit Date',
            'Checklist Items',
            'Findings',
            'Corrective Actions',
        ],
        tags: ['checklist', 'audit', 'inspection', 'compliance'],
        content: `<h1>Compliance Audit Checklist</h1>

<h2>Audit Information</h2>
<table>
  <tbody>
    <tr>
      <td><strong>Audit Date:</strong></td>
      <td>_____/_____/_____</td>
    </tr>
    <tr>
      <td><strong>Department/Area:</strong></td>
      <td>_____________________</td>
    </tr>
    <tr>
      <td><strong>Auditor Name:</strong></td>
      <td>_____________________</td>
    </tr>
    <tr>
      <td><strong>Manager Name:</strong></td>
      <td>_____________________</td>
    </tr>
  </tbody>
</table>

<h2>Audit Objectives</h2>
<p>To assess compliance with [specific policies/standards].</p>

<h2>Audit Scope</h2>
<p>This audit covers [specific areas/processes].</p>

<h2>Compliance Items</h2>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Compliance Item</th>
      <th>Reference</th>
      <th>Compliant?</th>
      <th>Evidence/Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>Documentation is up to date</td>
      <td>Policy X</td>
      <td>☐ Yes ☐ No ☐ N/A</td>
      <td></td>
    </tr>
    <tr>
      <td>2</td>
      <td>Staff trained on procedures</td>
      <td>Policy Y</td>
      <td>☐ Yes ☐ No ☐ N/A</td>
      <td></td>
    </tr>
    <tr>
      <td>3</td>
      <td>Equipment maintained properly</td>
      <td>Standard Z</td>
      <td>☐ Yes ☐ No ☐ N/A</td>
      <td></td>
    </tr>
  </tbody>
</table>

<h2>Overall Assessment</h2>
<p><strong>Overall Compliance Score:</strong> _____%</p>
<p><strong>Compliance Status:</strong> ☐ Compliant ☐ Partially Compliant ☐ Non-Compliant</p>

<h2>Findings & Non-Conformances</h2>
<p>List any findings:</p>
<ol>
  <li>Finding 1: ___________________________</li>
  <li>Finding 2: ___________________________</li>
</ol>

<h2>Corrective Actions Required</h2>
<table>
  <thead>
    <tr>
      <th>Finding</th>
      <th>Corrective Action</th>
      <th>Responsible Person</th>
      <th>Due Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>

<h2>Auditor Sign-Off</h2>
<p><strong>Auditor Name:</strong> _________________ <strong>Date:</strong> _____________</p>
<p><strong>Manager Acceptance:</strong> _________________ <strong>Date:</strong> _____________</p>`,
    },

    {
        id: 'template_guideline_clinical',
        name: 'Clinical Practice Guideline',
        description: 'Template for evidence-based clinical practice guidelines',
        category: 'guideline',
        standard: 'JCI',
        wordCount: 1500,
        requiredSections: [
            'Guideline Title',
            'Background',
            'Evidence Review',
            'Recommendations',
            'Implementation',
            'Quality Indicators',
            'References',
        ],
        tags: ['guideline', 'clinical', 'evidence-based', 'best-practice'],
        content: `<h1>Clinical Practice Guideline Template</h1>

<h2>Guideline Information</h2>
<p><strong>Title:</strong> [Specific Clinical Guideline]</p>
<p><strong>Effective Date:</strong> _____/_____/_____</p>
<p><strong>Review Date:</strong> _____/_____/_____</p>
<p><strong>Evidence Level:</strong> ☐ Level 1 ☐ Level 2 ☐ Level 3</p>

<h2>Background</h2>
<p>Provide clinical context and rationale for this guideline:</p>
<ul>
  <li>Clinical problem or condition addressed</li>
  <li>Prevalence and impact</li>
  <li>Current practice variation</li>
  <li>Why standardization is needed</li>
</ul>

<h2>Evidence Review</h2>
<p>Summary of evidence supporting recommendations:</p>
<ul>
  <li>Key studies reviewed</li>
  <li>Meta-analyses or systematic reviews consulted</li>
  <li>Expert consensus</li>
  <li>Quality of evidence</li>
</ul>

<h2>Clinical Recommendations</h2>

<h3>Recommendation 1</h3>
<p><strong>Recommendation:</strong> [Specific recommendation]</p>
<p><strong>Strength of Recommendation:</strong> ☐ Strong ☐ Moderate ☐ Weak</p>
<p><strong>Quality of Evidence:</strong> ☐ High ☐ Moderate ☐ Low</p>
<p><strong>Rationale:</strong> [Explanation]</p>

<h2>Implementation</h2>
<p>Steps to implement this guideline:</p>
<ol>
  <li>Staff education and training</li>
  <li>Protocol development</li>
  <li>Resource allocation</li>
  <li>Monitoring compliance</li>
</ol>

<h2>Quality Indicators</h2>
<ul>
  <li>Adherence rate (target: ____%)</li>
  <li>Patient outcomes</li>
  <li>Adverse events</li>
</ul>

<h2>References</h2>
<ol>
  <li>[Reference 1]</li>
  <li>[Reference 2]</li>
</ol>

<h2>Approval</h2>
<p><strong>Developed by:</strong> _________________ <strong>Date:</strong> _____________</p>
<p><strong>Approved by:</strong> _________________ <strong>Date:</strong> _____________</p>`,
    },
];

/**
 * Get all templates
 */
export function getAllTemplates(): ComplianceTemplate[] {
    return complianceTemplates;
}

/**
 * Get template by category
 */
export function getTemplatesByCategory(
    category: ComplianceTemplate['category']
): ComplianceTemplate[] {
    return complianceTemplates.filter(t => t.category === category);
}

/**
 * Get template by standard
 */
export function getTemplatesByStandard(
    standard: ComplianceTemplate['standard']
): ComplianceTemplate[] {
    return complianceTemplates.filter(t => t.standard === standard);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ComplianceTemplate | undefined {
    return complianceTemplates.find(t => t.id === id);
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): ComplianceTemplate[] {
    const q = query.toLowerCase();
    return complianceTemplates.filter(
        t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.includes(q))
    );
}
