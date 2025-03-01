export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: number;
  name: string;
  chips: number;
  hand: Card[];
  isAI: boolean;
  currentBet: number;
  hasFolded: boolean;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  currentPlayer: number;
  pot: number;
  currentBet: number;
  gamePhase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
}

export type Action = 'fold' | 'check' | 'call' | 'raise'; 