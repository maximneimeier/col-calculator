import { cookies } from "next/headers";
import {
  defaultLocale,
  isLocale,
  localeCookie,
  type Locale,
} from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(localeCookie)?.value;
  return isLocale(value) ? value : defaultLocale;
}
