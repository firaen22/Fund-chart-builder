
import { DataPoint, FundDataset, FundMetadata } from "../types";

export interface RawFundEntry {
  code: string;
  description: string;
  rawText: string;
}

/**
 * Normalizes a date string to YYYY-MM-DD for consistent key matching.
 */
const normalizeDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.trim();
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr.trim();
  }
};

/**
 * Parses a single-fund raw paste into objects.
 */
export const parseRawPastedData = (text: string): { date: string; value: number }[] => {
  const lines = text.trim().split(/\r?\n/);
  const result: { date: string; value: number }[] = [];

  for (const line of lines) {
    const parts = line.split(/[\t]| {2,}/).map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length < 2) continue;

    let foundDate = "";
    let foundValue: number | null = null;

    for (const part of parts) {
      const cleanNumStr = part.replace(/[$\u00A5\u20AC]/g, '').replace(/,/g, '');
      const num = parseFloat(cleanNumStr);
      
      if (!isNaN(num) && foundValue === null) {
        if (!/[\/ \-]/.test(part) && !/[a-zA-Z]/.test(part)) {
          foundValue = num;
        } else if (foundDate === "") {
          foundDate = normalizeDate(part);
        }
      } else if (foundDate === "") {
        foundDate = normalizeDate(part);
      }
    }

    if (foundDate && foundValue !== null) {
      result.push({ date: foundDate, value: foundValue });
    }
  }

  return result;
};

/**
 * Merges entries into a unified Master Timeline (Outer Join).
 */
export const mergeFundEntries = (entries: RawFundEntry[]): FundDataset => {
  const fundNames = entries.map(e => e.code);
  const metadata: Record<string, FundMetadata> = {};
  const masterDateMap: { [date: string]: DataPoint } = {};

  entries.forEach(entry => {
    metadata[entry.code] = { description: entry.description };
    const parsedData = parseRawPastedData(entry.rawText);
    parsedData.forEach(item => {
      if (!masterDateMap[item.date]) {
        masterDateMap[item.date] = { date: item.date };
        fundNames.forEach(name => { masterDateMap[item.date][name] = null; });
      }
      masterDateMap[item.date][entry.code] = item.value;
    });
  });

  const data = Object.values(masterDateMap).sort((a, b) => a.date.localeCompare(b.date));
  return { funds: fundNames, data, metadata };
};

/**
 * Forward Fill: Carries last known price forward.
 */
export const reconcileDataset = (dataset: FundDataset, strategy: 'forwardFill' | 'original' | 'intersect'): FundDataset => {
  if (strategy === 'original') return dataset;
  if (strategy === 'intersect') {
    return { ...dataset, data: dataset.data.filter(p => dataset.funds.every(f => typeof p[f] === 'number')) };
  }

  let newData = dataset.data.map(p => ({ ...p }));
  const lastKnown: { [fund: string]: number | null } = {};
  dataset.funds.forEach(f => lastKnown[f] = null);

  newData.forEach(point => {
    dataset.funds.forEach(fund => {
      const val = point[fund];
      if (typeof val === 'number') {
        lastKnown[fund] = val;
      } else if (lastKnown[fund] !== null) {
        point[fund] = lastKnown[fund];
        point[`_synthetic_${fund}`] = true;
      }
    });
  });

  newData = newData.filter(point => {
    return dataset.funds.every(fund => typeof point[fund] === 'number');
  });

  return { ...dataset, data: newData };
};
