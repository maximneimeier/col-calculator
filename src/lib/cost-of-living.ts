export type CalculationInput = {
  monthlyIncome: number;
  coldRent: number;
  utilities: number;
  groceries: number;
  mobility: number;
  insurance: number;
  telecom: number;
};

export type CostSegment = {
  id: string;
  label: string;
  amount: number;
  color: string;
};

export type CalculationResult = {
  monthlyIncome: number;
  totalCosts: number;
  remaining: number;
  segments: CostSegment[];
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
    totalCosts,
    remaining,
    segments,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function parseAmount(value: string | undefined): number {
  if (!value) return NaN;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized);
}

export function formatAmountInput(value: string | undefined): string {
  if (!value?.trim()) return "";
  const num = parseAmount(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
