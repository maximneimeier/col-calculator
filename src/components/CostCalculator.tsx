"use client";

import { useMemo, useState, type MouseEvent } from "react";
import {
  convertSalaryPeriod,
  extraIncomeKinds,
  formatAmountInput,
  isExtraIncomeKind,
  netFromTaxRate,
  parseAmount,
  parseSalaryPeriod,
  type ExtraIncomeKind,
  type ExtraIncomeRow,
  type SalaryPeriod,
} from "@/lib/cost-of-living";
import { setStammdatenFromForm } from "@/app/set-stammdaten";
import { StammdatenPanel, stammdatenFormId } from "@/components/StammdatenPanel";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { Stammdaten } from "@/lib/stammdaten";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none transition-colors placeholder:text-muted-light focus:border-accent focus:ring-2 focus:ring-accent/10";

const labelClass =
  "text-left text-[11px] font-medium uppercase tracking-widest text-muted";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="pt-1 text-[11px] font-medium uppercase tracking-widest text-muted-light">
      {children}
    </p>
  );
}

function closeSidebarDrawer(event: MouseEvent<HTMLLabelElement>, id: string) {
  const input = document.getElementById(id) as HTMLInputElement | null;
  if (!input?.checked) return;
  event.preventDefault();
  const none = document.getElementById("nav-none") as HTMLInputElement | null;
  if (none) none.checked = true;
}

function NavItem({ id, label }: { id: string; label: string }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground has-[:checked]:bg-background has-[:checked]:text-foreground"
      onClick={(event) => closeSidebarDrawer(event, id)}
    >
      <input
        id={id}
        type="radio"
        name="sidebarNav"
        form="sidebar-nav"
        className="js-nav-section sr-only"
      />
      <span className="min-w-0 text-left">{label}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0 text-muted-light"
        aria-hidden
      >
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </label>
  );
}

function AmountField({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  value,
  suffix,
  locale,
  readOnly,
  onChange,
}: {
  id: string;
  name?: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  value?: string;
  suffix: string;
  locale: Locale;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative min-w-0">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          readOnly={readOnly}
          {...(value !== undefined
            ? { value, onChange: (event) => onChange?.(event.currentTarget.value) }
            : { defaultValue })}
          className={`${inputClass} pr-24 ${readOnly ? "bg-card text-muted" : ""}`}
          placeholder={placeholder}
          onBlur={(event) => {
            if (readOnly) return;
            const formatted = formatAmountInput(
              event.currentTarget.value,
              locale
            );
            event.currentTarget.value = formatted;
            onChange?.(formatted);
          }}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
          {suffix}
        </span>
      </div>
    </div>
  );
}

type SalaryMode = "tax" | "net";

type CostCalculatorProps = {
  locale: Locale;
  defaultSalaryMode?: string;
  defaultSalaryPeriod?: string;
  defaultGross?: string;
  defaultTaxRate?: string;
  defaultIncome?: string;
  defaultColdRent?: string;
  defaultUtilities?: string;
  defaultGroceries?: string;
  defaultMobility?: string;
  defaultInsurance?: string;
  defaultTelecom?: string;
  defaultRaisePercent?: string;
  defaultRaiseEvery?: 1 | 2 | 3;
  defaultInflation?: string;
  defaultMarketReturn?: string;
  defaultPropertyReturn?: string;
  defaultCashReturn?: string;
  defaultRentalYield?: string;
  defaultExtraIncomes?: ExtraIncomeRow[];
  stammdaten: Stammdaten;
};

function createExtraIncomeRow(kind: ExtraIncomeKind = 5): ExtraIncomeRow {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `extra-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { id, kind, amount: "" };
}

function initialSalaryMode(defaultSalaryMode?: string): SalaryMode {
  return defaultSalaryMode === "net" ? "net" : "tax";
}

export function CostCalculator({
  locale,
  defaultSalaryMode,
  defaultSalaryPeriod,
  defaultGross,
  defaultTaxRate,
  defaultIncome,
  defaultColdRent,
  defaultUtilities,
  defaultGroceries,
  defaultMobility,
  defaultInsurance,
  defaultTelecom,
  defaultRaisePercent,
  defaultRaiseEvery = 1,
  defaultInflation,
  defaultMarketReturn,
  defaultPropertyReturn,
  defaultCashReturn,
  defaultRentalYield,
  defaultExtraIncomes = [],
  stammdaten,
}: CostCalculatorProps) {
  const t = getDictionary(locale);
  const perMonth = t.form.perMonth;
  const [mode, setMode] = useState<SalaryMode>(() =>
    initialSalaryMode(defaultSalaryMode)
  );
  const [period, setPeriod] = useState<SalaryPeriod>(() =>
    parseSalaryPeriod(defaultSalaryPeriod)
  );
  const [gross, setGross] = useState(defaultGross ?? "");
  const [taxRate, setTaxRate] = useState(defaultTaxRate ?? "");
  const [net, setNet] = useState(defaultIncome ?? "");
  const [extras, setExtras] = useState<ExtraIncomeRow[]>(defaultExtraIncomes);
  const salarySuffix = period === "year" ? t.form.perYear : perMonth;
  const grossPlaceholder =
    period === "year"
      ? locale === "en"
        ? "54,000"
        : "54.000"
      : locale === "en"
        ? "4,500"
        : "4.500";
  const netPlaceholder =
    period === "year"
      ? locale === "en"
        ? "42,000"
        : "42.000"
      : locale === "en"
        ? "3,500"
        : "3.500";

  function applyPeriod(next: SalaryPeriod) {
    if (next === period) return;
    setGross((current) => convertSalaryPeriod(current, period, next, locale));
    setNet((current) => convertSalaryPeriod(current, period, next, locale));
    setExtras((rows) =>
      rows.map((row) => ({
        ...row,
        amount: convertSalaryPeriod(row.amount, period, next, locale),
      }))
    );
    setPeriod(next);
  }

  function updateExtra(id: string, patch: Partial<ExtraIncomeRow>) {
    setExtras((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  const computedNet = useMemo(() => {
    if (mode !== "tax") return null;
    return netFromTaxRate(parseAmount(gross), parseAmount(taxRate));
  }, [gross, mode, taxRate]);

  const netValue =
    computedNet != null
      ? formatAmountInput(String(computedNet), locale)
      : net;
  return (
    <aside className="js-app-sidebar flex w-full flex-col border-b border-border bg-surface lg:h-full lg:min-h-0 lg:w-56 lg:shrink-0 lg:overflow-hidden lg:border-b-0 lg:border-r lg:transition-[width] lg:[&:has(.js-nav-section:checked)]:w-[36rem] xl:[&:has(.js-nav-section:checked)]:w-[38rem]">
    <form
      action="/"
      method="get"
      className="flex min-h-0 flex-1 flex-col [&:has(#salary-mode-net:checked)_.js-tax-fields]:hidden [&:has(#salary-mode-tax:checked)_.js-net-fields]:hidden [&:has(#nav-salary:checked)_.js-drawer]:flex [&:has(#nav-extras:checked)_.js-drawer]:flex [&:has(#nav-costs:checked)_.js-drawer]:flex [&:has(#nav-rates:checked)_.js-drawer]:flex [&:has(#nav-salary:checked)_.js-panel-salary]:flex [&:has(#nav-extras:checked)_.js-panel-extras]:flex [&:has(#nav-costs:checked)_.js-panel-costs]:flex [&:has(#nav-rates:checked)_.js-panel-rates]:flex [&:has(#nav-salary:checked)_.js-title-salary]:block [&:has(#nav-extras:checked)_.js-title-extras]:block [&:has(#nav-costs:checked)_.js-title-costs]:block [&:has(#nav-rates:checked)_.js-title-rates]:block"
    >
      <input type="hidden" name="inflation" value={defaultInflation ?? ""} />
      <input type="hidden" name="marketReturn" value={defaultMarketReturn ?? ""} />
      <input type="hidden" name="propertyReturn" value={defaultPropertyReturn ?? ""} />
      <input type="hidden" name="cashReturn" value={defaultCashReturn ?? ""} />
      <input type="hidden" name="rentalYield" value={defaultRentalYield ?? ""} />
      <input
        id="nav-none"
        type="radio"
        name="sidebarNav"
        form="sidebar-nav"
        className="sr-only"
        defaultChecked
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="flex shrink-0 flex-col border-b border-border lg:h-full lg:w-56 lg:border-b-0 lg:border-r">
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3 text-left">
          <NavItem id="nav-salary" label={t.form.salary} />
          <NavItem id="nav-extras" label={t.form.extraIncomes} />
          <NavItem id="nav-costs" label={t.form.livingCosts} />
          <NavItem id="nav-rates" label={t.home.tabRates} />
        </nav>
      </div>

      <div className="js-drawer hidden min-h-0 flex-1 flex-col bg-surface lg:w-[22rem] xl:w-[24rem]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="js-title-salary hidden text-sm font-medium text-foreground">
            {t.form.salary}
          </h2>
          <h2 className="js-title-extras hidden text-sm font-medium text-foreground">
            {t.form.extraIncomes}
          </h2>
          <h2 className="js-title-costs hidden text-sm font-medium text-foreground">
            {t.form.livingCosts}
          </h2>
          <h2 className="js-title-rates hidden text-sm font-medium text-foreground">
            {t.home.tabRates}
          </h2>
          <label
            htmlFor="nav-none"
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-lg leading-none text-muted transition-colors hover:bg-background hover:text-foreground"
            aria-label={t.form.sidebarClose}
          >
            ×
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-left">
          <div className="js-panel-salary hidden flex-col space-y-3">
          <p className="text-sm text-muted">{t.form.salaryHint}</p>

          <div className="space-y-1.5">
            <span className={labelClass}>{t.form.salaryPeriod}</span>
            <div
              role="radiogroup"
              aria-label={t.form.salaryPeriod}
              className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1"
            >
              {(["month", "year"] as const).map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground has-[:checked]:bg-foreground has-[:checked]:text-background"
                >
                  <input
                    id={`salary-period-${value}`}
                    type="radio"
                    name="salaryPeriod"
                    value={value}
                    defaultChecked={period === value}
                    className="peer sr-only"
                    onChange={() => applyPeriod(value)}
                  />
                  {value === "month" ? t.form.monthly : t.form.yearly}
                </label>
              ))}
            </div>
          </div>

          <AmountField
            id="gross"
            name="gross"
            label={t.form.gross}
            placeholder={grossPlaceholder}
            value={gross}
            suffix={salarySuffix}
            locale={locale}
            onChange={setGross}
          />

          <div className="space-y-1.5">
            <span className={labelClass}>{t.form.salaryMode}</span>
            <div
              role="radiogroup"
              aria-label={t.form.salaryMode}
              className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1"
            >
              {(["tax", "net"] as const).map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground has-[:checked]:bg-foreground has-[:checked]:text-background"
                >
                  <input
                    id={`salary-mode-${value}`}
                    type="radio"
                    name="salaryMode"
                    value={value}
                    defaultChecked={mode === value}
                    className="peer sr-only"
                    onChange={() => {
                      if (value === "net" && computedNet != null) {
                        setNet(formatAmountInput(String(computedNet), locale));
                      }
                      setMode(value);
                    }}
                  />
                  {value === "tax" ? t.form.viaTaxRate : t.form.viaNet}
                </label>
              ))}
            </div>
          </div>

          <div className="js-tax-fields space-y-3">
            <AmountField
              id="tax-rate"
              name="taxRate"
              label={t.form.taxRate}
              placeholder="35"
              value={taxRate}
              suffix={t.form.percent}
              locale={locale}
              onChange={setTaxRate}
            />
            <AmountField
              id="income-display"
              label={t.form.netIncome}
              placeholder={netPlaceholder}
              value={netValue}
              suffix={salarySuffix}
              locale={locale}
              readOnly
            />
          </div>

          <div className="js-net-fields">
            <AmountField
              id="income"
              name="income"
              label={t.form.netIncome}
              placeholder={netPlaceholder}
              value={net}
              suffix={salarySuffix}
              locale={locale}
              onChange={setNet}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="raise-percent" className={labelClass}>
              {t.form.raise}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative w-[4.5rem] shrink-0">
                <input
                  id="raise-percent"
                  name="raisePercent"
                  type="text"
                  inputMode="decimal"
                  defaultValue={defaultRaisePercent}
                  placeholder="3"
                  className={`${inputClass} px-2 py-1.5 pr-6 text-sm`}
                  onBlur={(event) => {
                    event.currentTarget.value = formatAmountInput(
                      event.currentTarget.value,
                      locale
                    );
                  }}
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">
                  {t.form.percent}
                </span>
              </div>
              <div className="relative min-w-0 flex-1">
                <select
                  id="raise-every"
                  name="raiseEvery"
                  aria-label={t.form.raiseInterval}
                  defaultValue={String(defaultRaiseEvery)}
                  className={`${inputClass} cursor-pointer appearance-none px-2 py-1.5 pr-7 text-sm`}
                >
                  <option value="1">{t.form.raiseYearly}</option>
                  <option value="2">{t.form.raiseEvery2}</option>
                  <option value="3">{t.form.raiseEvery3}</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          </div>

          <div className="js-panel-extras hidden flex-col space-y-3">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-sm text-muted">
              {t.form.extraIncomesHint}
            </p>
            <button
              type="button"
              aria-label={t.form.extraIncomesAdd}
              className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-lg font-medium leading-none text-foreground transition-colors hover:bg-card"
              onClick={() =>
                setExtras((rows) => [...rows, createExtraIncomeRow()])
              }
            >
              +
            </button>
          </div>

          {extras.map((row) => (
            <div key={row.id} className="flex flex-col gap-2">
              <select
                name="extraType"
                aria-label={t.form.extraIncomes}
                value={row.kind}
                className={`${inputClass} cursor-pointer appearance-none px-3 py-2 pr-8`}
                onChange={(event) => {
                  const kind = Number(event.currentTarget.value);
                  if (isExtraIncomeKind(kind)) updateExtra(row.id, { kind });
                }}
              >
                {extraIncomeKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {t.form.incomeKinds[String(kind) as keyof typeof t.form.incomeKinds]}
                  </option>
                ))}
              </select>
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    name="extraAmount"
                    type="text"
                    inputMode="decimal"
                    value={row.amount}
                    aria-label={t.form.extraIncomeAmount}
                    placeholder={period === "year" ? "6.000" : "500"}
                    className={`${inputClass} pr-24`}
                    onChange={(event) =>
                      updateExtra(row.id, { amount: event.currentTarget.value })
                    }
                    onBlur={(event) =>
                      updateExtra(row.id, {
                        amount: formatAmountInput(
                          event.currentTarget.value,
                          locale
                        ),
                      })
                    }
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                    {salarySuffix}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={t.form.extraIncomeRemove}
                  className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-lg leading-none text-muted transition-colors hover:bg-card hover:text-foreground"
                  onClick={() =>
                    setExtras((rows) => rows.filter((item) => item.id !== row.id))
                  }
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          </div>

          <div className="js-panel-costs hidden flex-col space-y-3">
          <SectionLabel>{t.form.housing}</SectionLabel>
          <AmountField
            id="cold-rent"
            name="coldRent"
            label={t.form.coldRent}
            placeholder="900"
            defaultValue={defaultColdRent}
            suffix={perMonth}
            locale={locale}
          />
          <AmountField
            id="utilities"
            name="utilities"
            label={t.form.utilities}
            placeholder="250"
            defaultValue={defaultUtilities}
            suffix={perMonth}
            locale={locale}
          />

          <SectionLabel>{t.form.fixedCosts}</SectionLabel>
          <AmountField
            id="groceries"
            name="groceries"
            label={t.form.groceries}
            placeholder="400"
            defaultValue={defaultGroceries}
            suffix={perMonth}
            locale={locale}
          />
          <AmountField
            id="mobility"
            name="mobility"
            label={t.form.mobility}
            placeholder="150"
            defaultValue={defaultMobility}
            suffix={perMonth}
            locale={locale}
          />
          <AmountField
            id="insurance"
            name="insurance"
            label={t.form.insurance}
            placeholder="120"
            defaultValue={defaultInsurance}
            suffix={perMonth}
            locale={locale}
          />
          <AmountField
            id="telecom"
            name="telecom"
            label={t.form.telecom}
            placeholder="60"
            defaultValue={defaultTelecom}
            suffix={perMonth}
            locale={locale}
          />
          </div>

          <div className="js-panel-rates hidden flex-col">
            <StammdatenPanel locale={locale} values={stammdaten} />
          </div>
        </div>
      </div>
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <button
          type="submit"
          name="calculate"
          value="1"
          className="w-full cursor-pointer rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.99]"
        >
          {t.form.calculate}
        </button>
      </div>
    </form>
    <form id="sidebar-nav" hidden />
    <form id={stammdatenFormId} action={setStammdatenFromForm} hidden />
    </aside>
  );
}
