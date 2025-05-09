import { Strategy } from '../logic/strategy';

export const scaleFactorStrategy = new Strategy({
	name: 'Scale factor',
	from: 0,
	to: 0.475,
	increment: 0.025,
	strategy: (threshold) => {
		return {
			stakePerGame: 100,
			lowerThreshold: 0.5 - threshold,
			upperThreshold: 0.5 + threshold,
		};
	},
});
