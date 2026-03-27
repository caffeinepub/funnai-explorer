# funnAI Explorer

## Current State
The app shows Challenge History with FUNNAI token reward amounts for 1st/2nd/3rd place winners. Amounts are fetched as `bigint` (Nat) from the canister but displayed raw via `Number(entry.reward.amount).toLocaleString()` — this shows the smallest-unit integer (e.g. 10,993,000,000) instead of the human-readable token amount (109.93). The same bug affects mAIner Lookup (`entry.reward.amount.toString()`) and Leaderboard (`Number(entry.totalRewards).toLocaleString()`).

The Token Rewards tab shows `rewards_per_challenge` as 109.93 (correct float from the API), confirming FUNNAI uses 8 decimal places.

## Requested Changes (Diff)

### Add
- `formatFunnaiAmount(amount: bigint): string` utility function in App.tsx that divides by `1e8` and formats to 2 decimal places, e.g. `"109.93"`

### Modify
- Challenge History rewards section (line ~764): replace `Number(entry.reward.amount).toLocaleString()` with `formatFunnaiAmount(entry.reward.amount)`
- mAIner Lookup rewards section (line ~1010): replace `entry.reward.amount.toString()` with `formatFunnaiAmount(entry.reward.amount)`
- Leaderboard total rewards column (line ~1228): replace `Number(entry.totalRewards).toLocaleString()` with `formatFunnaiAmount(entry.totalRewards)`

### Remove
- Nothing removed

## Implementation Plan
1. Add `formatFunnaiAmount` helper near the other formatting utilities at the top of App.tsx
2. Update the three display sites to use the new helper
3. Validate and build
