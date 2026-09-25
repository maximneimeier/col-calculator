import { cookies } from "next/headers";
import {
  DEFAULT_CASH_RETURN,
  DEFAULT_INFLATION,
  DEFAULT_MARKET_RETURN,
  DEFAULT_PROPERTY_RETURN,
  DEFAULT_RENTAL_YIELD,
  parseRate,
} from "@/lib/cost-of-living";

export const stammdatenCookie = "stammdaten";

export type Stammdaten = {
  inflation: number;
  marketReturn: number;
  propertyReturn: number;
  cashReturn: number;
  rentalYield: number;
};

export function defaultStammdaten(): Stammdaten {
  return {
    inflation: DEFAULT_INFLATION,
    marketReturn: DEFAULT_MARKET_RETURN,
    propertyReturn: DEFAULT_PROPERTY_RETURN,
    cashReturn: DEFAULT_CASH_RETURN,
    rentalYield: DEFAULT_RENTAL_YIELD,
  };
}

export function parseStammdaten(raw: string | undefined | null): Stammdaten {
  const fallback = defaultStammdaten();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof Stammdaten, unknown>>;
    return {
      inflation: parseRate(String(parsed.inflation ?? ""), fallback.inflation),
      marketReturn: parseRate(
        String(parsed.marketReturn ?? ""),
        fallback.marketReturn
      ),
      propertyReturn: parseRate(
        String(parsed.propertyReturn ?? ""),
        fallback.propertyReturn
      ),
      cashReturn: parseRate(String(parsed.cashReturn ?? ""), fallback.cashReturn),
      rentalYield: parseRate(
        String(parsed.rentalYield ?? ""),
        fallback.rentalYield
      ),
    };
  } catch {
    return fallback;
  }
}

export async function getStammdaten(): Promise<Stammdaten | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(stammdatenCookie)?.value;
  if (!raw) return null;
  return parseStammdaten(raw);
}
