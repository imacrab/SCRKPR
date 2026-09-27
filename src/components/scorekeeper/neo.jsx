import FluentEmoji from "./FluentEmoji";
import { RANK_COLORS, toNeoColor } from "@/lib/colors";

export function LogoSticker({ size = "sm", bg = "#FFD23F", className = "", style }) {
  const big = size === "lg";
  return (
    <span
      className={`font-display inline-block border-3 border-ink leading-none text-ink select-none ${big ? "text-2xl px-3 pt-[5px] pb-[7px] rounded-[9px] shadow-neo" : "text-lg px-2.5 pt-1 pb-1.5 rounded-lg shadow-neo-sm"} ${className}`}
      style={{ background: bg, transform: "rotate(-3deg)", ...style }}
    >
      SCRKPR!
    </span>
  );
}

export function SectionLabel({ children, className = "", as: Tag = "div", ...props }) {
  return (
    <Tag className={`font-mono text-xs font-bold tracking-[0.12em] uppercase text-subtle ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function PlayerTile({ emoji, color = "rgb(var(--surface))", size = 48, radius, border = 3, rotate = 0, className = "", children }) {
  return (
    <span
      className={`flex-shrink-0 flex items-center justify-center text-ink border-ink ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: border,
        borderRadius: radius ?? Math.round(size * 0.23),
        background: color,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      {children ?? (emoji ? <FluentEmoji emoji={emoji} size={Math.round((size - border * 2) * 0.8)} /> : null)}
    </span>
  );
}

export function SegmentedControl({ options, value, onChange, height = 44, className = "" }) {
  return (
    <div
      role="tablist"
      className={`grid border-3 border-ink rounded-xl overflow-hidden bg-surface ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(({ id, label, icon }, i) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex items-center justify-center gap-2 text-base font-extrabold transition-colors duration-150 ${i > 0 ? "border-l-3 border-ink" : ""} ${active ? "bg-ink text-sun" : "bg-surface text-fg"}`}
            style={{ height }}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Tag({ children, bg = "#FFD23F", rotate = -4, className = "", style }) {
  return (
    <span
      className={`font-mono inline-flex items-center gap-1.5 px-2 py-[3px] border-2.5 border-ink rounded-[7px] text-[11px] font-bold tracking-[0.08em] uppercase text-ink leading-none ${className}`}
      style={{ background: bg, transform: `rotate(${rotate}deg)`, ...style }}
    >
      {children}
    </span>
  );
}

export function CrownGlyph({ width = 14, height = 11 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 42 32" aria-hidden="true">
      <path d="M5 27 L3 7 L13 15 L21 3 L29 15 L39 7 L37 27 Z" fill="currentColor" />
    </svg>
  );
}

export function RankBadge({ rank }) {
  return (
    <span
      className="font-mono w-6 h-6 flex-shrink-0 flex items-center justify-center border-2 border-ink rounded-md text-xs font-bold"
      style={{ background: RANK_COLORS[rank - 1] || "rgb(var(--surface))", color: rank <= RANK_COLORS.length ? "rgb(var(--ink))" : undefined }}
    >
      {rank}
    </span>
  );
}

export function ColorChip({ color, size = 18, radius = 5 }) {
  return (
    <span
      className="flex-shrink-0 border-2 border-ink"
      style={{ width: size, height: size, borderRadius: radius, background: toNeoColor(color) }}
    />
  );
}

export function StandingRow({ rank, color, name, total, height = 40 }) {
  return (
    <div
      className="flex items-center gap-2.5 pl-2 pr-3 bg-surface text-fg border-2.5 border-ink rounded-[10px]"
      style={{ height }}
    >
      <RankBadge rank={rank} />
      <ColorChip color={color} />
      <span className="flex-1 min-w-0 truncate text-base font-bold">{name}</span>
      <span className="font-display text-lg">{total}</span>
    </div>
  );
}

export function StatTile({ label, value }) {
  return (
    <div className="px-3 py-2.5 bg-surface text-fg border-2.5 border-ink rounded-xl min-w-0">
      <div className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-subtle">{label}</div>
      <div className="mt-1 text-base font-extrabold truncate">{value}</div>
    </div>
  );
}

export const PAGE_TOP = "max(calc(env(safe-area-inset-top) + 8px), 44px)";

export function PageTitle({ children, className = "" }) {
  return <h1 className={`font-display m-0 text-[30px] leading-none uppercase ${className}`}>{children}</h1>;
}

export function HeaderLink({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`h-11 px-1 text-base font-extrabold underline decoration-2 underline-offset-4 text-fg ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function WinnerCard({ label, date, sorted, isTie, modeLabel, className = "" }) {
  const winner = sorted[0];
  const tiedNames = sorted.filter((p) => p.total === winner.total).map((p) => p.name).join(" & ");
  return (
    <div
      className={`mr-1.5 p-4 border-3 border-ink rounded-[18px] shadow-neo-lg ${className}`}
      style={{ background: isTie ? "rgb(var(--surface))" : toNeoColor(winner.color), color: isTie ? "rgb(var(--fg))" : "rgb(var(--ink))" }}
    >
      <div className="font-mono flex justify-between gap-3 text-[11px] font-bold tracking-[0.1em] uppercase">
        <span>{label}</span>
        <span>{date}</span>
      </div>
      <div className="mt-3.5 flex items-center gap-3.5">
        <div className="relative flex-shrink-0">
          <PlayerTile emoji={isTie ? "🤝" : winner.emoji || "🏆"} color="#FFFFFF" size={62} radius={14} />
          <span className="absolute -right-2.5 -bottom-2 w-[30px] h-[30px] flex items-center justify-center bg-sun text-ink border-2.5 border-ink rounded-full">
            <FluentEmoji emoji="🏆" size={16} />
          </span>
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">{isTie ? "It's a tie" : "Winner"}</div>
          <div className="font-display text-[30px] leading-[1.1] uppercase truncate">{isTie ? tiedNames : winner.name}</div>
          <div className="mt-0.5 text-sm font-bold">{winner.total} pts · {modeLabel}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {sorted.map((p, i) => (
          <StandingRow
            key={`${i}-${p.name}`}
            rank={isTie && p.total === winner.total ? 1 : i + 1}
            color={p.color}
            name={p.name}
            total={p.total}
            height={42}
          />
        ))}
      </div>
    </div>
  );
}
