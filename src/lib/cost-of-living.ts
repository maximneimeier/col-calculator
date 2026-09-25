import { numberLocale, type Locale } from "@/lib/i18n";

export const raiseIntervals = [1, 2, 3] as const;
export type RaiseInterval = (typeof raiseIntervals)[number];

export type CalculationInput = {
  monthlyIncome: number;
  grossMonthly?: number;
  extraMonthlyNet?: number;
  extraMonthlyGross?: number;
  coldRent: number;
  utilities: number;
  groceries: number;
  mobility: number;
  insurance: number;
  telecom: number;
  raisePercent?: number;
  raiseEveryYears?: RaiseInterval;
};

export type SalaryRaiseProjection = {
  percent: number;
  everyYears: RaiseInterval;
  annualizedPercent: number;
  nextNetMonthly: number;
  extraNetMonthly: number;
  extraNetPerYear: number;
  nextRemaining: number;
};

export type CostSegment = {
  id: string;
  label: string;
  amount: number;
  color: string;
};

export type CalculationResult = {
  monthlyIncome: number;
  grossMonthly?: number;
  salaryMonthlyNet: number;
  salaryMonthlyGross?: number;
  extraMonthlyNet: number;
  extraMonthlyGross: number;
  totalCosts: number;
  remaining: number;
  segments: CostSegment[];
  raise?: SalaryRaiseProjection;
};

function isValidInput(input: CalculationInput): boolean {
  return (
    input.monthlyIncome > 0 &&
    input.coldRent >= 0 &&
    input.utilities >= 0 &&
    input.groceries >= 0 &&
    input.mobility >= 0 &&
    input.insurance >= 0 &&
    input.telecom >= 0
  );
}

export function calculateCostOfLiving(
  input: CalculationInput
): CalculationResult | null {
  if (!isValidInput(input)) return null;

  const costItems = [
    {
      id: "cold-rent",
      label: "Kaltmiete",
      amount: input.coldRent,
      color: "#266df0",
    },
    {
      id: "utilities",
      label: "Mietnebenkosten",
      amount: input.utilities,
      color: "#5c8ef7",
    },
    {
      id: "groceries",
      label: "Lebensmittel",
      amount: input.groceries,
      color: "#6366f1",
    },
    {
      id: "mobility",
      label: "Mobilität",
      amount: input.mobility,
      color: "#f59e0b",
    },
    {
      id: "insurance",
      label: "Versicherungen",
      amount: input.insurance,
      color: "#ec4899",
    },
    {
      id: "telecom",
      label: "Telekommunikation",
      amount: input.telecom,
      color: "#14b8a6",
    },
  ];

  const extraMonthlyNet = Math.max(0, input.extraMonthlyNet ?? 0);
  const extraMonthlyGross = Math.max(0, input.extraMonthlyGross ?? 0);
  const salaryMonthlyNet = input.monthlyIncome;
  const totalMonthlyNet = salaryMonthlyNet + extraMonthlyNet;
  const salaryMonthlyGross =
    Number.isFinite(input.grossMonthly) && (input.grossMonthly ?? 0) > 0
      ? input.grossMonthly
      : undefined;
  const totalMonthlyGross =
    (salaryMonthlyGross ?? salaryMonthlyNet) + extraMonthlyGross;

  const totalCosts = costItems.reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalMonthlyNet - totalCosts;

  const segments: CostSegment[] = [
    ...costItems.filter((item) => item.amount > 0),
    {
      id: "remaining",
      label: "Übrig",
      amount: Math.max(0, remaining),
      color: "#22c55e",
    },
  ].filter((segment) => segment.amount > 0);

  return {
    monthlyIncome: totalMonthlyNet,
    grossMonthly: totalMonthlyGross > 0 ? totalMonthlyGross : undefined,
    salaryMonthlyNet,
    salaryMonthlyGross,
    extraMonthlyNet,
    extraMonthlyGross,
    totalCosts,
    remaining,
    segments,
    raise: (() => {
      const raise = projectSalaryRaise(
        salaryMonthlyNet,
        remaining,
        input.raisePercent,
        input.raiseEveryYears
      );
      if (!raise || extraMonthlyNet <= 0) return raise;
      return {
        ...raise,
        nextNetMonthly: raise.nextNetMonthly + extraMonthlyNet,
      };
    })(),
  };
}

export const extraIncomeKinds = [1, 2, 3, 4, 5, 6, 7] as const;
export type ExtraIncomeKind = (typeof extraIncomeKinds)[number];
export const CAPITAL_GAINS_TAX_RATE = 25;

export type ExtraIncomeRow = {
  id: string;
  kind: ExtraIncomeKind;
  amount: string;
};

export function isExtraIncomeKind(value: number): value is ExtraIncomeKind {
  return extraIncomeKinds.includes(value as ExtraIncomeKind);
}

export function extraIncomeTaxRate(
  kind: ExtraIncomeKind,
  personalRate: number
): number {
  return kind === 5 ? CAPITAL_GAINS_TAX_RATE : personalRate;
}

function asParamList(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseExtraIncomeRows(
  types?: string | string[],
  amounts?: string | string[]
): ExtraIncomeRow[] {
  const kinds = asParamList(types);
  const values = asParamList(amounts);
  const length = Math.min(kinds.length, values.length);
  const rows: ExtraIncomeRow[] = [];

  for (let index = 0; index < length; index += 1) {
    const kind = Number(kinds[index]);
    if (!isExtraIncomeKind(kind)) continue;
    rows.push({
      id: `extra-${index}-${kind}`,
      kind,
      amount: values[index] ?? "",
    });
  }

  return rows;
}

export function resolvePersonalTaxRate(params: {
  taxRate?: string;
  gross?: string;
  income?: string;
}): number {
  const parsed = parseAmount(params.taxRate);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) return parsed;

  const gross = parseAmount(params.gross);
  const net = parseAmount(params.income);
  if (gross > 0 && Number.isFinite(net) && net >= 0 && net <= gross) {
    return Math.round((1 - net / gross) * 1000) / 10;
  }

  return 0;
}

export function extraIncomeMonthlyTotals(
  rows: ExtraIncomeRow[],
  period: SalaryPeriod,
  personalRate: number
): { gross: number; net: number } {
  const rate = Number.isFinite(personalRate) && personalRate >= 0 && personalRate <= 100
    ? personalRate
    : 0;

  return rows.reduce(
    (totals, row) => {
      const monthlyGross = toMonthlyAmount(parseAmount(row.amount), period);
      if (!Number.isFinite(monthlyGross) || monthlyGross <= 0) return totals;
      const net = netFromTaxRate(
        monthlyGross,
        extraIncomeTaxRate(row.kind, rate)
      );
      return {
        gross: totals.gross + monthlyGross,
        net: totals.net + (net ?? 0),
      };
    },
    { gross: 0, net: 0 }
  );
}

export function parseRaiseInterval(value: string | undefined): RaiseInterval {
  if (value === "2" || value === "3") return Number(value) as RaiseInterval;
  return 1;
}

export function projectSalaryRaise(
  monthlyNet: number,
  remaining: number,
  percent: number | undefined,
  everyYears: RaiseInterval | undefined
): SalaryRaiseProjection | undefined {
  if (!Number.isFinite(monthlyNet) || monthlyNet <= 0) return undefined;
  if (
    percent == null ||
    !Number.isFinite(percent) ||
    percent <= 0 ||
    percent > 100
  ) {
    return undefined;
  }

  const interval: RaiseInterval =
    everyYears === 2 || everyYears === 3 ? everyYears : 1;
  const factor = 1 + percent / 100;
  const annualizedPercent = (factor ** (1 / interval) - 1) * 100;
  const nextNetMonthly = Math.round(monthlyNet * factor);
  const extraNetMonthly = nextNetMonthly - Math.round(monthlyNet);
  const extraNetPerYear = Math.round(
    monthlyNet * 12 * (annualizedPercent / 100)
  );

  return {
    percent,
    everyYears: interval,
    annualizedPercent,
    nextNetMonthly,
    extraNetMonthly,
    extraNetPerYear,
    nextRemaining: remaining + extraNetMonthly,
  };
}

export const MIN_HORIZON = 3;
export const MAX_HORIZON = 100;
export const DEFAULT_HORIZON = 10;

export const DEFAULT_INFLATION = 2;
export const DEFAULT_MARKET_RETURN = 8;
export const DEFAULT_PROPERTY_RETURN = 5;
export const DEFAULT_CASH_RETURN = 2;
export const DEFAULT_RENTAL_YIELD = 2.5;

export function parseRate(
  value: string | undefined,
  fallback: number
): number {
  const parsed = parseAmount(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return fallback;
  return parsed;
}

export type SalaryPeriod = "month" | "year";

export function parseSalaryPeriod(value: string | undefined): SalaryPeriod {
  return value === "year" ? "year" : "month";
}

export function toMonthlyAmount(
  value: number,
  period: SalaryPeriod
): number {
  if (!Number.isFinite(value)) return value;
  return period === "year" ? Math.round(value / 12) : value;
}

export function convertSalaryPeriod(
  value: string | undefined,
  from: SalaryPeriod,
  to: SalaryPeriod,
  locale: Locale
): string {
  if (from === to) return formatAmountInput(value, locale);
  const num = parseAmount(value);
  if (!Number.isFinite(num)) return value ?? "";
  const next = to === "year" ? num * 12 : num / 12;
  return formatAmountInput(String(Math.round(next)), locale);
}

export type SalaryYearPoint = {
  yearOffset: number;
  calendarYear: number;
  gross: number;
  net: number;
};

export function parseHorizon(value: string | undefined): number {
  const parsed = Math.round(parseAmount(value));
  if (!Number.isFinite(parsed)) return DEFAULT_HORIZON;
  return Math.min(MAX_HORIZON, Math.max(MIN_HORIZON, parsed));
}

export function projectSalaryPath(params: {
  monthlyNet: number;
  monthlyGross?: number;
  raisePercent?: number;
  raiseEveryYears?: RaiseInterval;
  horizon: number;
  startYear?: number;
}): SalaryYearPoint[] {
  const horizon = parseHorizon(String(params.horizon));
  const net0 = params.monthlyNet;
  const gross0 =
    Number.isFinite(params.monthlyGross) && (params.monthlyGross ?? 0) > net0
      ? (params.monthlyGross as number)
      : net0;
  const percent =
    Number.isFinite(params.raisePercent) &&
    (params.raisePercent ?? 0) > 0 &&
    (params.raisePercent ?? 0) <= 100
      ? (params.raisePercent as number)
      : 0;
  const every: RaiseInterval =
    params.raiseEveryYears === 2 || params.raiseEveryYears === 3
      ? params.raiseEveryYears
      : 1;
  const startYear = params.startYear ?? new Date().getFullYear();

  return Array.from({ length: horizon }, (_, year) => {
    const raises = percent > 0 ? Math.floor(year / every) : 0;
    const factor = (1 + percent / 100) ** raises;
    return {
      yearOffset: year,
      calendarYear: startYear + year,
      gross: Math.round(gross0 * factor),
      net: Math.round(net0 * factor),
    };
  });
}

export const savingsRateKinds = ["market", "property", "cash", "rental"] as const;
export type SavingsRateKind = (typeof savingsRateKinds)[number];

export function parseSavingsRateKind(value: string | undefined): SavingsRateKind {
  if (value === "property" || value === "cash" || value === "rental") return value;
  return "market";
}

export function resolveSavingsRate(
  kind: SavingsRateKind,
  rates: {
    marketReturn: number;
    propertyReturn: number;
    cashReturn: number;
    rentalYield: number;
  }
): number {
  if (kind === "property") return rates.propertyReturn;
  if (kind === "cash") return rates.cashReturn;
  if (kind === "rental") return rates.rentalYield;
  return rates.marketReturn;
}

export type WealthYearPoint = {
  yearOffset: number;
  calendarYear: number;
  wealth: number;
  contribution: number;
  cumulativeContribution: number;
};

export function projectWealthPath(params: {
  leftoverMonthlyByYear: number[];
  annualRate: number;
  startYear?: number;
}): WealthYearPoint[] {
  const rate =
    Number.isFinite(params.annualRate) && params.annualRate > -100
      ? params.annualRate / 100
      : 0;
  const startYear = params.startYear ?? new Date().getFullYear();
  let wealth = 0;
  let cumulativeContribution = 0;

  return params.leftoverMonthlyByYear.map((leftover, year) => {
    const contribution =
      Number.isFinite(leftover) && leftover > 0 ? Math.round(leftover * 12) : 0;
    cumulativeContribution += contribution;
    wealth = Math.round((wealth + contribution) * (1 + rate));
    return {
      yearOffset: year,
      calendarYear: startYear + year,
      wealth,
      contribution,
      cumulativeContribution,
    };
  });
}

export function adjustWealthPathForInflation(
  points: WealthYearPoint[],
  inflationPercent: number
): WealthYearPoint[] {
  const inflation =
    Number.isFinite(inflationPercent) && inflationPercent > 0
      ? inflationPercent
      : 0;
  if (inflation === 0) return points;

  return points.map((point) => {
    const divisor = (1 + inflation / 100) ** point.yearOffset;
    return {
      ...point,
      wealth: Math.round(point.wealth / divisor),
      contribution: Math.round(point.contribution / divisor),
      cumulativeContribution: Math.round(point.cumulativeContribution / divisor),
    };
  });
}

export function adjustSalaryPathForInflation(
  points: SalaryYearPoint[],
  inflationPercent: number
): SalaryYearPoint[] {
  const rate =
    Number.isFinite(inflationPercent) && inflationPercent > 0
      ? inflationPercent
      : 0;
  if (rate === 0) return points;

  return points.map((point) => {
    const divisor = (1 + rate / 100) ** point.yearOffset;
    return {
      ...point,
      gross: Math.round(point.gross / divisor),
      net: Math.round(point.net / divisor),
    };
  });
}

export function formatCurrency(
  amount: number,
  locale: Locale = "de",
  currency: "EUR" | "CHF" = "EUR"
): string {
  const numberLoc =
    currency === "CHF"
      ? locale === "en"
        ? "en-CH"
        : "de-CH"
      : numberLocale(locale);

  return new Intl.NumberFormat(numberLoc, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function formatRaisePercent(value: number, locale: Locale = "de"): string {
  return `${new Intl.NumberFormat(numberLocale(locale), {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value)} %`;
}

export function netFromTaxRate(
  gross: number,
  taxRatePercent: number
): number | null {
  if (!Number.isFinite(gross) || gross <= 0) return null;
  if (
    !Number.isFinite(taxRatePercent) ||
    taxRatePercent < 0 ||
    taxRatePercent > 100
  ) {
    return null;
  }

  return Math.round(gross * (1 - taxRatePercent / 100));
}

export function resolveNetIncome(params: {
  gross?: string;
  taxRate?: string;
  income?: string;
  salaryMode?: string;
}): string {
  if (params.salaryMode !== "net") {
    const computed = netFromTaxRate(
      parseAmount(params.gross),
      parseAmount(params.taxRate)
    );
    if (computed != null) return String(computed);
  }

  return params.income ?? "";
}

export function parseAmount(value: string | undefined): number {
  if (!value) return NaN;
  const trimmed = value.trim();
  if (!trimmed) return NaN;

  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");

  if (hasComma && hasDot) {
    if (trimmed.lastIndexOf(",") > trimmed.lastIndexOf(".")) {
      return parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
    }
    return parseFloat(trimmed.replace(/,/g, ""));
  }

  if (hasComma) {
    const parts = trimmed.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(`${parts[0].replace(/\s/g, "")}.${parts[1]}`);
    }
    return parseFloat(trimmed.replace(/,/g, ""));
  }

  if (hasDot) {
    const parts = trimmed.split(".");
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(trimmed);
    }
    return parseFloat(trimmed.replace(/\./g, ""));
  }

  return parseFloat(trimmed);
}

export function formatAmountInput(
  value: string | undefined,
  locale: Locale = "de"
): string {
  if (!value?.trim()) return "";
  const num = parseAmount(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
