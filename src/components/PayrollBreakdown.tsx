import { formatCurrency } from "@/lib/cost-of-living";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { PayrollLine, PayrollResult } from "@/lib/payroll";

function lineLabel(id: string, locale: Locale) {
  const t = getDictionary(locale);
  return t.payroll.lines[id as keyof typeof t.payroll.lines] ?? id;
}

function LineList({
  title,
  lines,
  locale,
  currency,
}: {
  title: string;
  lines: PayrollLine[];
  locale: Locale;
  currency: PayrollResult["currency"];
}) {
  if (lines.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-light">
        {title}
      </p>
      <div className="mt-2 space-y-1.5">
        {lines.map((line) => (
          <div key={line.id} className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">{lineLabel(line.id, locale)}</span>
            <span className="text-sm font-medium tabular-nums">
              {formatCurrency(line.amount, locale, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PayrollBreakdown({
  payroll,
  locale,
}: {
  payroll: PayrollResult;
  locale: Locale;
}) {
  const t = getDictionary(locale);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface/70 p-4">
      <LineList
        title={t.payroll.taxes}
        lines={payroll.taxes}
        locale={locale}
        currency={payroll.currency}
      />
      <LineList
        title={t.payroll.employeeDeductions}
        lines={payroll.employeeDeductions}
        locale={locale}
        currency={payroll.currency}
      />
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-sm font-medium">{t.form.netIncome}</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(payroll.netMonthly, locale, payroll.currency)}
        </span>
      </div>
      <LineList
        title={t.payroll.employerContributions}
        lines={payroll.employerContributions}
        locale={locale}
        currency={payroll.currency}
      />
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-sm font-medium">{t.payroll.employerCost}</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(
            payroll.employerCostMonthly,
            locale,
            payroll.currency
          )}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-light">
        {t.payroll.disclaimer}
      </p>
    </div>
  );
}
