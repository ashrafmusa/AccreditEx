/**
 * Utility functions for exporting dashboard data to CSV and PDF formats
 */

interface ExportData {
  [key: string]: string | number | Date | null | undefined;
}

/**
 * Convert an array of objects to CSV format
 */
export const convertToCSV = (data: ExportData[], headers?: string[]): string => {
  try {
    if (!data || data.length === 0) {
      return '';
    }

    const dataHeaders = headers || Object.keys(data[0]);
    const csvHeaders = dataHeaders.join(',');
    
    const csvRows = data.map(row => {
      return dataHeaders.map(header => {
        const value = row[header];
        
        // Handle special cases
        if (value === null || value === undefined) {
          return '';
        }
        
        // Convert dates to ISO string
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }
        
        // Escape quotes and wrap in quotes if contains comma or quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  } catch (error) {
    console.error('Error converting data to CSV:', error);
    return '';
  }
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent: string, fileName: string = 'export.csv'): void => {
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV:', error);
  }
};

/**
 * Export dashboard metrics to CSV
 */
export const exportDashboardMetricsToCSV = (
  metrics: { [key: string]: string | number },
  dashboardName: string,
  fileName?: string
): void => {
  try {
    const data: ExportData[] = [
      {
        Metric: 'Exported At',
        Value: new Date().toLocaleString()
      },
      {
        Metric: 'Dashboard',
        Value: dashboardName
      },
      ...Object.entries(metrics).map(([key, value]) => ({
        Metric: key,
        Value: value
      }))
    ];

    const csv = convertToCSV(data, ['Metric', 'Value']);
    const exportFileName = fileName || `${dashboardName}-metrics-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, exportFileName);
  } catch (error) {
    console.error('Error exporting dashboard metrics:', error);
  }
};

/**
 * Export list data to CSV
 */
export const exportListToCSV = (
  items: ExportData[],
  headers: string[],
  fileName: string
): void => {
  try {
    const csv = convertToCSV(items, headers);
    downloadCSV(csv, fileName);
  } catch (error) {
    console.error('Error exporting list to CSV:', error);
  }
};

/**
 * Generate a simple HTML string for PDF export (to be used with a PDF library)
 */
export const generateHTMLForPDF = (
  title: string,
  metrics: { [key: string]: string | number },
  timestamp: Date = new Date()
): string => {
  try {
    const metricRows = Object.entries(metrics)
      .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
      .join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .metadata { color: #7f8c8d; font-size: 12px; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #bdc3c7; padding: 12px; text-align: left; }
        th { background-color: #3498db; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #ecf0f1; }
        .footer { margin-top: 30px; color: #95a5a6; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="metadata">
        <p><strong>Generated:</strong> ${timestamp.toLocaleString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${metricRows}
        </tbody>
      </table>
      <div class="footer">
        <p>This is an automatically generated report.</p>
      </div>
    </body>
    </html>
    `;
  } catch (error) {
    console.error('Error generating HTML for PDF:', error);
    return '';
  }
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

export default {
  convertToCSV,
  downloadCSV,
  exportDashboardMetricsToCSV,
  exportListToCSV,
  generateHTMLForPDF,
  copyToClipboard
};
