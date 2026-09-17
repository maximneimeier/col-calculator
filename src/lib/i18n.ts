export const locales = ["de", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export const localeCookie = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "de" || value === "en";
}

const dictionaries = {
  de: {
    meta: {
      title: "COL Calculator — Lebenshaltungskosten vergleichen",
      description:
        "Vergleiche Lebenshaltungskosten zwischen Städten und finde heraus, wie viel du wo brauchst.",
    },
    language: {
      label: "Sprache",
      de: "Deutsch",
      en: "English",
    },
    theme: {
      toggle: "Hell/Dunkel umschalten",
      toLight: "Zu Light Mode wechseln",
      toDark: "Zu Dark Mode wechseln",
    },
    home: {
      title: "Lebenshaltungskosten",
      result: "Ergebnis",
      resultHint:
        "Trage deine Kosten ein und klicke auf Berechnen — hier erscheint die Aufschlüsselung.",
      incomeRequired: "Bitte Nettoeinkommen eingeben.",
      tabCosts: "Kosten",
      tabGrowth: "Lohnentwicklung",
    },
    form: {
      income: "Einkommen",
      salary: "Gehalt",
      salaryHint:
        "Gib die steuerliche Abgabenlast oder das Nettogehalt an — nicht beides gleichzeitig.",
      salaryMode: "Angabe",
      viaTaxRate: "Abgabenlast",
      viaNet: "Nettolohn",
      livingCosts: "Lebenshaltungskosten",
      gross: "Bruttolohn",
      taxRate: "Steuerliche Abgabenlast",
      percent: "%",
      netIncome: "Nettolohn",
      raise: "Lohnsteigerung",
      raiseInterval: "Rhythmus",
      raiseYearly: "Jährlich",
      raiseEvery2: "Alle 2 Jahre",
      raiseEvery3: "Alle 3 Jahre",
      raiseYearlyShort: "1 J.",
      raiseEvery2Short: "2 J.",
      raiseEvery3Short: "3 J.",
      housing: "Wohnen",
      coldRent: "Kaltmiete",
      utilities: "Mietnebenkosten",
      fixedCosts: "Fixkosten",
      groceries: "Lebensmittel",
      mobility: "Mobilität",
      insurance: "Versicherungen",
      telecom: "Telekommunikation",
      perMonth: "€ / Monat",
      perMonthChf: "CHF / Monat",
      calculate: "Berechnen",
    },
    payroll: {
      title: "Brutto-Netto",
      country: "Land",
      germany: "Deutschland",
      austria: "Österreich",
      switzerland: "Schweiz",
      gross: "Bruttolohn",
      churchTax: "Kirchensteuer",
      children: "Kinder",
      canton: "Kanton",
      region: "Bundesland",
      vienna: "Wien",
      otherStates: "Andere Bundesländer",
      employeeDeductions: "Abzüge Arbeitnehmer",
      taxes: "Steuern",
      employerContributions: "Abgaben Arbeitgeber",
      employerCost: "Arbeitgeberkosten",
      disclaimer:
        "Schätzung für 2026. Deutschland: Steuerklasse I, gesetzlich versichert. Österreich: inkl. anteiligem 13./14. Gehalt. Kein Ersatz für eine Lohnabrechnung.",
      lines: {
        incomeTax: "Einkommensteuer",
        soli: "Solidaritätszuschlag",
        church: "Kirchensteuer",
        pension: "Rentenversicherung",
        unemployment: "Arbeitslosenversicherung",
        health: "Krankenversicherung",
        care: "Pflegeversicherung",
        accident: "Unfallversicherung",
        chamber: "Arbeiterkammerumlage",
        housingFund: "Wohnbauförderung",
        insolvency: "Insolvenzentgeltfonds",
        severance: "Mitarbeitervorsorge",
        employerLevy: "DB, DZ & Kommunalsteuer",
        levies: "Umlagen & Unfallversicherung",
        ahv: "AHV / IV / EO",
        alv: "ALV",
        nbu: "NBU",
        bvg: "BVG (Schätzung)",
        fak: "Familienausgleich",
        federalTax: "Direkte Bundessteuer",
        cantonalTax: "Kantons- und Gemeindesteuer",
      },
    },
    chart: {
      breakdown: "Kostenaufschlüsselung",
      gross: "Brutto",
      net: "Netto",
      tax: "Steuern & Abgaben",
      remainingAfter: "Übrig nach Abzug",
      overspent: "Deine Kosten übersteigen dein Nettoeinkommen.",
      raiseAfter: "Nach der nächsten Erhöhung",
      raiseAnnualized: "Annualisiert",
      perYear: "pro Jahr",
      growthYears: "Jahre",
      growthHint:
        "Brutto und Netto über die nächsten Jahre, mit deiner Lohnsteigerung.",
    },
    segments: {
      "cold-rent": "Kaltmiete",
      utilities: "Mietnebenkosten",
      groceries: "Lebensmittel",
      mobility: "Mobilität",
      insurance: "Versicherungen",
      telecom: "Telekommunikation",
      remaining: "Übrig",
    },
  },
  en: {
    meta: {
      title: "COL Calculator — Compare cost of living",
      description:
        "Compare cost of living between cities and see how much you need where.",
    },
    language: {
      label: "Language",
      de: "Deutsch",
      en: "English",
    },
    theme: {
      toggle: "Toggle light/dark mode",
      toLight: "Switch to light mode",
      toDark: "Switch to dark mode",
    },
    home: {
      title: "Cost of living",
      result: "Result",
      resultHint:
        "Enter your costs and click Calculate — the breakdown will appear here.",
      incomeRequired: "Please enter your net income.",
      tabCosts: "Costs",
      tabGrowth: "Pay growth",
    },
    form: {
      income: "Income",
      salary: "Salary",
      salaryHint:
        "Enter either the tax burden or net salary — not both at once.",
      salaryMode: "Use",
      viaTaxRate: "Tax burden",
      viaNet: "Net salary",
      livingCosts: "Cost of living",
      gross: "Gross salary",
      taxRate: "Tax burden",
      percent: "%",
      netIncome: "Net salary",
      raise: "Salary increase",
      raiseInterval: "Cadence",
      raiseYearly: "Yearly",
      raiseEvery2: "Every 2 years",
      raiseEvery3: "Every 3 years",
      raiseYearlyShort: "1 yr",
      raiseEvery2Short: "2 yr",
      raiseEvery3Short: "3 yr",
      housing: "Housing",
      coldRent: "Base rent",
      utilities: "Utilities",
      fixedCosts: "Fixed costs",
      groceries: "Groceries",
      mobility: "Transport",
      insurance: "Insurance",
      telecom: "Telecom",
      perMonth: "€ / month",
      perMonthChf: "CHF / month",
      calculate: "Calculate",
    },
    payroll: {
      title: "Gross to net",
      country: "Country",
      germany: "Germany",
      austria: "Austria",
      switzerland: "Switzerland",
      gross: "Gross salary",
      churchTax: "Church tax",
      children: "Children",
      canton: "Canton",
      region: "State",
      vienna: "Vienna",
      otherStates: "Other states",
      employeeDeductions: "Employee deductions",
      taxes: "Taxes",
      employerContributions: "Employer contributions",
      employerCost: "Employer cost",
      disclaimer:
        "2026 estimate. Germany: tax class I, statutory insurance. Austria: includes prorated 13th/14th salary. Not a payslip.",
      lines: {
        incomeTax: "Income tax",
        soli: "Solidarity surcharge",
        church: "Church tax",
        pension: "Pension insurance",
        unemployment: "Unemployment insurance",
        health: "Health insurance",
        care: "Long-term care",
        accident: "Accident insurance",
        chamber: "Chamber of labour",
        housingFund: "Housing subsidy",
        insolvency: "Insolvency fund",
        severance: "Severance fund",
        employerLevy: "Employer levies & municipal tax",
        levies: "Levies & accident insurance",
        ahv: "AHV / IV / EO",
        alv: "Unemployment insurance",
        nbu: "Non-occupational accident",
        bvg: "Pension fund (estimate)",
        fak: "Family allowance",
        federalTax: "Federal tax",
        cantonalTax: "Cantonal and municipal tax",
      },
    },
    chart: {
      breakdown: "Cost breakdown",
      gross: "Gross",
      net: "Net",
      tax: "Taxes & deductions",
      remainingAfter: "Remaining after expenses",
      overspent: "Your expenses exceed your net income.",
      raiseAfter: "After the next raise",
      raiseAnnualized: "Annualized",
      perYear: "per year",
      growthYears: "Years",
      growthHint:
        "Gross and net over the coming years, using your salary increase.",
    },
    segments: {
      "cold-rent": "Base rent",
      utilities: "Utilities",
      groceries: "Groceries",
      mobility: "Transport",
      insurance: "Insurance",
      telecom: "Telecom",
      remaining: "Left over",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function numberLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "de-DE";
}
