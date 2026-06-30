export type Platform = string;

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD format for easy sorting
  amount: number;
  platform: Platform;
  firstName?: string;
  lastName?: string;
  phone?: string;
  nights?: number;
  clientAmount?: number;
  commission?: number;
  bankFee?: number;
  isValidated?: boolean;
  rating?: number; // 1 to 5 stars
  validationComment?: string;
  adults?: number;
  children?: number;
  comments?: string;
}

export interface HouseCost {
  id: string;
  name: string;
  amount: number;
}

export interface YearlyTaxRates {
  csgRate: number;
  taxRate: number;
  abattementRate: number;
  chargeParNuit: number;
  chargeFonciere: number;
}

export interface Settings {
  yearlyTaxes: Record<string, YearlyTaxRates>;
  platforms: Platform[];
  platformColors: Record<string, string>;
  platformFees?: Record<string, { percentage: number; active: boolean }>;
  platformExcludeFiscal?: Record<string, boolean>;
  houseCosts: HouseCost[];
  // Deprecated flat settings for migration
  csgRate?: number;
  taxRate?: number;
  abattementRate?: number;
  chargeParNuit?: number;
  chargeFonciere?: number;
}

export interface AppState {
  transactions: Transaction[];
  settings: Settings;
}
