import { formatCurrency, type WealthYearPoint } from "@/lib/cost-of-living";
import { getDictionary, numberLocale, type Locale } from "@/lib/i18n";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 300;
const PLOT_LEFT = 56;
const PLOT_RIGHT = 624;
const PLOT_TOP = 20;
const PLOT_BOTTOM = 252;

function axisTicks(max: number): number[] {
  const raw = max / 4 || 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const residual = raw / magnitude;
  const step =
    residual >= 5 ? 5 * magnitude : residual >= 2 ? 2 * magnitude : magnitude;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) {
    ticks.push(Math.round(value));
  }
  return ticks;
}

function stackParts(point: WealthYearPoint) {
  const deposited = Math.min(
    Math.max(0, point.cumulativeContribution),
    Math.max(0, point.wealth)
  );
  const interest = Math.max(0, point.wealth - deposited);
  return { deposited, interest };
}

export function WealthChart({
  points,
  locale,
}: {
  points: WealthYearPoint[];
  locale: Locale;
}) {
  const t = getDictionary(locale);
  if (points.length === 0) return null;

  const maxValue = Math.max(...points.map((point) => point.wealth), 1);
  const padding = maxValue * 0.08;
  const domainMax = maxValue + padding;
  const ticks = axisTicks(domainMax);
  const groupWidth = (PLOT_RIGHT - PLOT_LEFT) / points.length;
  const barWidth = Math.min(36, Math.max(8, groupWidth * 0.56));
  const labelEvery = points.length > 12 ? 2 : 1;

  function xCenter(index: number) {
    return PLOT_LEFT + groupWidth * index + groupWidth / 2;
  }

  function y(value: number) {
    return PLOT_BOTTOM - (value / domainMax) * (PLOT_BOTTOM - PLOT_TOP);
  }

  const last = points[points.length - 1];
  const lastStack = stackParts(last);
  const ariaLabel = `${t.home.tabWealth}. ${t.chart.saved}: ${formatCurrency(last.cumulativeContribution, locale)}. ${t.chart.interest}: ${formatCurrency(lastStack.interest, locale)}. ${t.chart.wealth}: ${formatCurrency(last.wealth, locale)}.`;

  return (
    <div className="relative mt-4">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full overflow-visible"
        role="img"
        aria-label={ariaLabel}
      >
        {ticks.map((tick) => {
          const tickY = y(tick);
          return (
            <g key={`tick-${tick}`}>
              <line
                x1={PLOT_LEFT}
                x2={PLOT_RIGHT}
                y1={tickY}
                y2={tickY}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={PLOT_LEFT - 8}
                y={tickY + 4}
                textAnchor="end"
                className="fill-muted"
                fontSize="10"
              >
                {new Intl.NumberFormat(numberLocale(locale), {
                  maximumFractionDigits: 0,
                }).format(tick)}
              </text>
            </g>
          );
        })}

        <line
          x1={PLOT_LEFT}
          x2={PLOT_LEFT}
          y1={PLOT_TOP}
          y2={PLOT_BOTTOM}
          stroke="var(--border)"
          strokeWidth="1"
        />
        <line
          x1={PLOT_LEFT}
          x2={PLOT_RIGHT}
          y1={PLOT_BOTTOM}
          y2={PLOT_BOTTOM}
          stroke="var(--border)"
          strokeWidth="1"
        />

        {points.map((point, index) => {
          const { deposited, interest } = stackParts(point);
          const center = xCenter(index);
          const x = center - barWidth / 2;
          const wealthTop = y(point.wealth);
          const depositTop = y(deposited);
          const wealthHeight = Math.max(PLOT_BOTTOM - wealthTop, 0);
          const depositHeight = Math.max(PLOT_BOTTOM - depositTop, 0);

          return (
            <g key={point.calendarYear}>
              {interest > 0 && wealthHeight > 0 && (
                <rect
                  x={x}
                  y={wealthTop}
                  width={barWidth}
                  height={wealthHeight}
                  rx="3"
                  fill="var(--interest)"
                />
              )}
              {deposited > 0 && depositHeight > 0 && (
                <rect
                  x={x}
                  y={depositTop}
                  width={barWidth}
                  height={depositHeight}
                  rx={interest > 0 ? 0 : 3}
                  fill="var(--accent)"
                />
              )}
              {index % labelEvery === 0 && (
                <text
                  x={center}
                  y={PLOT_BOTTOM + 16}
                  textAnchor="middle"
                  className="fill-muted"
                  fontSize="10"
                >
                  {point.calendarYear}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0">
        {points.map((point, index) => {
          const { deposited, interest } = stackParts(point);
          const left = ((PLOT_LEFT + groupWidth * index) / VIEW_WIDTH) * 100;
          const width = (groupWidth / VIEW_WIDTH) * 100;
          const top = (PLOT_TOP / VIEW_HEIGHT) * 100;
          const height = ((PLOT_BOTTOM - PLOT_TOP + 20) / VIEW_HEIGHT) * 100;
          const edge =
            index === 0
              ? "left-0"
              : index === points.length - 1
                ? "right-0"
                : "left-1/2 -translate-x-1/2";

          return (
            <div
              key={point.calendarYear}
              className="group absolute cursor-crosshair"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top: `${top}%`,
                height: `${height}%`,
              }}
            >
              <div className="absolute inset-0 rounded-sm bg-foreground/0 group-hover:bg-foreground/[0.06]" />
              <div
                className={`pointer-events-none absolute top-2 z-20 min-w-36 rounded-lg border border-border bg-card px-3 py-2 text-left opacity-0 shadow-[0_8px_24px_var(--shadow)] group-hover:opacity-100 ${edge}`}
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {point.calendarYear}
                </p>
                <div className="mt-1.5 space-y-1 text-xs">
                  <p className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-1.5 text-accent">
                      <span className="h-2 w-2 rounded-sm bg-accent" />
                      {t.chart.saved}
                    </span>
                    <span className="font-medium tabular-nums text-accent">
                      {formatCurrency(deposited, locale)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-1.5 text-[var(--interest)]">
                      <span className="h-2 w-2 rounded-sm bg-[var(--interest)]" />
                      {t.chart.interest}
                    </span>
                    <span className="font-medium tabular-nums text-[var(--interest)]">
                      {formatCurrency(interest, locale)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between gap-4">
                    <span className="text-muted">{t.chart.wealth}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCurrency(point.wealth, locale)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
