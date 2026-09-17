import { calculateAustria } from "./austria";
import { calculateGermany } from "./germany";
import { calculateSwitzerland } from "./switzerland";
import {
  isPayrollCountry,
  type PayrollInput,
  type PayrollResult,
} from "./types";

export { isPayrollCountry } from "./types";
export { swissCantons } from "./switzerland";
export type {
  PayrollCountry,
  PayrollCurrency,
  PayrollInput,
  PayrollLine,
  PayrollResult,
} from "./types";

export function calculatePayroll(input: PayrollInput): PayrollResult | null {
  if (!Number.isFinite(input.grossMonthly) || input.grossMonthly <= 0) {
    return null;
  }

  if (input.country === "AT") return calculateAustria(input);
  if (input.country === "CH") return calculateSwitzerland(input);
  return calculateGermany(input);
}

export function payrollFromParams(params: {
  country?: string;
  gross?: number;
  church?: string;
  children?: string;
  region?: string;
}): PayrollResult | null {
  if (!isPayrollCountry(params.country) || !params.gross || params.gross <= 0) {
    return null;
  }

  return calculatePayroll({
    country: params.country,
    grossMonthly: params.gross,
    churchTax: params.church === "1",
    children: Number.parseInt(params.children ?? "0", 10) || 0,
    region: params.region,
  });
}
