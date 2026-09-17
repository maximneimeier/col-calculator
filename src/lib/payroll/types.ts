export const countries = ["DE", "AT", "CH"] as const;

export type PayrollCountry = (typeof countries)[number];

export type PayrollCurrency = "EUR" | "CHF";

export type PayrollLine = {
  id: string;
  amount: number;
};

export type PayrollInput = {
  country: PayrollCountry;
  grossMonthly: number;
  churchTax?: boolean;
  children?: number;
  region?: string;
};

export type PayrollResult = {
  country: PayrollCountry;
  currency: PayrollCurrency;
  grossMonthly: number;
  netMonthly: number;
  employerCostMonthly: number;
  employeeDeductions: PayrollLine[];
  employerContributions: PayrollLine[];
  taxes: PayrollLine[];
};

export function isPayrollCountry(
  value: string | undefined
): value is PayrollCountry {
  return value === "DE" || value === "AT" || value === "CH";
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function capped(amount: number, limit: number): number {
  return Math.min(Math.max(amount, 0), limit);
}

export function sumLines(lines: PayrollLine[]): number {
  return roundMoney(lines.reduce((total, line) => total + line.amount, 0));
}
