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
  isDealer: boolean;
  position: 'dealer' | 'smallBlind' | 'bigBlind' | 'normal';
  hasActed: boolean;
}

export type BettingRound = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  currentPlayer: number;
  pot: number;
  currentBet: number;
  gamePhase: BettingRound;
  dealerPosition: number;
  smallBlind: number;
  bigBlind: number;
  minRaise: number;
  lastRaiseAmount: number;
  roundComplete: boolean;
  playerHand: Card[];
  probabilities: {
    current: HandProbability;
    future: HandProbability;
  };
}

export type Action = 'fold' | 'check' | 'call' | 'raise';

export interface HandProbability {
  onePair: number;
  twoPair: number;
  threeOfAKind: number;
  straight: number;
  flush: number;
  fullHouse: number;
  fourOfAKind: number;
  straightFlush: number;
  royalFlush: number;
  highCard: number;
} 