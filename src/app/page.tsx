import { CostBreakdownChart } from "@/components/CostBreakdownChart";
import { CostCalculator } from "@/components/CostCalculator";
import { Header } from "@/components/Header";
import {
  calculateCostOfLiving,
  formatAmountInput,
  parseAmount,
} from "@/lib/cost-of-living";

type HomeProps = {
  searchParams: Promise<{
    income?: string;
    coldRent?: string;
    utilities?: string;
    groceries?: string;
    mobility?: string;
    insurance?: string;
    telecom?: string;
    calculate?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const hasCalculated = params.calculate === "1";
  const income = params.income ?? "";
  const coldRent = params.coldRent ?? "";
  const utilities = params.utilities ?? "";
  const groceries = params.groceries ?? "";
  const mobility = params.mobility ?? "";
  const insurance = params.insurance ?? "";
  const telecom = params.telecom ?? "";

  const result = hasCalculated
    ? calculateCostOfLiving({
        monthlyIncome: parseAmount(income),
        coldRent: parseAmount(coldRent) || 0,
        utilities: parseAmount(utilities) || 0,
        groceries: parseAmount(groceries) || 0,
        mobility: parseAmount(mobility) || 0,
        insurance: parseAmount(insurance) || 0,
        telecom: parseAmount(telecom) || 0,
      })
    : null;

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center px-6 py-12 sm:py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center text-center">
          <h1 className="font-[family-name:var(--font-inter-display)] text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Lebenshaltungskosten
          </h1>

          <div className="mt-10 grid w-full items-start gap-6 lg:grid-cols-2">
            <CostCalculator
              defaultIncome={formatAmountInput(income)}
              defaultColdRent={formatAmountInput(coldRent)}
              defaultUtilities={formatAmountInput(utilities)}
              defaultGroceries={formatAmountInput(groceries)}
              defaultMobility={formatAmountInput(mobility)}
              defaultInsurance={formatAmountInput(insurance)}
              defaultTelecom={formatAmountInput(telecom)}
            />

            <div className="w-full">
              {hasCalculated && result && (
                <CostBreakdownChart result={result} />
              )}

              {hasCalculated && !result && (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-border bg-surface p-6 text-left">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Bitte Nettoeinkommen eingeben.
                  </p>
                </div>
              )}

              {!hasCalculated && (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Ergebnis
                  </p>
                  <p className="mt-2 max-w-xs text-sm text-muted">
                    Trage deine Kosten ein und klicke auf Berechnen — hier
                    erscheint die Aufschlüsselung.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
