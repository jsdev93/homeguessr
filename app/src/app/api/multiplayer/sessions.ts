// Shared in-memory session store (for demo only)
export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface Session {
  players: Player[];
  state: 'waiting' | 'playing' | 'finished';
  round: number;
  homes: any[];
  guesses: Record<string, string>;
}


