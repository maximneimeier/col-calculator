import { CostCalculator } from "@/components/CostCalculator";
import { Header } from "@/components/Header";
import { ResultPanel } from "@/components/ResultPanel";
import {
  calculateCostOfLiving,
  DEFAULT_CASH_RETURN,
  DEFAULT_INFLATION,
  DEFAULT_MARKET_RETURN,
  DEFAULT_PROPERTY_RETURN,
  DEFAULT_RENTAL_YIELD,
  extraIncomeMonthlyTotals,
  formatAmountInput,
  parseAmount,
  parseExtraIncomeRows,
  parseHorizon,
  parseRaiseInterval,
  parseRate,
  parseSalaryPeriod,
  resolveNetIncome,
  resolvePersonalTaxRate,
  toMonthlyAmount,
} from "@/lib/cost-of-living";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { defaultStammdaten, getStammdaten } from "@/lib/stammdaten";

type HomeProps = {
  searchParams: Promise<{
    salaryMode?: string;
    salaryPeriod?: string;
    gross?: string;
    taxRate?: string;
    income?: string;
    coldRent?: string;
    utilities?: string;
    groceries?: string;
    mobility?: string;
    insurance?: string;
    telecom?: string;
    raisePercent?: string;
    raiseEvery?: string;
    view?: string;
    horizon?: string;
    inflation?: string;
    marketReturn?: string;
    propertyReturn?: string;
    cashReturn?: string;
    rentalYield?: string;
    extraType?: string | string[];
    extraAmount?: string | string[];
    savingsRate?: string;
    calculate?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;
  const storedStammdaten = await getStammdaten();
  const stammdaten = storedStammdaten ?? defaultStammdaten();
  const hasCalculated = params.calculate === "1";
  const salaryPeriod = parseSalaryPeriod(params.salaryPeriod);
  const income = resolveNetIncome({
    gross: params.gross,
    taxRate: params.taxRate,
    income: params.income,
    salaryMode: params.salaryMode,
  });
  const monthlyIncome = toMonthlyAmount(parseAmount(income), salaryPeriod);
  const monthlyGross = toMonthlyAmount(parseAmount(params.gross), salaryPeriod);
  const extraIncomes = parseExtraIncomeRows(params.extraType, params.extraAmount);
  const extraTotals = extraIncomeMonthlyTotals(
    extraIncomes,
    salaryPeriod,
    resolvePersonalTaxRate({
      taxRate: params.taxRate,
      gross: params.gross,
      income,
    })
  );
  const coldRent = params.coldRent ?? "";
  const utilities = params.utilities ?? "";
  const groceries = params.groceries ?? "";
  const mobility = params.mobility ?? "";
  const insurance = params.insurance ?? "";
  const telecom = params.telecom ?? "";
  const raiseEvery = parseRaiseInterval(params.raiseEvery);
  const inflation = storedStammdaten
    ? storedStammdaten.inflation
    : parseRate(params.inflation, DEFAULT_INFLATION);
  const marketReturn = storedStammdaten
    ? storedStammdaten.marketReturn
    : parseRate(params.marketReturn, DEFAULT_MARKET_RETURN);
  const propertyReturn = storedStammdaten
    ? storedStammdaten.propertyReturn
    : parseRate(params.propertyReturn, DEFAULT_PROPERTY_RETURN);
  const cashReturn = storedStammdaten
    ? storedStammdaten.cashReturn
    : parseRate(params.cashReturn, DEFAULT_CASH_RETURN);
  const rentalYield = storedStammdaten
    ? storedStammdaten.rentalYield
    : parseRate(params.rentalYield, DEFAULT_RENTAL_YIELD);

  const result = hasCalculated
    ? calculateCostOfLiving({
        monthlyIncome,
        grossMonthly: monthlyGross,
        extraMonthlyNet: extraTotals.net,
        extraMonthlyGross: extraTotals.gross,
        coldRent: parseAmount(coldRent) || 0,
        utilities: parseAmount(utilities) || 0,
        groceries: parseAmount(groceries) || 0,
        mobility: parseAmount(mobility) || 0,
        insurance: parseAmount(insurance) || 0,
        telecom: parseAmount(telecom) || 0,
        raisePercent: parseAmount(params.raisePercent),
        raiseEveryYears: raiseEvery,
      })
    : null;

  return (
    <>
      <Header locale={locale} />
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <CostCalculator
          key={locale}
          locale={locale}
          defaultSalaryMode={params.salaryMode}
          defaultSalaryPeriod={salaryPeriod}
          defaultGross={formatAmountInput(params.gross, locale)}
          defaultTaxRate={formatAmountInput(params.taxRate, locale)}
          defaultIncome={formatAmountInput(income, locale)}
          defaultColdRent={formatAmountInput(coldRent, locale)}
          defaultUtilities={formatAmountInput(utilities, locale)}
          defaultGroceries={formatAmountInput(groceries, locale)}
          defaultMobility={formatAmountInput(mobility, locale)}
          defaultInsurance={formatAmountInput(insurance, locale)}
          defaultTelecom={formatAmountInput(telecom, locale)}
          defaultRaisePercent={formatAmountInput(params.raisePercent, locale)}
          defaultRaiseEvery={raiseEvery}
          defaultInflation={formatAmountInput(String(inflation), locale)}
          defaultMarketReturn={formatAmountInput(String(marketReturn), locale)}
          defaultPropertyReturn={formatAmountInput(
            String(propertyReturn),
            locale
          )}
          defaultCashReturn={formatAmountInput(String(cashReturn), locale)}
          defaultRentalYield={formatAmountInput(String(rentalYield), locale)}
          defaultExtraIncomes={extraIncomes.map((row) => ({
            ...row,
            amount: formatAmountInput(row.amount, locale),
          }))}
          stammdaten={stammdaten}
        />

        <div className="min-w-0 flex-1 px-5 py-8 text-left lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-10">
          <h1 className="font-[family-name:var(--font-inter-display)] text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            {t.home.title}
          </h1>

          <div className="mt-8 w-full max-w-4xl">
            {hasCalculated && result && (
              <ResultPanel
                result={result}
                locale={locale}
                raisePercent={parseAmount(params.raisePercent)}
                raiseEveryYears={raiseEvery}
                defaultView={params.view}
                defaultHorizon={parseHorizon(params.horizon)}
                inflationPercent={inflation}
                rates={{
                  marketReturn,
                  propertyReturn,
                  cashReturn,
                  rentalYield,
                }}
                defaultSavingsRate={params.savingsRate}
              />
            )}

            {hasCalculated && !result && (
              <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border bg-surface p-6">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t.home.incomeRequired}
                </p>
              </div>
            )}

            {!hasCalculated && (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
                <p className="text-sm font-medium text-foreground">
                  {t.home.result}
                </p>
                <p className="mt-2 max-w-xs text-sm text-muted">
                  {t.home.resultHint}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
