export interface Game {
	url: string;
	question: string;
	probability: number;
	outcome: number;
}

export interface BetResult {
	question: string;
	probability: number;
	stake: number;
	profit: number;
	won: boolean;
	outcome: number;
}

export type BetPreferences = {
	stakePerGame: number | ((probability: number) => number);
	lowerThreshold: number;
	upperThreshold: number;
	includeOutputs?: boolean;
	excludeSkippedBets?: boolean;
	games: Game[];
};
