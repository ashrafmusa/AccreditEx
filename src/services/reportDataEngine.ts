/**
 * Report Data Engine
 *
 * Resolves data from Zustand stores based on ReportBlock config,
 * applies filters and aggregations, and returns ready-to-render data
 * for metrics, charts, and tables.
 *
 * Also provides PDF export via jsPDF + jspdf-autotable.
 */

import { useAppStore } from '@/stores/useAppStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useUserStore } from '@/stores/useUserStore';
import {
    ReportDataSource,
    AggregationType,
    MetricBlockConfig,
    ChartBlockConfig,
    TableBlockConfig,
    ReportDefinition,
    ReportSection,
    ReportBlock,
    DATA_SOURCE_FIELDS,
} from '@/types/reportBuilder';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Data Resolution ─────────────────────────────────────────

/** Pull raw data array for given data source from the Zustand stores */
export function resolveDataSource(source: ReportDataSource): Record<string, unknown>[] {
    const appState = useAppStore.getState();
    const projectState = useProjectStore.getState();
    const userState = useUserStore.getState();

    switch (source) {
        case 'projects':
            return projectState.projects as unknown as Record<string, unknown>[];
        case 'documents':
            return appState.documents as unknown as Record<string, unknown>[];
        case 'checklist_items': {
            const items: Record<string, unknown>[] = [];
            for (const p of projectState.projects) {
                if (p.checklist) {
                    for (const item of p.checklist) {
                        items.push({ ...item, projectId: p.id, projectName: p.name } as unknown as Record<string, unknown>);
                    }
                }
            }
            return items;
        }
        case 'capa_reports': {
            const capas: Record<string, unknown>[] = [];
            for (const p of projectState.projects) {
                if (p.capaReports) {
                    for (const c of p.capaReports) {
                        capas.push({ ...c, projectId: p.id, projectName: p.name } as unknown as Record<string, unknown>);
                    }
                }
            }
            return capas;
        }
        case 'incidents':
            return appState.incidentReports as unknown as Record<string, unknown>[];
        case 'risks':
            return appState.risks as unknown as Record<string, unknown>[];
        case 'audits':
            return (appState.audits || []) as unknown as Record<string, unknown>[];
        case 'training':
            return appState.trainingPrograms as unknown as Record<string, unknown>[];
        case 'departments':
            return appState.departments as unknown as Record<string, unknown>[];
        case 'users':
            return userState.users as unknown as Record<string, unknown>[];
        case 'mock_surveys': {
            const surveys: Record<string, unknown>[] = [];
            for (const p of projectState.projects) {
                if (p.mockSurveys) {
                    for (const s of p.mockSurveys) {
                        surveys.push({ ...s, projectId: p.id, projectName: p.name } as unknown as Record<string, unknown>);
                    }
                }
            }
            return surveys;
        }
        case 'pdca_cycles': {
            const cycles: Record<string, unknown>[] = [];
            for (const p of projectState.projects) {
                if (p.pdcaCycles) {
                    for (const c of p.pdcaCycles) {
                        cycles.push({ ...c, projectId: p.id, projectName: p.name } as unknown as Record<string, unknown>);
                    }
                }
            }
            return cycles;
        }
        case 'quality_rounds':
            return []; // Placeholder — quality rounds may not be in a store yet
        default:
            return [];
    }
}

// ── Filtering ───────────────────────────────────────────────

function applyFilter(
    data: Record<string, unknown>[],
    filterField?: string,
    filterValue?: string,
): Record<string, unknown>[] {
    if (!filterField || !filterValue) return data;
    return data.filter((d) => String(d[filterField] ?? '').toLowerCase() === filterValue.toLowerCase());
}

// ── Aggregation ─────────────────────────────────────────────

export function aggregate(
    data: Record<string, unknown>[],
    field: string,
    type: AggregationType,
): number {
    if (data.length === 0) return 0;

    switch (type) {
        case 'count':
            return data.length;
        case 'sum':
            return data.reduce((acc, d) => acc + (Number(d[field]) || 0), 0);
        case 'average': {
            const nums = data.map((d) => Number(d[field]) || 0);
            return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        }
        case 'min':
            return Math.min(...data.map((d) => Number(d[field]) || 0));
        case 'max':
            return Math.max(...data.map((d) => Number(d[field]) || 0));
        case 'percentage': {
            const total = data.length;
            const matching = data.filter((d) => d[field] !== undefined && d[field] !== null && d[field] !== '').length;
            return total > 0 ? Math.round((matching / total) * 100) : 0;
        }
        case 'group_count':
            // Returns count of unique groups — used mainly for charts
            return new Set(data.map((d) => String(d[field] ?? 'Unknown'))).size;
        default:
            return data.length;
    }
}

/** Group data by a field and count occurrences — for chart rendering */
export function groupAndCount(
    data: Record<string, unknown>[],
    groupByField: string,
): { name: string; value: number }[] {
    const groups: Record<string, number> = {};
    for (const d of data) {
        const key = String(d[groupByField] ?? 'Unknown');
        groups[key] = (groups[key] || 0) + 1;
    }
    return Object.entries(groups)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

// ── Block Data Resolvers ────────────────────────────────────

export function resolveMetric(config: MetricBlockConfig): number {
    const raw = resolveDataSource(config.dataSource);
    const filtered = applyFilter(raw, config.filterField, config.filterValue);
    const value = aggregate(filtered, config.field, config.aggregation);

    if (config.format === 'percentage') {
        return Math.round(value * 10) / 10;
    }
    return Math.round(value * 100) / 100;
}

export function resolveChart(config: ChartBlockConfig): { name: string; value: number }[] {
    const raw = resolveDataSource(config.dataSource);
    const filtered = applyFilter(raw, config.filterField, config.filterValue);
    return groupAndCount(filtered, config.groupByField);
}

export function resolveTable(config: TableBlockConfig): {
    headers: string[];
    rows: string[][];
} {
    const raw = resolveDataSource(config.dataSource);
    const filtered = applyFilter(raw, config.filterField, config.filterValue);

    // Sort
    let sorted = [...filtered];
    if (config.sortField) {
        const dir = config.sortDirection === 'desc' ? -1 : 1;
        sorted.sort((a, b) => {
            const aVal = String(a[config.sortField!] ?? '');
            const bVal = String(b[config.sortField!] ?? '');
            return aVal.localeCompare(bVal) * dir;
        });
    }

    // Limit
    if (config.maxRows) {
        sorted = sorted.slice(0, config.maxRows);
    }

    const headers = config.columns.length > 0
        ? config.columns
        : DATA_SOURCE_FIELDS[config.dataSource]?.slice(0, 5) || [];

    const rows = sorted.map((row) =>
        headers.map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '—';
            if (typeof val === 'object') return JSON.stringify(val).slice(0, 50);
            return String(val);
        }),
    );

    return { headers, rows };
}

// ── Format helpers ──────────────────────────────────────────

export function formatMetricValue(value: number, format?: string): string {
    if (format === 'percentage') return `${value}%`;
    if (format === 'currency') return `$${value.toLocaleString()}`;
    if (value >= 1000) return value.toLocaleString();
    return String(value);
}

// ── PDF Export ──────────────────────────────────────────────

const BRAND_COLOR: [number, number, number] = [79, 70, 229];
const CHART_COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#8B5CF6', '#0284C7', '#EC4899', '#14B8A6'];

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

const PDF_COLORS: [number, number, number][] = [
    [79, 70, 229], [5, 150, 105], [217, 119, 6], [220, 38, 38],
    [139, 92, 246], [2, 132, 199], [236, 72, 153], [20, 184, 166],
];

/**
 * Canvas-based chart renderer for PDF export.
 * Draws charts natively on an OffscreenCanvas / HTMLCanvasElement and returns a
 * high-resolution PNG data-URL that jsPDF can embed via addImage.
 */
function renderChartToImage(
    data: { name: string; value: number }[],
    chartType: string,
    canvasW: number,
    canvasH: number,
): string {
    const canvas = document.createElement('canvas');
    const dpr = 2;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (data.length === 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data available', canvasW / 2, canvasH / 2);
        return canvas.toDataURL('image/png');
    }

    const colors = PDF_COLORS;

    switch (chartType) {
        case 'bar': {
            const padL = 55, padR = 20, padB = 50, padT = 15;
            const cW = canvasW - padL - padR;
            const cH = canvasH - padT - padB;
            const maxVal = Math.max(...data.map(d => d.value), 1);
            const barWidth = Math.min(50, (cW / data.length) * 0.65);
            const gap = cW / data.length;

            // Horizontal grid lines + Y-axis labels
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 0; i <= 5; i++) {
                const yPos = padT + cH - (cH * i / 5);
                ctx.strokeStyle = '#f0f0f0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padL, yPos);
                ctx.lineTo(canvasW - padR, yPos);
                ctx.stroke();
                ctx.fillStyle = '#6b7280';
                ctx.font = '10px Helvetica, Arial, sans-serif';
                ctx.fillText(String(Math.round(maxVal * i / 5)), padL - 8, yPos);
            }

            // X-axis line
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padL, padT + cH);
            ctx.lineTo(canvasW - padR, padT + cH);
            ctx.stroke();

            // Bars with gradient + rounded tops
            data.forEach((d, i) => {
                const x = padL + i * gap + (gap - barWidth) / 2;
                const barH = (d.value / maxVal) * cH;
                const yBar = padT + cH - barH;
                const [r, g, b] = colors[i % colors.length];

                const grad = ctx.createLinearGradient(x, yBar, x, padT + cH);
                grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
                grad.addColorStop(1, `rgba(${r},${g},${b},0.6)`);
                ctx.fillStyle = grad;

                const radius = Math.min(5, barWidth / 4);
                ctx.beginPath();
                ctx.moveTo(x + radius, yBar);
                ctx.lineTo(x + barWidth - radius, yBar);
                ctx.quadraticCurveTo(x + barWidth, yBar, x + barWidth, yBar + radius);
                ctx.lineTo(x + barWidth, padT + cH);
                ctx.lineTo(x, padT + cH);
                ctx.lineTo(x, yBar + radius);
                ctx.quadraticCurveTo(x, yBar, x + radius, yBar);
                ctx.closePath();
                ctx.fill();

                // Value label on top
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 10px Helvetica, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(d.value.toLocaleString(), x + barWidth / 2, yBar - 4);

                // X-axis label
                ctx.fillStyle = '#4b5563';
                ctx.font = '9px Helvetica, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                const label = d.name.length > 12 ? d.name.slice(0, 11) + '\u2026' : d.name;
                ctx.save();
                ctx.translate(x + barWidth / 2, padT + cH + 8);
                if (data.length > 5) ctx.rotate(-0.35);
                ctx.fillText(label, 0, 0);
                ctx.restore();
            });
            break;
        }

        case 'pie': {
            const total = data.reduce((a, d) => a + d.value, 0);
            if (total === 0) break;

            const cx = canvasW * 0.35;
            const cy = canvasH / 2;
            const outerR = Math.min(cx - 30, canvasH / 2 - 20);
            const innerR = outerR * 0.38;

            let startAngle = -Math.PI / 2;
            const sliceInfo: { midAngle: number; pct: number }[] = [];

            // Draw slices (donut style)
            data.forEach((d, i) => {
                const sliceAngle = (d.value / total) * Math.PI * 2;
                const midAngle = startAngle + sliceAngle / 2;
                const [r, g, b] = colors[i % colors.length];

                ctx.beginPath();
                ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
                ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                sliceInfo.push({ midAngle, pct: Math.round((d.value / total) * 100) });
                startAngle += sliceAngle;
            });

            // Percentage labels on large slices
            sliceInfo.forEach((s) => {
                if (s.pct >= 8) {
                    const labelR = (outerR + innerR) / 2;
                    const lx = cx + Math.cos(s.midAngle) * labelR;
                    const ly = cy + Math.sin(s.midAngle) * labelR;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 11px Helvetica, Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${s.pct}%`, lx, ly);
                }
            });

            // Legend on the right
            const legendX = cx + outerR + 25;
            let legendY = 30;
            data.forEach((d, i) => {
                const [r, g, b] = colors[i % colors.length];
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(legendX, legendY - 6, 10, 10);
                ctx.fillStyle = '#374151';
                ctx.font = '10px Helvetica, Arial, sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const pct = Math.round((d.value / total) * 100);
                const name = d.name.length > 16 ? d.name.slice(0, 15) + '\u2026' : d.name;
                ctx.fillText(`${name} \u2014 ${d.value} (${pct}%)`, legendX + 15, legendY);
                legendY += 18;
            });
            break;
        }

        case 'line':
        case 'area': {
            const padL = 55, padR = 20, padB = 40, padT = 15;
            const cW = canvasW - padL - padR;
            const cH = canvasH - padT - padB;
            const maxVal = Math.max(...data.map(d => d.value), 1);

            // Grid + Y labels
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 0; i <= 5; i++) {
                const yPos = padT + cH - (cH * i / 5);
                ctx.strokeStyle = '#f0f0f0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padL, yPos);
                ctx.lineTo(canvasW - padR, yPos);
                ctx.stroke();
                ctx.fillStyle = '#6b7280';
                ctx.font = '10px Helvetica, Arial, sans-serif';
                ctx.fillText(String(Math.round(maxVal * i / 5)), padL - 8, yPos);
            }

            const points = data.map((d, i) => ({
                x: padL + (data.length === 1 ? cW / 2 : (i / (data.length - 1)) * cW),
                y: padT + cH - (d.value / maxVal) * cH,
            }));

            const [r, g, b] = colors[0];

            // Area fill
            if (chartType === 'area') {
                ctx.beginPath();
                ctx.moveTo(points[0].x, padT + cH);
                points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.lineTo(points[points.length - 1].x, padT + cH);
                ctx.closePath();
                const grad = ctx.createLinearGradient(0, padT, 0, padT + cH);
                grad.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
                grad.addColorStop(1, `rgba(${r},${g},${b},0.02)`);
                ctx.fillStyle = grad;
                ctx.fill();
            }

            // Line
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();

            // Data points
            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = `rgb(${r},${g},${b})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // X-axis labels
            data.forEach((d, i) => {
                const x = padL + (data.length === 1 ? cW / 2 : (i / (data.length - 1)) * cW);
                ctx.fillStyle = '#4b5563';
                ctx.font = '9px Helvetica, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                const label = d.name.length > 10 ? d.name.slice(0, 9) + '\u2026' : d.name;
                ctx.fillText(label, x, padT + cH + 8);
            });

            // Value labels
            data.forEach((d, i) => {
                const p = points[i];
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px Helvetica, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(d.value.toLocaleString(), p.x, p.y - 8);
            });
            break;
        }

        default: {
            // Fallback: horizontal bars list
            const padL = 80, padR = 30, padT = 10;
            const barH = Math.min(24, (canvasH - padT) / data.length - 4);
            const maxVal = Math.max(...data.map(d => d.value), 1);

            data.forEach((d, i) => {
                const yBar = padT + i * (barH + 6);
                const bW = ((d.value / maxVal) * (canvasW - padL - padR));
                const [r, g, b] = colors[i % colors.length];

                // Label
                ctx.fillStyle = '#374151';
                ctx.font = '10px Helvetica, Arial, sans-serif';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                const label = d.name.length > 12 ? d.name.slice(0, 11) + '\u2026' : d.name;
                ctx.fillText(label, padL - 8, yBar + barH / 2);

                // Bar
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(padL, yBar, bW, barH);

                // Value
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 10px Helvetica, Arial, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(d.value.toLocaleString(), padL + bW + 6, yBar + barH / 2);
            });
            break;
        }
    }

    return canvas.toDataURL('image/png');
}

export async function exportReportToPDF(report: ReportDefinition): Promise<Blob> {
    const isLandscape = report.pageOrientation === 'landscape';
    const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: report.pageSize === 'Letter' ? 'letter' : 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let y = margin;

    // ── Header ──────────────────────────
    const addHeader = () => {
        if (!report.includeHeader) return;
        doc.setFillColor(...BRAND_COLOR);
        doc.rect(0, 0, pageWidth, 14, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(report.headerTitle || report.name, margin, 9);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 9, { align: 'right' });
        y = 20;
    };

    // ── Footer ──────────────────────────
    const addFooter = (pageNum: number) => {
        if (!report.includeFooter && !report.includePageNumbers) return;
        doc.setTextColor(128, 128, 128);
        doc.setFontSize(7);
        if (report.footerText) {
            doc.text(report.footerText, margin, pageHeight - 8);
        }
        if (report.includePageNumbers) {
            doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        }
    };

    // ── Page break check ────────────────
    const needsPageBreak = (requiredSpace: number): boolean => {
        return y + requiredSpace > pageHeight - margin - 10;
    };

    const addNewPage = () => {
        addFooter(doc.getNumberOfPages());
        doc.addPage();
        addHeader();
    };

    // ── Start ───────────────────────────
    addHeader();

    // Walk through sections
    for (const section of report.sections.sort((a, b) => a.order - b.order)) {
        // Section title
        if (section.title) {
            if (needsPageBreak(15)) addNewPage();
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text(section.title, margin, y);
            y += 8;
        }

        // Render blocks
        for (const block of section.blocks.sort((a, b) => a.order - b.order)) {
            if (needsPageBreak(30)) addNewPage();

            switch (block.type) {
                case 'header': {
                    const cfg = block.config as { title: string; subtitle?: string; level: number };
                    const fontSize = cfg.level === 1 ? 16 : cfg.level === 2 ? 13 : 11;
                    doc.setTextColor(30, 30, 30);
                    doc.setFontSize(fontSize);
                    doc.setFont('helvetica', 'bold');
                    doc.text(cfg.title, margin, y);
                    y += fontSize * 0.5 + 2;
                    if (cfg.subtitle) {
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(100, 100, 100);
                        doc.text(cfg.subtitle, margin, y);
                        y += 6;
                    }
                    y += 3;
                    break;
                }

                case 'text': {
                    const cfg = block.config as { content: string };
                    doc.setTextColor(50, 50, 50);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const lines = doc.splitTextToSize(cfg.content, contentWidth);
                    doc.text(lines, margin, y);
                    y += lines.length * 5 + 4;
                    break;
                }

                case 'metric': {
                    const cfg = block.config as MetricBlockConfig;
                    const value = resolveMetric(cfg);
                    const formatted = formatMetricValue(value, cfg.format);

                    // Position metrics side-by-side in a row
                    const allMetrics = section.blocks.filter(b => b.type === 'metric').sort((a, b) => a.order - b.order);
                    const metricIdx = allMetrics.findIndex(b => b.id === block.id);
                    const metricsPerRow = Math.min(allMetrics.length, 4);
                    const colInRow = metricIdx % metricsPerRow;
                    const boxGap = 3;
                    const boxW = (contentWidth - (metricsPerRow - 1) * boxGap) / metricsPerRow;
                    const boxH = 22;
                    const boxX = margin + colInRow * (boxW + boxGap);

                    // New row for metrics beyond first row
                    if (colInRow === 0 && metricIdx > 0) {
                        y += boxH + 5;
                        if (needsPageBreak(boxH + 10)) addNewPage();
                    }

                    // Card background
                    doc.setFillColor(249, 250, 251);
                    doc.setDrawColor(220, 220, 230);
                    doc.roundedRect(boxX, y, boxW, boxH, 2, 2, 'FD');

                    // Color accent bar on left
                    const colorHex = cfg.color || '#4F46E5';
                    const [cr, cg, cb] = hexToRgb(colorHex);
                    doc.setFillColor(cr, cg, cb);
                    doc.rect(boxX, y + 1, 2.5, boxH - 2, 'F');

                    // Value
                    doc.setTextColor(30, 30, 30);
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text(formatted, boxX + 7, y + 10);

                    // Label
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 100, 100);
                    doc.text(cfg.label, boxX + 7, y + 17);

                    // Advance y after last metric in row
                    if (colInRow === metricsPerRow - 1 || metricIdx === allMetrics.length - 1) {
                        y += boxH + 6;
                    }
                    break;
                }

                case 'chart': {
                    const cfg = block.config as ChartBlockConfig;
                    const chartData = resolveChart(cfg);

                    if (cfg.title) {
                        doc.setTextColor(50, 50, 50);
                        doc.setFontSize(11);
                        doc.setFont('helvetica', 'bold');
                        doc.text(cfg.title, margin, y);
                        y += 7;
                    }

                    if (chartData.length > 0) {
                        // Render chart to canvas image for high-quality PDF embedding
                        const pxW = 800;
                        const pxH = 280;
                        const mmW = block.width === 'half' ? contentWidth / 2 - 2 : contentWidth;
                        const mmH = (pxH / pxW) * mmW;

                        if (needsPageBreak(mmH + 8)) addNewPage();

                        const imgData = renderChartToImage(chartData, cfg.chartType, pxW, pxH);
                        doc.addImage(imgData, 'PNG', margin, y, mmW, mmH);
                        y += mmH + 6;
                    } else {
                        doc.setTextColor(150, 150, 150);
                        doc.setFontSize(9);
                        doc.text('No data available for chart', margin, y);
                        y += 8;
                    }
                    break;
                }

                case 'table': {
                    const cfg = block.config as TableBlockConfig;
                    const { headers, rows } = resolveTable(cfg);

                    if (rows.length > 0) {
                        autoTable(doc, {
                            startY: y,
                            head: [headers.map((h) => h.charAt(0).toUpperCase() + h.slice(1))],
                            body: rows,
                            theme: 'striped',
                            headStyles: { fillColor: BRAND_COLOR, fontSize: 8, fontStyle: 'bold' },
                            bodyStyles: { fontSize: 7 },
                            alternateRowStyles: { fillColor: [245, 245, 255] },
                            margin: { left: margin, right: margin },
                            tableWidth: contentWidth,
                            showHead: 'everyPage',
                        });
                        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 8 || y + 40;
                    } else {
                        doc.setTextColor(150, 150, 150);
                        doc.setFontSize(9);
                        doc.text('No data available', margin, y);
                        y += 8;
                    }
                    break;
                }

                case 'divider': {
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, y, pageWidth - margin, y);
                    y += 6;
                    break;
                }
            }
        }

        y += 5; // Section gap
    }

    // Final footer
    addFooter(doc.getNumberOfPages());

    return doc.output('blob');
}

/** Trigger download of a PDF blob */
export function downloadPDFBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Export report data to CSV */
export function exportReportToCSV(report: ReportDefinition): string {
    const allRows: string[][] = [];
    const allHeaders: string[] = [];

    for (const section of report.sections) {
        for (const block of section.blocks) {
            if (block.type === 'table') {
                const cfg = block.config as TableBlockConfig;
                const { headers, rows } = resolveTable(cfg);
                if (allHeaders.length === 0) {
                    allHeaders.push(...headers);
                    allRows.push(headers);
                }
                allRows.push(...rows);
            }
        }
    }

    if (allRows.length === 0) return '';

    return allRows
        .map((row) =>
            row.map((cell) => {
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(','),
        )
        .join('\n');
}
