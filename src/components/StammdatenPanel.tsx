import { formatAmountInput } from "@/lib/cost-of-living";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { Stammdaten } from "@/lib/stammdaten";

export const stammdatenFormId = "stammdaten-form";

function RateField({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  suffix,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  placeholder: string;
  suffix: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label
        htmlFor={id}
        className="block text-left text-xs font-medium leading-snug text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          form={stammdatenFormId}
          name={name}
          type="text"
          inputMode="decimal"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
          {suffix}
        </span>
      </div>
    </div>
  );
}

export function StammdatenPanel({
  locale,
  values,
}: {
  locale: Locale;
  values: Stammdaten;
}) {
  const t = getDictionary(locale);
  const format = (value: number) => formatAmountInput(String(value), locale);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t.form.ratesHint}</p>
      <div className="grid grid-cols-2 gap-3">
        <RateField
          id="stammdaten-inflation"
          name="inflation"
          label={t.form.inflation}
          defaultValue={format(values.inflation)}
          placeholder="2"
          suffix={t.form.percent}
        />
        <RateField
          id="stammdaten-market-return"
          name="marketReturn"
          label={t.form.marketReturn}
          defaultValue={format(values.marketReturn)}
          placeholder="8"
          suffix={t.form.percent}
        />
        <RateField
          id="stammdaten-property-return"
          name="propertyReturn"
          label={t.form.propertyReturn}
          defaultValue={format(values.propertyReturn)}
          placeholder="5"
          suffix={t.form.percent}
        />
        <RateField
          id="stammdaten-cash-return"
          name="cashReturn"
          label={t.form.cashReturn}
          defaultValue={format(values.cashReturn)}
          placeholder="2"
          suffix={t.form.percent}
        />
        <RateField
          id="stammdaten-rental-yield"
          name="rentalYield"
          label={t.form.rentalYield}
          defaultValue={format(values.rentalYield)}
          placeholder={locale === "en" ? "2.5" : "2,5"}
          suffix={t.form.percent}
        />
      </div>
      <button
        type="submit"
        form={stammdatenFormId}
        className="w-full cursor-pointer rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
      >
        {t.home.stammdatenSave}
      </button>
    </div>
  );
}
