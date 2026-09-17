import { roundMoney, type PayrollInput, type PayrollResult } from "./types";

export const swissCantons = [
  { id: "ZH", name: "Zürich", rate: 0.085 },
  { id: "BE", name: "Bern", rate: 0.12 },
  { id: "LU", name: "Luzern", rate: 0.1 },
  { id: "UR", name: "Uri", rate: 0.09 },
  { id: "SZ", name: "Schwyz", rate: 0.07 },
  { id: "OW", name: "Obwalden", rate: 0.08 },
  { id: "NW", name: "Nidwalden", rate: 0.075 },
  { id: "GL", name: "Glarus", rate: 0.1 },
  { id: "ZG", name: "Zug", rate: 0.06 },
  { id: "FR", name: "Freiburg", rate: 0.12 },
  { id: "SO", name: "Solothurn", rate: 0.11 },
  { id: "BS", name: "Basel-Stadt", rate: 0.13 },
  { id: "BL", name: "Basel-Landschaft", rate: 0.105 },
  { id: "SH", name: "Schaffhausen", rate: 0.105 },
  { id: "AR", name: "Appenzell Ausserrhoden", rate: 0.11 },
  { id: "AI", name: "Appenzell Innerrhoden", rate: 0.1 },
  { id: "SG", name: "St. Gallen", rate: 0.11 },
  { id: "GR", name: "Graubünden", rate: 0.1 },
  { id: "AG", name: "Aargau", rate: 0.1 },
  { id: "TG", name: "Thurgau", rate: 0.1 },
  { id: "TI", name: "Tessin", rate: 0.12 },
  { id: "VD", name: "Waadt", rate: 0.135 },
  { id: "VS", name: "Wallis", rate: 0.11 },
  { id: "NE", name: "Neuenburg", rate: 0.135 },
  { id: "GE", name: "Genf", rate: 0.145 },
  { id: "JU", name: "Jura", rate: 0.135 },
] as const;

const AHV = 0.053;
const ALV = 0.011;
const ALV_CAP_MONTHLY = 148200 / 12;
const ALV2 = 0.005;
const NBU = 0.013;
const BU = 0.007;
const FAK = 0.012;
const BVG = 0.07;

function swissFederalTax(income: number): number {
  const x = Math.floor(income / 100) * 100;
  if (x <= 15200) return 0;
  if (x >= 794000) {
    return 91310 + ((x - 794000) / 100) * 11.5;
  }

  const steps = [
    { from: 15200, base: 0, rate: 0.77 },
    { from: 33200, base: 138.6, rate: 0.88 },
    { from: 43500, base: 229.2, rate: 2.64 },
    { from: 58000, base: 612, rate: 2.97 },
    { from: 76200, base: 1152.5, rate: 5.94 },
    { from: 82100, base: 1502.95, rate: 6.6 },
    { from: 108900, base: 3271.75, rate: 8.8 },
    { from: 141500, base: 6140.55, rate: 11 },
    { from: 185100, base: 10936.55, rate: 13.2 },
  ];

  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (x >= step.from) {
      return step.base + ((x - step.from) / 100) * step.rate;
    }
  }

  return 0;
}

export function calculateSwitzerland(input: PayrollInput): PayrollResult {
  const gross = input.grossMonthly;
  const canton =
    swissCantons.find((item) => item.id === input.region) ?? swissCantons[0];

  const ahv = roundMoney(gross * AHV);
  const alvBase = Math.min(gross, ALV_CAP_MONTHLY);
  const alv = roundMoney(alvBase * ALV);
  const alvSolidarity =
    gross > ALV_CAP_MONTHLY ? roundMoney((gross - ALV_CAP_MONTHLY) * ALV2) : 0;
  const nbu = roundMoney(gross * NBU);
  const bvg = gross > 1845 ? roundMoney(gross * BVG) : 0;

  const employeeDeductions = [
    { id: "ahv", amount: ahv },
    { id: "alv", amount: roundMoney(alv + alvSolidarity) },
    { id: "nbu", amount: nbu },
    { id: "bvg", amount: bvg },
  ].filter((line) => line.amount > 0);

  const annualGross = gross * 12;
  const annualEmployeeSv =
    (ahv + alv + alvSolidarity + nbu + bvg) * 12;
  const professionalCosts = Math.min(Math.max(annualGross * 0.03, 2000), 4000);
  const taxable = Math.max(annualGross - annualEmployeeSv - professionalCosts, 0);
  const federal = swissFederalTax(taxable);
  const cantonal = taxable * canton.rate;

  const taxes = [
    { id: "federalTax", amount: roundMoney(federal / 12) },
    { id: "cantonalTax", amount: roundMoney(cantonal / 12) },
  ].filter((line) => line.amount > 0);

  const employerAhv = roundMoney(gross * AHV);
  const employerAlv = roundMoney(alvBase * ALV + (gross > ALV_CAP_MONTHLY ? (gross - ALV_CAP_MONTHLY) * ALV2 : 0));
  const employerBu = roundMoney(gross * BU);
  const employerFak = roundMoney(gross * FAK);
  const employerBvg = bvg;

  const employerContributions = [
    { id: "ahv", amount: employerAhv },
    { id: "alv", amount: employerAlv },
    { id: "accident", amount: employerBu },
    { id: "fak", amount: employerFak },
    { id: "bvg", amount: employerBvg },
  ].filter((line) => line.amount > 0);

  const employeeTotal =
    employeeDeductions.reduce((sum, line) => sum + line.amount, 0) +
    taxes.reduce((sum, line) => sum + line.amount, 0);

  return {
    country: "CH",
    currency: "CHF",
    grossMonthly: roundMoney(gross),
    netMonthly: roundMoney(gross - employeeTotal),
    employerCostMonthly: roundMoney(
      gross +
        employerAhv +
        employerAlv +
        employerBu +
        employerFak +
        employerBvg
    ),
    employeeDeductions,
    employerContributions,
    taxes,
  };
}
