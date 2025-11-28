export interface BankRecord {
  account_no: string;
  settlement_date: string;
  transaction_date: string;
  time: string;
  invoice_number: string;
  product: string;
  liter: number;
  price: number;
  amount_before_vat: number;
  vat: number;
  total_amount: number;
  fuel_brand: string;
  original_row: any; // Keep original for reference
}

export interface BookRecord {
  document_no: string;
  posting_date: string;
  description: string;
  amount: number;
  original_row: any;
}

export enum MatchStatus {
  MATCHED = 'MATCHED',
  VARIANCE = 'VARIANCE', // Matched by ID but amount differs
  POTENTIAL_MATCH = 'POTENTIAL_MATCH', // AI Suggested Match (New)
  UNMATCHED_BANK = 'UNMATCHED_BANK', // Exists in Bank only
  UNMATCHED_BOOK = 'UNMATCHED_BOOK', // Exists in Book only
}

export interface ReconciledItem {
  id: string;
  status: MatchStatus;
  bankRecord?: BankRecord;
  bookRecord?: BookRecord;
  varianceAmount?: number;
  notes?: string;
  // AI Fields
  suggestion?: string;
  confidence?: 'High' | 'Medium' | 'Low';
  errorType?: 'TRANSPOSITION' | 'ROUNDING' | 'KEYING' | 'TYPO' | 'MISSING' | 'UNKNOWN';
}

export interface ReconciliationStats {
  totalBank: number;
  totalBook: number;
  totalBankAmount: number;
  totalBookAmount: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedBookCount: number;
  varianceCount: number;
  potentialMatchCount: number; // New
}

export interface AnalysisInsight {
  type: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  description: string;
}

export interface AnalysisReport {
  summary: string;
  insights: AnalysisInsight[];
  recommendations: string[];
  errorDistribution: { name: string; value: number }[];
}

export interface ReconcileResult {
  items: ReconciledItem[];
  stats: ReconciliationStats;
  report: AnalysisReport;
}