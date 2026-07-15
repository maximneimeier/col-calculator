import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "COL Calculator — Lebenshaltungskosten vergleichen",
  description:
    "Vergleiche Lebenshaltungskosten zwischen Städten und finde heraus, wie viel du wo brauchst.",
};

const themeScript = `
(function () {
  var sun =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"></circle>' +
    '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>' +
    "</svg>";
  var moon =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 6.5 6.5 0 0 0 21 14.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>' +
    "</svg>";

  function isDark() {
    return document.documentElement.classList.contains("dark");
  }

  function applyTheme(dark) {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }

  function updateButton() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var dark = isDark();
    btn.innerHTML = dark ? sun : moon;
    btn.setAttribute(
      "aria-label",
      dark ? "Zu Light Mode wechseln" : "Zu Dark Mode wechseln"
    );
  }

  try {
    var stored = localStorage.getItem("theme");
    var dark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyTheme(dark);
  } catch (e) {}

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    if (!target.closest("#theme-toggle")) return;
    event.preventDefault();
    applyTheme(!isDark());
    updateButton();
  });

  function init() {
    updateButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  setTimeout(init, 50);
  setTimeout(init, 300);
})();
`;

const amountFormatScript = `
(function () {
  function parseAmount(value) {
    if (!value) return NaN;
    return parseFloat(String(value).replace(/\\./g, "").replace(",", "."));
  }

  function formatAmount(value) {
    var num = parseAmount(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }

  function formatInput(input) {
    if (!input.value.trim()) return;
    input.value = formatAmount(input.value);
  }

  function formatAllInputs() {
    document.querySelectorAll("[data-amount-input]").forEach(formatInput);
  }

  document.addEventListener(
    "blur",
    function (event) {
      var target = event.target;
      if (!target || !target.matches || !target.matches("[data-amount-input]")) {
        return;
      }
      formatInput(target);
    },
    true
  );

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !form.querySelectorAll) return;
    form.querySelectorAll("[data-amount-input]").forEach(formatInput);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", formatAllInputs);
  } else {
    formatAllInputs();
  }

  setTimeout(formatAllInputs, 50);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${interDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Script id="amount-format-script" strategy="beforeInteractive">
          {amountFormatScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
