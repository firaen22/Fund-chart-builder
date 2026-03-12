/**
 * XLSX import/export using SheetJS loaded dynamically from CDN.
 * No npm dependency required — SheetJS is loaded on first use.
 */

import { FundDataset, DataPoint } from '../types';

// Type declarations for the subset of SheetJS API we use
interface XLSXLib {
  read: (data: ArrayBuffer, opts?: any) => any;
  utils: {
    sheet_to_json: (sheet: any, opts?: any) => any[];
    aoa_to_sheet: (data: any[][]) => any;
    book_new: () => any;
    book_append_sheet: (wb: any, ws: any, name: string) => void;
  };
  writeFile: (wb: any, filename: string, opts?: any) => void;
  write: (wb: any, opts?: any) => any;
}

let _xlsx: XLSXLib | null = null;

/**
 * Lazily load SheetJS from CDN. Cached after first load.
 */
async function getXLSX(): Promise<XLSXLib> {
  if (_xlsx) return _xlsx;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.onload = () => {
      _xlsx = (window as any).XLSX as XLSXLib;
      if (_xlsx) resolve(_xlsx);
      else reject(new Error('SheetJS loaded but XLSX global not found'));
    };
    script.onerror = () => reject(new Error('Failed to load SheetJS from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Parse an XLSX file (ArrayBuffer) into a FundDataset.
 * Reads the first sheet, expects first column = dates, rest = fund values.
 */
export async function parseXLSX(buffer: ArrayBuffer): Promise<FundDataset> {
  const XLSX = await getXLSX();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('No sheets found in workbook');

  const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    header: 1,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  if (rows.length < 2) throw new Error('XLSX must have at least a header row and one data row.');

  const headers = (rows[0] as string[]).map((h: any) => String(h).trim());
  const funds = headers.slice(1).filter(h => h.length > 0);

  const data: DataPoint[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as any[];
    if (!row || !row[0]) continue;

    let dateStr = String(row[0]).trim();

    // Try to normalize date formats
    if (dateStr.includes('/')) {
      // Convert MM/DD/YYYY or DD/MM/YYYY to YYYY-MM-DD
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [a, b, c] = parts;
        if (c.length === 4) {
          dateStr = `${c}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
        }
      }
    }

    const point: DataPoint = { date: dateStr };

    funds.forEach((fund, idx) => {
      const raw = row[idx + 1];
      if (raw === undefined || raw === null || raw === '') {
        point[fund] = null;
      } else {
        const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[,$]/g, ''));
        point[fund] = isNaN(num) ? null : num;
      }
    });

    data.push(point);
  }

  // Sort by date
  data.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
  });

  return { funds, data };
}

/**
 * Export a FundDataset to an XLSX file and trigger browser download.
 */
export async function exportDatasetToXLSX(
  dataset: FundDataset,
  filename: string = 'fund-data.xlsx',
): Promise<void> {
  const XLSX = await getXLSX();

  // Build header row
  const header = ['Date', ...dataset.funds];

  // Build data rows
  const rows: any[][] = dataset.data.map((point) => {
    const row: any[] = [point.date];
    dataset.funds.forEach((fund) => {
      const val = point[fund];
      row.push(typeof val === 'number' ? val : null);
    });
    return row;
  });

  const aoa = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    ...dataset.funds.map(() => ({ wch: 16 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fund Data');

  XLSX.writeFile(wb, filename);
}

/**
 * Export metrics data to XLSX.
 */
export async function exportMetricsToXLSX(
  metricsData: { fund: string; metrics: Record<string, string | number> }[],
  metricLabels: { key: string; label: string }[],
  filename: string = 'fund-metrics.xlsx',
): Promise<void> {
  const XLSX = await getXLSX();

  // Header
  const header = ['Fund', ...metricLabels.map(m => m.label)];

  // Data rows
  const rows: any[][] = metricsData.map(({ fund, metrics }) => {
    const row: any[] = [fund];
    metricLabels.forEach(({ key }) => {
      row.push(metrics[key] ?? '—');
    });
    return row;
  });

  const aoa = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    { wch: 20 },
    ...metricLabels.map(() => ({ wch: 16 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Metrics');

  XLSX.writeFile(wb, filename);
}
