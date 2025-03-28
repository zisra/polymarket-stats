import { type CheerioAPI, load } from 'cheerio';

const BASE_URL = 'https://polymarket.com/';

export function getLeagueUrl(league: string, week: number): string {
	return `${BASE_URL}/sports/${league}/games/week/${week}`;
}

export async function loadUrl(url: string) {
	return fetch(url)
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			return res.text();
		})
		.then((text) => load(text));
}

export function getNextData(html: CheerioAPI) {
	const script = html('script[id="__NEXT_DATA__"]').html();
	const json = script?.replace(/\\u002F/g, '/');
	if (!json) {
		throw new Error('No script found');
	}

	const jsonData = JSON.parse(json);
	const props = jsonData.props.pageProps.initialState;
	return props;
}
