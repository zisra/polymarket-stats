import { getGames } from './logic/getGames';
import { biasFactorStrategy } from './strategies/biasFactor';

const games = await getGames('./nba-data/gamesComplete.json');

biasFactorStrategy.executeOverfit({
	divisions: 3,
	games,
});

biasFactorStrategy.executeFor({
	variable: 2.6,
	excludeSkippedBets: true,
	games,
});
