import {
	calculateBettingProfit,
	calculateBettingProfitOverfit,
} from './calculateBettingProfit';
import { BetPreferences, Game } from './types';

export class Strategy {
	private name: string;
	private from: number;
	private to: number;
	private increment: number;
	private strategy: (i: number) => Omit<BetPreferences, 'games'>;

	constructor({
		name,
		from,
		to,
		increment,
		strategy,
	}: {
		name: string;
		from: number;
		to: number;
		increment: number;
		strategy: (i: number) => Omit<BetPreferences, 'games'>;
	}) {
		this.name = name;
		this.from = from;
		this.to = to;
		this.increment = increment;
		this.strategy = strategy;
	}

	public execute({ games }: { games: Game[] }) {
		const results: {
			[key: string]: string;
			'ROI (%)': string;
		}[] = [];
		console.log(`\n=== ${this.name} ===`);
		for (
			let i = this.from;
			i <= this.to + this.increment;
			i += this.increment
		) {
			results.push({
				[this.name]: i.toFixed(3),
				'ROI (%)': calculateBettingProfit({
					...this.strategy(i),
					games,
				}),
			});
		}

		console.table(results);
	}

	public executeOverfit({
		divisions,
		games,
	}: {
		divisions: number;
		games: Game[];
	}) {
		const results: {
			[key: string]: string;
			'ROI (%)': string;
		}[] = [];
		console.log(`\n=== ${this.name} (Overfit mitigation) ===`);
		for (
			let i = this.from;
			i <= this.to + this.increment;
			i += this.increment
		) {
			results.push({
				[this.name]: i.toFixed(3),
				'ROI (%)': calculateBettingProfitOverfit({
					...this.strategy(i),
					games,
					divisions: divisions,
				}),
			});
		}

		console.table(results);
	}

	public executeFor({
		variable,
		excludeSkippedBets = false,
		games,
	}: {
		excludeSkippedBets?: boolean;
		variable: number;
		games: Game[];
	}) {
		calculateBettingProfit({
			...this.strategy(variable),
			includeOutputs: true,
			games,
			excludeSkippedBets,
		});
	}
}
