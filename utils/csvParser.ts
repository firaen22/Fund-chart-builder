import { FundDataset, DataPoint } from "../types";

export const parseCSV = (csvText: string): FundDataset => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row.");
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const funds = headers.slice(1); // Assume col 0 is Date, rest are funds
  
  const data: DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const date = values[0];

    // Basic date validation
    if (!date) continue;

    const point: DataPoint = { date };

    funds.forEach((fund, index) => {
      // values[index + 1] corresponds to the fund because index 0 of values is date
      const valStr = values[index + 1];
      const val = parseFloat(valStr);
      
      // If value is missing (empty string, undefined, or not a number), set to null.
      const isMissing = !valStr || valStr.trim() === '' || isNaN(val);
      point[fund] = isMissing ? null : val;
    });

    data.push(point);
  }

  // Sort by date to ensure time-series linearity even if CSV is unsorted
  data.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
  });

  return { funds, data };
};

export const normalizeDataset = (dataset: FundDataset): FundDataset => {
  // Create a deep copy of the data to avoid mutating the original dataset
  const newData = dataset.data.map(point => ({ ...point }));
  
  dataset.funds.forEach(fund => {
    // Find the first valid numerical value for this fund
    let startValue: number | null = null;
    
    for (const point of newData) {
      const val = point[fund];
      if (typeof val === 'number') {
        startValue = val;
        break;
      }
    }

    // Rebase if we found a valid start value
    if (startValue !== null && startValue !== 0) {
      for (const point of newData) {
        const val = point[fund];
        if (typeof val === 'number') {
          // Calculate rebased value: (Current / Start) * 100
          point[fund] = Number(((val / startValue) * 100).toFixed(2));
        }
      }
    }
  });

  return {
    funds: dataset.funds,
    data: newData
  };
};

export const generateDemoData = (): string => {
  return `Date,Growth Fund A,Balanced Fund B
2023-01-01,100.00,100.00
2023-01-02,101.50,
2023-01-03,101.20,100.40
2023-01-04,,100.60
2023-01-05,102.50,100.50
2023-01-06,105.00,100.90
2023-01-07,104.20,101.00
2023-01-08,106.10,101.20
2023-01-09,103.50,101.10
2023-01-10,107.00,101.50
2023-01-11,108.50,101.80
2023-01-12,106.00,101.60
2023-01-13,109.00,102.00
2023-01-14,110.50,102.30`;
};