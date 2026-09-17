import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const interDisplay = Inter({
  variable: "--font-inter-display",
  subsets: ["latin"],
  weight: ["600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return {
    title: t.meta.title,
    description: t.meta.description,
  };
}

const themeInitScript = `(() => {
  if (window.__themeInit) return;
  window.__themeInit = true;
  function isDark() {
    try {
      var stored = localStorage.getItem("theme");
      if (stored === "dark") return true;
      if (stored === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      return false;
    }
  }
  function apply(dark) {
    document.documentElement.classList.toggle("dark", dark);
  }
  apply(isDark());
  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var button = target.closest("#theme-toggle");
    if (!button) return;
    event.preventDefault();
    var next = !document.documentElement.classList.contains("dark");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch (e) {}
    apply(next);
  });
  new MutationObserver(function () {
    apply(isDark());
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${interDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
