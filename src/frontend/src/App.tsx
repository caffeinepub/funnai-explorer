import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Database,
  ExternalLink,
  Flame,
  Hash,
  History,
  RefreshCw,
  Search,
  Tag,
  TrendingUp,
  Trophy,
  User,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import {
  type ChallengeType,
  type ChallengeWinnerDeclarationArrayType,
  type DailyMetricType,
  type LeaderboardEntryType,
  type MainerStatsType,
  type TokenRewardsDataType,
  getChallengeHistory,
  getLatestDailyMetric,
  getLeaderboard,
  getMainerStats,
  getTokenRewardsData,
} from "./funnaiAgent";

// ─── Utility Helpers ──────────────────────────────────────────────────────────

function formatTimestamp(ns: bigint): string {
  return new Date(Number(ns) / 1_000_000).toLocaleString();
}

function formatCycles(cycles: bigint): string {
  const n = Number(cycles);
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toString();
}

function truncatePrincipal(p: { toString(): string } | string): string {
  const s = typeof p === "string" ? p : p.toString();
  if (s.length <= 20) return s;
  return `${s.slice(0, 10)}...${s.slice(-5)}`;
}

function formatFunnaiAmount(amount: bigint): string {
  return (Number(amount) / 1e8).toFixed(2);
}
function getRewardTypeName(rt: Record<string, unknown>): string {
  if ("ICP" in rt) return "ICP";
  if ("Cycles" in rt) return "Cycles";
  if ("MainerToken" in rt) return "FUNNAI";
  if ("Coupon" in rt) return "Coupon";
  return "Other";
}

function getStatusVariant(
  status: Record<string, unknown>,
): "default" | "secondary" | "destructive" | "outline" {
  if ("Open" in status) return "default";
  if ("Closed" in status) return "secondary";
  if ("Archived" in status) return "outline";
  if ("Other" in status) return "secondary";
  return "secondary";
}

function getStatusLabel(status: Record<string, unknown>): string {
  if ("Open" in status) return "Open";
  if ("Closed" in status) return "Closed";
  if ("Archived" in status) return "Archived";
  if ("Other" in status) return "Terminated";
  return "Terminated";
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

// ─── Tab: Token Rewards ───────────────────────────────────────────────────────

function TokenRewardsTab() {
  const [data, setData] = useState<TokenRewardsDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getTokenRewardsData());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load token rewards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {data && (
          <div className="space-y-0.5">
            <p className="text-sm text-foreground font-medium">
              {data.metadata.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: {data.metadata.last_updated} · v
              {data.metadata.version}
            </p>
          </div>
        )}
        {!data && <div />}
        <Button
          variant="outline"
          size="sm"
          onClick={fetch}
          disabled={loading}
          className="gap-2 border-border hover:border-primary hover:text-primary shrink-0"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading && (
        <div data-ocid="explorer.loading_state" className="space-y-2">
          {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((k) => (
            <Skeleton key={k} className="h-10 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          data-ocid="explorer.error_state"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center"
        >
          <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">
            Error loading token rewards
          </p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={fetch} className="mt-3">
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && (!data || data.data.length === 0) && (
        <div
          data-ocid="explorer.empty_state"
          className="rounded-lg border border-border bg-card p-12 text-center"
        >
          <Coins className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-foreground font-medium">
            No reward data available
          </p>
        </div>
      )}

      {!loading && !error && data && data.data.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="rewards.table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold">
                  Date
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold">
                  Quarter
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">
                  Rewards / Challenge
                  <span className="block text-xs font-normal text-muted-foreground/70">
                    {data.metadata.units.rewards_per_challenge}
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">
                  Rewards / Quarter
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">
                  Total Minted
                  <span className="block text-xs font-normal text-muted-foreground/70">
                    {data.metadata.units.total_minted}
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold">
                  Notes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row) => (
                <TableRow
                  key={row.date + row.quarter}
                  className="border-border hover:bg-muted/20"
                >
                  <TableCell className="font-mono text-sm">
                    {row.date}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-border">
                      {row.quarter}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-primary">
                    {row.rewards_per_challenge.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.rewards_per_quarter.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {row.total_minted.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className="text-xs text-muted-foreground max-w-48 truncate"
                    title={row.notes}
                  >
                    {row.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Protocol Stats ──────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentColor = "text-primary",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accentColor?: string;
}) {
  return (
    <motion.div
      data-ocid="stats.card"
      variants={{
        hidden: { opacity: 0, scale: 0.96 },
        visible: { opacity: 1, scale: 1 },
      }}
      className="rounded-lg border border-border bg-card p-5 card-glow group hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          {label}
        </p>
        <Icon className={`h-4 w-4 ${accentColor} opacity-70`} />
      </div>
      <p className={`font-display font-bold text-2xl ${accentColor} text-glow`}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-muted-foreground mt-1 font-mono">{sub}</p>
      )}
    </motion.div>
  );
}

interface ChallengeStats {
  totalAllTime: number;
  total7d: number;
  total30d: number;
  totalFunnaiDistributed: number;
  avgRewardPerMainer: number;
  lastChallengeCreated: string;
  lastWinnerRecorded: string;
}

function ProtocolStatsTab() {
  const [data, setData] = useState<DailyMetricType | null>(null);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metric, history] = await Promise.all([
        getLatestDailyMetric(),
        getChallengeHistory(),
      ]);
      setData(metric);

      const { challenges, winners } = history;
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      const ago7d = now - BigInt(7 * 24 * 3600 * 1000) * BigInt(1_000_000);
      const ago30d = now - BigInt(30 * 24 * 3600 * 1000) * BigInt(1_000_000);

      const total7d = challenges.filter(
        (c) => c.challengeCreationTimestamp > ago7d,
      ).length;
      const total30d = challenges.filter(
        (c) => c.challengeCreationTimestamp > ago30d,
      ).length;

      let totalFunnaiDistributed = 0;
      const uniquePrincipals = new Set<string>();
      let maxFinalizedTs = BigInt(0);

      for (const w of winners) {
        for (const key of ["winner", "secondPlace", "thirdPlace"] as const) {
          const e = w[key];
          if (e) {
            totalFunnaiDistributed += Number(e.reward.amount) / 1e8;
            uniquePrincipals.add(e.submittedBy.toString());
          }
        }
        if (w.finalizedTimestamp > maxFinalizedTs)
          maxFinalizedTs = w.finalizedTimestamp;
      }

      const avgRewardPerMainer =
        uniquePrincipals.size > 0
          ? totalFunnaiDistributed / uniquePrincipals.size
          : 0;

      let maxCreationTs = BigInt(0);
      for (const c of challenges) {
        if (c.challengeCreationTimestamp > maxCreationTs)
          maxCreationTs = c.challengeCreationTimestamp;
      }

      setChallengeStats({
        totalAllTime: challenges.length,
        total7d,
        total30d,
        totalFunnaiDistributed,
        avgRewardPerMainer,
        lastChallengeCreated:
          maxCreationTs > 0n ? formatTimestamp(maxCreationTs) : "—",
        lastWinnerRecorded:
          maxFinalizedTs > 0n ? formatTimestamp(maxFinalizedTs) : "—",
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load protocol stats",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {data && (
          <p className="text-sm text-muted-foreground">
            Metrics for{" "}
            <span className="text-foreground font-mono">
              {data.metadata.date}
            </span>
          </p>
        )}
        {!data && <div />}
        <Button
          variant="outline"
          size="sm"
          onClick={fetch}
          disabled={loading}
          className="gap-2 border-border hover:border-primary hover:text-primary"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading && (
        <div data-ocid="explorer.loading_state" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
              <div
                key={k}
                className="rounded-lg border border-border bg-card p-5 space-y-3"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {["c1", "c2", "c3", "c4", "c5"].map((k) => (
              <div
                key={k}
                className="rounded-lg border border-border bg-card p-5 space-y-3"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div
          data-ocid="explorer.error_state"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center"
        >
          <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">
            Error loading protocol stats
          </p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={fetch} className="mt-3">
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            <StatCard
              label="funnAI Index"
              value={data.system_metrics.funnai_index.toFixed(2)}
              icon={TrendingUp}
              accentColor="text-primary"
            />
            <StatCard
              label="Active Mainers"
              value={data.mainers.totals.active.toString()}
              sub={`${data.derived_metrics.active_percentage.toFixed(1)}% of all mainers`}
              icon={Users}
              accentColor="text-chart-2"
            />
            <StatCard
              label="Total Mainers Created"
              value={data.mainers.totals.created.toString()}
              sub={`${data.mainers.totals.paused.toString()} paused`}
              icon={Database}
              accentColor="text-chart-3"
            />
            <StatCard
              label="Daily Burn Rate"
              value={`${formatCycles(data.system_metrics.daily_burn_rate.cycles)} cycles`}
              sub={`≈ $${data.system_metrics.daily_burn_rate.usd.toFixed(4)} USD`}
              icon={Flame}
              accentColor="text-destructive"
            />
            {data.system_metrics.total_cycles.length > 0 &&
              (() => {
                const tc = data.system_metrics.total_cycles[0];
                if (!tc) return null;
                return (
                  <>
                    <StatCard
                      label="Total Cycles (All)"
                      value={`${formatCycles(tc.all.cycles)}`}
                      sub={`≈ $${tc.all.usd.toFixed(2)} USD`}
                      icon={Zap}
                      accentColor="text-chart-4"
                    />
                    <StatCard
                      label="Protocol Cycles"
                      value={`${formatCycles(tc.protocol.cycles)}`}
                      sub={`≈ $${tc.protocol.usd.toFixed(2)} USD`}
                      icon={Activity}
                      accentColor="text-chart-5"
                    />
                  </>
                );
              })()}
          </motion.div>

          {challengeStats && (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
            >
              <StatCard
                label="Total Challenges"
                value={challengeStats.totalAllTime.toString()}
                sub={`7d: ${challengeStats.total7d} · 30d: ${challengeStats.total30d}`}
                icon={Hash}
                accentColor="text-chart-1"
              />
              <StatCard
                label="Total FUNNAI Distributed"
                value={challengeStats.totalFunnaiDistributed.toFixed(2)}
                sub="FUNNAI tokens"
                icon={Award}
                accentColor="text-chart-2"
              />
              <StatCard
                label="Avg Reward / mAIner"
                value={challengeStats.avgRewardPerMainer.toFixed(2)}
                sub="FUNNAI per unique mAIner"
                icon={Coins}
                accentColor="text-chart-3"
              />
              <StatCard
                label="Last Challenge Created"
                value={challengeStats.lastChallengeCreated}
                icon={Calendar}
                accentColor="text-primary"
              />
              <StatCard
                label="Last Winner Recorded"
                value={challengeStats.lastWinnerRecorded}
                icon={Clock}
                accentColor="text-chart-5"
              />
            </motion.div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">
              Tier Distribution (Active)
            </p>
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  ["Low", data.derived_metrics.tier_distribution.low],
                  ["Medium", data.derived_metrics.tier_distribution.medium],
                  ["High", data.derived_metrics.tier_distribution.high],
                  [
                    "Very High",
                    data.derived_metrics.tier_distribution.very_high,
                  ],
                  ["Custom", data.derived_metrics.tier_distribution.custom],
                ] as [string, number][]
              ).map(([tier, pct]) => (
                <div key={tier} className="text-center">
                  <div className="text-lg font-display font-bold text-primary">
                    {pct.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {tier}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Challenge History ───────────────────────────────────────────────────

const PLACEMENT_CONFIG = [
  {
    key: "winner" as const,
    medal: "🥇",
    label: "Winner",
    color: "text-yellow-400",
    badgeClass: "border-yellow-400/30 text-yellow-400 bg-yellow-400/5",
  },
  {
    key: "secondPlace" as const,
    medal: "🥈",
    label: "2nd Place",
    color: "text-slate-300",
    badgeClass: "border-slate-400/30 text-slate-300 bg-slate-400/5",
  },
  {
    key: "thirdPlace" as const,
    medal: "🥉",
    label: "3rd Place",
    color: "text-amber-600",
    badgeClass: "border-amber-600/30 text-amber-500 bg-amber-600/5",
  },
];

function ChallengeHistoryTab() {
  const [challenges, setChallenges] = useState<ChallengeType[]>([]);
  const [winners, setWinners] = useState<ChallengeWinnerDeclarationArrayType[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getChallengeHistory();
      setChallenges(data.challenges);
      setWinners(data.winners);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load challenge history",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(text);
      setTimeout(
        () => setCopiedId((prev) => (prev === text ? null : prev)),
        1500,
      );
    });
  }, []);

  const filtered = challenges.filter((ch) => {
    if (filter.trim()) {
      const q = filter.toLowerCase();
      return (
        ch.challengeTopic.toLowerCase().includes(q) ||
        ch.challengeQuestion.toLowerCase().includes(q) ||
        ch.challengeId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) =>
    Number(b.challengeCreationTimestamp - a.challengeCreationTimestamp),
  );

  const openChallenges = sorted.filter((ch) => {
    const status = ch.challengeStatus as Record<string, unknown>;
    return "Open" in status;
  });

  const completedChallenges = sorted.filter((ch) => {
    const status = ch.challengeStatus as Record<string, unknown>;
    const hasWinner = winners.some((w) => w.challengeId === ch.challengeId);
    return !("Open" in status) || hasWinner;
  });

  const renderChallengeCard = (ch: ChallengeType, i: number) => {
    const winnerRecord = winners.find((w) => w.challengeId === ch.challengeId);
    const idCopied = copiedId === ch.challengeId;
    return (
      <motion.div
        key={ch.challengeId}
        data-ocid={`history.item.${i + 1}`}
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0 },
        }}
        className="rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-200 flex flex-col overflow-hidden"
      >
        {/* Header: ID + Status */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-border/50">
          <button
            type="button"
            data-ocid={`history.item.${i + 1}.button`}
            className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-primary transition-colors group"
            title="Click to copy challenge ID"
            onClick={() => copyToClipboard(ch.challengeId)}
          >
            <span className="truncate max-w-[140px]">
              {truncatePrincipal(ch.challengeId)}
            </span>
            {idCopied ? (
              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
            ) : (
              <Copy className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          <Badge
            variant={getStatusVariant(
              ch.challengeStatus as Record<string, unknown>,
            )}
            className="text-[10px] shrink-0"
          >
            {getStatusLabel(ch.challengeStatus as Record<string, unknown>)}
          </Badge>
        </div>

        {/* Topic badge */}
        <div className="px-4 pt-2.5 pb-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary tracking-wide">
            <Tag className="h-3 w-3" />
            {ch.challengeTopic}
          </span>
        </div>

        {/* Question */}
        <div className="px-4 pt-1.5 pb-3 flex-1">
          <p
            className={`text-sm leading-relaxed ${ch.challengeQuestion ? "text-foreground" : "text-muted-foreground italic"}`}
          >
            {ch.challengeQuestion || "Challenge details not available"}
          </p>
        </div>

        {/* Winners section */}
        {winnerRecord && (
          <div className="border-t border-border/50 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Top Winners
              </p>
              {winnerRecord.participants.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {winnerRecord.participants.length} participants
                </span>
              )}
            </div>
            {PLACEMENT_CONFIG.map(({ key, medal, color }) => {
              const entry = winnerRecord[key];
              if (!entry) return null;
              const principalStr = entry.ownedBy.toString();
              const pCopied = copiedId === principalStr;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5"
                >
                  <span className="text-base leading-none w-5 shrink-0">
                    {medal}
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors flex-1 min-w-0 group"
                    title={principalStr}
                    onClick={() => copyToClipboard(principalStr)}
                  >
                    <span className="truncate">
                      {truncatePrincipal(principalStr)}
                    </span>
                    {pCopied ? (
                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    ) : (
                      <Copy className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                  <span
                    className={`font-bold text-xs font-mono shrink-0 ${color}`}
                  >
                    {formatFunnaiAmount(entry.reward.amount)}
                    <span className="font-normal text-muted-foreground text-[10px] ml-0.5">
                      F
                    </span>
                  </span>
                  {entry.reward.distributed ? (
                    <span title="Distributed">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    </span>
                  ) : (
                    <span title="Pending">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer: timestamp */}
        <div className="px-4 pb-2.5 text-[10px] text-muted-foreground font-mono">
          {ch.challengeClosedTimestamp.length > 0 &&
          ch.challengeClosedTimestamp[0] ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
              Closed {formatTimestamp(ch.challengeClosedTimestamp[0])}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              Created {formatTimestamp(ch.challengeCreationTimestamp)}
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            data-ocid="history.search_input"
            className="pl-9 h-9 text-sm border-border bg-card focus:border-primary"
            placeholder="Filter by topic, question, or ID…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="gap-2 border-border hover:border-primary hover:text-primary shrink-0"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading && (
        <div
          data-ocid="history.loading_state"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
            <CardSkeleton key={k} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          data-ocid="history.error_state"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center"
        >
          <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">
            Error loading challenges
          </p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div
          data-ocid="history.empty_state"
          className="rounded-lg border border-border bg-card p-12 text-center"
        >
          <History className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-foreground font-medium">
            {filter ? "No challenges match your filter" : "No challenges yet"}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {filter
              ? "Try a different search term."
              : "Check back after challenges are created."}
          </p>
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Open Challenges */}
          <div className="flex flex-col gap-3">
            <div className="sticky top-[65px] z-[1] bg-background/90 backdrop-blur-sm pb-2">
              <div className="flex items-center gap-2 border-b border-emerald-400/20 pb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-emerald-400 tracking-wide">
                  Open Challenges
                </h2>
                <span className="ml-auto text-xs font-mono text-emerald-400/70 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                  {openChallenges.length}
                </span>
              </div>
            </div>
            {openChallenges.length === 0 ? (
              <div
                data-ocid="history.open.empty_state"
                className="rounded-xl border border-border bg-card p-8 text-center"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400/50" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No open challenges
                </p>
              </div>
            ) : (
              <motion.div
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
              >
                {openChallenges.map((ch, i) => renderChallengeCard(ch, i))}
              </motion.div>
            )}
          </div>

          {/* Right Panel: Completed Challenges */}
          <div className="flex flex-col gap-3">
            <div className="sticky top-[65px] z-[1] bg-background/90 backdrop-blur-sm pb-2">
              <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h2 className="text-sm font-semibold text-primary tracking-wide">
                  Completed Challenges
                </h2>
                <span className="ml-auto text-xs font-mono text-primary/70 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                  {completedChallenges.length}
                </span>
              </div>
            </div>
            {completedChallenges.length === 0 ? (
              <div
                data-ocid="history.completed.empty_state"
                className="rounded-xl border border-border bg-card p-8 text-center"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <History className="h-4 w-4 text-primary/50" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No completed challenges
                </p>
              </div>
            ) : (
              <motion.div
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
              >
                {completedChallenges.map((ch, i) =>
                  renderChallengeCard(ch, openChallenges.length + i),
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: mAIner Lookup ───────────────────────────────────────────────────────

function MainerLookupTab() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MainerStatsType | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const pid = input.trim();
    if (!pid) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const result = await getMainerStats(pid);
      setStats(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to look up mAIner");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [input]);

  const allEntries = stats
    ? [
        ...stats.wins.map((w) => ({
          record: w,
          placement: "1st" as const,
          entry: w.winner,
        })),
        ...stats.secondPlaces.map((w) => ({
          record: w,
          placement: "2nd" as const,
          entry: w.secondPlace,
        })),
        ...stats.thirdPlaces.map((w) => ({
          record: w,
          placement: "3rd" as const,
          entry: w.thirdPlace,
        })),
      ]
    : [];

  const placementConfig = {
    "1st": {
      label: "🥇 Winner",
      color: "text-yellow-400",
      badgeClass: "border-yellow-400/40 text-yellow-400",
    },
    "2nd": {
      label: "🥈 2nd Place",
      color: "text-slate-300",
      badgeClass: "border-slate-300/40 text-slate-300",
    },
    "3rd": {
      label: "🥉 3rd Place",
      color: "text-orange-400",
      badgeClass: "border-orange-400/40 text-orange-400",
    },
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            data-ocid="mainer.search_input"
            className="pl-9 border-border bg-card focus:border-primary"
            placeholder="Enter principal ID (e.g. aaaaa-aa)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button
          data-ocid="mainer.button"
          onClick={handleSearch}
          disabled={loading || !input.trim()}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Lookup
        </Button>
      </div>

      {loading && (
        <div data-ocid="mainer.loading_state" className="space-y-3">
          {["s1", "s2", "s3"].map((k) => (
            <CardSkeleton key={k} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          data-ocid="mainer.error_state"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center"
        >
          <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">Lookup failed</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && !searched && (
        <div
          data-ocid="mainer.empty_state"
          className="rounded-lg border border-border bg-card p-12 text-center"
        >
          <User className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-foreground font-medium">
            Enter a principal ID to look up a mAIner
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            See all challenge participations, wins, and rewards for any
            principal.
          </p>
        </div>
      )}

      {!loading && !error && searched && stats && allEntries.length === 0 && (
        <div
          data-ocid="mainer.empty_state"
          className="rounded-lg border border-border bg-card p-12 text-center"
        >
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-foreground font-medium">No results found</p>
          <p className="text-muted-foreground text-sm mt-1">
            This principal has no recorded wins or placements in recent
            challenges.
          </p>
        </div>
      )}

      {!loading && !error && stats && allEntries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <User className="h-5 w-5 text-primary shrink-0" />
            <div
              className="font-mono text-sm text-foreground truncate flex-1"
              title={stats.principalId}
            >
              {stats.principalId}
            </div>
            <div className="flex items-center gap-3 shrink-0 text-sm">
              <span className="text-yellow-400 font-semibold">
                {stats.wins.length}W
              </span>
              <span className="text-slate-300 font-semibold">
                {stats.secondPlaces.length} 2nd
              </span>
              <span className="text-orange-400 font-semibold">
                {stats.thirdPlaces.length} 3rd
              </span>
            </div>
          </div>

          <motion.div
            data-ocid="mainer.results.card"
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {allEntries.map(({ record, placement, entry }, i) => {
              const cfg = placementConfig[placement];
              return (
                <motion.div
                  key={`${record.challengeId}-${placement}`}
                  data-ocid={`mainer.item.${i + 1}`}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors card-glow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${cfg.badgeClass} shrink-0`}
                      >
                        {cfg.label}
                      </Badge>
                      <span
                        className="font-mono text-xs text-muted-foreground truncate"
                        title={record.challengeId}
                      >
                        {truncatePrincipal(record.challengeId)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(record.finalizedTimestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge
                      variant="outline"
                      className="text-xs px-1.5 py-0 border-primary/30 text-primary"
                    >
                      {getRewardTypeName(
                        entry.reward.rewardType as Record<string, unknown>,
                      )}
                    </Badge>
                    <span className="text-xs font-mono text-foreground">
                      {formatFunnaiAmount(entry.reward.amount)}
                    </span>
                    {entry.reward.distributed ? (
                      <span className="flex items-center gap-1 text-xs text-primary ml-auto">
                        <CheckCircle2 className="h-3 w-3" /> Distributed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

// ─── Leaderboard Tab ─────────────────────────────────────────────────────────

function LeaderboardTab() {
  const [entries, setEntries] = useState<LeaderboardEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await getLeaderboard());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyPrincipal = async (principalId: string) => {
    try {
      await navigator.clipboard.writeText(principalId);
      setCopied(principalId);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const totalChallenges = entries.reduce(
    (sum, e) => sum + e.wins + e.secondPlaces + e.thirdPlaces,
    0,
  );

  const rankMedal = (rank: number) => {
    if (rank === 1) return <span title="Gold">🥇</span>;
    if (rank === 2) return <span title="Silver">🥈</span>;
    if (rank === 3) return <span title="Bronze">🥉</span>;
    return (
      <span className="text-muted-foreground font-mono text-sm">{rank}</span>
    );
  };

  const rowAccent = (rank: number) => {
    if (rank === 1) return "border-l-2 border-l-yellow-400/70 bg-yellow-400/5";
    if (rank === 2) return "border-l-2 border-l-slate-400/70 bg-slate-400/5";
    if (rank === 3) return "border-l-2 border-l-amber-600/70 bg-amber-600/5";
    return "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {!loading && !error && entries.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">
              {entries.length}
            </span>{" "}
            mainers ranked
            {" · "}
            <span className="text-foreground font-semibold">
              {totalChallenges}
            </span>{" "}
            total placements
          </p>
        )}
        {(loading || error || entries.length === 0) && <div />}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          data-ocid="leaderboard.button"
          className="gap-2 border-border hover:border-primary hover:text-primary shrink-0"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading && (
        <div data-ocid="leaderboard.loading_state" className="space-y-2">
          {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
            <Skeleton key={k} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          data-ocid="leaderboard.error_state"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center"
        >
          <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">
            Error loading leaderboard
          </p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div
          data-ocid="leaderboard.empty_state"
          className="rounded-lg border border-border bg-card p-12 text-center"
        >
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-foreground font-medium">No leaderboard data yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Check back after challenges are finalized.
          </p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="leaderboard.table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold w-14 text-center">
                  Rank
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold">
                  mAIner
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">
                  <span className="flex items-center gap-1 justify-center">
                    <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                    Wins
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">
                  2nd / 3rd
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">
                  Total Rewards
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right hidden md:table-cell">
                  Last Active
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                return (
                  <TableRow
                    key={entry.principalId}
                    data-ocid={`leaderboard.item.${rank}`}
                    className={`border-border ${rowAccent(rank)}`}
                  >
                    <TableCell className="text-center font-medium">
                      {rankMedal(rank)}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        title={`${entry.principalId} — click to copy`}
                        onClick={() => handleCopyPrincipal(entry.principalId)}
                        className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {truncatePrincipal(entry.principalId)}
                        {copied === entry.principalId ? (
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        ) : (
                          <Users className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-foreground">
                        {entry.wins}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {entry.secondPlaces} / {entry.thirdPlaces}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-foreground font-mono">
                        {formatFunnaiAmount(entry.totalRewards)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        FUNNAI
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground hidden md:table-cell">
                      {entry.lastActiveTimestamp > BigInt(0)
                        ? formatTimestamp(entry.lastActiveTimestamp)
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "stats", label: "Protocol Stats", icon: Activity },
  { id: "history", label: "Challenges", icon: History },
  { id: "rewards", label: "Token Rewards", icon: Coins },
  { id: "mainer", label: "mAIner Lookup", icon: User },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("stats");

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
                  funnAI Explorer
                </h1>
                <p className="text-xs text-muted-foreground">
                  Live protocol data from the Internet Computer
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs border-primary/30 text-primary bg-primary/5 gap-1.5 animate-pulse-glow"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                Mainnet
              </Badge>
              <a
                href="https://dashboard.internetcomputer.org/canister/bgm6p-5aaaa-aaaaf-qbzda-cai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-background/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-ocid={`explorer.tab.${i + 1}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-px ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {isActive && (
                    <motion.span layoutId="tab-indicator" className="sr-only" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "stats" && <ProtocolStatsTab />}
            {activeTab === "history" && <ChallengeHistoryTab />}
            {activeTab === "rewards" && <TokenRewardsTab />}
            {activeTab === "mainer" && <MainerLookupTab />}
            {activeTab === "leaderboard" && <LeaderboardTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3 text-primary" />
            <span className="font-mono">bgm6p-5aaaa-aaaaf-qbzda-cai</span>
          </div>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            © {new Date().getFullYear()}. Built with ❤️ using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
