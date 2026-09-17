import { setLocaleFromForm } from "@/app/set-locale";
import { getDictionary, type Locale } from "@/lib/i18n";

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <details className="group relative">
      <summary
        className="flex h-8 cursor-pointer list-none items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-muted transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden"
        aria-label={t.language.label}
      >
        {locale.toUpperCase()}
        <ChevronIcon />
      </summary>
      <ul
        className="absolute right-0 z-[60] mt-1 hidden min-w-36 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-[0_8px_24px_var(--shadow)] group-open:block"
        aria-label={t.language.label}
      >
        {(["de", "en"] as const).map((option) => (
          <li key={option}>
            <form action={setLocaleFromForm}>
              <input type="hidden" name="locale" value={option} />
              <button
                type="submit"
                className={`flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface ${
                  option === locale
                    ? "font-medium text-foreground"
                    : "text-muted"
                }`}
              >
                {t.language[option]}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </details>
  );
}
