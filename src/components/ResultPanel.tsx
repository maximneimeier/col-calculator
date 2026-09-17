"use client";

import { useMemo, useState } from "react";
import { CostBreakdownChart } from "@/components/CostBreakdownChart";
import { SalaryGrowthChart } from "@/components/SalaryGrowthChart";
import {
  adjustSalaryPathForInflation,
  DEFAULT_HORIZON,
  MAX_HORIZON,
  MIN_HORIZON,
  parseHorizon,
  projectSalaryPath,
  type CalculationResult,
  type RaiseInterval,
} from "@/lib/cost-of-living";
import { getDictionary, type Locale } from "@/lib/i18n";

export function ResultPanel({
  result,
  locale,
  raisePercent,
  raiseEveryYears,
  defaultView,
  defaultHorizon,
  inflationPercent = 0,
}: {
  result: CalculationResult;
  locale: Locale;
  raisePercent?: number;
  raiseEveryYears: RaiseInterval;
  defaultView?: string;
  defaultHorizon?: number;
  inflationPercent?: number;
}) {
  const t = getDictionary(locale);
  const [horizonInput, setHorizonInput] = useState(
    String(defaultHorizon ?? DEFAULT_HORIZON)
  );
  const horizon = parseHorizon(horizonInput);
  const startOnGrowth = defaultView === "growth";

  const points = useMemo(
    () =>
      projectSalaryPath({
        monthlyNet: result.monthlyIncome,
        monthlyGross: result.grossMonthly,
        raisePercent,
        raiseEveryYears,
        horizon,
      }),
    [horizon, raiseEveryYears, raisePercent, result.grossMonthly, result.monthlyIncome]
  );
  const realPoints = useMemo(
    () => adjustSalaryPathForInflation(points, inflationPercent),
    [inflationPercent, points]
  );

  return (
    <div
      className="h-full rounded-xl border border-border bg-surface p-6 text-left [&:has(#result-view-growth:checked)_.js-costs-view]:hidden [&:has(#result-view-costs:checked)_.js-growth-view]:hidden"
    >
      <div
        role="tablist"
        aria-label={t.home.result}
        className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1"
      >
        <label className="flex cursor-pointer items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground has-[:checked]:bg-foreground has-[:checked]:text-background">
          <input
            id="result-view-costs"
            type="radio"
            name="resultView"
            value="costs"
            defaultChecked={!startOnGrowth}
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
    </div>
  );
}
