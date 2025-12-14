# AI Weekly Summary Queries Documentation

## Overview

This document explains the behavior of the three database queries used by the AI Weekly Summary feature. These queries provide different perspectives on karma transactions and leaderboards for generating weekly summaries.

## Query Functions

### 1. `getLastWeekTransactions()`

**Purpose:** Returns all transactions (points given or taken) from the last 7 days.

**Description:**
- Returns individual transaction records from the **most recent 7 days** (recent activity)
- Includes full transaction details: message, amount, timestamp, running total, and user names
- Used to show what happened in the current week

**SQL Logic:**
```sql
WHERE t.timestamp >= datetime('now', '-7 days')
```
- Gets transactions where timestamp is **greater than or equal to** 7 days ago
- This means: transactions from the last 7 days (recent)

**Returns:**
- Array of `LastWeekTransaction` objects
- Each transaction includes:
  - `message`: The transaction message
  - `amount`: Karma amount (positive or negative)
  - `timestamp`: When the transaction occurred
  - `newTotal`: Running total after this transaction
  - `fromName`: Real name of the user who gave/took karma
  - `toName`: Real name of the user who received/lost karma

---

### 2. `getLastWeekLeaderboard()`

**Purpose:** Retrieves the leaderboard snapshot from 7 days ago.

**Description:**
- Returns the leaderboard state **as it was exactly 7 days ago** (historical snapshot)
- Shows who was leading 7 days ago, before the current week's activity
- Used to compare "where we were" vs "where we are now"

**SQL Logic:**
```sql
WHERE t.timestamp <= datetime('now', '-7 days')
```
- Gets transactions where timestamp is **less than or equal to** 7 days ago
- This means: all transactions up to 7 days ago (historical data)
- Calculates totals and ranks based only on transactions that existed 7 days ago

**Returns:**
- Array of `LeaderboardEntry` objects
- Each entry includes:
  - `toRealName`: User's real name
  - `totalReceived`: Total karma received (up to 7 days ago)
  - `rank`: User's rank in the leaderboard (1 = highest)

---

### 3. `getTodayLeaderboard()`

**Purpose:** Shows the current leaderboard as of today.

**Description:**
- Returns the **all-time leaderboard** up to and including today
- Shows the current state of who has the most karma overall
- Used to show "where we are now"

**SQL Logic:**
```sql
WHERE date(t.timestamp) <= date('now')
```
- Gets all transactions up to and including today
- This means: all historical transactions (no time limit)
- Calculates totals and ranks based on all transactions ever

**Returns:**
- Array of `LeaderboardEntry` objects
- Each entry includes:
  - `toRealName`: User's real name
  - `totalReceived`: Total karma received (all-time)
  - `rank`: User's current rank in the leaderboard (1 = highest)

---

## Key Differences

| Query | Time Range | Purpose | Use Case |
|-------|-----------|---------|----------|
| `getLastWeekTransactions` | **Last 7 days** (recent) | Show recent activity | "What happened this week?" |
| `getLastWeekLeaderboard` | **Up to 7 days ago** (historical) | Show past state | "Where were we last week?" |
| `getTodayLeaderboard` | **All time up to today** | Show current state | "Where are we now?" |

## Visual Timeline Example

```
Timeline:  [14 days ago]  [7 days ago]  [Today]
           |--------------|--------------|
           
getLastWeekLeaderboard:   [============]  (up to 7 days ago)
getLastWeekTransactions:              [========]  (last 7 days)
getTodayLeaderboard:      [========================]  (all time)
```

## Related Files

- `app/_lib/_db/index.ts`: Query implementations
- `app/_lib/_agent/agent.ts`: Query usage in AI agent
- `tests/e2e/aiWeeklySummary/aiWeeklySummary.spec.ts`: Test suite
