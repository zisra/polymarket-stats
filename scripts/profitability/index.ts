import { getGames } from './logic/getGames';
import { biasFactorStrategy } from './strategies/biasFactor';
import { scaleFactorStrategy } from './strategies/scaleFactor';

const games = await getGames('./nba-data/gamesComplete.json');

biasFactorStrategy.executeOverfit({
	divisions: 3,
	games,
});

scaleFactorStrategy.execute({
	games,
});

// biasFactorStrategy.executeFor({
// 	variable: 2.6,
// 	excludeSkippedBets: true,
// 	games,
// });

// scaleFactorStrategy.executeFor({
// 	games,
// 	variable: 0,
// });
