import { getLeagueUrl, getNextData, loadUrl } from '../src';
import { writeFile } from 'node:fs/promises';

const LEAGUE = 'nba';
const MIN_WEEKS = 1;
const MAX_WEEKS = 28;

let allGames: string[] = [];

for (let week = MIN_WEEKS; week <= MAX_WEEKS; week++) {
	const leagueUrl = getLeagueUrl(LEAGUE, week);
	const leagueHtml = await loadUrl(leagueUrl);
	const props = getNextData(leagueHtml);
	const games = Object.keys(props.games).map((gameId) => {
		return `https://polymarket.com/sports/${LEAGUE}/games/week/${week}/${gameId}`;
	});

	allGames = allGames.concat(games);
}

const gamesFile = './nba-data/games.json';
const gamesData = JSON.stringify(allGames, null, 2);

await writeFile(gamesFile, gamesData);
console.log(`Games data written to ${gamesFile}`);
