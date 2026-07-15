import {
  formatCurrency,
  formatPercent,
  type CalculationResult,
} from "@/lib/cost-of-living";

export function CostBreakdownChart({ result }: { result: CalculationResult }) {
  const { monthlyIncome, segments, remaining } = result;

  return (
    <div className="h-full rounded-xl border border-border bg-surface p-6 text-left">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Kostenaufschlüsselung
        </p>
        <p className="text-xs text-muted">
          Netto: {formatCurrency(monthlyIncome)}
        </p>
      </div>

      <div className="mt-4 flex h-8 w-full overflow-hidden rounded-lg bg-border/40">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="h-full"
            style={{
              width: formatPercent(segment.amount, monthlyIncome),
              backgroundColor: segment.color,
            }}
            title={`${segment.label}: ${formatCurrency(segment.amount)}`}
          />
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {segments
          .filter((segment) => segment.id !== "remaining")
          .map((segment) => (
            <div
              key={segment.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-foreground">{segment.label}</span>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-medium">
                  {formatCurrency(segment.amount)}
                </span>
                <span className="ml-2 text-xs text-muted">
                  {formatPercent(segment.amount, monthlyIncome)}
                </span>
              </div>
            </div>
          ))}
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">Übrig nach Abzug</span>
          <span
            className={`text-xl font-semibold tracking-tight ${
              remaining >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(remaining)}
          </span>
        </div>
        {remaining < 0 && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Deine Kosten übersteigen dein Nettoeinkommen.
          </p>
        )}
      </div>
    </div>
  );
}
