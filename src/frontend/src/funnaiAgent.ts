import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import type { Principal } from "@dfinity/principal";

// ─── Canister IDs ─────────────────────────────────────────────────────────────

const API_CANISTER_ID = "bgm6p-5aaaa-aaaaf-qbzda-cai";
const GAME_STATE_CANISTER_ID = "r5m5y-diaaa-aaaaa-qanaa-cai";

// ─── IDL Factories ───────────────────────────────────────────────────────────

function buildApiIdlFactory() {
  const RewardType = IDL.Variant({
    ICP: IDL.Null,
    Cycles: IDL.Null,
    MainerToken: IDL.Null,
    Coupon: IDL.Text,
    Other: IDL.Text,
  });

  const ChallengeParticipationResult = IDL.Variant({
    Winner: IDL.Null,
    SecondPlace: IDL.Null,
    ThirdPlace: IDL.Null,
    Participated: IDL.Null,
    Other: IDL.Text,
  });

  const ChallengeWinnerReward = IDL.Record({
    amount: IDL.Nat,
    rewardType: RewardType,
    distributed: IDL.Bool,
    distributedTimestamp: IDL.Opt(IDL.Nat64),
    rewardDetails: IDL.Text,
  });

  const ChallengeParticipantEntry = IDL.Record({
    submissionId: IDL.Text,
    submittedBy: IDL.Principal,
    ownedBy: IDL.Principal,
    result: ChallengeParticipationResult,
    reward: ChallengeWinnerReward,
  });

  const ChallengeStatus = IDL.Variant({
    Open: IDL.Null,
    Closed: IDL.Null,
    Archived: IDL.Null,
    Other: IDL.Text,
  });

  const ChallengeTopicStatus = IDL.Variant({
    Open: IDL.Null,
    Closed: IDL.Null,
    Archived: IDL.Null,
    Other: IDL.Text,
  });

  const Challenge = IDL.Record({
    challengeId: IDL.Text,
    challengeQuestion: IDL.Text,
    challengeQuestionSeed: IDL.Nat32,
    challengeTopic: IDL.Text,
    challengeStatus: ChallengeStatus,
    challengeCreationTimestamp: IDL.Nat64,
    challengeClosedTimestamp: IDL.Opt(IDL.Nat64),
    challengeCreatedBy: IDL.Text,
    challengeTopicId: IDL.Text,
    challengeTopicStatus: ChallengeTopicStatus,
    challengeTopicCreationTimestamp: IDL.Nat64,
    cyclesGenerateChallengeChctrlChllm: IDL.Nat,
    cyclesGenerateChallengeGsChctrl: IDL.Nat,
    cyclesGenerateResponseOwnctrlGs: IDL.Nat,
    cyclesGenerateResponseOwnctrlOwnllmHIGH: IDL.Nat,
    cyclesGenerateResponseOwnctrlOwnllmLOW: IDL.Nat,
    cyclesGenerateResponseOwnctrlOwnllmMEDIUM: IDL.Nat,
    cyclesGenerateResponseSactrlSsctrl: IDL.Nat,
    cyclesGenerateResponseSsctrlGs: IDL.Nat,
    cyclesGenerateResponseSsctrlSsllm: IDL.Nat,
    cyclesSubmitResponse: IDL.Nat,
    judgePromptId: IDL.Text,
    mainerMaxContinueLoopCount: IDL.Nat,
    mainerNumTokens: IDL.Nat64,
    mainerPromptId: IDL.Text,
    mainerTemp: IDL.Float64,
    protocolOperationFeesCut: IDL.Nat,
  });

  const ChallengeWinnerDeclarationArray = IDL.Record({
    challengeId: IDL.Text,
    finalizedTimestamp: IDL.Nat64,
    winner: ChallengeParticipantEntry,
    secondPlace: ChallengeParticipantEntry,
    thirdPlace: ChallengeParticipantEntry,
    participants: IDL.Vec(ChallengeParticipantEntry),
  });

  const ActivityFeedQuery = IDL.Record({
    challengesLimit: IDL.Opt(IDL.Nat),
    challengesOffset: IDL.Opt(IDL.Nat),
    winnersLimit: IDL.Opt(IDL.Nat),
    winnersOffset: IDL.Opt(IDL.Nat),
    sinceTimestamp: IDL.Opt(IDL.Nat64),
  });

  const ApiError = IDL.Variant({
    FailedOperation: IDL.Null,
    InsuffientCycles: IDL.Nat,
    InvalidId: IDL.Null,
    Other: IDL.Text,
    StatusCode: IDL.Nat16,
    Unauthorized: IDL.Null,
    ZeroAddress: IDL.Null,
  });

  const ActivityFeedResponse = IDL.Record({
    challenges: IDL.Vec(Challenge),
    winners: IDL.Vec(ChallengeWinnerDeclarationArray),
    totalChallenges: IDL.Nat,
    totalWinners: IDL.Nat,
    cacheTimestamp: IDL.Nat64,
  });

  const ActivityFeedResult = IDL.Variant({
    Ok: ActivityFeedResponse,
    Err: ApiError,
  });
  const ChallengesResult = IDL.Variant({
    Ok: IDL.Vec(Challenge),
    Err: ApiError,
  });

  const TokenRewardsEntry = IDL.Record({
    date: IDL.Text,
    quarter: IDL.Text,
    rewards_per_challenge: IDL.Float64,
    rewards_per_quarter: IDL.Float64,
    total_minted: IDL.Float64,
    notes: IDL.Text,
  });

  const TokenRewardsMetadata = IDL.Record({
    dataset: IDL.Text,
    description: IDL.Text,
    last_updated: IDL.Text,
    version: IDL.Text,
    units: IDL.Record({
      rewards_per_challenge: IDL.Text,
      total_minted: IDL.Text,
    }),
  });

  const TokenRewardsData = IDL.Record({
    data: IDL.Vec(TokenRewardsEntry),
    metadata: TokenRewardsMetadata,
  });

  const TokenRewardsDataResult = IDL.Variant({
    Ok: TokenRewardsData,
    Err: ApiError,
  });

  const DailyBurnRate = IDL.Record({ cycles: IDL.Nat, usd: IDL.Float64 });
  const CycleAmount = IDL.Record({ cycles: IDL.Nat, usd: IDL.Float64 });
  const TotalCycles = IDL.Record({
    all: CycleAmount,
    mainers: CycleAmount,
    protocol: CycleAmount,
  });
  const SystemMetrics = IDL.Record({
    funnai_index: IDL.Float64,
    daily_burn_rate: DailyBurnRate,
    total_cycles: IDL.Opt(TotalCycles),
  });

  const MainersTierBreakdown = IDL.Record({
    custom: IDL.Nat,
    high: IDL.Nat,
    low: IDL.Nat,
    medium: IDL.Nat,
    very_high: IDL.Nat,
  });

  const MainersMetrics = IDL.Record({
    totals: IDL.Record({
      active: IDL.Nat,
      created: IDL.Nat,
      paused: IDL.Nat,
      total_cycles: IDL.Nat,
    }),
    breakdown_by_tier: IDL.Record({
      active: MainersTierBreakdown,
      paused: MainersTierBreakdown,
    }),
  });

  const DerivedMetrics = IDL.Record({
    active_percentage: IDL.Float64,
    avg_cycles_per_mainer: IDL.Float64,
    burn_rate_per_active_mainer: IDL.Float64,
    paused_percentage: IDL.Float64,
    tier_distribution: IDL.Record({
      custom: IDL.Float64,
      high: IDL.Float64,
      low: IDL.Float64,
      medium: IDL.Float64,
      very_high: IDL.Float64,
    }),
  });

  const DailyMetricMetadata = IDL.Record({
    created_at: IDL.Text,
    date: IDL.Text,
    updated_at: IDL.Text,
  });

  const DailyMetric = IDL.Record({
    system_metrics: SystemMetrics,
    mainers: MainersMetrics,
    derived_metrics: DerivedMetrics,
    metadata: DailyMetricMetadata,
  });

  const DailyMetricResult = IDL.Variant({ Ok: DailyMetric, Err: ApiError });

  return IDL.Service({
    getActivityFeed: IDL.Func(
      [ActivityFeedQuery],
      [ActivityFeedResult],
      ["query"],
    ),
    getOpenChallengesFromCache: IDL.Func([], [ChallengesResult], ["query"]),
    getTokenRewardsData: IDL.Func([], [TokenRewardsDataResult], ["query"]),
    getLatestDailyMetric: IDL.Func([], [DailyMetricResult], ["query"]),
  });
}

function buildGameStateIdlFactory() {
  const RewardType = IDL.Variant({
    ICP: IDL.Null,
    Cycles: IDL.Null,
    MainerToken: IDL.Null,
    Coupon: IDL.Text,
    Other: IDL.Text,
  });

  const ChallengeParticipationResult = IDL.Variant({
    Winner: IDL.Null,
    SecondPlace: IDL.Null,
    ThirdPlace: IDL.Null,
    Participated: IDL.Null,
    Other: IDL.Text,
  });

  const ChallengeWinnerReward = IDL.Record({
    amount: IDL.Nat,
    rewardType: RewardType,
    distributed: IDL.Bool,
    distributedTimestamp: IDL.Opt(IDL.Nat64),
    rewardDetails: IDL.Text,
  });

  const ChallengeParticipantEntry = IDL.Record({
    submissionId: IDL.Text,
    submittedBy: IDL.Principal,
    ownedBy: IDL.Principal,
    result: ChallengeParticipationResult,
    reward: ChallengeWinnerReward,
  });

  const ChallengeStatus = IDL.Variant({
    Open: IDL.Null,
    Closed: IDL.Null,
    Archived: IDL.Null,
    Other: IDL.Text,
  });

  const ChallengeTopicStatus = IDL.Variant({
    Open: IDL.Null,
    Closed: IDL.Null,
    Archived: IDL.Null,
    Other: IDL.Text,
  });

  const Challenge = IDL.Record({
    challengeId: IDL.Text,
    challengeQuestion: IDL.Text,
    challengeQuestionSeed: IDL.Nat32,
    challengeTopic: IDL.Text,
    challengeStatus: ChallengeStatus,
    challengeCreationTimestamp: IDL.Nat64,
    challengeClosedTimestamp: IDL.Opt(IDL.Nat64),
    challengeCreatedBy: IDL.Text,
    challengeTopicId: IDL.Text,
    challengeTopicStatus: ChallengeTopicStatus,
    challengeTopicCreationTimestamp: IDL.Nat64,
    cyclesGenerateChallengeChctrlChllm: IDL.Nat,
    cyclesGenerateChallengeGsChctrl: IDL.Nat,
    cyclesGenerateResponseOwnctrlGs: IDL.Nat,
    cyclesGenerateResponseOwnctrlOwnllmHIGH: IDL.Nat,
    cyclesGenerateResponseOwnctrlOwnllmLOW: IDL.Nat,
    cyclesGenerateResponseOwnctrlOwnllmMEDIUM: IDL.Nat,
    cyclesGenerateResponseSactrlSsctrl: IDL.Nat,
    cyclesGenerateResponseSsctrlGs: IDL.Nat,
    cyclesGenerateResponseSsctrlSsllm: IDL.Nat,
    cyclesSubmitResponse: IDL.Nat,
    judgePromptId: IDL.Text,
    mainerMaxContinueLoopCount: IDL.Nat,
    mainerNumTokens: IDL.Nat64,
    mainerPromptId: IDL.Text,
    mainerTemp: IDL.Float64,
    protocolOperationFeesCut: IDL.Nat,
  });

  // Motoko List is a recursive type: opt record { ChallengeParticipantEntry; List_1; }
  // We decode it as Reserved to avoid recursive type issues
  const ChallengeWinnerDeclaration = IDL.Record({
    challengeId: IDL.Text,
    finalizedTimestamp: IDL.Nat64,
    winner: ChallengeParticipantEntry,
    secondPlace: ChallengeParticipantEntry,
    thirdPlace: ChallengeParticipantEntry,
    participants: IDL.Opt(IDL.Reserved),
  });

  const ApiError = IDL.Variant({
    FailedOperation: IDL.Null,
    InsuffientCycles: IDL.Nat,
    InvalidId: IDL.Null,
    Other: IDL.Text,
    StatusCode: IDL.Nat16,
    Unauthorized: IDL.Null,
    ZeroAddress: IDL.Null,
  });

  const ProtocolActivityRecord = IDL.Record({
    challenges: IDL.Vec(Challenge),
    winners: IDL.Vec(ChallengeWinnerDeclaration),
  });

  const ProtocolActivityResult = IDL.Variant({
    Ok: ProtocolActivityRecord,
    Err: ApiError,
  });

  const ChallengesResult = IDL.Variant({
    Ok: IDL.Vec(Challenge),
    Err: ApiError,
  });

  const ChallengeWinnersResult = IDL.Variant({
    Ok: IDL.Vec(ChallengeWinnerDeclaration),
    Err: ApiError,
  });

  return IDL.Service({
    getRecentProtocolActivity: IDL.Func(
      [],
      [ProtocolActivityResult],
      ["query"],
    ),
    getCurrentChallenges: IDL.Func([], [ChallengesResult], ["query"]),
    getRecentChallengeWinners: IDL.Func(
      [],
      [ChallengeWinnersResult],
      ["query"],
    ),
  });
}

// ─── Actor singletons ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _apiActor: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _gameStateActor: any = null;

async function getApiActor() {
  if (_apiActor) return _apiActor;
  const agent = await HttpAgent.create({ host: "https://icp-api.io" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _apiActor = Actor.createActor((() => buildApiIdlFactory()) as any, {
    agent,
    canisterId: API_CANISTER_ID,
  });
  return _apiActor;
}

async function getGameStateActor() {
  if (_gameStateActor) return _gameStateActor;
  const agent = await HttpAgent.create({ host: "https://icp-api.io" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _gameStateActor = Actor.createActor(
    (() => buildGameStateIdlFactory()) as any,
    {
      agent,
      canisterId: GAME_STATE_CANISTER_ID,
    },
  );
  return _gameStateActor;
}

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type RewardTypeVariant =
  | { ICP: null }
  | { Cycles: null }
  | { MainerToken: null }
  | { Coupon: string }
  | { Other: string };

export type ChallengeParticipationResultVariant =
  | { Winner: null }
  | { SecondPlace: null }
  | { ThirdPlace: null }
  | { Participated: null }
  | { Other: string };

export interface ChallengeWinnerRewardType {
  amount: bigint;
  rewardType: RewardTypeVariant;
  distributed: boolean;
  distributedTimestamp: [] | [bigint];
  rewardDetails: string;
}

export interface ChallengeParticipantEntryType {
  submissionId: string;
  submittedBy: Principal;
  ownedBy: Principal;
  result: ChallengeParticipationResultVariant;
  reward: ChallengeWinnerRewardType;
}

export interface ChallengeType {
  challengeId: string;
  challengeQuestion: string;
  challengeTopic: string;
  challengeStatus:
    | { Open: null }
    | { Closed: null }
    | { Archived: null }
    | { Other: string };
  challengeCreationTimestamp: bigint;
  challengeClosedTimestamp: [] | [bigint];
  challengeCreatedBy: string;
  challengeTopicId: string;
}

export interface ChallengeWinnerDeclarationArrayType {
  challengeId: string;
  finalizedTimestamp: bigint;
  winner: ChallengeParticipantEntryType;
  secondPlace: ChallengeParticipantEntryType;
  thirdPlace: ChallengeParticipantEntryType;
  participants: ChallengeParticipantEntryType[];
}

// game_state_canister winner type (participants is skipped/empty)
export type ChallengeWinnerDeclarationType = Omit<
  ChallengeWinnerDeclarationArrayType,
  "participants"
> & { participants: [] };

export interface ActivityFeedResponseType {
  challenges: ChallengeType[];
  winners: ChallengeWinnerDeclarationArrayType[];
  totalChallenges: bigint;
  totalWinners: bigint;
  cacheTimestamp: bigint;
}

export interface TokenRewardsEntryType {
  date: string;
  quarter: string;
  rewards_per_challenge: number;
  rewards_per_quarter: number;
  total_minted: number;
  notes: string;
}

export interface TokenRewardsDataType {
  data: TokenRewardsEntryType[];
  metadata: {
    dataset: string;
    description: string;
    last_updated: string;
    version: string;
    units: { rewards_per_challenge: string; total_minted: string };
  };
}

export interface DailyMetricType {
  system_metrics: {
    funnai_index: number;
    daily_burn_rate: { cycles: bigint; usd: number };
    total_cycles:
      | []
      | [
          {
            all: { cycles: bigint; usd: number };
            mainers: { cycles: bigint; usd: number };
            protocol: { cycles: bigint; usd: number };
          },
        ];
  };
  mainers: {
    totals: {
      active: bigint;
      created: bigint;
      paused: bigint;
      total_cycles: bigint;
    };
    breakdown_by_tier: {
      active: {
        custom: bigint;
        high: bigint;
        low: bigint;
        medium: bigint;
        very_high: bigint;
      };
      paused: {
        custom: bigint;
        high: bigint;
        low: bigint;
        medium: bigint;
        very_high: bigint;
      };
    };
  };
  derived_metrics: {
    active_percentage: number;
    avg_cycles_per_mainer: number;
    burn_rate_per_active_mainer: number;
    paused_percentage: number;
    tier_distribution: {
      custom: number;
      high: number;
      low: number;
      medium: number;
      very_high: number;
    };
  };
  metadata: { created_at: string; date: string; updated_at: string };
}

// ─── Exported API Functions ───────────────────────────────────────────────────

type ApiResult<T> = { Ok: T } | { Err: unknown };

async function unwrapResult<T>(result: ApiResult<T>): Promise<T> {
  if ("Ok" in result) return result.Ok;
  throw new Error(JSON.stringify((result as { Err: unknown }).Err));
}

// Map raw game_state_canister winner record to ChallengeWinnerDeclarationArrayType
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGsWinner(raw: any): ChallengeWinnerDeclarationArrayType {
  return {
    challengeId: raw.challengeId,
    finalizedTimestamp: raw.finalizedTimestamp,
    winner: raw.winner,
    secondPlace: raw.secondPlace,
    thirdPlace: raw.thirdPlace,
    participants: [], // Motoko List not decoded
  };
}

export async function getActivityFeed(query: {
  challengesLimit?: number;
  challengesOffset?: number;
  winnersLimit?: number;
  winnersOffset?: number;
}): Promise<ActivityFeedResponseType> {
  // Fetch winners from game_state_canister and challenges from api_canister in parallel
  const [gsActor, apiActor] = await Promise.all([
    getGameStateActor(),
    getApiActor(),
  ]);

  const arg = {
    challengesLimit:
      query.challengesLimit != null
        ? [BigInt(query.challengesLimit)]
        : ([] as []),
    challengesOffset:
      query.challengesOffset != null
        ? [BigInt(query.challengesOffset)]
        : ([] as []),
    winnersLimit:
      query.winnersLimit != null ? [BigInt(query.winnersLimit)] : ([] as []),
    winnersOffset:
      query.winnersOffset != null ? [BigInt(query.winnersOffset)] : ([] as []),
    sinceTimestamp: [] as [],
  };

  // Run both in parallel
  const [gsWinnersResult, apiFeedResult] = await Promise.all([
    (
      gsActor.getRecentChallengeWinners() as Promise<ApiResult<unknown[]>>
    ).catch(() => null),
    (
      apiActor.getActivityFeed(arg) as Promise<
        ApiResult<ActivityFeedResponseType>
      >
    ).catch(() => null),
  ]);

  let winners: ChallengeWinnerDeclarationArrayType[] = [];
  let challenges: ChallengeType[] = [];
  let totalChallenges = BigInt(0);
  let cacheTimestamp = BigInt(0);

  // Use game_state_canister winners if available
  if (gsWinnersResult && "Ok" in gsWinnersResult) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    winners = (gsWinnersResult.Ok as any[]).map(mapGsWinner);
  }

  // Use api_canister feed for challenges (and winners fallback)
  if (apiFeedResult && "Ok" in apiFeedResult) {
    const feed = apiFeedResult.Ok as ActivityFeedResponseType;
    challenges = feed.challenges;
    totalChallenges = feed.totalChallenges;
    cacheTimestamp = feed.cacheTimestamp;
    // Fall back to api winners if game_state had none
    if (winners.length === 0) {
      winners = feed.winners;
    }
  }

  return {
    challenges,
    winners,
    totalChallenges,
    totalWinners: BigInt(winners.length),
    cacheTimestamp,
  };
}

export async function getOpenChallenges(): Promise<ChallengeType[]> {
  // Try game_state_canister first, fall back to api_canister cache
  const gsActor = await getGameStateActor();
  try {
    const gsResult = (await gsActor.getCurrentChallenges()) as ApiResult<
      ChallengeType[]
    >;
    if ("Ok" in gsResult && gsResult.Ok.length > 0) {
      return gsResult.Ok;
    }
  } catch (_e) {
    // fall through to api_canister
  }

  const apiActor = await getApiActor();
  const result = (await apiActor.getOpenChallengesFromCache()) as ApiResult<
    ChallengeType[]
  >;
  return unwrapResult(result);
}

export async function getRecentProtocolActivity(): Promise<{
  challenges: ChallengeType[];
  winners: ChallengeWinnerDeclarationArrayType[];
}> {
  const gsActor = await getGameStateActor();
  const result = (await gsActor.getRecentProtocolActivity()) as ApiResult<{
    challenges: ChallengeType[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    winners: any[];
  }>;
  const data = await unwrapResult(result);
  return {
    challenges: data.challenges,
    winners: data.winners.map(mapGsWinner),
  };
}

export async function getTokenRewardsData(): Promise<TokenRewardsDataType> {
  const actor = await getApiActor();
  const result =
    (await actor.getTokenRewardsData()) as ApiResult<TokenRewardsDataType>;
  return unwrapResult(result);
}

export async function getLatestDailyMetric(): Promise<DailyMetricType> {
  const actor = await getApiActor();
  const result =
    (await actor.getLatestDailyMetric()) as ApiResult<DailyMetricType>;
  return unwrapResult(result);
}

// ─── Challenge History ────────────────────────────────────────────────────────

// Returns all recent challenges + winners from game_state_canister
export async function getChallengeHistory(): Promise<{
  challenges: ChallengeType[];
  winners: ChallengeWinnerDeclarationArrayType[];
}> {
  return getRecentProtocolActivity();
}

// ─── mAIner Lookup ────────────────────────────────────────────────────────────

export interface MainerStatsType {
  principalId: string;
  wins: ChallengeWinnerDeclarationArrayType[];
  secondPlaces: ChallengeWinnerDeclarationArrayType[];
  thirdPlaces: ChallengeWinnerDeclarationArrayType[];
}

// Fetches all recent winners and filters by principal ID
export async function getMainerStats(
  principalId: string,
): Promise<MainerStatsType> {
  const gsActor = await getGameStateActor();
  const result = (await gsActor.getRecentChallengeWinners()) as ApiResult<
    unknown[]
  >;
  let allWinners: ChallengeWinnerDeclarationArrayType[] = [];
  if ("Ok" in result) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allWinners = (result.Ok as any[]).map(mapGsWinner);
  }
  const wins = allWinners.filter(
    (w) => w.winner.ownedBy.toString() === principalId,
  );
  const secondPlaces = allWinners.filter(
    (w) => w.secondPlace.ownedBy.toString() === principalId,
  );
  const thirdPlaces = allWinners.filter(
    (w) => w.thirdPlace.ownedBy.toString() === principalId,
  );
  return { principalId, wins, secondPlaces, thirdPlaces };
}
