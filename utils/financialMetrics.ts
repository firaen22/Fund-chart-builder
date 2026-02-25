import { DataPoint } from '../types';

export const inferFrequency = (dates: string[]): number => {
    if (dates.length < 2) return 252;
    const start = new Date(dates[0]).getTime();
    const end = new Date(dates[dates.length - 1]).getTime();
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    const avgDays = daysDiff / (dates.length - 1);

    if (avgDays > 20) return 12; // Monthly
    if (avgDays > 4) return 52;  // Weekly
    return 252;                  // Daily
};

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

export const calculateVolatility = (prices: number[], frequency: number = 252): number => {
    if (prices.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;

    // Weber compounding formula for annualizing volatility
    const varianceTerm = variance + Math.pow(1 + mean, 2);
    const annVariance = Math.pow(varianceTerm, frequency) - Math.pow(1 + mean, 2 * frequency);

    return annVariance > 0 ? Math.sqrt(annVariance) : 0;
};

export const calculateSharpeRatio = (prices: number[], riskFreeRate: number = 0, frequency: number = 252): number => {
    if (prices.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const meanDailyReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Utilize geometric annualization
    const annualizedReturn = Math.pow(1 + meanDailyReturn, frequency) - 1;
    const annualizedVol = calculateVolatility(prices, frequency);

    if (annualizedVol === 0) return 0;

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

export const calculateSortinoRatio = (prices: number[], riskFreeRate: number = 0, frequency: number = 252): number => {
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
    const annualizedReturn = Math.pow(1 + meanDailyReturn, frequency) - 1;
    const annualizedDownsideDev = downsideDeviation * Math.sqrt(frequency);

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

export const calculateAlpha = (fundPrices: number[], benchmarkPrices: number[], beta: number, riskFreeRate: number = 0, frequency: number = 252): number | undefined => {
    if (fundPrices.length < 2 || benchmarkPrices.length < 2 || fundPrices.length !== benchmarkPrices.length) return undefined;

    const calcAnnualized = (prices: number[]) => {
        const returns: number[] = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        const meanDaily = returns.reduce((a, b) => a + b, 0) / returns.length;
        return Math.pow(1 + meanDaily, frequency) - 1;
    };

    const fundAnn = calcAnnualized(fundPrices);
    const benchAnn = calcAnnualized(benchmarkPrices);

    return (fundAnn - riskFreeRate) - beta * (benchAnn - riskFreeRate);
};

export const calculateTrackingError = (fundPrices: number[], benchmarkPrices: number[], frequency: number = 252): number | undefined => {
    if (fundPrices.length < 2 || benchmarkPrices.length < 2 || fundPrices.length !== benchmarkPrices.length) return undefined;

    const diffReturns: number[] = [];
    for (let i = 1; i < fundPrices.length; i++) {
        const fReturn = (fundPrices[i] - fundPrices[i - 1]) / fundPrices[i - 1];
        const bReturn = (benchmarkPrices[i] - benchmarkPrices[i - 1]) / benchmarkPrices[i - 1];
        diffReturns.push(fReturn - bReturn);
    }

    const meanDiff = diffReturns.reduce((a, b) => a + b, 0) / diffReturns.length;
    const variance = diffReturns.reduce((a, b) => a + Math.pow(b - meanDiff, 2), 0) / diffReturns.length;

    return Math.sqrt(variance) * Math.sqrt(frequency);
};

export const calculateRSquared = (fundPrices: number[], benchmarkPrices: number[]): number | undefined => {
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
    let fundVariance = 0;
    let benchVariance = 0;

    for (let i = 0; i < fundReturns.length; i++) {
        const fDiff = fundReturns[i] - fundMean;
        const bDiff = benchReturns[i] - benchMean;
        covariance += fDiff * bDiff;
        fundVariance += Math.pow(fDiff, 2);
        benchVariance += Math.pow(bDiff, 2);
    }

    if (fundVariance === 0 || benchVariance === 0) return undefined;

    const correlation = covariance / Math.sqrt(fundVariance * benchVariance);
    return Math.pow(correlation, 2);
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
    trackingError?: number;
    rSquared?: number;
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

    const dates = filteredData.map(d => d.date);
    const frequency = inferFrequency(dates);

    // 2. Extract prices
    const prices = filteredData
        .map(d => d[fundName])
        .filter((val): val is number => typeof val === 'number');

    if (prices.length === 0) return null;

    let beta: number | undefined = undefined;
    let alpha: number | undefined = undefined;
    let trackingError: number | undefined = undefined;
    let rSquared: number | undefined = undefined;

    if (benchmarkName && benchmarkName !== fundName) {
        const benchPrices = filteredData
            .map(d => d[benchmarkName])
            .filter((val): val is number => typeof val === 'number');

        if (benchPrices.length === prices.length) {
            beta = calculateBeta(prices, benchPrices);
            if (beta !== undefined) {
                alpha = calculateAlpha(prices, benchPrices, beta, 0, frequency);
            }
            trackingError = calculateTrackingError(prices, benchPrices, frequency);
            rSquared = calculateRSquared(prices, benchPrices);
        }
    }

    return {
        cumulativeReturn: calculateCumulativeReturn(prices),
        maxDrawdown: calculateDrawdown(prices),
        volatility: calculateVolatility(prices, frequency),
        sharpeRatio: calculateSharpeRatio(prices, 0, frequency),
        sortinoRatio: calculateSortinoRatio(prices, 0, frequency),
        rsi: calculateRSI(prices),
        beta,
        alpha,
        trackingError,
        rSquared
    };
};
