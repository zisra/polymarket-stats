import { writeFile, readFile } from 'node:fs/promises';
import { getNextData, loadUrl } from '../../src';

const gamesFilePath = './nba-data/games.json';
const rawGamesData = await readFile(gamesFilePath, 'utf-8');
const gameUrls = JSON.parse(rawGamesData) as string[];

const allGameResults: {
	url: string;
	question: string;
	probability: number;
	outcome: number;
}[] = [];
const currentTimestamp = (new Date().valueOf() / 1000).toFixed(0);

for (const gameUrl of gameUrls) {
	console.log(`Fetching data for game: ${gameUrl}`);

	const gameHtml = await loadUrl(gameUrl);
	const gameProps = getNextData(gameHtml);
	const gameId = gameUrl.split('/').pop();

	if (!gameId) {
		console.error(`Invalid game URL: ${gameUrl}`);
		continue;
	}

	const clobTokenId = gameProps.events[gameId].markets[0].clobTokenIds[0];
	const marketQuestion = gameProps.events[gameId].markets[0].question;
	const gameStartTimestamp = gameProps.events[gameId].markets[0].gameStartTime;

	const clobApiUrl = `https://clob.polymarket.com/prices-history?market=${clobTokenId}&fidelity=15&endTs=${currentTimestamp}`;
	const response = await fetch(clobApiUrl);
	const clobData = await response.json();

	const finalPrice = clobData.history[clobData.history.length - 1].p;
	const initialPriceIndex = clobData.history.findIndex(
		(price: { t: number }) => {
			return price.t >= new Date(gameStartTimestamp).valueOf() / 1000;
		}
	);
	const initialPrice =
		initialPriceIndex >= 5
			? clobData.history[initialPriceIndex - 5].p
			: clobData.history[0].p;

	const gameResult = {
		url: gameUrl,
		question: marketQuestion,
		probability: initialPrice,
		outcome: finalPrice,
	};

	allGameResults.push(gameResult);

	const completeGamesData = await readFile(
		'./nba-data/gamesComplete.json',
		'utf-8'
	);
	const parsedCompleteGames = JSON.parse(completeGamesData);

	parsedCompleteGames.push(gameResult);
	const updatedGamesDataString = JSON.stringify(parsedCompleteGames, null, 2);
	await writeFile('./nba-data/gamesComplete.json', updatedGamesDataString);
}
