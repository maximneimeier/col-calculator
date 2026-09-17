import {
  capped,
  roundMoney,
  type PayrollInput,
  type PayrollResult,
} from "./types";

const BBG_RV_AV = 8450;
const BBG_KV_PV = 5812.5;
const KV_GENERAL = 0.146;
const KV_EXTRA = 0.029;
const RV = 0.186;
const AV = 0.026;
const PV_BASE = 0.036;
const PV_CHILDLESS_EXTRA = 0.006;
const WERBUNGSKOSTEN = 1230;
const SONDERAUSGABEN = 36;
const SOLI_RATE = 0.055;
const SOLI_FREE = 20350;
const SOLI_CAP = 0.119;
const CHURCH_RATE = 0.09;
const EMPLOYER_LEVIES = 0.031;

function incomeTax2026(zve: number): number {
  const x = Math.floor(Math.max(zve, 0));
  if (x <= 12348) return 0;
  if (x <= 17799) {
    const y = (x - 12348) / 10000;
    return Math.floor((914.51 * y + 1400) * y);
  }
  if (x <= 69878) {
    const z = (x - 17799) / 10000;
    return Math.floor((173.1 * z + 2397) * z + 1034.87);
  }
  if (x <= 277825) return Math.floor(0.42 * x - 11135.63);
  return Math.floor(0.45 * x - 19470.38);
}

function solidaritySurcharge(incomeTax: number): number {
  if (incomeTax <= SOLI_FREE) return 0;
  return roundMoney(Math.min(incomeTax * SOLI_RATE, (incomeTax - SOLI_FREE) * SOLI_CAP));
}

export function calculateGermany(input: PayrollInput): PayrollResult {
  const gross = input.grossMonthly;
  const children = input.children ?? 0;
  const rvBase = capped(gross, BBG_RV_AV);
  const kvBase = capped(gross, BBG_KV_PV);
  const employeePvRate = PV_BASE / 2 + (children > 0 ? 0 : PV_CHILDLESS_EXTRA);

  const pension = roundMoney(rvBase * (RV / 2));
  const unemployment = roundMoney(rvBase * (AV / 2));
  const health = roundMoney(kvBase * (KV_GENERAL / 2 + KV_EXTRA / 2));
  const care = roundMoney(kvBase * employeePvRate);

  const employeeDeductions = [
    { id: "pension", amount: pension },
    { id: "unemployment", amount: unemployment },
    { id: "health", amount: health },
    { id: "care", amount: care },
  ];

  const annualGross = gross * 12;
  const annualSv = (pension + unemployment + health + care) * 12;
  const zve = Math.max(annualGross - annualSv - WERBUNGSKOSTEN - SONDERAUSGABEN, 0);
  const annualTax = incomeTax2026(zve);
  const annualSoli = solidaritySurcharge(annualTax);
  const annualChurch = input.churchTax ? roundMoney(annualTax * CHURCH_RATE) : 0;

  const taxes = [
    { id: "incomeTax", amount: roundMoney(annualTax / 12) },
    { id: "soli", amount: roundMoney(annualSoli / 12) },
    ...(annualChurch > 0
      ? [{ id: "church", amount: roundMoney(annualChurch / 12) }]
      : []),
  ].filter((line) => line.amount > 0);

  const employerPension = roundMoney(rvBase * (RV / 2));
  const employerUnemployment = roundMoney(rvBase * (AV / 2));
  const employerHealth = roundMoney(kvBase * (KV_GENERAL / 2 + KV_EXTRA / 2));
  const employerCare = roundMoney(kvBase * (PV_BASE / 2));
  const levies = roundMoney(gross * EMPLOYER_LEVIES);

  const employerContributions = [
    { id: "pension", amount: employerPension },
    { id: "unemployment", amount: employerUnemployment },
    { id: "health", amount: employerHealth },
    { id: "care", amount: employerCare },
    { id: "levies", amount: levies },
  ];

  const employeeTotal =
    pension +
    unemployment +
    health +
    care +
    taxes.reduce((sum, line) => sum + line.amount, 0);

  return {
    country: "DE",
    currency: "EUR",
    grossMonthly: roundMoney(gross),
    netMonthly: roundMoney(gross - employeeTotal),
    employerCostMonthly: roundMoney(
      gross +
        employerPension +
        employerUnemployment +
        employerHealth +
        employerCare +
        levies
    ),
    employeeDeductions,
    employerContributions,
    taxes,
  };
}
