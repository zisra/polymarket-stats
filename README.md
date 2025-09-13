## Polymarket Sports Backtesting

Backtest betting strategies against historical Polymarket sports price data. This repo provides:

- A simple data model for games and prices
- Utilities to load data and compute PnL/ROI
- A tiny Strategy runner to sweep hyperparameters and mitigate overfitting
- An example strategy you can copy and modify

## Quick start

Prereqs: Node 18+ (for global fetch), pnpm or npm.

1. Install deps

```sh
pnpm install
# or
npm install
```

2. Fetch game URLs and price data (NBA by default)

```sh
pnpm run getGames   # writes ./nba-data/games.json
pnpm run getData    # writes/updates ./nba-data/gamesComplete.json
```

3. Run profitability backtests (executes the example strategy)

```sh
pnpm run profitability
```

## Data model

Games are stored in `nba-data/gamesComplete.json` as an array of objects with this shape:

```ts
type Game = {
	url: string;
	question: string;
	probability: number; // price ∈ [0,1] near game start (pre-tipoff)
	outcome: number; // final price ∈ [0,1] after settlement (~1 for Yes, ~0 for No)
};
```

Notes:

- If `probability < lowerThreshold`, the backtester treats the bet as "No" (win when `outcome < 0.5`).
- If `probability > upperThreshold`, the bet is treated as "Yes" (win when `outcome > 0.5`).
- If `probability` is between thresholds, no bet is placed for that game.

## Backtesting APIs

All core utilities live under `scripts/profitability/logic`.

### Load games

`getGames(path: string): Promise<Game[]>`

```ts
import { getGames } from './scripts/profitability/logic/getGames';

const games = await getGames('./nba-data/gamesComplete.json');
```

### Core result types

```ts
type BetPreferences = {
	stakePerGame: number | ((probability: number) => number);
	lowerThreshold: number;
	upperThreshold: number;
	includeOutputs?: boolean;
	excludeSkippedBets?: boolean;
	games: Game[];
};
```

### PnL and ROI

`calculateBettingProfit(options: BetPreferences)`

- For each game, if a threshold is crossed, a stake is computed:
  - If `stakePerGame` is a number, that fixed amount is used per placed bet.
  - If it’s a function, it’s called with the game’s `probability` and can return a dynamic stake. Returning `0` effectively skips the bet even if the threshold is crossed.
- Payouts are derived from the quoted probability as decimal odds:
  - Yes bet profit: `stake * (100 / (prob*100) - 1)` when winning, else `-stake`.
  - No bet profit: `stake * (100 / (100 - prob*100) - 1)` when winning, else `-stake`.
- Returns:
  - `{ returnOnInvestment: string, successRate: string }` (percent strings, e.g. `'12.34'`).
- If `includeOutputs` is true, prints a table of per-game results and a summary.
- If `excludeSkippedBets` is true, the printed table hides rows where no bet was placed (does not change ROI math).

`calculateBettingProfitOverfit(options: BetPreferences & { divisions: number })`

- Shuffles games, splits into `divisions`, runs repeated evaluations per slice, and averages ROI and Success to reduce overfitting.
- Returns the same `{ returnOnInvestment, successRate }` shape.

### Strategy runner

`Strategy` helps sweep a single hyperparameter and print tables of ROI/Success.

Constructor signature:

```ts
new Strategy({
	name: string,
	from: number,
	to: number,
	increment: number,
	strategy: (i: number) => Omit<BetPreferences, 'games'>,
});
```

Methods:

- `execute({ games })`: Sweeps `i` from `from` to `to` in `increment` steps. Prints a table of ROI and Success.
- `executeOverfit({ divisions, games })`: Same sweep, but uses `calculateBettingProfitOverfit` to average over shuffled splits.
- `executeFor({ variable, excludeSkippedBets?, games })`: Runs a single configuration with detailed per-game output.

## Example strategy (included)

See `scripts/profitability/strategies/biasFactor.ts`:

```ts
import { Strategy } from '../logic/strategy';

export const biasFactorStrategy = new Strategy({
	name: 'Bias factor',
	from: 1,
	to: 4,
	increment: 0.1,
	strategy: (biasFactor) => ({
		stakePerGame: (probability) => {
			const multiplier = 0.01;
			const pricing =
				Math.pow(1 - Math.abs(probability - 0.5) * biasFactor, -2) * multiplier;
			return pricing < 10 ? 0 : pricing;
		},
		lowerThreshold: 0.5,
		upperThreshold: 0.5,
	}),
});
```

And it’s used in `scripts/profitability/index.ts`:

```ts
import { getGames } from './logic/getGames';
import { biasFactorStrategy } from './strategies/biasFactor';

const games = await getGames('./nba-data/gamesComplete.json');

biasFactorStrategy.executeOverfit({ divisions: 3, games });
biasFactorStrategy.execute({ games });
```

## Create your own strategy

1. Create a new file under `scripts/profitability/strategies/`, e.g. `myStrategy.ts`:

```ts
import { Strategy } from '../logic/strategy';

export const myStrategy = new Strategy({
	name: 'My strategy',
	from: 0.1,
	to: 0.9,
	increment: 0.1,
	strategy: (threshold) => ({
		// Fixed stake example (use a function for dynamic sizing)
		stakePerGame: 100,

		// Bet Yes above threshold, No below (set one equal to keep only one side)
		lowerThreshold: 1 - threshold, // No when prob < 1 - threshold
		upperThreshold: threshold, // Yes when prob > threshold
	}),
});
```

2. Register and run it in `scripts/profitability/index.ts`:

```ts
import { getGames } from './logic/getGames';
import { myStrategy } from './strategies/myStrategy';

const games = await getGames('./nba-data/gamesComplete.json');

// Overfit-mitigated sweep
myStrategy.executeOverfit({ divisions: 3, games });

// Simple sweep
myStrategy.execute({ games });

// Single run with detailed per-game output
myStrategy.executeFor({ variable: 0.6, excludeSkippedBets: true, games });
```

## Tips for designing strategies

- stakePerGame
  - Fixed stake: `stakePerGame: 100`
  - Probability-aware: `(p) => p < 0.5 ? 150 : 50`
  - Kelly-style (rough approximation): `(p) => bankroll * (edge/odds)`, where you estimate `edge` and convert `p` to fair odds.
- Thresholds
  - Set both to 0.5 to place bets only when the stake function returns > 0 (as in the example).
  - Use a gap (e.g. `lowerThreshold = 0.45`, `upperThreshold = 0.55`) to avoid marginal prices.
- Overfitting
  - Prefer `executeOverfit` with `divisions` between 3–5 for a more stable estimate.
- Reporting
  - Use `executeFor` with `excludeSkippedBets: true` to inspect only placed bets.

## Scripts reference

Defined in `package.json`:

- `getGames`: scrape league weeks and write `nba-data/games.json`.
- `getData`: fetch market prices and append to `nba-data/gamesComplete.json`.
- `profitability`: run `scripts/profitability/index.ts` to execute strategies.

## Troubleshooting

- Requires Node 18+ (global `fetch`). If you see fetch-related errors, upgrade Node.
- If `nba-data/gamesComplete.json` is empty, ensure you ran `getGames` before `getData` and that Polymarket endpoints are reachable.
- If you change file paths, update the path passed to `getGames()` in `scripts/profitability/index.ts`.

---

Happy testing! If you create a neat strategy, consider contributing it under `scripts/profitability/strategies/`.
