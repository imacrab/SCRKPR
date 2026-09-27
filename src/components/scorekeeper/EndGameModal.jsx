import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { fireNeoConfetti } from "@/lib/neoConfetti";
import { Button } from "@/components/ui/button";
import { isLowMode, getModeMeta } from "@/lib/gameModes";
import NeoIcon from "./NeoIcon";
import BottomSheetModal from "./BottomSheetModal";
import { toNeoColor } from "@/lib/colors";
import { PlayerTile, Tag, CrownGlyph, StandingRow, StatTile, SectionLabel } from "./neo";
import { SPRING_SHEET } from "@/lib/motion";
import { useWideLayout } from "@/lib/useWideLayout";

export default function EndGameModal({ isOpen, players, winMode, gameStartTime, onConfirm, onCancel, isConfirming = false }) {
  const wide = useWideLayout();
  useEffect(() => {
    if (!isOpen || players.length === 0) return;

    const lowWin = isLowMode(winMode);
    const ranked = [...players]
      .map((p) => ({ ...p, total: p.scores.reduce((s, n) => s + n, 0) }))
      .sort((a, b) => (lowWin ? a.total - b.total : b.total - a.total));
    const isTied = ranked.length > 1 && ranked[0].total === ranked[1].total;
    return fireNeoConfetti({ icon: !isTied ? ranked[0]?.emoji : null });
  }, [isOpen, players, winMode]);

  const hasPlayers = isOpen && players.length > 0;

  const isLowWin = isLowMode(winMode);
  const sorted = hasPlayers
    ? [...players]
        .map((p) => ({ ...p, total: p.scores.reduce((s, n) => s + n, 0) }))
        .sort((a, b) => isLowWin ? a.total - b.total : b.total - a.total)
    : [];

  const topScore = sorted[0]?.total ?? 0;
  const tied = sorted.filter((p) => p.total === topScore);
  const isTie = tied.length > 1;
  const winner = sorted[0];
  const modeMeta = getModeMeta(winMode);

  const totalRounds = hasPlayers
    ? players.reduce((sum, p) => sum + p.scores.length, 0) / players.length
    : 0;
  const roundsWon = {};
  players.forEach((p) => { roundsWon[p.id] = p.scores.length; });
  const roundsWonEntries = Object.entries(roundsWon);
  const playerWithMostRounds = roundsWonEntries.length > 0
    ? roundsWonEntries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
    : null;
  const mostRoundsPlayer = players.find((p) => p.id == playerWithMostRounds);

  const loserPlayer = sorted[sorted.length - 1];

  const elapsedMs = gameStartTime ? new Date() - gameStartTime : 0;
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);

  // Swish-only stats:
  //  • Went-out-most: player with the most rounds scoring exactly 0 ("going out")
  //  • Worst round : the single highest one-round score across the whole game
  const isSwish = winMode === "swish";
  let wentOutPlayer = null;
  let wentOutCount = 0;
  let worstRoundPlayer = null;
  let worstRoundScore = -Infinity;
  let worstRoundNumber = 0;
  if (isSwish && hasPlayers) {
    players.forEach((p) => {
      const zeros = p.scores.filter((s) => s === 0).length;
      if (zeros > wentOutCount) { wentOutCount = zeros; wentOutPlayer = p; }
    });
    players.forEach((p) => {
      p.scores.forEach((s, idx) => {
        if (s > worstRoundScore) {
          worstRoundScore = s;
          worstRoundPlayer = p;
          worstRoundNumber = idx + 1;
        }
      });
    });
  }

  const stats = isSwish
    ? [
        ["Went out most", wentOutPlayer ? `${wentOutPlayer.name} · ${wentOutCount}` : "—"],
        ["Worst round", worstRoundPlayer ? `${worstRoundPlayer.name} · R${worstRoundNumber} (${worstRoundScore})` : "—"],
        ["Rounds", Math.round(totalRounds)],
        ["Time", `${minutes}m ${seconds}s`],
      ]
    : [
        ["Most rounds", mostRoundsPlayer?.name ?? "—"],
        ["Worst score", loserPlayer ? `${loserPlayer.name} · ${loserPlayer.total}` : "—"],
        ["Rounds", Math.round(totalRounds)],
        ["Time", `${minutes}m ${seconds}s`],
      ];

  const actions = (
    <div className="grid grid-cols-2 gap-3.5">
      <Button onClick={onCancel} disabled={isConfirming} variant="outline">
        Keep playing
      </Button>
      <Button onClick={onConfirm} disabled={isConfirming} variant="success">
        <Check size={20} strokeWidth={3} />
        End game
      </Button>
    </div>
  );

  const winnerCard = (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING_SHEET, delay: 0.1 }}
      className="relative mt-5 mr-[5px] flex items-center gap-3.5 px-4 py-[18px] border-3 border-ink rounded-2xl shadow-neo-md"
      style={{ background: isTie ? "rgb(var(--surface))" : toNeoColor(winner?.color) }}
    >
      <span className="absolute -top-[15px] right-4">
        <Tag rotate={4}>{isTie ? "It's a tie" : <><CrownGlyph />Winner</>}</Tag>
      </span>
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.25 }}
      >
        <PlayerTile color="#FFFFFF" size={66} radius={15}>
          <motion.span
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ delay: 0.7, duration: 0.8, ease: "easeInOut" }}
            className="flex"
          >
            <NeoIcon name={isTie ? "handshake" : winner?.emoji || "trophy"} knockout="#FFFFFF" size={40} />
          </motion.span>
        </PlayerTile>
      </motion.div>
      <div className="min-w-0">
        <h2 className="font-display m-0 text-[34px] leading-[1.05] uppercase truncate">
          {isTie ? tied.map((p) => p.name).join(" & ") : winner?.name}
        </h2>
        <p className="mt-1 text-[15px] font-bold">
          {winner?.total ?? 0} pts · {modeMeta.label}
        </p>
      </div>
    </motion.div>
  );

  const standings = (
    <div className="mt-[18px] flex flex-col gap-1.5">
      {sorted.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING_SHEET, delay: 0.35 + i * 0.07 }}
        >
          <StandingRow rank={isTie && p.total === topScore ? 1 : i + 1} color={p.color} name={p.name} total={p.total} />
        </motion.div>
      ))}
    </div>
  );

  const statTiles = (
    <div className="grid grid-cols-2 gap-2.5">
      {stats.map(([label, value]) => (
        <StatTile key={label} label={label} value={value} />
      ))}
    </div>
  );

  if (wide) {
    return (
      <BottomSheetModal isOpen={hasPlayers} onClose={onCancel} scrollable wideMaxWidth={820}>
        <div className="grid grid-cols-2 gap-8 pl-3 pr-2 pb-5">
          <div className="min-w-0">
            {winnerCard}
            {standings}
          </div>
          <div className="min-w-0 mt-5 flex flex-col">
            <SectionLabel className="mb-3">Game stats</SectionLabel>
            {statTiles}
            <div className="flex-1 min-h-8" />
            {actions}
          </div>
        </div>
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal isOpen={hasPlayers} onClose={onCancel} scrollable footer={actions}>
      {winnerCard}
      {standings}
      <div className="mt-4 mb-1">{statTiles}</div>
    </BottomSheetModal>
  );
}
