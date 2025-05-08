import {
	calculateBettingProfit,
	calculateBettingProfitOverfit,
} from './calculateBettingProfit';
import { BetPreferences, Game } from './types';

export function declareStrategy({
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
	strategy: (i: number) => BetPreferences;
}) {
	return {
		execute: () => {
			const results: {
				[key: string]: string;
				'ROI (%)': string;
			}[] = [];
			console.log(`\n=== ${name} ===`);
			for (let i = from; i <= to + increment; i += increment) {
				results.push({
					[name]: i.toFixed(3),
					'ROI (%)': calculateBettingProfit(strategy(i)),
				});
			}

			console.table(results);
		},

		executeOverfit: (divisions: number) => {
			const results: {
				[key: string]: string;
				'ROI (%)': string;
			}[] = [];
			console.log(`\n=== ${name} ===`);
			for (let i = from; i <= to + increment; i += increment) {
				results.push({
					[name]: i.toFixed(3),
					'ROI (%)': calculateBettingProfitOverfit(strategy(i), divisions),
				});
			}

			console.table(results);
		},

		executeFor: (i: number) => {
			calculateBettingProfit({ ...strategy(i), includeOutputs: true });
		},
	};
}
