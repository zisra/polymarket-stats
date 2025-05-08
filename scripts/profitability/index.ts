import { readFile } from 'node:fs/promises';
import { Game } from './types';
import { declareStrategy } from './declareStrategy';

const FILE_PATH = './nba-data/gamesComplete.json';
const data = await readFile(FILE_PATH, 'utf-8');
const games: Game[] = JSON.parse(data);

const scaleFactor = declareStrategy({
	name: 'Scale factor',
	from: 0,
	to: 0.475,
	increment: 0.025,
	strategy: (i) => {
		return {
			stakePerGame: 100,
			lowerThreshold: 0.5 - i,
			upperThreshold: 0.5 + i,
			games,
		};
	},
});

const biasFactor = declareStrategy({
	name: 'Bias factor',
	from: 1,
	to: 4,
	increment: 0.1,
	strategy: (biasFactor) => {
		return {
			stakePerGame: (probability) => {
				const multiplier = 1;
				return (
					Math.pow(1 - Math.abs(probability - 0.5) * biasFactor, -2) *
					multiplier
				);
			},
			lowerThreshold: 0.5,
			upperThreshold: 0.5,
			games,
		};
	},
});

biasFactor.execute();
biasFactor.executeOverfit(10);