/**
 * Report Service
 * AI-powered compliance report generation with Firebase integration and PDF export
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Project, AppDocument, ComplianceStatus } from '@/types';
import { freeTierMonitor } from './freeTierMonitor';
import { generatePDFReport, downloadPDF } from './pdfReportGenerator';

const API_BASE_URL = 'https://accreditex.onrender.com';

interface ReportGenerationOptions {
  projectId: string;
  reportType: string;
  project: Project;
  userName: string;
}

interface AIReportResponse {
  content: string;
  summary: string;
  recommendations: string[];
}

/**
 * Generate AI-powered compliance report
 */
export const generateAIComplianceReport = async (
  options: ReportGenerationOptions
): Promise<AppDocument> => {
  const { project, reportType, userName } = options;

  // Prepare comprehensive project data for AI analysis
  const projectData = {
    name: project.name,
    status: project.status,
    progress: project.progress,
    programId: project.programId,
    totalStandards: project.checklist?.length || 0,
    compliantStandards: project.checklist?.filter(item => item.status === ComplianceStatus.Compliant).length || 0,
    nonCompliantStandards: project.checklist?.filter(item => item.status === ComplianceStatus.NonCompliant).length || 0,
    partiallyCompliantStandards: project.checklist?.filter(item => item.status === ComplianceStatus.PartiallyCompliant).length || 0,
    notApplicableStandards: project.checklist?.filter(item => item.status === ComplianceStatus.NotApplicable).length || 0,
    openCAPAs: project.capaReports?.filter(capa => capa.status !== 'Finalized').length || 0,
    completedCAPAs: project.capaReports?.filter(capa => capa.status === 'Finalized').length || 0,
    mockSurveysCompleted: project.mockSurveys?.length || 0,
    criticalFindings: project.checklist?.filter(item => 
      item.status === ComplianceStatus.NonCompliant && item.item.toLowerCase().includes('critical')
    ).length || 0,
    evidenceDocuments: project.checklist?.reduce((acc, item) => acc + (item.evidenceFiles?.length || 0), 0) || 0,
    lastUpdated: project.updatedAt,
    createdAt: project.createdAt
  };

  // Generate AI report using the deployed agent
  const aiResponse = await callAIAgent(project, projectData, reportType);

  // Generate professional PDF
  const pdfBlob = await generatePDFReport({
    project,
    reportType,
    aiContent: aiResponse.content,
    summary: aiResponse.summary,
    recommendations: aiResponse.recommendations,
    statistics: projectData,
    complianceScore: calculateComplianceScore(project),
    generatedBy: userName,
    generatedAt: new Date().toISOString()
  });

  // Upload PDF via backend to bypass CORS
  const pdfBuffer = await pdfBlob.arrayBuffer();
  const base64Data = btoa(
    new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  
  const pdfFileName = `compliance_report_${Date.now()}.pdf`;
  
  const formData = new FormData();
  formData.append('project_id', project.id);
  formData.append('file_data', base64Data);
  formData.append('file_name', pdfFileName);

  const uploadResponse = await fetch('https://accreditex.onrender.com/upload-report', {
    method: 'POST',
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload PDF report');
  }

  const uploadResult = await uploadResponse.json();
  const pdfUrl = uploadResult.downloadUrl;

  // Create document object for Firebase
  const reportDocument: Omit<AppDocument, 'id'> = {
    name: {
      en: `${reportType === 'complianceSummary' ? 'Compliance Summary Report' : 'Compliance Report'} - ${project.name}`,
      ar: `تقرير الامتثال - ${project.name}`
    },
    type: 'Report',
    isControlled: true,
    status: 'Approved',
    content: {
      en: aiResponse.content,
      ar: aiResponse.content // In production, translate to Arabic
    },
    fileUrl: pdfUrl,
    metadata: {
      projectId: project.id,
      reportType,
      generatedBy: userName,
      generatedAt: new Date().toISOString(),
      projectProgress: project.progress,
      complianceScore: calculateComplianceScore(project),
      summary: aiResponse.summary,
      recommendations: aiResponse.recommendations,
      statistics: projectData,
      pdfFileName: fileName
    },
    currentVersion: 1,
    versionHistory: [{
      version: 1,
      date: new Date().toISOString(),
      uploadedBy: userName,
      content: {
        en: aiResponse.content,
        ar: aiResponse.content
      }
    }],
    uploadedAt: new Date().toISOString(),
    tags: ['compliance', 'report', 'ai-generated', reportType, 'pdf'],
    category: 'Reports',
    departmentIds: []
  };

  // Save to Firebase
  const docRef = await addDoc(collection(db, 'documents'), {
    ...reportDocument,
    uploadedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  
  freeTierMonitor.recordWrite(1);

  return {
    id: docRef.id,
    ...reportDocument
  };
};

/**
 * Call AI Agent API to generate report content
 */
async function callAIAgent(
  project: Project,
  projectData: any,
  reportType: string
): Promise<AIReportResponse> {
  const prompt = buildReportPrompt(project, projectData, reportType);

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        thread_id: `report_${Date.now()}`,
        context: {
          page_title: 'Compliance Report Generation',
          user_role: 'Quality Manager',
          project_id: project.id,
          report_type: reportType
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Agent API error: ${response.status}`);
    }

    // Read streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += decoder.decode(value);
      }
    }

    // Parse AI response and extract sections
    const summary = extractSection(fullContent, 'Executive Summary', 'Key Findings') || 
                   fullContent.substring(0, 500);
    const recommendations = extractRecommendations(fullContent);

    return {
      content: fullContent,
      summary,
      recommendations
    };
  } catch (error) {
    console.error('AI Agent error:', error);
    // Fallback to template-based report
    return generateFallbackReport(project, projectData, reportType);
  }
}

/**
 * Build comprehensive prompt for AI agent
 */
function buildReportPrompt(project: Project, data: any, reportType: string): string {
  return `
Generate a comprehensive ${reportType === 'complianceSummary' ? 'Compliance Summary Report' : 'Compliance Report'} for the following healthcare accreditation project.

**Project Information:**
- Project Name: ${project.name}
- Status: ${project.status}
- Overall Compliance: ${data.progress.toFixed(1)}%
- Last Updated: ${new Date(data.lastUpdated).toLocaleDateString()}

**Compliance Statistics:**
- Total Standards: ${data.totalStandards}
- Compliant: ${data.compliantStandards} (${((data.compliantStandards / data.totalStandards) * 100).toFixed(1)}%)
- Partially Compliant: ${data.partiallyCompliantStandards} (${((data.partiallyCompliantStandards / data.totalStandards) * 100).toFixed(1)}%)
- Non-Compliant: ${data.nonCompliantStandards} (${((data.nonCompliantStandards / data.totalStandards) * 100).toFixed(1)}%)
- Not Applicable: ${data.notApplicableStandards}

**Quality Improvement:**
- Open CAPA Reports: ${data.openCAPAs}
- Completed CAPA Reports: ${data.completedCAPAs}
- Mock Surveys Conducted: ${data.mockSurveysCompleted}
- Critical Findings: ${data.criticalFindings}
- Evidence Documents: ${data.evidenceDocuments}

**Required Report Sections:**

1. **Executive Summary**
   - Brief overview of the project's compliance status
   - Key achievements and concerns
   - Overall readiness assessment

2. **Key Findings**
   - Detailed analysis of compliance statistics
   - Areas of strength
   - Areas requiring attention
   - Critical non-compliances (if any)

3. **Risk Assessment**
   - Compliance risks identified
   - Potential impact on accreditation
   - Risk mitigation strategies

4. **CAPA Analysis**
   - Summary of corrective and preventive actions
   - Effectiveness of implemented CAPAs
   - Outstanding issues

5. **Evidence & Documentation**
   - Documentation completeness
   - Quality of evidence provided
   - Gaps in documentation

6. **Strategic Recommendations**
   - Prioritized action items
   - Timeline recommendations
   - Resource allocation suggestions
   - Next steps for improvement

7. **Compliance Roadmap**
   - Short-term goals (next 30 days)
   - Medium-term goals (next 90 days)
   - Long-term sustainability measures

**Format Requirements:**
- Use professional healthcare accreditation terminology
- Include specific data points and percentages
- Provide actionable recommendations
- Structure with clear headings and sections
- Use bullet points for readability
- Maintain objective, analytical tone

Generate the complete report now.
  `.trim();
}

/**
 * Calculate overall compliance score
 */
function calculateComplianceScore(project: Project): number {
  if (!project.checklist || project.checklist.length === 0) return 0;

  const weights: Record<ComplianceStatus, number> = {
    [ComplianceStatus.Compliant]: 1.0,
    [ComplianceStatus.PartiallyCompliant]: 0.5,
    [ComplianceStatus.NonCompliant]: 0.0,
    [ComplianceStatus.NotApplicable]: 0.0 // Not counted
  };

  const applicableItems = project.checklist.filter(
    item => item.status !== ComplianceStatus.NotApplicable
  );

  if (applicableItems.length === 0) return 0;

  const totalScore = applicableItems.reduce((sum, item) => {
    return sum + (weights[item.status] || 0);
  }, 0);

  return (totalScore / applicableItems.length) * 100;
}

/**
 * Extract section from AI response
 */
function extractSection(content: string, startMarker: string, endMarker: string): string | null {
  const startRegex = new RegExp(`#{1,3}\\s*${startMarker}`, 'i');
  const endRegex = new RegExp(`#{1,3}\\s*${endMarker}`, 'i');
  
  const startMatch = content.search(startRegex);
  const endMatch = content.search(endRegex);
  
  if (startMatch !== -1) {
    if (endMatch !== -1 && endMatch > startMatch) {
      return content.substring(startMatch, endMatch).trim();
    }
    return content.substring(startMatch).trim();
  }
  
  return null;
}

/**
 * Extract recommendations from AI response
 */
function extractRecommendations(content: string): string[] {
  const recommendations: string[] = [];
  const lines = content.split('\n');
  let inRecommendationsSection = false;

  for (const line of lines) {
    if (line.match(/#{1,3}\s*(Strategic\s+)?Recommendations/i)) {
      inRecommendationsSection = true;
      continue;
    }
    
    if (inRecommendationsSection && line.match(/^#{1,3}\s+/)) {
      break; // Next section started
    }
    
    if (inRecommendationsSection) {
      const match = line.match(/^[\d\-\*•]\s*(.+)/);
      if (match && match[1].trim().length > 10) {
        recommendations.push(match[1].trim());
      }
    }
  }

  return recommendations.slice(0, 10); // Top 10 recommendations
}

/**
 * Generate fallback report when AI is unavailable
 */
function generateFallbackReport(
  project: Project,
  data: any,
  reportType: string
): AIReportResponse {
  const complianceScore = calculateComplianceScore(project);
  
  const content = `
# ${reportType === 'complianceSummary' ? 'Compliance Summary Report' : 'Compliance Report'}

**Project:** ${project.name}  
**Generated:** ${new Date().toLocaleDateString()}  
**Status:** ${project.status}  
**Overall Compliance:** ${complianceScore.toFixed(1)}%

---

## Executive Summary

This report provides a comprehensive overview of the compliance status for ${project.name}. The project currently maintains an overall compliance level of ${complianceScore.toFixed(1)}%, with ${data.compliantStandards} out of ${data.totalStandards} applicable standards fully compliant.

### Key Metrics:
- **Compliant Standards:** ${data.compliantStandards} (${((data.compliantStandards / data.totalStandards) * 100).toFixed(1)}%)
- **Partially Compliant:** ${data.partiallyCompliantStandards} (${((data.partiallyCompliantStandards / data.totalStandards) * 100).toFixed(1)}%)
- **Non-Compliant:** ${data.nonCompliantStandards} (${((data.nonCompliantStandards / data.totalStandards) * 100).toFixed(1)}%)
- **Open CAPAs:** ${data.openCAPAs}
- **Mock Surveys:** ${data.mockSurveysCompleted}

---

## Key Findings

### Strengths
${data.compliantStandards > data.totalStandards * 0.7 ? 
  '- Strong overall compliance rate demonstrates effective quality management\n- Majority of standards are fully compliant' :
  '- Progress is being made toward full compliance\n- Foundation for improvement is established'}
- ${data.evidenceDocuments} evidence documents uploaded
- ${data.completedCAPAs} CAPA reports completed

### Areas for Improvement
${data.nonCompliantStandards > 0 ? 
  `- ${data.nonCompliantStandards} standards remain non-compliant and require immediate attention\n` : ''}
${data.partiallyCompliantStandards > 0 ? 
  `- ${data.partiallyCompliantStandards} standards are partially compliant and need completion\n` : ''}
${data.openCAPAs > 0 ? 
  `- ${data.openCAPAs} open CAPA reports require resolution\n` : ''}
${data.criticalFindings > 0 ?
  `- ${data.criticalFindings} critical findings identified\n` : ''}

---

## Risk Assessment

**Compliance Risk Level:** ${complianceScore >= 85 ? 'LOW' : complianceScore >= 70 ? 'MEDIUM' : 'HIGH'}

${complianceScore < 70 ? 
  '**Critical Risks:**\n- Current compliance level is below accreditation threshold\n- Immediate action required to address non-compliant standards\n- Risk of accreditation delay or failure\n' : 
  complianceScore < 85 ?
  '**Moderate Risks:**\n- Compliance level needs improvement to ensure accreditation success\n- Several standards require additional work\n- Timeline may be at risk without focused effort\n' :
  '**Low Risk:**\n- Strong compliance position\n- Well-positioned for accreditation\n- Maintain current momentum\n'}

---

## CAPA Analysis

**Total CAPA Reports:** ${data.openCAPAs + data.completedCAPAs}
- Completed: ${data.completedCAPAs}
- In Progress: ${data.openCAPAs}

${data.openCAPAs > 0 ? 
  `\n**Action Required:** Focus on completing ${data.openCAPAs} outstanding CAPA reports to improve compliance status.\n` : 
  '\n**Status:** All CAPA reports are completed. Maintain continuous improvement processes.\n'}

---

## Strategic Recommendations

1. **Priority Actions:**
   ${data.nonCompliantStandards > 0 ? 
     `- Address ${data.nonCompliantStandards} non-compliant standards immediately\n   ` : ''}
   ${data.openCAPAs > 0 ? 
     `- Complete ${data.openCAPAs} open CAPA reports\n   ` : ''}
   ${data.partiallyCompliantStandards > 0 ? 
     `- Finish documentation for ${data.partiallyCompliantStandards} partially compliant standards\n   ` : ''}

2. **Documentation Enhancement:**
   - Continue uploading evidence documents for all standards
   - Ensure all documentation is current and accessible
   - Implement document control procedures

3. **Quality Improvement:**
   - Conduct additional mock surveys to identify gaps
   - Implement preventive measures from CAPA findings
   - Establish regular compliance monitoring

4. **Timeline Management:**
   - ${complianceScore < 70 ? 'Accelerate compliance activities to meet accreditation deadline' : 
       complianceScore < 85 ? 'Maintain steady progress to ensure timely completion' :
       'Continue current pace while focusing on excellence'}

---

## Compliance Roadmap

### Next 30 Days
- Complete all critical non-compliances
- Close at least 50% of open CAPAs
- Upload missing evidence documents

### Next 90 Days
- Achieve 90%+ compliance across all standards
- Complete all CAPA reports
- Conduct final mock survey

### Long-term
- Maintain compliance through regular audits
- Implement continuous improvement processes
- Prepare for accreditation survey

---

**Report Generated:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  
**Note:** This is an automated compliance report. For detailed analysis, please review individual standards and CAPA reports.
  `.trim();

  const summary = `Project ${project.name} maintains ${complianceScore.toFixed(1)}% compliance with ${data.compliantStandards} of ${data.totalStandards} standards fully compliant. ${data.nonCompliantStandards > 0 ? `${data.nonCompliantStandards} standards require immediate attention. ` : ''}${data.openCAPAs > 0 ? `${data.openCAPAs} CAPA reports are pending completion.` : 'All CAPA reports completed.'}`;

  const recommendations = [
    data.nonCompliantStandards > 0 ? `Address ${data.nonCompliantStandards} non-compliant standards immediately` : null,
    data.openCAPAs > 0 ? `Complete ${data.openCAPAs} open CAPA reports` : null,
    data.partiallyCompliantStandards > 0 ? `Finish ${data.partiallyCompliantStandards} partially compliant standards` : null,
    'Enhance documentation and evidence collection',
    'Conduct regular compliance monitoring and audits',
    complianceScore < 85 ? 'Accelerate progress to meet accreditation requirements' : 'Maintain current compliance momentum'
  ].filter(Boolean) as string[];

  return {
    content,
    summary,
    recommendations
  };
}
