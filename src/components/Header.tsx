import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
            <span className="text-xs font-semibold text-background">C</span>
          </div>
          <span className="text-sm font-medium tracking-tight">
            COL Calculator
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
