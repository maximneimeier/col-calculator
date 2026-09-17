"use client";

import { useMemo, useState } from "react";
import {
  formatAmountInput,
  netFromTaxRate,
  parseAmount,
} from "@/lib/cost-of-living";
import { getDictionary, type Locale } from "@/lib/i18n";

const cardClass =
  "rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_var(--shadow)]";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none transition-colors placeholder:text-muted-light focus:border-accent focus:ring-2 focus:ring-accent/10";

const labelClass =
  "w-40 shrink-0 text-left text-xs font-medium uppercase leading-tight tracking-wide text-muted sm:w-48";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="pt-1 text-[11px] font-medium uppercase tracking-widest text-muted-light">
      {children}
    </p>
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
    <div className="flex items-center gap-4">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative min-w-0 flex-1">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          readOnly={readOnly}
          {...(value !== undefined
            ? { value, onChange: (event) => onChange?.(event.currentTarget.value) }
            : { defaultValue })}
          className={`${inputClass} pr-24 ${readOnly ? "bg-surface text-muted" : ""}`}
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
};

function initialSalaryMode(defaultSalaryMode?: string): SalaryMode {
  return defaultSalaryMode === "net" ? "net" : "tax";
}

export function CostCalculator({
  locale,
  defaultSalaryMode,
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
}: CostCalculatorProps) {
  const t = getDictionary(locale);
  const perMonth = t.form.perMonth;
  const [mode, setMode] = useState<SalaryMode>(() =>
    initialSalaryMode(defaultSalaryMode)
  );
  const [gross, setGross] = useState(defaultGross ?? "");
  const [taxRate, setTaxRate] = useState(defaultTaxRate ?? "");
  const [net, setNet] = useState(defaultIncome ?? "");

  const computedNet = useMemo(() => {
    if (mode !== "tax") return null;
    return netFromTaxRate(parseAmount(gross), parseAmount(taxRate));
  }, [gross, mode, taxRate]);

  const netValue =
    computedNet != null
      ? formatAmountInput(String(computedNet), locale)
      : net;

  return (
    <form
      action="/"
      method="get"
      className="flex w-full flex-col gap-6 [&:has(#salary-mode-net:checked)_.js-tax-fields]:hidden [&:has(#salary-mode-tax:checked)_.js-net-fields]:hidden"
    >
      <div className={cardClass}>
        <div className="space-y-4 text-left">
          <SectionLabel>{t.form.salary}</SectionLabel>
          <p className="text-sm text-muted">{t.form.salaryHint}</p>

          <AmountField
            id="gross"
            name="gross"
            label={t.form.gross}
            placeholder={locale === "en" ? "4,500" : "4.500"}
            value={gross}
            suffix={perMonth}
            locale={locale}
            onChange={setGross}
          />

          <div className="flex items-center gap-4">
            <span className={labelClass}>{t.form.salaryMode}</span>
            <div
              role="radiogroup"
              aria-label={t.form.salaryMode}
              className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1"
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

          <div className="js-tax-fields space-y-4">
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
              placeholder={locale === "en" ? "3,500" : "3.500"}
              value={netValue}
              suffix={perMonth}
              locale={locale}
              readOnly
            />
          </div>

          <div className="js-net-fields">
            <AmountField
              id="income"
              name="income"
              label={t.form.netIncome}
              placeholder={locale === "en" ? "3,500" : "3.500"}
              value={net}
              suffix={perMonth}
              locale={locale}
              onChange={setNet}
            />
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="raise-percent" className={labelClass}>
              {t.form.raise}
            </label>
            <div className="flex min-w-0 flex-1 items-center gap-2">
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
              <div
                role="radiogroup"
                aria-label={t.form.raiseInterval}
                className="grid min-w-0 flex-1 grid-cols-3 gap-0.5 rounded-md border border-border bg-background p-0.5"
              >
                {([1, 2, 3] as const).map((years) => {
                  const full =
                    years === 1
                      ? t.form.raiseYearly
                      : years === 2
                        ? t.form.raiseEvery2
                        : t.form.raiseEvery3;
                  const short =
                    years === 1
                      ? t.form.raiseYearlyShort
                      : years === 2
                        ? t.form.raiseEvery2Short
                        : t.form.raiseEvery3Short;
                  return (
                    <label
                      key={years}
                      title={full}
                      className="flex cursor-pointer items-center justify-center rounded px-1 py-1 text-center text-[11px] font-medium leading-none text-muted transition-colors hover:text-foreground has-[:checked]:bg-foreground has-[:checked]:text-background"
                    >
                      <input
                        type="radio"
                        name="raiseEvery"
                        value={years}
                        defaultChecked={defaultRaiseEvery === years}
                        aria-label={full}
                        className="sr-only"
                      />
                      {short}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="space-y-4 text-left">
          <SectionLabel>{t.form.livingCosts}</SectionLabel>

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

          <button
            type="submit"
            name="calculate"
            value="1"
            className="w-full cursor-pointer rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.99]"
          >
            {t.form.calculate}
          </button>
        </div>
      </div>
    </form>
  );
}
