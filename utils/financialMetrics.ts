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

export const calculateSortinoRatio = (prices: number[], riskFreeRate: number = 0): number => {
    if (prices.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const meanDailyReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    const downsideReturns = returns.map(r => r < 0 ? r : 0);
    const downsideVariance = downsideReturns.reduce((a, b) => a + Math.pow(b, 2), 0) / returns.length;

    if (downsideVariance === 0) return 0; // handle zero downside variance edge case

    const downsideDeviation = Math.sqrt(downsideVariance);

    // Annualize
    const annualizedReturn = Math.pow(1 + meanDailyReturn, 252) - 1;
    const annualizedDownsideDev = downsideDeviation * Math.sqrt(252);

    return (annualizedReturn - riskFreeRate) / annualizedDownsideDev;
};

export const calculateBeta = (fundPrices: number[], benchmarkPrices: number[]): number | undefined => {
    if (fundPrices.length < 2 || benchmarkPrices.length < 2 || fundPrices.length !== benchmarkPrices.length) return undefined;

    const fundReturns: number[] = [];
    const benchReturns: number[] = [];
    for (let i = 1; i < fundPrices.length; i++) {
        fundReturns.push((fundPrices[i] - fundPrices[i - 1]) / fundPrices[i - 1]);
        benchReturns.push((benchmarkPrices[i] - benchmarkPrices[i - 1]) / benchmarkPrices[i - 1]);
    }

    const fundMean = fundReturns.reduce((a, b) => a + b, 0) / fundReturns.length;
    const benchMean = benchReturns.reduce((a, b) => a + b, 0) / benchReturns.length;

    let covariance = 0;
    let benchVariance = 0;

    for (let i = 0; i < fundReturns.length; i++) {
        covariance += (fundReturns[i] - fundMean) * (benchReturns[i] - benchMean);
        benchVariance += Math.pow(benchReturns[i] - benchMean, 2);
    }

    covariance /= fundReturns.length;
    benchVariance /= benchReturns.length;

    if (benchVariance === 0) return undefined;

    return covariance / benchVariance;
};

export const calculateAlpha = (fundPrices: number[], benchmarkPrices: number[], beta: number, riskFreeRate: number = 0): number | undefined => {
    if (fundPrices.length < 2 || benchmarkPrices.length < 2 || fundPrices.length !== benchmarkPrices.length) return undefined;

    const calcAnnualized = (prices: number[]) => {
        const returns: number[] = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        const meanDaily = returns.reduce((a, b) => a + b, 0) / returns.length;
        return Math.pow(1 + meanDaily, 252) - 1;
    };

    const fundAnn = calcAnnualized(fundPrices);
    const benchAnn = calcAnnualized(benchmarkPrices);

    return (fundAnn - riskFreeRate) - beta * (benchAnn - riskFreeRate);
};

export interface MetricResults {
    cumulativeReturn: number;
    maxDrawdown: number;
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
    rsi: number;
    beta?: number;
    alpha?: number;
}

export const calculateAllMetrics = (
    data: DataPoint[],
    fundName: string,
    startDate?: string,
    endDate?: string,
    benchmarkName?: string
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

    let beta: number | undefined = undefined;
    let alpha: number | undefined = undefined;

    if (benchmarkName && benchmarkName !== fundName) {
        const benchPrices = filteredData
            .map(d => d[benchmarkName])
            .filter((val): val is number => typeof val === 'number');

        if (benchPrices.length === prices.length) {
            beta = calculateBeta(prices, benchPrices);
            if (beta !== undefined) {
                alpha = calculateAlpha(prices, benchPrices, beta);
            }
        }
    }

    return {
        cumulativeReturn: calculateCumulativeReturn(prices),
        maxDrawdown: calculateDrawdown(prices),
        volatility: calculateVolatility(prices),
        sharpeRatio: calculateSharpeRatio(prices),
        sortinoRatio: calculateSortinoRatio(prices),
        rsi: calculateRSI(prices),
        beta,
        alpha
    };
};
