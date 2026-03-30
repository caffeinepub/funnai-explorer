# funnAI Explorer

## Current State
ProtocolStatsTab fetches data from `getLatestDailyMetric()` (a local JSON-based source) and shows: funnAI Index, Active Mainers, Total Mainers Created, Daily Burn Rate, Total Cycles, Protocol Cycles, and Tier Distribution. Challenge history and leaderboard data are fetched from the live `game_state_canister`.

## Requested Changes (Diff)

### Add
- **Total challenges created (all-time)** -- count of all challenges fetched from `getChallengeHistory()`
- **Challenges created last 7 days** -- filter challenges where `challengeCreationTimestamp` is within 7 days
- **Challenges created last 30 days** -- filter challenges where `challengeCreationTimestamp` is within 30 days
- **Total FUNNAI distributed** -- sum of all winner reward amounts from `getChallengeHistory()` winners, divided by 10^8
- **Average reward per mAIner** -- total FUNNAI distributed / unique mAIner count across all winner records
- **Last challenge created** -- timestamp of the most recently created challenge
- **Last winner recorded** -- timestamp of the most recently finalized winner record

### Modify
- `ProtocolStatsTab` must fetch both `getLatestDailyMetric()` AND `getChallengeHistory()` in parallel, then compute/display the new stats in additional StatCard components below the existing ones.

### Remove
- Nothing removed.

## Implementation Plan
1. In `ProtocolStatsTab`, add a second `useState` for challenge-derived stats and fetch both data sources in parallel using `Promise.all`.
2. Compute from `getChallengeHistory()` result:
   - `totalChallenges`: challenges.length (plus orphaned winner synthetics)
   - `challenges7d` / `challenges30d`: filter by `challengeCreationTimestamp` within 7/30 days (compare to `Date.now() * 1_000_000` nanoseconds)
   - `totalFunnaiDistributed`: sum winner.reward.amount across all placements (winner, secondPlace, thirdPlace) / 1e8
   - `avgRewardPerMainer`: totalFunnaiDistributed / uniqueMainerCount (deduplicate principal IDs from all winner entries)
   - `lastChallengeCreated`: max(challengeCreationTimestamp) formatted via `formatTimestamp`
   - `lastWinnerRecorded`: max(finalizedTimestamp) from winners formatted via `formatTimestamp`
3. Display new stats as StatCard entries in a second grid row below the existing metrics, using appropriate icons (e.g. `Hash`, `Award`, `Calendar`, `Clock`).
4. Show loading skeletons for the new cards while challenge data loads.
