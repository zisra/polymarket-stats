import { BetPreferences, BetResult } from './types';

function shuffleArray<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

export function calculateBettingProfit({
	stakePerGame = 100,
	lowerThreshold,
	upperThreshold,
	includeOutputs = false,
	games,
	excludeSkippedBets,
}: BetPreferences) {
	if (!Array.isArray(games) || games.length === 0)
		throw new Error('Invalid or empty JSON data');

	const results: BetResult[] = [];
	let totalStake = 0;
	let totalProfit = 0;

	for (const game of games) {
		const { question, probability, outcome } = game;

		if (probability < 0 || probability > 1 || outcome < 0 || outcome > 1)
			continue;

		let stake = 0;
		let profit = 0;
		let won = false;

		const calculatedStake =
			typeof stakePerGame === 'function'
				? stakePerGame(probability)
				: stakePerGame;

		if (probability < lowerThreshold) {
			stake = calculatedStake;
			totalStake += stake;
			won = outcome < 0.5;
			profit = won ? stake * (100 / (100 - probability * 100) - 1) : -stake;
		} else if (probability > upperThreshold) {
			stake = calculatedStake;
			totalStake += stake;
			won = outcome > 0.5;
			profit = won ? stake * (100 / (probability * 100) - 1) : -stake;
		}

		totalProfit += profit;
		results.push({ question, probability, stake, profit, won, outcome });
	}

	const returnOnInvestment = ((totalProfit / totalStake) * 100 || 0).toFixed(2);
	const betsPlaced = results.filter((r) => r.stake > 0).length;
	const successRate = (
		(results.filter((r) => r.profit > 0).length / betsPlaced) *
		100
	).toFixed(2);

	if (includeOutputs) {
		if (excludeSkippedBets) {
			let resultsTable = results
				.filter((i) => i.profit !== 0)
				.map((r) => ({
					Game: r.question,
					Probability: r.probability.toFixed(3),
					Outcome: r.outcome.toFixed(3),
					Stake: `$${r.stake.toFixed(2)}`,
					Profit: `$${r.profit.toFixed(2)}`,
					Won: r.won,
				}));

			console.table(resultsTable);
		} else {
			let resultsTable = results.map((r) => ({
				Game: r.question,
				Probability: r.probability.toFixed(3),
				Outcome: r.outcome.toFixed(3),
				Stake: `$${r.stake.toFixed(2)}`,
				Profit: `$${r.profit.toFixed(2)}`,
				Won: r.won,
			}));

			console.table(resultsTable);
		}

		console.log('=== Summary ===');
		console.log(`Total Games: ${results.length}`);
		console.log(`Bets Placed: ${betsPlaced}`);
		console.log(`Success Rate: ${successRate}%`);
		console.log(`Total Stake: $${totalStake.toFixed(2)}`);
		console.log(`Total Profit: $${totalProfit.toFixed(2)}`);
		console.log(`ROI: ${returnOnInvestment}%`);
	}

	return {
		returnOnInvestment,
		successRate,
	};
}

export function calculateBettingProfitOverfit({
	stakePerGame = 100,
	lowerThreshold,
	upperThreshold,
	includeOutputs = false,
	games,
	divisions,
}: BetPreferences & {
	divisions: number;
}) {
	games = shuffleArray(games);
	const EXTRA_ITERATIONS = 3;
	if (divisions > games.length) {
		throw new Error('Divisions cannot be greater than the number of games.');
	}

	const returnsOnInvestment: {
		returnOnInvestment: string;
		successRate: string;
	}[] = [];
	for (let i = 0; i < divisions; i++) {
		for (let j = 0; j < EXTRA_ITERATIONS; j++) {
			const start = Math.floor((i * games.length) / divisions);
			const end = Math.floor(((i + 1) * games.length) / divisions);
			returnsOnInvestment.push(
				calculateBettingProfit({
					stakePerGame,
					lowerThreshold,
					upperThreshold,
					includeOutputs,
					games: games.slice(start, end),
					excludeSkippedBets: false,
				})
			);
		}
	}

	return {
		returnOnInvestment: (
			returnsOnInvestment
				.map((n) => Number(n.returnOnInvestment))
				.reduce((a, b) => a + b, 0) / returnsOnInvestment.length
		).toFixed(2),
		successRate: (
			returnsOnInvestment
				.map((n) => Number(n.successRate))
				.reduce((a, b) => a + b, 0) / returnsOnInvestment.length
		).toFixed(2),
	};
}
