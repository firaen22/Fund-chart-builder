import { DataPoint } from '../types';

export const calculateCumulativeReturn = (prices: number[]): number => {
    if (prices.length < 2) return 0;
    const start = prices[0];
    const end = prices[prices.length - 1];
    return (end - start) / start;
};

export const calculateDrawdown = (prices: number[]): number => {
    let maxPrice = -Infinity;
    let maxDrawdown = 0;

    for (const price of prices) {
        if (price > maxPrice) {
            maxPrice = price;
        }
        const drawdown = (price - maxPrice) / maxPrice;
        if (drawdown < maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }
    return maxDrawdown; // Returns a negative number (e.g. -0.20 for 20% drop)
};

export const calculateVolatility = (prices: number[]): number => {
    if (prices.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Annualize (assuming daily data, 252 trading days)
    return stdDev * Math.sqrt(252);
};

export const calculateSharpeRatio = (prices: number[], riskFreeRate: number = 0): number => {
    if (prices.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const meanDailyReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - meanDailyReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Annualize
    const annualizedReturn = Math.pow(1 + meanDailyReturn, 252) - 1;
    const annualizedVol = stdDev * Math.sqrt(252);

    return (annualizedReturn - riskFreeRate) / annualizedVol;
};

export const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length <= period) return 0;

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (change >= 0) {
            gains.push(change);
            losses.push(0);
        } else {
            gains.push(0);
            losses.push(Math.abs(change));
        }
    }

    // Calculate initial average
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Smooth
    for (let i = period; i < prices.length - 1; i++) {
        const currentGain = gains[i];
        const currentLoss = losses[i];

        avgGain = ((avgGain * (period - 1)) + currentGain) / period;
        avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
    }

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

export interface MetricResults {
    cumulativeReturn: number;
    maxDrawdown: number;
    volatility: number;
    sharpeRatio: number;
    rsi: number;
}

export const calculateAllMetrics = (
    data: DataPoint[],
    fundName: string,
    startDate?: string,
    endDate?: string
): MetricResults | null => {
    // 1. Filter by date
    let filteredData = data;
    if (startDate && endDate) {
        filteredData = data.filter(d => d.date >= startDate && d.date <= endDate);
    }

    // 2. Extract prices
    const prices = filteredData
        .map(d => d[fundName])
        .filter((val): val is number => typeof val === 'number');

    if (prices.length === 0) return null;

    return {
        cumulativeReturn: calculateCumulativeReturn(prices),
        maxDrawdown: calculateDrawdown(prices),
        volatility: calculateVolatility(prices),
        sharpeRatio: calculateSharpeRatio(prices),
        rsi: calculateRSI(prices)
    };
};
