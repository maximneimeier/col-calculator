import "dotenv/config";
import { prisma } from "../src/lib/db";

const instruments = [
  {
    name: "DAX",
    type: "Thesaurierender Aktien ETF",
    priceReturn: 8.31,
    dividendYield: 0,
    standardDeviation: 17.0,
    valueAtRisk: 28.0,
    sortOrder: 1,
  },
  {
    name: "MSCI World",
    type: "Thesaurierender Aktien ETF",
    priceReturn: 8.59,
    dividendYield: 0,
    standardDeviation: 14.8,
    valueAtRisk: 21.0,
    sortOrder: 2,
  },
  {
    name: "MSCI World All Countries (ACWI)",
    type: "Thesaurierender Aktien ETF",
    priceReturn: 7.0,
    dividendYield: 0,
    standardDeviation: 15.0,
    valueAtRisk: 25.0,
    sortOrder: 3,
  },
  {
    name: "MSCI Europe",
    type: "Thesaurierender Aktien ETF",
    priceReturn: 5.01,
    dividendYield: 0,
    standardDeviation: 17.0,
    valueAtRisk: 28.0,
    sortOrder: 4,
  },
  {
    name: "S&P 500",
    type: "Thesaurierender Aktien ETF",
    priceReturn: 10.06,
    dividendYield: 0,
    standardDeviation: 14.0,
    valueAtRisk: 23.0,
    sortOrder: 5,
  },
  {
    name: "FTSE All-World High Dividend Yield",
    type: "Ausschüttender Aktien ETF",
    priceReturn: 3.0,
    dividendYield: 3.5,
    standardDeviation: 12.3,
    valueAtRisk: 20.0,
    sortOrder: 6,
  },
  {
    name: "SPDR S&P US Dividend Aristocrats",
    type: "Ausschüttender Aktien ETF",
    priceReturn: 5.5,
    dividendYield: 2.1,
    standardDeviation: 13.0,
    valueAtRisk: 21.0,
    sortOrder: 7,
  },
  {
    name: "STOXX Global Select Dividend 100",
    type: "Ausschüttender Aktien ETF",
    priceReturn: 3.2,
    dividendYield: 4.8,
    standardDeviation: 16.5,
    valueAtRisk: 27.0,
    sortOrder: 8,
  },
  {
    name: "Deutsche Bundesanleihe 10 Jahre",
    type: "Staatsanleihe",
    priceReturn: 2.6,
    dividendYield: 0,
    standardDeviation: 0,
    valueAtRisk: 0,
    sortOrder: 9,
  },
  {
    name: "Euro Government Bond 10Y+ DR UCITS",
    type: "Staatsleihen ETF",
    priceReturn: 2.93,
    dividendYield: 0,
    standardDeviation: 7.95,
    valueAtRisk: 13.12,
    sortOrder: 10,
  },
  {
    name: "Global Govt Bond UCITS ETF",
    type: "Staatsleihen ETF",
    priceReturn: 3.46,
    dividendYield: 0,
    standardDeviation: 8.77,
    valueAtRisk: 14.77,
    sortOrder: 11,
  },
  {
    name: "Bloomberg Global Aggregate Bond UCITS ETF",
    type: "Staatsleihen ETF",
    priceReturn: 3.5,
    dividendYield: 0,
    standardDeviation: 6.3,
    valueAtRisk: 10.39,
    sortOrder: 12,
  },
  {
    name: "Core € Corp Bond UCITS ETF",
    type: "Unternehmensanleihen ETF",
    priceReturn: 3.0,
    dividendYield: 0,
    standardDeviation: 4.98,
    valueAtRisk: 8.22,
    sortOrder: 13,
  },
  {
    name: "EUR Corporate Bond UCITS ETF",
    type: "Unternehmensanleihen ETF",
    priceReturn: 3.01,
    dividendYield: 0,
    standardDeviation: 2.67,
    valueAtRisk: 4.41,
    sortOrder: 14,
  },
  {
    name: "Global Corporate Bond UCITS ETF",
    type: "Unternehmensanleihen ETF",
    priceReturn: 4.4,
    dividendYield: 0,
    standardDeviation: 8.68,
    valueAtRisk: 14.32,
    sortOrder: 15,
  },
];

async function main() {
  for (const instrument of instruments) {
    await prisma.instrument.upsert({
      where: { name: instrument.name },
      update: instrument,
      create: instrument,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
