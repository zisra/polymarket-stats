import { readFile } from 'node:fs/promises';
import { Game } from './types';

export async function getGames(path: string) {
	const data = await readFile(path, 'utf-8');
	const games: Game[] = JSON.parse(data);

	return games;
}
