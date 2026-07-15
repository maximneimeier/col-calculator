const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none transition-colors placeholder:text-muted-light focus:border-accent focus:ring-2 focus:ring-accent/10";

const labelClass =
  "w-36 shrink-0 text-left text-xs font-medium uppercase tracking-wide text-muted sm:w-44";

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
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
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
          data-amount-input=""
          defaultValue={defaultValue}
          className={`${inputClass} pr-24`}
          placeholder={placeholder}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
          € / Monat
        </span>
      </div>
    </div>
  );
}

type CostCalculatorProps = {
  defaultIncome?: string;
  defaultColdRent?: string;
  defaultUtilities?: string;
  defaultGroceries?: string;
  defaultMobility?: string;
  defaultInsurance?: string;
  defaultTelecom?: string;
};

export function CostCalculator({
  defaultIncome,
  defaultColdRent,
  defaultUtilities,
  defaultGroceries,
  defaultMobility,
  defaultInsurance,
  defaultTelecom,
}: CostCalculatorProps) {
  return (
    <div className="w-full">
      <form
        action="/"
        method="get"
        className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_var(--shadow)]"
      >
        <div className="space-y-4 text-left">
          <SectionLabel>Einkommen</SectionLabel>
          <AmountField
            id="income"
            name="income"
            label="Nettoeinkommen"
            placeholder="3.500"
            defaultValue={defaultIncome}
          />

          <SectionLabel>Wohnen</SectionLabel>
          <AmountField
            id="cold-rent"
            name="coldRent"
            label="Kaltmiete"
            placeholder="900"
            defaultValue={defaultColdRent}
          />
          <AmountField
            id="utilities"
            name="utilities"
            label="Mietnebenkosten"
            placeholder="250"
            defaultValue={defaultUtilities}
          />

          <SectionLabel>Fixkosten</SectionLabel>
          <AmountField
            id="groceries"
            name="groceries"
            label="Lebensmittel"
            placeholder="400"
            defaultValue={defaultGroceries}
          />
          <AmountField
            id="mobility"
            name="mobility"
            label="Mobilität"
            placeholder="150"
            defaultValue={defaultMobility}
          />
          <AmountField
            id="insurance"
            name="insurance"
            label="Versicherungen"
            placeholder="120"
            defaultValue={defaultInsurance}
          />
          <AmountField
            id="telecom"
            name="telecom"
            label="Telekommunikation"
            placeholder="60"
            defaultValue={defaultTelecom}
          />

          <button
            type="submit"
            name="calculate"
            value="1"
            className="w-full cursor-pointer rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.99]"
          >
            Berechnen
          </button>
        </div>
      </form>
    </div>
  );
}
