import { Card, Suit, Rank, Player, GameState } from '../types/poker';

export const createDeck = (): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealCards = (deck: Card[], numPlayers: number): { hands: Card[][], remainingDeck: Card[] } => {
  const hands: Card[][] = [];
  const remainingDeck = [...deck];

  for (let i = 0; i < numPlayers; i++) {
    const hand = [remainingDeck.pop()!, remainingDeck.pop()!];
    hands.push(hand);
  }

  return { hands, remainingDeck };
};

export const dealCommunityCards = (deck: Card[], count: number): { cards: Card[], remainingDeck: Card[] } => {
  const cards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  return { cards, remainingDeck };
};

export const initializeGame = (playerCount: number = 6): GameState => {
  const deck = createDeck();
  const players: Player[] = [];

  // 사람 플레이어 추가
  players.push({
    id: 0,
    name: '플레이어',
    chips: 1000,
    hand: [],
    isAI: false,
    currentBet: 0,
    hasFolded: false
  });

  // AI 플레이어 추가
  for (let i = 1; i < playerCount; i++) {
    players.push({
      id: i,
      name: `AI ${i}`,
      chips: 1000,
      hand: [],
      isAI: true,
      currentBet: 0,
      hasFolded: false
    });
  }

  return {
    players,
    deck,
    communityCards: [],
    currentPlayer: 0,
    pot: 0,
    currentBet: 0,
    gamePhase: 'preflop'
  };
};

export const getHandStrength = (hand: Card[], communityCards: Card[]): number => {
  // 여기에 핸드 강도를 계산하는 로직을 구현합니다.
  // 실제 구현에서는 포커 핸드의 순위를 결정하는 복잡한 로직이 필요합니다.
  return Math.random(); // 임시 구현
};

export const makeAIDecision = (
  player: Player,
  gameState: GameState
): { action: 'fold' | 'check' | 'call' | 'raise'; amount?: number } => {
  const handStrength = getHandStrength(player.hand, gameState.communityCards);
  
  if (handStrength < 0.3) {
    return { action: 'fold' };
  }
  
  if (handStrength < 0.6) {
    return { action: 'call' };
  }
  
  return { 
    action: 'raise',
    amount: Math.min(
      Math.floor(player.chips * handStrength * 0.2),
      player.chips
    )
  };
}; 