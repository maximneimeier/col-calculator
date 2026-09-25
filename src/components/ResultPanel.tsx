"use client";

import { useMemo, useState } from "react";
import { CostBreakdownChart } from "@/components/CostBreakdownChart";
import { SalaryGrowthChart } from "@/components/SalaryGrowthChart";
import { WealthChart } from "@/components/WealthChart";
import {
  adjustSalaryPathForInflation,
  adjustWealthPathForInflation,
  DEFAULT_HORIZON,
  formatCurrency,
  formatRaisePercent,
  MAX_HORIZON,
  MIN_HORIZON,
  parseHorizon,
  parseSavingsRateKind,
  projectSalaryPath,
  projectWealthPath,
  resolveSavingsRate,
  savingsRateKinds,
  type CalculationResult,
  type RaiseInterval,
  type SavingsRateKind,
} from "@/lib/cost-of-living";
import { getDictionary, type Locale } from "@/lib/i18n";

type SavingsRates = {
  marketReturn: number;
  propertyReturn: number;
  cashReturn: number;
  rentalYield: number;
};

const rateLabels: Record<SavingsRateKind, "marketReturn" | "propertyReturn" | "cashReturn" | "rentalYield"> = {
  market: "marketReturn",
  property: "propertyReturn",
  cash: "cashReturn",
  rental: "rentalYield",
};

export function ResultPanel({
  result,
  locale,
  raisePercent,
  raiseEveryYears,
  defaultView,
  defaultHorizon,
  inflationPercent = 0,
  rates,
  defaultSavingsRate,
}: {
  result: CalculationResult;
  locale: Locale;
  raisePercent?: number;
  raiseEveryYears: RaiseInterval;
  defaultView?: string;
  defaultHorizon?: number;
  inflationPercent?: number;
  rates: SavingsRates;
  defaultSavingsRate?: string;
}) {
  const t = getDictionary(locale);
  const [horizonInput, setHorizonInput] = useState(
    String(defaultHorizon ?? DEFAULT_HORIZON)
  );
  const [savingsKind, setSavingsKind] = useState<SavingsRateKind>(() =>
    parseSavingsRateKind(defaultSavingsRate)
  );
  const horizon = parseHorizon(horizonInput);
  const startOnGrowth = defaultView === "growth";
  const startOnWealth = defaultView === "wealth";
  const savingsRate = resolveSavingsRate(savingsKind, rates);

  const points = useMemo(() => {
    const extraNet = result.extraMonthlyNet ?? 0;
    const extraGross = result.extraMonthlyGross ?? 0;
    const path = projectSalaryPath({
      monthlyNet: result.salaryMonthlyNet ?? result.monthlyIncome - extraNet,
      monthlyGross:
        result.salaryMonthlyGross ??
        (result.grossMonthly != null
          ? result.grossMonthly - extraGross
          : undefined),
      raisePercent,
      raiseEveryYears,
      horizon,
    });

    if (extraNet === 0 && extraGross === 0) return path;

    return path.map((point) => ({
      ...point,
      gross: point.gross + extraGross,
      net: point.net + extraNet,
    }));
  }, [
    horizon,
    raiseEveryYears,
    raisePercent,
    result.extraMonthlyGross,
    result.extraMonthlyNet,
    result.grossMonthly,
    result.monthlyIncome,
    result.salaryMonthlyGross,
    result.salaryMonthlyNet,
  ]);
  const realPoints = useMemo(
    () => adjustSalaryPathForInflation(points, inflationPercent),
    [inflationPercent, points]
  );
  const wealthPoints = useMemo(
    () =>
      projectWealthPath({
        leftoverMonthlyByYear: points.map((point) => point.net - result.totalCosts),
        annualRate: savingsRate,
      }),
    [points, result.totalCosts, savingsRate]
  );
  const realWealthPoints = useMemo(
    () => adjustWealthPathForInflation(wealthPoints, inflationPercent),
    [inflationPercent, wealthPoints]
  );
  const hasSavings = wealthPoints.some((point) => point.wealth > 0);
  const lastWealth = wealthPoints[wealthPoints.length - 1];
  const lastRealWealth = realWealthPoints[realWealthPoints.length - 1];

  return (
    <div
      className="h-full rounded-xl border border-border bg-surface p-6 text-left [&:has(#result-view-growth:checked)_.js-costs-view]:hidden [&:has(#result-view-wealth:checked)_.js-costs-view]:hidden [&:has(#result-view-costs:checked)_.js-growth-view]:hidden [&:has(#result-view-wealth:checked)_.js-growth-view]:hidden [&:has(#result-view-costs:checked)_.js-wealth-view]:hidden [&:has(#result-view-growth:checked)_.js-wealth-view]:hidden"
    >
      <div
        role="tablist"
        aria-label={t.home.result}
        className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-background p-1"
      >
        <label className="flex cursor-pointer items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground has-[:checked]:bg-foreground has-[:checked]:text-background">
          <input
            id="result-view-costs"
            type="radio"
            name="resultView"
            value="costs"
            defaultChecked={!startOnGrowth && !startOnWealth}
            className="sr-only"
          />
          {t.home.tabCosts}
        </label>
        <label className="flex cursor-pointer items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground has-[:checked]:bg-foreground has-[:checked]:text-background">
          <input
            id="result-view-growth"
            type="radio"
            name="resultView"
            value="growth"
            defaultChecked={startOnGrowth}
            className="sr-only"
          />
          {t.home.tabGrowth}
        </label>
        <label className="flex cursor-pointer items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground has-[:checked]:bg-foreground has-[:checked]:text-background">
          <input
            id="result-view-wealth"
            type="radio"
            name="resultView"
            value="wealth"
            defaultChecked={startOnWealth}
            className="sr-only"
          />
          {t.home.tabWealth}
        </label>
      </div>

      <div className="js-costs-view mt-5">
        <CostBreakdownChart result={result} locale={locale} embedded />
      </div>

      <div className="js-growth-view mt-5 [&:has(#inflation-adjusted:checked)_.js-nominal-growth]:hidden [&:has(#inflation-adjusted:checked)_.js-real-growth]:block [&:has(#inflation-adjusted:checked)_.js-nominal-hint]:hidden [&:has(#inflation-adjusted:checked)_.js-real-hint]:block">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="js-nominal-hint max-w-xs text-sm text-muted">
            {t.chart.growthHint}
          </p>
          <p className="js-real-hint hidden max-w-xs text-sm text-muted">
            {t.chart.growthHintReal}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <label
              htmlFor="inflation-adjusted"
              className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted"
            >
              <input
                id="inflation-adjusted"
                type="checkbox"
                className="size-4 cursor-pointer accent-[var(--accent)]"
              />
              {t.chart.inflationAdjusted}
            </label>
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              {t.chart.growthYears}
              <input
                type="number"
                min={MIN_HORIZON}
                max={MAX_HORIZON}
                value={horizonInput}
                inputMode="numeric"
                className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                onChange={(event) => setHorizonInput(event.currentTarget.value)}
                onBlur={() => setHorizonInput(String(horizon))}
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-foreground" />
            {t.chart.gross}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
            {t.chart.net}
          </span>
        </div>

        <div className="js-nominal-growth">
          <SalaryGrowthChart points={points} locale={locale} />
        </div>
        <div className="js-real-growth hidden">
          <SalaryGrowthChart points={realPoints} locale={locale} />
        </div>
      </div>

      <div className="js-wealth-view mt-5 [&:has(#wealth-inflation-adjusted:checked)_.js-nominal-wealth]:hidden [&:has(#wealth-inflation-adjusted:checked)_.js-real-wealth]:block [&:has(#wealth-inflation-adjusted:checked)_.js-nominal-wealth-hint]:hidden [&:has(#wealth-inflation-adjusted:checked)_.js-real-wealth-hint]:block [&:has(#wealth-inflation-adjusted:checked)_.js-nominal-wealth-total]:hidden [&:has(#wealth-inflation-adjusted:checked)_.js-real-wealth-total]:block">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
              {t.chart.finalWealth}
            </p>
            <p className="js-nominal-wealth-total text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatCurrency(lastWealth?.wealth ?? 0, locale)}
            </p>
            <p className="js-real-wealth-total hidden text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatCurrency(lastRealWealth?.wealth ?? 0, locale)}
            </p>
            <p className="js-nominal-wealth-hint max-w-xs text-sm text-muted">
              {t.chart.wealthHint}
            </p>
            <p className="js-real-wealth-hint hidden max-w-xs text-sm text-muted">
              {t.chart.wealthHintReal}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              {t.chart.savingsRate}
              <select
                aria-label={t.chart.savingsRate}
                value={savingsKind}
                className="max-w-52 cursor-pointer appearance-none rounded-lg border border-border bg-background px-2 py-1.5 pr-7 text-xs font-medium text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                onChange={(event) =>
                  setSavingsKind(parseSavingsRateKind(event.currentTarget.value))
                }
              >
                {savingsRateKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {t.form[rateLabels[kind]]} ({formatRaisePercent(resolveSavingsRate(kind, rates), locale)})
                  </option>
                ))}
              </select>
            </label>
            <label
              htmlFor="wealth-inflation-adjusted"
              className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted"
            >
              <input
                id="wealth-inflation-adjusted"
                type="checkbox"
                className="size-4 cursor-pointer accent-[var(--accent)]"
              />
              {t.chart.inflationAdjusted}
            </label>
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              {t.chart.growthYears}
              <input
                type="number"
                min={MIN_HORIZON}
                max={MAX_HORIZON}
                value={horizonInput}
                inputMode="numeric"
                className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                onChange={(event) => setHorizonInput(event.currentTarget.value)}
                onBlur={() => setHorizonInput(String(horizon))}
              />
            </label>
          </div>
        </div>

        {hasSavings ? (
          <>
            <div className="mt-4 flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[var(--interest)]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--interest)]" />
                {t.chart.interest}
              </span>
              <span className="inline-flex items-center gap-1.5 text-accent">
                <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
                {t.chart.saved}
              </span>
            </div>
            <div className="js-nominal-wealth">
              <WealthChart points={wealthPoints} locale={locale} />
            </div>
            <div className="js-real-wealth hidden">
              <WealthChart points={realWealthPoints} locale={locale} />
            </div>
          </>
        ) : (
          <p className="mt-8 text-sm text-muted">{t.chart.noSavings}</p>
        )}
      </div>
    </div>
  );
}
