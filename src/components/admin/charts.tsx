import React, { useState } from 'react';

export interface ChartDatum {
  key: string;
  label: string;
  value: number;
  /** Optional longer label used in the tooltip / table (e.g. full date). */
  fullLabel?: string;
}

/** Rounds the axis max up so the half-way gridline is a whole number. */
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * step);
  const top = candidates.find((c) => c >= max) ?? 10 * step;
  return top % 2 === 0 ? top : top * 2;
}

/**
 * Single-series column chart (magnitude over time).
 * One brand hue, thin columns with a 4px rounded data end on the baseline,
 * recessive gridlines, per-column hover/focus tooltip, and a screen-reader table.
 */
export const ColumnChart: React.FC<{
  data: ChartDatum[];
  valueLabel: string;
  height?: number;
}> = ({ data, valueLabel, height = 200 }) => {
  const [active, setActive] = useState<number | null>(null);
  const top = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [top, top / 2, 0];
  const labelEvery = data.length > 10 ? 2 : 1;

  return (
    <div>
      <div className="flex gap-2" style={{ height }}>
        {/* Y axis */}
        <div className="relative w-7 shrink-0 text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${(1 - t / top) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative flex-1" onMouseLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden="true"
              className={`absolute left-0 right-0 border-t ${
                t === 0 ? 'border-[#CBD5E1] dark:border-[#334155]' : 'border-dashed border-[#E2E8F0] dark:border-[#1E293B]'
              }`}
              style={{ top: `${(1 - t / top) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end">
            {data.map((d, i) => {
              const pct = (d.value / top) * 100;
              const isActive = active === i;
              return (
                <div
                  key={d.key}
                  className="relative flex-1 h-full flex items-end justify-center outline-none"
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.fullLabel ?? d.label}: ${d.value} ${valueLabel}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                >
                  {d.value > 0 && (
                    <div
                      className={`w-[60%] max-w-[22px] rounded-t-[4px] transition-colors ${
                        isActive
                          ? 'bg-[#047857] dark:bg-[#6EE7B7]'
                          : 'bg-[#059669] dark:bg-[#34D399]'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                  )}

                  {isActive && (
                    <div
                      className="pointer-events-none absolute z-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1.5 rounded-[6px] bg-[#0F172A] dark:bg-[#F8FAFC] text-[#F8FAFC] dark:text-[#0F172A] text-[12px] shadow-lg"
                      style={{ bottom: `calc(${pct}% + 8px)` }}
                    >
                      <div className="font-semibold">{d.fullLabel ?? d.label}</div>
                      <div className="font-mono">
                        {d.value} {valueLabel}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X axis */}
      <div className="flex gap-2 mt-1.5" aria-hidden="true">
        <div className="w-7 shrink-0" />
        <div className="flex flex-1">
          {data.map((d, i) => (
            <div key={d.key} className="flex-1 text-center text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">
              {(data.length - 1 - i) % labelEvery === 0 ? d.label : ''}
            </div>
          ))}
        </div>
      </div>

      <table className="sr-only">
        <thead>
          <tr>
            <th>Day</th>
            <th>{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <td>{d.fullLabel ?? d.label}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Single-series horizontal bar list (ranked categories).
 * Bars anchored left with a 4px rounded data end, value direct-labelled in text ink.
 */
export const BarList: React.FC<{
  data: ChartDatum[];
  valueLabel: string;
  emptyMessage?: string;
}> = ({ data, valueLabel, emptyMessage = 'No activity recorded yet.' }) => {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <p className="py-8 text-center text-[13px] text-[#64748B] dark:text-[#94A3B8]">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li
          key={d.key}
          className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-[12px]"
          title={`${d.fullLabel ?? d.label}: ${d.value} ${valueLabel}`}
        >
          <span className="truncate text-[#475569] dark:text-[#94A3B8]">{d.label}</span>
          <span className="h-2.5 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-r-[4px] overflow-hidden" aria-hidden="true">
            <span
              className="block h-full rounded-r-[4px] bg-[#059669] dark:bg-[#34D399]"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </span>
          <span className="font-mono font-semibold text-[#0F172A] dark:text-[#E2E8F0] tabular-nums text-right min-w-[2.5rem]">
            {d.value}
            <span className="sr-only"> {valueLabel}</span>
          </span>
        </li>
      ))}
    </ul>
  );
};
