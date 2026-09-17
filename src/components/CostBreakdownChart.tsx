import { formatCurrency, formatRaisePercent, type CalculationResult } from "@/lib/cost-of-living";
import { getDictionary, numberLocale, type Locale } from "@/lib/i18n";
import type { PayrollCurrency } from "@/lib/payroll";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 340;
const PLOT_LEFT = 72;
const PLOT_RIGHT = 622;
const PLOT_TOP = 28;
const PLOT_BOTTOM = 248;

type WaterfallBar = {
  id: string;
  label: string;
  amount: number;
  base: number;
  top: number;
  color: string;
  kind: "start" | "step" | "end";
};

function buildWaterfallBars(
  result: CalculationResult,
  locale: Locale
): WaterfallBar[] {
  const t = getDictionary(locale);
  const costs = result.segments.filter((segment) => segment.id !== "remaining");
  const gross = result.grossMonthly;
  const net = result.monthlyIncome;
  const showGross = typeof gross === "number" && gross > net;
  const bars: WaterfallBar[] = [];

  if (showGross) {
    bars.push({
      id: "gross",
      label: t.chart.gross,
      amount: gross,
      base: 0,
      top: gross,
      color: "var(--foreground)",
      kind: "start",
    });
    bars.push({
      id: "tax",
      label: t.chart.tax,
      amount: -(gross - net),
      base: net,
      top: gross,
      color: "#64748b",
      kind: "step",
    });
  } else {
    bars.push({
      id: "net",
      label: t.chart.net,
      amount: net,
      base: 0,
      top: net,
      color: "var(--foreground)",
      kind: "start",
    });
  }

  let level = net;
  for (const cost of costs) {
    bars.push({
      id: cost.id,
      label: t.segments[cost.id as keyof typeof t.segments] ?? cost.label,
      amount: -cost.amount,
      base: level - cost.amount,
      top: level,
      color: cost.color,
      kind: "step",
    });
    level -= cost.amount;
  }

  bars.push({
    id: "remaining",
    label: t.segments.remaining,
    amount: result.remaining,
    base: Math.min(0, result.remaining),
    top: Math.max(0, result.remaining),
    color: result.remaining >= 0 ? "#22c55e" : "#ef4444",
    kind: "end",
  });

  return bars;
}

function axisTicks(min: number, max: number): number[] {
  const span = max - min || 1;
  const raw = span / 3;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const residual = raw / magnitude;
  const step =
    residual >= 5 ? 5 * magnitude : residual >= 2 ? 2 * magnitude : magnitude;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];

  for (let value = start; value <= max + step / 2; value += step) {
    ticks.push(Math.round(value));
  }

  if (min <= 0 && max >= 0 && !ticks.includes(0)) {
    ticks.push(0);
    ticks.sort((a, b) => a - b);
  }

  return ticks;
}

function formatAxisValue(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value);
}

export function CostBreakdownChart({
  result,
  locale,
  currency = "EUR",
  embedded = false,
}: {
  result: CalculationResult;
  locale: Locale;
  currency?: PayrollCurrency;
  embedded?: boolean;
}) {
  const t = getDictionary(locale);
  const { monthlyIncome, remaining, grossMonthly } = result;
  const bars = buildWaterfallBars(result, locale);

  const values = bars.flatMap((bar) => [bar.base, bar.top]);
  const dataMin = Math.min(0, ...values);
  const dataMax = Math.max(...values);
  const padding = (dataMax - dataMin) * 0.08 || 1;
  const domainMin = dataMin < 0 ? dataMin - padding : 0;
  const domainMax = dataMax + padding;
  const domain = domainMax - domainMin || 1;
  const ticks = axisTicks(domainMin, domainMax);
  const slot = (PLOT_RIGHT - PLOT_LEFT) / bars.length;
  const barWidth = Math.min(42, slot * 0.55);

  function xCenter(index: number) {
    return PLOT_LEFT + slot * index + slot / 2;
  }

  function y(value: number) {
    return (
      PLOT_BOTTOM -
      ((value - domainMin) / domain) * (PLOT_BOTTOM - PLOT_TOP)
    );
  }

  const ariaLabel = `${t.chart.breakdown}. ${
    grossMonthly
      ? `${t.chart.gross}: ${formatCurrency(grossMonthly, locale, currency)}. `
      : ""
  }${t.chart.net}: ${formatCurrency(monthlyIncome, locale, currency)}. ${t.chart.remainingAfter}: ${formatCurrency(remaining, locale, currency)}.`;

  return (
    <div
      className={
        embedded
          ? "text-left"
          : "h-full rounded-xl border border-border bg-surface p-6 text-left"
      }
    >
      <div className="flex items-baseline justify-between gap-4">
        <p
          className="text-xs font-medium uppercase tracking-wide text-muted"
          suppressHydrationWarning
        >
          {t.chart.breakdown}
        </p>
        <p className="text-xs text-muted" suppressHydrationWarning>
          {grossMonthly
            ? `${t.chart.gross}: ${formatCurrency(grossMonthly, locale, currency)} · ${t.chart.net}: ${formatCurrency(monthlyIncome, locale, currency)}`
            : `${t.chart.net}: ${formatCurrency(monthlyIncome, locale, currency)}`}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="mt-5 w-full"
        role="img"
        aria-label={ariaLabel}
      >
        <text
          x={14}
          y={(PLOT_TOP + PLOT_BOTTOM) / 2}
          textAnchor="middle"
          className="fill-muted"
          fontSize="11"
          transform={`rotate(-90 14 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`}
        >
          {t.chart.breakdown}
        </text>

        {ticks.map((tick) => {
          const tickY = y(tick);
          return (
            <g key={`tick-${tick}`}>
              <line
                x1={PLOT_LEFT}
                x2={PLOT_RIGHT}
                y1={tickY}
                y2={tickY}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={PLOT_LEFT - 8}
                y={tickY + 4}
                textAnchor="end"
                className="fill-muted"
                fontSize="10"
              >
                {formatAxisValue(tick, locale)}
              </text>
            </g>
          );
        })}

        <line
          x1={PLOT_LEFT}
          x2={PLOT_LEFT}
          y1={PLOT_TOP}
          y2={PLOT_BOTTOM}
          stroke="var(--border)"
          strokeWidth="1"
        />
        <line
          x1={PLOT_LEFT}
          x2={PLOT_RIGHT}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--foreground)"
          strokeOpacity="0.35"
          strokeWidth="1"
        />

        {bars.slice(0, -1).map((bar, index) => {
          const next = bars[index + 1];
          const connectorY = y(next.top);
          const from = xCenter(index) + barWidth / 2;
          const to = xCenter(index + 1) - barWidth / 2;
          if (to <= from) return null;

          return (
            <line
              key={`connector-${bar.id}`}
              x1={from}
              x2={to}
              y1={connectorY}
              y2={connectorY}
              stroke="var(--muted-light)"
              strokeWidth="1"
            />
          );
        })}

        {bars.map((bar, index) => {
          const center = xCenter(index);
          const topY = y(Math.max(bar.base, bar.top));
          const bottomY = y(Math.min(bar.base, bar.top));
          const height = Math.max(bottomY - topY, 2);
          const labelAbove = topY > PLOT_TOP + 14;

          return (
            <g
              key={bar.id}
              aria-label={`${bar.label}: ${formatCurrency(bar.amount, locale, currency)}`}
            >
              <rect
                x={center - barWidth / 2}
                y={topY}
                width={barWidth}
                height={height}
                rx="3"
                fill={bar.color}
              />
              <text
                x={center}
                y={labelAbove ? topY - 6 : topY + 14}
                textAnchor="middle"
                fill={
                  labelAbove
                    ? "var(--foreground)"
                    : bar.kind === "start"
                      ? "var(--background)"
                      : "#fff"
                }
                fontSize="10"
                fontWeight="500"
              >
                {formatCurrency(bar.amount, locale, currency)}
              </text>
              <text
                x={center}
                y={PLOT_BOTTOM + 16}
                textAnchor="end"
                className="fill-muted"
                fontSize="10"
                transform={`rotate(-40 ${center} ${PLOT_BOTTOM + 16})`}
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-5 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">{t.chart.remainingAfter}</span>
          <span
            className={`text-xl font-semibold tracking-tight ${
              remaining >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(remaining, locale, currency)}
          </span>
        </div>
        {remaining < 0 && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {t.chart.overspent}
          </p>
        )}
        {result.raise && (
          <div className="mt-4 space-y-1.5 border-t border-border pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium">{t.chart.raiseAfter}</span>
              <span className="text-sm font-medium tabular-nums">
                {formatCurrency(result.raise.nextNetMonthly, locale, currency)}{" "}
                <span className="text-muted">
                  (+{formatCurrency(result.raise.extraNetMonthly, locale, currency)})
                </span>
              </span>
            </div>
            <p className="text-xs text-muted">
              {formatRaisePercent(result.raise.percent, locale)}{" "}
              {result.raise.everyYears === 1
                ? t.form.raiseYearly
                : result.raise.everyYears === 2
                  ? t.form.raiseEvery2
                  : t.form.raiseEvery3}{" "}
              · {t.chart.raiseAnnualized}{" "}
              {formatRaisePercent(result.raise.annualizedPercent, locale)} p.a. · +
              {formatCurrency(result.raise.extraNetPerYear, locale, currency)}{" "}
              {t.chart.perYear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
