
export type Language = 'en' | 'cn';

export interface DataPoint {
  date: string;
  [key: string]: string | number | boolean | null;
}

export interface FundMetadata {
  description: string;
}

export interface FundDataset {
  data: DataPoint[];
  funds: string[]; // List of fund names identified in columns
  metadata?: Record<string, FundMetadata>;
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface AnalysisMetrics {
  cumulativeReturn: string;
  volatility: string;
  maxDrawdown: string;
  sharpeRatio: string;
  trackingError?: string;
  rSquared?: string;
}

export interface FundAnalysis {
  [fundName: string]: AnalysisMetrics;
}

export interface PortfolioSummary {
  totalAum: number;
  portfolioYield: number;
  maxDrawdown: number;
  trackingError?: number;
  rSquared?: number;
  activeShare?: number;
}
