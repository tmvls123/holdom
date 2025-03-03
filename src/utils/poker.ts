import { Card, Suit, Rank, Player, GameState, BettingRound, HandProbability } from '../types/poker';

const HAND_RANKINGS = {
  ROYAL_FLUSH: 10,
  STRAIGHT_FLUSH: 9,
  FOUR_OF_A_KIND: 8,
  FULL_HOUSE: 7,
  FLUSH: 6,
  STRAIGHT: 5,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH_CARD: 1
};

const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return shuffleDeck(deck);
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealInitialCards(): GameState {
  const deck = createDeck();
  const playerHand = [deck.pop()!, deck.pop()!];
  const communityCards: Card[] = [];
  const probabilities = calculateProbabilities(playerHand, communityCards, deck);

  return {
    playerHand,
    communityCards,
    deck,
    probabilities,
    gamePhase: 'preflop',
    players: [],
    currentPlayer: 0,
    pot: 0,
    currentBet: 0,
    dealerPosition: 0,
    smallBlind: 1,
    bigBlind: 2,
    minRaise: 2,
    lastRaiseAmount: 0,
    roundComplete: false
  };
}

export function dealFlop(gameState: GameState): GameState {
  const { deck } = gameState;
  const communityCards = [deck.pop()!, deck.pop()!, deck.pop()!];
  
  return {
    ...gameState,
    communityCards,
    deck,
    probabilities: calculateProbabilities(gameState.playerHand, communityCards, deck),
    gamePhase: 'flop'
  };
}

export function dealTurn(gameState: GameState): GameState {
  const { deck, communityCards } = gameState;
  communityCards.push(deck.pop()!);
  
  return {
    ...gameState,
    communityCards,
    deck,
    probabilities: calculateProbabilities(gameState.playerHand, communityCards, deck),
    gamePhase: 'turn'
  };
}

export function dealRiver(gameState: GameState): GameState {
  const { deck, communityCards } = gameState;
  communityCards.push(deck.pop()!);
  
  return {
    ...gameState,
    communityCards,
    deck,
    probabilities: calculateProbabilities(gameState.playerHand, communityCards, deck),
    gamePhase: 'river'
  };
}

export function calculateProbabilities(playerHand: Card[], communityCards: Card[], deck: Card[]): {
  current: HandProbability;
  future: HandProbability;
} {
  // 현재 핸드 확률 계산
  const currentResults = {
    onePair: 0,
    twoPair: 0,
    threeOfAKind: 0,
    straight: 0,
    flush: 0,
    fullHouse: 0,
    fourOfAKind: 0,
    straightFlush: 0,
    royalFlush: 0,
    highCard: 0
  };

  // 현재 보드 상태 평가
  const currentHand = evaluateHand([...playerHand, ...communityCards]);
  currentResults[currentHand] = 100; // 현재 핸드는 100% 확률

  // 미래 핸드 확률 계산
  const futureResults = {
    onePair: 0,
    twoPair: 0,
    threeOfAKind: 0,
    straight: 0,
    flush: 0,
    fullHouse: 0,
    fourOfAKind: 0,
    straightFlush: 0,
    royalFlush: 0,
    highCard: 0
  };

  const simulations = 10000;
  const remainingCards = 5 - communityCards.length;

  // 미래 핸드 시뮬레이션
  for (let i = 0; i < simulations; i++) {
    const shuffledDeck = shuffleDeck([...deck]);
    const simulatedCommunityCards = [
      ...communityCards,
      ...shuffledDeck.slice(0, remainingCards)
    ];
    
    const simulatedHand = evaluateHand([...playerHand, ...simulatedCommunityCards]);
    futureResults[simulatedHand]++;
  }

  // 확률로 변환
  const current: HandProbability = {
    onePair: currentResults.onePair,
    twoPair: currentResults.twoPair,
    threeOfAKind: currentResults.threeOfAKind,
    straight: currentResults.straight,
    flush: currentResults.flush,
    fullHouse: currentResults.fullHouse,
    fourOfAKind: currentResults.fourOfAKind,
    straightFlush: currentResults.straightFlush,
    royalFlush: currentResults.royalFlush,
    highCard: currentResults.highCard
  };

  const future: HandProbability = {
    onePair: futureResults.onePair / simulations * 100,
    twoPair: futureResults.twoPair / simulations * 100,
    threeOfAKind: futureResults.threeOfAKind / simulations * 100,
    straight: futureResults.straight / simulations * 100,
    flush: futureResults.flush / simulations * 100,
    fullHouse: futureResults.fullHouse / simulations * 100,
    fourOfAKind: futureResults.fourOfAKind / simulations * 100,
    straightFlush: futureResults.straightFlush / simulations * 100,
    royalFlush: futureResults.royalFlush / simulations * 100,
    highCard: futureResults.highCard / simulations * 100
  };

  return { current, future };
}

function evaluateHand(cards: Card[]): keyof HandProbability {
  const rankCounts = new Map<Rank, number>();
  const suitCounts = new Map<Suit, number>();
  
  cards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  });

  // 플러시 체크
  const hasFlush = Array.from(suitCounts.values()).some(count => count >= 5);

  // 스트레이트 체크
  const ranks = RANKS;
  const uniqueRanks = Array.from(rankCounts.keys()).sort(
    (a, b) => ranks.indexOf(a) - ranks.indexOf(b)
  );
  
  let hasStraight = false;
  // 일반 스트레이트 체크
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const consecutive = uniqueRanks.slice(i, i + 5);
    if (consecutive.every((rank, index) => 
      ranks.indexOf(rank) === ranks.indexOf(consecutive[0]) + index
    )) {
      hasStraight = true;
      break;
    }
  }
  // A-5 스트레이트 체크
  if (!hasStraight && uniqueRanks.includes('A' as Rank)) {
    const lowAceStraight: Rank[] = ['A', '2', '3', '4', '5'] as Rank[];
    if (lowAceStraight.every(rank => uniqueRanks.includes(rank))) {
      hasStraight = true;
    }
  }

  const pairs = Array.from(rankCounts.values()).filter(count => count === 2).length;
  const threes = Array.from(rankCounts.values()).filter(count => count === 3).length;
  const fours = Array.from(rankCounts.values()).filter(count => count === 4).length;

  // 스트레이트 플러시 체크
  if (hasFlush && hasStraight) {
    // 로열 플러시 체크는 생략 (필요하다면 추가 구현)
    return 'straightFlush';
  }
  if (fours > 0) return 'fourOfAKind';
  if (threes > 0 && pairs > 0) return 'fullHouse';
  if (hasFlush) return 'flush';
  if (hasStraight) return 'straight';
  if (threes > 0) return 'threeOfAKind';
  if (pairs === 2) return 'twoPair';
  if (pairs === 1) return 'onePair';
  
  return 'highCard';
}

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
  const smallBlind = 10;
  const bigBlind = 20;

  // 사람 플레이어 추가
  players.push({
    id: 0,
    name: '플레이어',
    chips: 1000,
    hand: [],
    isAI: false,
    currentBet: 0,
    hasFolded: false,
    isDealer: true,
    position: 'dealer',
    hasActed: false
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
      hasFolded: false,
      isDealer: false,
      position: 'normal',
      hasActed: false
    });
  }

  return {
    players,
    deck,
    communityCards: [],
    currentPlayer: 0,
    pot: 0,
    currentBet: 0,
    gamePhase: 'preflop',
    dealerPosition: 0,
    smallBlind,
    bigBlind,
    minRaise: bigBlind,
    lastRaiseAmount: 0,
    roundComplete: false
  };
};

export const advanceGamePhase = (gameState: GameState): GameState => {
  const newState = { ...gameState };
  
  // 모든 플레이어의 베팅과 액션 상태 초기화
  newState.players.forEach(player => {
    if (!player.hasFolded) {
      player.hasActed = false;
      player.currentBet = 0;
    }
  });
  newState.currentBet = 0;

  // 베팅 라운드 진행
  switch (newState.gamePhase) {
    case 'preflop':
      // 플랍 카드 3장 추가
      const flopCards = dealCommunityCards(newState.deck, 3);
      newState.communityCards = flopCards.cards;
      newState.deck = flopCards.remainingDeck;
      newState.gamePhase = 'flop';
      break;
    case 'flop':
      // 턴 카드 1장 추가
      const turnCard = dealCommunityCards(newState.deck, 1);
      newState.communityCards.push(turnCard.cards[0]);
      newState.deck = turnCard.remainingDeck;
      newState.gamePhase = 'turn';
      break;
    case 'turn':
      // 리버 카드 1장 추가
      const riverCard = dealCommunityCards(newState.deck, 1);
      newState.communityCards.push(riverCard.cards[0]);
      newState.deck = riverCard.remainingDeck;
      newState.gamePhase = 'river';
      break;
    case 'river':
      newState.gamePhase = 'showdown';
      break;
  }

  // 첫 베팅 플레이어 설정 (딜러 다음 플레이어부터)
  let firstPlayer = (newState.dealerPosition + 1) % newState.players.length;
  while (newState.players[firstPlayer].hasFolded) {
    firstPlayer = (firstPlayer + 1) % newState.players.length;
  }
  newState.currentPlayer = firstPlayer;
  
  return newState;
};

export const isRoundComplete = (gameState: GameState): boolean => {
  const activePlayers = gameState.players.filter(p => !p.hasFolded);
  
  // 모든 플레이어가 행동했는지 확인
  const allPlayersActed = activePlayers.every(p => p.hasActed);
  
  // 모든 베팅이 동일한지 확인
  const allBetsEqual = activePlayers.every(p => p.currentBet === gameState.currentBet);
  
  return allPlayersActed && allBetsEqual;
};

export const getHandStrength = (hand: Card[], communityCards: Card[]): number => {
  const allCards = [...hand, ...communityCards];
  
  // 카드 순위 맵 생성
  const rankMap = new Map<string, number>();
  const suitMap = new Map<string, number>();
  
  allCards.forEach(card => {
    rankMap.set(card.rank, (rankMap.get(card.rank) || 0) + 1);
    suitMap.set(card.suit, (suitMap.get(card.suit) || 0) + 1);
  });

  // 플러시 체크
  const hasFlush = Array.from(suitMap.values()).some(count => count >= 5);
  
  // 스트레이트 체크
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const uniqueRanks = Array.from(rankMap.keys()).sort(
    (a, b) => ranks.indexOf(a) - ranks.indexOf(b)
  );
  
  let hasStraight = false;
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const consecutive = uniqueRanks.slice(i, i + 5);
    if (consecutive.every((rank, index) => 
      ranks.indexOf(rank) === ranks.indexOf(consecutive[0]) + index
    )) {
      hasStraight = true;
      break;
    }
  }

  // 페어 체크
  const pairs = Array.from(rankMap.values()).filter(count => count === 2).length;
  const hasThreeOfAKind = Array.from(rankMap.values()).some(count => count === 3);
  const hasFourOfAKind = Array.from(rankMap.values()).some(count => count === 4);

  // 핸드 랭킹 결정
  let handRank = HAND_RANKINGS.HIGH_CARD;
  
  if (hasFlush && hasStraight) handRank = HAND_RANKINGS.STRAIGHT_FLUSH;
  else if (hasFourOfAKind) handRank = HAND_RANKINGS.FOUR_OF_A_KIND;
  else if (hasThreeOfAKind && pairs > 0) handRank = HAND_RANKINGS.FULL_HOUSE;
  else if (hasFlush) handRank = HAND_RANKINGS.FLUSH;
  else if (hasStraight) handRank = HAND_RANKINGS.STRAIGHT;
  else if (hasThreeOfAKind) handRank = HAND_RANKINGS.THREE_OF_A_KIND;
  else if (pairs === 2) handRank = HAND_RANKINGS.TWO_PAIR;
  else if (pairs === 1) handRank = HAND_RANKINGS.ONE_PAIR;

  // 핸드 강도를 0~1 사이의 값으로 정규화
  return handRank / HAND_RANKINGS.ROYAL_FLUSH;
};

const calculatePotOdds = (callAmount: number, potSize: number): number => {
  return callAmount / (potSize + callAmount);
};

const getPositionStrength = (position: string): number => {
  switch (position) {
    case 'dealer': return 1;
    case 'cutoff': return 0.9;
    case 'hijack': return 0.8;
    case 'lojack': return 0.7;
    case 'bigBlind': return 0.4;
    case 'smallBlind': return 0.3;
    default: return 0.6;
  }
};

export const makeAIDecision = (
  player: Player,
  gameState: GameState
): { action: 'fold' | 'check' | 'call' | 'raise'; amount?: number } => {
  const handStrength = getHandStrength(player.hand, gameState.communityCards);
  const callAmount = gameState.currentBet - player.currentBet;
  const potOdds = calculatePotOdds(callAmount, gameState.pot);
  const positionStrength = getPositionStrength(player.position);
  const stackToCallRatio = player.chips / (callAmount || 1);
  
  // GTO 기반 의사결정 (더 공격적인 플레이 스타일)
  const effectiveStrength = handStrength * 0.6 + positionStrength * 0.3 + (1 / stackToCallRatio) * 0.1;
  
  // 체크 가능한 상황
  if (callAmount === 0) {
    if (effectiveStrength > 0.5) {
      // 강한 핸드로 벳팅 (더 자주 벳팅)
      const betAmount = Math.min(
        Math.max(
          gameState.minRaise,
          Math.floor(gameState.pot * (effectiveStrength * 0.8))
        ),
        player.chips
      );
      return { action: 'raise', amount: betAmount };
    }
    return { action: 'check' };
  }
  
  // 콜/레이즈 결정 (더 낮은 임계값)
  if (effectiveStrength > potOdds * 1.2) {
    if (effectiveStrength > 0.6 && stackToCallRatio > 2) {
      // 강한 핸드로 레이즈 (더 공격적인 레이즈)
      const raiseAmount = Math.min(
        Math.max(
          gameState.minRaise,
          Math.floor(gameState.pot * (effectiveStrength * 1.2))
        ),
        player.chips
      );
      return { action: 'raise', amount: raiseAmount };
    }
    return { action: 'call' };
  }
  
  // 약한 핸드로 폴드 (블러핑 추가)
  if (Math.random() < 0.2 && effectiveStrength > 0.3) {
    const bluffAmount = Math.min(
      Math.max(gameState.minRaise, Math.floor(gameState.pot * 0.5)),
      player.chips
    );
    return { action: 'raise', amount: bluffAmount };
  }
  
  return { action: 'fold' };
};

export const determineWinner = (players: Player[], communityCards: Card[]): Player => {
  const activePlayers = players.filter(p => !p.hasFolded);
  let winner = activePlayers[0];
  let maxStrength = getHandStrength(winner.hand, communityCards);

  for (let i = 1; i < activePlayers.length; i++) {
    const player = activePlayers[i];
    const strength = getHandStrength(player.hand, communityCards);
    if (strength > maxStrength) {
      maxStrength = strength;
      winner = player;
    }
  }

  return winner;
}; 