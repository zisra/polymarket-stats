import { Strategy } from '../logic/strategy';

export const biasFactorStrategy = new Strategy({
	name: 'Bias factor',
	from: 1,
	to: 4,
	increment: 0.1,
	strategy: (biasFactor) => {
		return {
			stakePerGame: (probability) => {
				const multiplier = 0.01;
				const pricing =
					Math.pow(1 - Math.abs(probability - 0.5) * biasFactor, -2) *
					multiplier;

				if (pricing < 10) {
					return 0;
				}

				return pricing;
			},
			lowerThreshold: 0.5,
			upperThreshold: 0.5,
		};
	},
});
