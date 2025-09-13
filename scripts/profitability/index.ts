import { getGames } from './logic/getGames';
import { biasFactorStrategy } from './strategies/biasFactor';

const games = await getGames('./nba-data/gamesComplete.json');

biasFactorStrategy.executeOverfit({
	divisions: 3,
	games,
});

biasFactorStrategy.execute({
	games,
});
