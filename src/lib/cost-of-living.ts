import { numberLocale, type Locale } from "@/lib/i18n";

export const raiseIntervals = [1, 2, 3] as const;
export type RaiseInterval = (typeof raiseIntervals)[number];

export type CalculationInput = {
  monthlyIncome: number;
  grossMonthly?: number;
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

  const totalCosts = costItems.reduce((sum, item) => sum + item.amount, 0);
  const remaining = input.monthlyIncome - totalCosts;

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
    monthlyIncome: input.monthlyIncome,
    grossMonthly:
      Number.isFinite(input.grossMonthly) && (input.grossMonthly ?? 0) > 0
        ? input.grossMonthly
        : undefined,
    totalCosts,
    remaining,
    segments,
    raise: projectSalaryRaise(
      input.monthlyIncome,
      remaining,
      input.raisePercent,
      input.raiseEveryYears
    ),
  };
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
export const MAX_HORIZON = 20;
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
