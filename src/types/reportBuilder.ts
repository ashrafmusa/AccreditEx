/**
 * Custom Report Builder — Type Definitions
 *
 * Defines the data model for user-designed reports:
 *  - ReportBlock: The atomic unit (text, chart, table, metric, divider)
 *  - ReportSection: A row of blocks that renders as a section
 *  - ReportDefinition: The full report template (metadata + sections)
 *  - DataSource: Where block data comes from (projects, documents, etc.)
 *  - Pre-built report templates for quick-start
 */

// ── Data Sources ────────────────────────────────────────────

export type ReportDataSource =
    | 'projects'
    | 'documents'
    | 'checklist_items'
    | 'capa_reports'
    | 'incidents'
    | 'risks'
    | 'audits'
    | 'training'
    | 'departments'
    | 'users'
    | 'mock_surveys'
    | 'pdca_cycles'
    | 'quality_rounds';

export const DATA_SOURCE_LABELS: Record<ReportDataSource, string> = {
    projects: 'Projects',
    documents: 'Documents',
    checklist_items: 'Checklist Items',
    capa_reports: 'CAPA Reports',
    incidents: 'Incidents',
    risks: 'Risks',
    audits: 'Audits',
    training: 'Training Programs',
    departments: 'Departments',
    users: 'Users',
    mock_surveys: 'Mock Surveys',
    pdca_cycles: 'PDCA Cycles',
    quality_rounds: 'Quality Rounds',
};

// ── Fields per data source (what columns are available) ────

export const DATA_SOURCE_FIELDS: Record<ReportDataSource, string[]> = {
    projects: ['name', 'status', 'progress', 'complianceScore', 'createdAt', 'updatedAt', 'startDate', 'dueDate', 'department'],
    documents: ['title', 'type', 'status', 'department', 'uploadedBy', 'createdAt', 'currentVersion', 'approvedBy'],
    checklist_items: ['item', 'status', 'standardId', 'evidence', 'notes', 'completedBy', 'completedAt'],
    capa_reports: ['status', 'rootCause', 'correctiveAction', 'preventiveAction', 'pdcaStage', 'createdAt', 'updatedAt'],
    incidents: ['type', 'severity', 'status', 'description', 'reportedBy', 'reportedAt', 'department', 'location'],
    risks: ['title', 'category', 'likelihood', 'impact', 'riskScore', 'status', 'mitigationPlan', 'owner'],
    audits: ['title', 'type', 'status', 'department', 'scheduledDate', 'completedDate', 'findings'],
    training: ['name', 'type', 'status', 'department', 'startDate', 'endDate', 'enrolledCount', 'completionRate'],
    departments: ['name', 'head', 'staffCount', 'complianceScore', 'riskLevel'],
    users: ['name', 'email', 'role', 'department', 'status', 'lastActive'],
    mock_surveys: ['status', 'startDate', 'completedDate', 'overallScore', 'totalItems', 'passedItems'],
    pdca_cycles: ['currentStage', 'status', 'startedAt', 'completedAt', 'description'],
    quality_rounds: ['title', 'department', 'status', 'date', 'findings', 'score'],
};

// ── Aggregation Functions ───────────────────────────────────

export type AggregationType = 'count' | 'sum' | 'average' | 'min' | 'max' | 'percentage' | 'group_count';

export const AGGREGATION_LABELS: Record<AggregationType, string> = {
    count: 'Count',
    sum: 'Sum',
    average: 'Average',
    min: 'Minimum',
    max: 'Maximum',
    percentage: 'Percentage',
    group_count: 'Group & Count',
};

// ── Chart Types ─────────────────────────────────────────────

export type ReportChartType = 'bar' | 'line' | 'area' | 'pie' | 'radial';

export const CHART_TYPE_LABELS: Record<ReportChartType, string> = {
    bar: 'Bar Chart',
    line: 'Line Chart',
    area: 'Area Chart',
    pie: 'Pie Chart',
    radial: 'Radial Bar',
};

// ── Block Types ─────────────────────────────────────────────

export type ReportBlockType = 'text' | 'metric' | 'chart' | 'table' | 'divider' | 'header';

export const BLOCK_TYPE_LABELS: Record<ReportBlockType, string> = {
    text: 'Text Block',
    metric: 'Metric Card',
    chart: 'Chart',
    table: 'Data Table',
    divider: 'Divider',
    header: 'Section Header',
};

// ── Block Configuration ─────────────────────────────────────

export interface TextBlockConfig {
    content: string;
    fontSize?: 'sm' | 'base' | 'lg' | 'xl';
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
}

export interface HeaderBlockConfig {
    title: string;
    subtitle?: string;
    level: 1 | 2 | 3;
}

export interface MetricBlockConfig {
    label: string;
    dataSource: ReportDataSource;
    field: string;
    aggregation: AggregationType;
    filterField?: string;
    filterValue?: string;
    format?: 'number' | 'percentage' | 'currency';
    icon?: string;
    color?: string;
}

export interface ChartBlockConfig {
    chartType: ReportChartType;
    dataSource: ReportDataSource;
    groupByField: string;
    valueField?: string;
    aggregation: AggregationType;
    filterField?: string;
    filterValue?: string;
    title?: string;
    showLegend?: boolean;
    colors?: string[];
    height?: number;
}

export interface TableBlockConfig {
    dataSource: ReportDataSource;
    columns: string[];
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    filterField?: string;
    filterValue?: string;
    maxRows?: number;
    showRowNumbers?: boolean;
}

export interface DividerBlockConfig {
    style: 'solid' | 'dashed' | 'dotted';
    spacing: 'sm' | 'md' | 'lg';
}

export type BlockConfig =
    | TextBlockConfig
    | HeaderBlockConfig
    | MetricBlockConfig
    | ChartBlockConfig
    | TableBlockConfig
    | DividerBlockConfig;

// ── Report Block ────────────────────────────────────────────

export interface ReportBlock {
    id: string;
    type: ReportBlockType;
    config: BlockConfig;
    width: 'full' | 'half' | 'third' | 'quarter';
    order: number;
}

// ── Report Section ──────────────────────────────────────────

export interface ReportSection {
    id: string;
    title?: string;
    blocks: ReportBlock[];
    order: number;
}

// ── Report Definition ───────────────────────────────────────

export type ReportFormat = 'pdf' | 'csv' | 'excel';

export interface ReportDefinition {
    id: string;
    name: string;
    description: string;
    sections: ReportSection[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isTemplate: boolean;
    category: 'compliance' | 'quality' | 'safety' | 'operational' | 'custom';
    tags: string[];
    lastGeneratedAt?: string;
    generationCount: number;
    /** Page Layout */
    pageOrientation: 'portrait' | 'landscape';
    pageSize: 'A4' | 'Letter';
    includeHeader: boolean;
    includeFooter: boolean;
    includePageNumbers: boolean;
    headerTitle?: string;
    footerText?: string;
}

export const REPORT_CATEGORY_LABELS: Record<ReportDefinition['category'], string> = {
    compliance: 'Compliance',
    quality: 'Quality',
    safety: 'Safety',
    operational: 'Operational',
    custom: 'Custom',
};

// ── Pre-built Templates ─────────────────────────────────────

export const REPORT_TEMPLATES: Omit<ReportDefinition, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'lastGeneratedAt' | 'generationCount'>[] = [
    {
        name: 'Compliance Status Report',
        description: 'Overview of compliance across all projects with checklist completion rates, trends, and department breakdowns.',
        isTemplate: true,
        category: 'compliance',
        tags: ['compliance', 'projects', 'checklist'],
        pageOrientation: 'portrait',
        pageSize: 'A4',
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        headerTitle: 'Compliance Status Report',
        sections: [
            {
                id: 'sec-tpl1-1',
                title: 'Overview',
                order: 1,
                blocks: [
                    { id: 'b-1', type: 'header', config: { title: 'Compliance Status Report', subtitle: 'Current accreditation compliance overview', level: 1 } as HeaderBlockConfig, width: 'full', order: 1 },
                    { id: 'b-2', type: 'metric', config: { label: 'Total Projects', dataSource: 'projects', field: 'id', aggregation: 'count', format: 'number', color: '#4F46E5' } as MetricBlockConfig, width: 'quarter', order: 2 },
                    { id: 'b-3', type: 'metric', config: { label: 'Avg Compliance', dataSource: 'projects', field: 'complianceScore', aggregation: 'average', format: 'percentage', color: '#059669' } as MetricBlockConfig, width: 'quarter', order: 3 },
                    { id: 'b-4', type: 'metric', config: { label: 'Open CAPAs', dataSource: 'capa_reports', field: 'id', aggregation: 'count', filterField: 'status', filterValue: 'In Progress', format: 'number', color: '#D97706' } as MetricBlockConfig, width: 'quarter', order: 4 },
                    { id: 'b-5', type: 'metric', config: { label: 'Active Risks', dataSource: 'risks', field: 'id', aggregation: 'count', filterField: 'status', filterValue: 'Open', format: 'number', color: '#DC2626' } as MetricBlockConfig, width: 'quarter', order: 5 },
                ],
            },
            {
                id: 'sec-tpl1-2',
                title: 'Charts',
                order: 2,
                blocks: [
                    { id: 'b-6', type: 'chart', config: { chartType: 'bar', dataSource: 'projects', groupByField: 'status', aggregation: 'group_count', title: 'Projects by Status', showLegend: true, height: 300 } as ChartBlockConfig, width: 'half', order: 1 },
                    { id: 'b-7', type: 'chart', config: { chartType: 'pie', dataSource: 'capa_reports', groupByField: 'pdcaStage', aggregation: 'group_count', title: 'CAPA by PDCA Stage', showLegend: true, height: 300 } as ChartBlockConfig, width: 'half', order: 2 },
                ],
            },
            {
                id: 'sec-tpl1-3',
                title: 'Project Details',
                order: 3,
                blocks: [
                    { id: 'b-8', type: 'table', config: { dataSource: 'projects', columns: ['name', 'status', 'complianceScore', 'dueDate'], sortField: 'complianceScore', sortDirection: 'asc', maxRows: 20, showRowNumbers: true } as TableBlockConfig, width: 'full', order: 1 },
                ],
            },
        ],
    },
    {
        name: 'Incident & Safety Report',
        description: 'Incident analysis with severity breakdown, department distribution, and trend visualization.',
        isTemplate: true,
        category: 'safety',
        tags: ['incidents', 'safety', 'risk'],
        pageOrientation: 'portrait',
        pageSize: 'A4',
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        headerTitle: 'Incident & Safety Report',
        sections: [
            {
                id: 'sec-tpl2-1',
                title: 'Incident Summary',
                order: 1,
                blocks: [
                    { id: 'b-10', type: 'header', config: { title: 'Incident & Safety Report', level: 1 } as HeaderBlockConfig, width: 'full', order: 1 },
                    { id: 'b-11', type: 'metric', config: { label: 'Total Incidents', dataSource: 'incidents', field: 'id', aggregation: 'count', format: 'number', color: '#DC2626' } as MetricBlockConfig, width: 'third', order: 2 },
                    { id: 'b-12', type: 'metric', config: { label: 'Critical/Sentinel', dataSource: 'incidents', field: 'id', aggregation: 'count', filterField: 'severity', filterValue: 'Sentinel Event', format: 'number', color: '#7C2D12' } as MetricBlockConfig, width: 'third', order: 3 },
                    { id: 'b-13', type: 'metric', config: { label: 'Total Risks', dataSource: 'risks', field: 'id', aggregation: 'count', format: 'number', color: '#D97706' } as MetricBlockConfig, width: 'third', order: 4 },
                ],
            },
            {
                id: 'sec-tpl2-2',
                title: 'Analysis',
                order: 2,
                blocks: [
                    { id: 'b-14', type: 'chart', config: { chartType: 'bar', dataSource: 'incidents', groupByField: 'severity', aggregation: 'group_count', title: 'Incidents by Severity', showLegend: true, height: 300 } as ChartBlockConfig, width: 'half', order: 1 },
                    { id: 'b-15', type: 'chart', config: { chartType: 'pie', dataSource: 'incidents', groupByField: 'type', aggregation: 'group_count', title: 'Incidents by Type', showLegend: true, height: 300 } as ChartBlockConfig, width: 'half', order: 2 },
                    { id: 'b-16', type: 'table', config: { dataSource: 'incidents', columns: ['type', 'severity', 'status', 'department', 'reportedAt'], sortField: 'reportedAt', sortDirection: 'desc', maxRows: 25 } as TableBlockConfig, width: 'full', order: 3 },
                ],
            },
        ],
    },
    {
        name: 'Training Compliance Report',
        description: 'Training program completion rates, department training status, and overdue training items.',
        isTemplate: true,
        category: 'quality',
        tags: ['training', 'compliance', 'departments'],
        pageOrientation: 'portrait',
        pageSize: 'A4',
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        headerTitle: 'Training Compliance Report',
        sections: [
            {
                id: 'sec-tpl3-1',
                order: 1,
                blocks: [
                    { id: 'b-20', type: 'header', config: { title: 'Training Compliance Report', subtitle: 'Staff training progress and compliance status', level: 1 } as HeaderBlockConfig, width: 'full', order: 1 },
                    { id: 'b-21', type: 'metric', config: { label: 'Training Programs', dataSource: 'training', field: 'id', aggregation: 'count', format: 'number', color: '#4F46E5' } as MetricBlockConfig, width: 'third', order: 2 },
                    { id: 'b-22', type: 'metric', config: { label: 'Total Departments', dataSource: 'departments', field: 'id', aggregation: 'count', format: 'number', color: '#059669' } as MetricBlockConfig, width: 'third', order: 3 },
                    { id: 'b-23', type: 'metric', config: { label: 'Total Users', dataSource: 'users', field: 'id', aggregation: 'count', format: 'number', color: '#0284C7' } as MetricBlockConfig, width: 'third', order: 4 },
                ],
            },
            {
                id: 'sec-tpl3-2',
                order: 2,
                blocks: [
                    { id: 'b-24', type: 'chart', config: { chartType: 'bar', dataSource: 'training', groupByField: 'status', aggregation: 'group_count', title: 'Programs by Status', showLegend: true, height: 300 } as ChartBlockConfig, width: 'half', order: 1 },
                    { id: 'b-25', type: 'chart', config: { chartType: 'bar', dataSource: 'training', groupByField: 'department', aggregation: 'group_count', title: 'Programs by Department', showLegend: true, height: 300 } as ChartBlockConfig, width: 'half', order: 2 },
                    { id: 'b-26', type: 'table', config: { dataSource: 'training', columns: ['name', 'type', 'status', 'department', 'completionRate'], sortField: 'completionRate', sortDirection: 'asc', maxRows: 20, showRowNumbers: true } as TableBlockConfig, width: 'full', order: 3 },
                ],
            },
        ],
    },
    {
        name: 'Audit Summary Report',
        description: 'Internal and external audit results, findings, and action items across departments.',
        isTemplate: true,
        category: 'operational',
        tags: ['audits', 'findings', 'departments'],
        pageOrientation: 'landscape',
        pageSize: 'A4',
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        headerTitle: 'Audit Summary Report',
        sections: [
            {
                id: 'sec-tpl4-1',
                order: 1,
                blocks: [
                    { id: 'b-30', type: 'header', config: { title: 'Audit Summary Report', level: 1 } as HeaderBlockConfig, width: 'full', order: 1 },
                    { id: 'b-31', type: 'metric', config: { label: 'Total Audits', dataSource: 'audits', field: 'id', aggregation: 'count', format: 'number', color: '#4F46E5' } as MetricBlockConfig, width: 'quarter', order: 2 },
                    { id: 'b-32', type: 'chart', config: { chartType: 'bar', dataSource: 'audits', groupByField: 'status', aggregation: 'group_count', title: 'Audits by Status', showLegend: true, height: 280 } as ChartBlockConfig, width: 'half', order: 3 },
                    { id: 'b-33', type: 'table', config: { dataSource: 'audits', columns: ['title', 'type', 'status', 'department', 'scheduledDate'], sortField: 'scheduledDate', sortDirection: 'desc', maxRows: 30 } as TableBlockConfig, width: 'full', order: 4 },
                ],
            },
        ],
    },
    {
        name: 'CAPA Effectiveness Report',
        description: 'Corrective and preventive action tracking — root cause analysis, PDCA stages, closure rates.',
        isTemplate: true,
        category: 'quality',
        tags: ['capa', 'pdca', 'quality'],
        pageOrientation: 'portrait',
        pageSize: 'A4',
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        headerTitle: 'CAPA Effectiveness Report',
        sections: [
            {
                id: 'sec-tpl5-1',
                order: 1,
                blocks: [
                    { id: 'b-40', type: 'header', config: { title: 'CAPA Effectiveness Report', subtitle: 'Corrective & preventive action analysis', level: 1 } as HeaderBlockConfig, width: 'full', order: 1 },
                    { id: 'b-41', type: 'metric', config: { label: 'Total CAPAs', dataSource: 'capa_reports', field: 'id', aggregation: 'count', format: 'number', color: '#4F46E5' } as MetricBlockConfig, width: 'quarter', order: 2 },
                    { id: 'b-42', type: 'metric', config: { label: 'In Progress', dataSource: 'capa_reports', field: 'id', aggregation: 'count', filterField: 'status', filterValue: 'In Progress', format: 'number', color: '#D97706' } as MetricBlockConfig, width: 'quarter', order: 3 },
                    { id: 'b-43', type: 'chart', config: { chartType: 'pie', dataSource: 'capa_reports', groupByField: 'status', aggregation: 'group_count', title: 'CAPA Status Distribution', showLegend: true, height: 300 } as ChartBlockConfig, width: 'half', order: 4 },
                    { id: 'b-44', type: 'chart', config: { chartType: 'bar', dataSource: 'capa_reports', groupByField: 'pdcaStage', aggregation: 'group_count', title: 'CAPA by PDCA Stage', showLegend: true, height: 300 } as ChartBlockConfig, width: 'half', order: 5 },
                    { id: 'b-45', type: 'table', config: { dataSource: 'capa_reports', columns: ['status', 'rootCause', 'correctiveAction', 'pdcaStage', 'createdAt'], sortField: 'createdAt', sortDirection: 'desc', maxRows: 25 } as TableBlockConfig, width: 'full', order: 6 },
                ],
            },
        ],
    },
];
