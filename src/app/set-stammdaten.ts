"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { parseRate } from "@/lib/cost-of-living";
import {
  defaultStammdaten,
  stammdatenCookie,
} from "@/lib/stammdaten";

export async function setStammdatenFromForm(formData: FormData) {
  const fallback = defaultStammdaten();
  const next = {
    inflation: parseRate(String(formData.get("inflation") ?? ""), fallback.inflation),
    marketReturn: parseRate(
      String(formData.get("marketReturn") ?? ""),
      fallback.marketReturn
    ),
    propertyReturn: parseRate(
      String(formData.get("propertyReturn") ?? ""),
      fallback.propertyReturn
    ),
    cashReturn: parseRate(
      String(formData.get("cashReturn") ?? ""),
      fallback.cashReturn
    ),
    rentalYield: parseRate(
      String(formData.get("rentalYield") ?? ""),
      fallback.rentalYield
    ),
  };

  const cookieStore = await cookies();
  cookieStore.set(stammdatenCookie, JSON.stringify(next), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
