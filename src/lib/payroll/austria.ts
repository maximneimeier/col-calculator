import {
  capped,
  roundMoney,
  type PayrollInput,
  type PayrollResult,
} from "./types";

const MAX_BASE = 6930;
const MAX_SZ = 13860;
const WERBUNGSKOSTEN = 132;
const SONDERAUSGABEN = 60;
const TRAFFIC_CREDIT = 496;
const EMPLOYEE_CREDIT = 421;

const employeeRates = {
  health: 0.0387,
  pension: 0.1025,
  unemployment: 0.0295,
  housing: 0.005,
};

const employerSvRates = {
  health: 0.0378,
  accident: 0.011,
  pension: 0.1255,
  unemployment: 0.0295,
  insolvency: 0.001,
  housing: 0.005,
};

const BV = 0.0153;
const PAYROLL_TAXES = 0.0708; // DB + DZ + Kommunalsteuer, typical

const TAX_BRACKETS = [
  { limit: 13539, rate: 0 },
  { limit: 21992, rate: 0.2 },
  { limit: 36458, rate: 0.3 },
  { limit: 70365, rate: 0.4 },
  { limit: 104859, rate: 0.48 },
  { limit: 1000000, rate: 0.5 },
  { limit: Infinity, rate: 0.55 },
];

function progressiveTax(income: number): number {
  let tax = 0;
  let previous = 0;
  for (const bracket of TAX_BRACKETS) {
    const taxable = Math.min(income, bracket.limit) - previous;
    if (taxable > 0) tax += taxable * bracket.rate;
    if (income <= bracket.limit) break;
    previous = bracket.limit;
  }
  return Math.max(tax, 0);
}

function employeeSvRate(vienna: boolean): number {
  return (
    employeeRates.health +
    employeeRates.pension +
    employeeRates.unemployment +
    employeeRates.housing +
    (vienna ? 0.0075 : 0.005)
  );
}

export function calculateAustria(input: PayrollInput): PayrollResult {
  const gross = input.grossMonthly;
  const vienna = input.region === "wien";
  const runningBase = capped(gross, MAX_BASE);
  const szGross = gross * 2;
  const szBase = capped(szGross, MAX_SZ);
  const svRate = employeeSvRate(vienna);
  const szSvRate =
    employeeRates.health +
    employeeRates.pension +
    employeeRates.unemployment +
    employeeRates.housing;

  const svRunning = roundMoney(runningBase * svRate);
  const svSzAnnual = roundMoney(szBase * szSvRate);
  const svMonthlyEquivalent = roundMoney(svRunning + svSzAnnual / 12);

  const annualRunning = gross * 12;
  const annualSvRunning = svRunning * 12;
  const taxable = Math.max(
    annualRunning - annualSvRunning - WERBUNGSKOSTEN - SONDERAUSGABEN,
    0
  );
  const annualTax = Math.max(
    progressiveTax(taxable) - TRAFFIC_CREDIT - EMPLOYEE_CREDIT,
    0
  );
  const szTax = roundMoney((szGross - svSzAnnual) * 0.06);
  const taxMonthly = roundMoney(annualTax / 12 + szTax / 12);

  const taxes = [{ id: "incomeTax", amount: taxMonthly }].filter(
    (line) => line.amount > 0
  );

  const employeeDeductions = [
    { id: "health", amount: roundMoney(runningBase * employeeRates.health + (szBase * employeeRates.health) / 12) },
    { id: "pension", amount: roundMoney(runningBase * employeeRates.pension + (szBase * employeeRates.pension) / 12) },
    { id: "unemployment", amount: roundMoney(runningBase * employeeRates.unemployment + (szBase * employeeRates.unemployment) / 12) },
    { id: "chamber", amount: roundMoney(runningBase * (vienna ? 0.0075 : 0.005)) },
    { id: "housingFund", amount: roundMoney(runningBase * employeeRates.housing + (szBase * employeeRates.housing) / 12) },
  ];

  const employerBv = roundMoney((runningBase + szBase / 12) * BV);
  const employerLevies = roundMoney((gross + szGross / 12) * PAYROLL_TAXES);

  const employerContributions = [
    { id: "pension", amount: roundMoney(runningBase * employerSvRates.pension + (szBase * employerSvRates.pension) / 12) },
    { id: "health", amount: roundMoney(runningBase * employerSvRates.health + (szBase * employerSvRates.health) / 12) },
    { id: "unemployment", amount: roundMoney(runningBase * employerSvRates.unemployment + (szBase * employerSvRates.unemployment) / 12) },
    { id: "accident", amount: roundMoney(runningBase * employerSvRates.accident) },
    { id: "severance", amount: employerBv },
    { id: "employerLevy", amount: employerLevies },
  ];

  const employeeTotal = svMonthlyEquivalent + taxMonthly;
  const employerTotal = employerContributions.reduce(
    (sum, line) => sum + line.amount,
    0
  );

  return {
    country: "AT",
    currency: "EUR",
    grossMonthly: roundMoney(gross),
    netMonthly: roundMoney(gross + szGross / 12 - employeeTotal),
    employerCostMonthly: roundMoney(gross + szGross / 12 + employerTotal),
    employeeDeductions,
    employerContributions,
    taxes,
  };
}
