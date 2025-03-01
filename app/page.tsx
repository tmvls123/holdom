'use client';

import { useState } from 'react';
import { Card, GameState, HandProbability, Rank } from '../src/types/poker';
import { dealInitialCards, dealFlop, dealTurn, dealRiver, calculateProbabilities, createDeck } from '../src/utils/poker';

const CardComponent: React.FC<{ card: Card }> = ({ card }) => {
  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-black';
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  return (
    <div className="w-20 h-28 bg-white rounded-xl border-2 border-gray-200 shadow-lg flex flex-col items-center justify-between p-2 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <span className={`text-xl font-bold ${getSuitColor(card.suit)}`}>{card.rank}</span>
      <span className={`text-4xl ${getSuitColor(card.suit)}`}>{getSuitSymbol(card.suit)}</span>
    </div>
  );
};

const ProbabilityDisplay: React.FC<{ probabilities: { current: HandProbability; future: HandProbability }; gamePhase: string }> = ({ probabilities, gamePhase }) => {
  const getPhaseTitle = () => {
    switch (gamePhase) {
      case 'preflop':
        return '프리플랍 확률';
      case 'flop':
        return '플랍 확률';
      case 'turn':
        return '턴 확률';
      case 'river':
        return '리버 확률';
      default:
        return '핸드 확률';
    }
  };

  const getPhaseDescription = () => {
    switch (gamePhase) {
      case 'preflop':
        return '앞으로 나올 5장의 카드 기준';
      case 'flop':
        return '앞으로 나올 2장의 카드 기준';
      case 'turn':
        return '앞으로 나올 1장의 카드 기준';
      case 'river':
        return '최종 확률';
      default:
        return '';
    }
  };

  const ProbabilitySection = ({ title, probabilities }: { title: string; probabilities: HandProbability }) => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl">
      <h3 className="text-white text-xl font-bold mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="bg-gray-700 p-2 rounded-lg">
            <p className="text-white text-sm">원페어: <span className="font-bold text-blue-400">{probabilities.onePair.toFixed(1)}%</span></p>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg">
            <p className="text-white text-sm">투페어: <span className="font-bold text-blue-400">{probabilities.twoPair.toFixed(1)}%</span></p>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg">
            <p className="text-white text-sm">트리플: <span className="font-bold text-blue-400">{probabilities.threeOfAKind.toFixed(1)}%</span></p>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg">
            <p className="text-white text-sm">스트레이트: <span className="font-bold text-blue-400">{probabilities.straight.toFixed(1)}%</span></p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="bg-gray-700 p-2 rounded-lg">
            <p className="text-white text-sm">플러시: <span className="font-bold text-blue-400">{probabilities.flush.toFixed(1)}%</span></p>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg">
            <p className="text-white text-sm">풀하우스: <span className="font-bold text-blue-400">{probabilities.fullHouse.toFixed(1)}%</span></p>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg">
            <p className="text-white text-sm">포카드: <span className="font-bold text-blue-400">{probabilities.fourOfAKind.toFixed(1)}%</span></p>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg">
            <p className="text-white text-sm">스트레이트 플러시: <span className="font-bold text-blue-400">{probabilities.straightFlush.toFixed(1)}%</span></p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-white text-2xl font-bold">{getPhaseTitle()}</h2>
        <p className="text-gray-400 text-sm mt-2">{getPhaseDescription()}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProbabilitySection title="현재 핸드" probabilities={probabilities.current} />
        <ProbabilitySection title="가능한 미래 핸드" probabilities={probabilities.future} />
      </div>
    </div>
  );
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(dealInitialCards());
  const [isSelectingCard, setIsSelectingCard] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isSelectingBoardCard, setIsSelectingBoardCard] = useState(false);

  const handleCardSelect = (card: Card) => {
    if (selectedCardIndex !== null && (isSelectingCard || isSelectingBoardCard)) {
      const newGameState = { ...gameState };
      if (isSelectingCard) {
        newGameState.playerHand[selectedCardIndex] = card;
      } else {
        newGameState.communityCards[selectedCardIndex] = card;
      }
      
      // 새로운 덱 생성 (선택된 카드들을 제외한)
      const usedCards = [...newGameState.playerHand, ...newGameState.communityCards];
      const newDeck = createDeck().filter((c: Card) => 
        !usedCards.some(used => used.rank === c.rank && used.suit === c.suit)
      );
      newGameState.deck = newDeck;
      
      // 새로운 확률 계산
      const newProbabilities = calculateProbabilities(newGameState.playerHand, newGameState.communityCards, newDeck);
      newGameState.probabilities = newProbabilities;
      
      setGameState(newGameState);
      setIsSelectingCard(false);
      setIsSelectingBoardCard(false);
      setSelectedCardIndex(null);
    }
  };

  const allCards: Card[] = [];
  const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  suits.forEach(suit => {
    ranks.forEach(rank => {
      allCards.push({ suit, rank });
    });
  });

  const handleNextPhase = () => {
    switch (gameState.gamePhase) {
      case 'preflop':
        setGameState(dealFlop(gameState));
        break;
      case 'flop':
        setGameState(dealTurn(gameState));
        break;
      case 'turn':
        setGameState(dealRiver(gameState));
        break;
      case 'river':
        setGameState(dealInitialCards());
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="bg-gradient-to-r from-green-800 to-green-900 p-8 rounded-3xl shadow-2xl">
          <div className="mb-8">
            <h1 className="text-white text-3xl mb-6 font-bold text-center">나의 핸드</h1>
            <div className="flex gap-4 justify-center">
              {gameState.playerHand.map((card, index) => (
                <div 
                  key={index} 
                  onClick={() => {
                    setIsSelectingCard(true);
                    setIsSelectingBoardCard(false);
                    setSelectedCardIndex(index);
                  }}
                  className="cursor-pointer transform transition-all duration-300 hover:scale-110"
                >
                  <CardComponent card={card} />
                </div>
              ))}
            </div>
          </div>

          {(isSelectingCard || isSelectingBoardCard) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl max-w-4xl max-h-[80vh] overflow-auto">
                <h2 className="text-2xl font-bold mb-4 text-center">카드 선택</h2>
                <div className="grid grid-cols-4 gap-4">
                  {allCards.map((card, index) => (
                    <div
                      key={index}
                      onClick={() => handleCardSelect(card)}
                      className="cursor-pointer transform transition-all duration-300 hover:scale-105"
                    >
                      <CardComponent card={card} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setIsSelectingCard(false);
                    setIsSelectingBoardCard(false);
                    setSelectedCardIndex(null);
                  }}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg w-full"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-white text-2xl mb-6 font-bold text-center">보드</h2>
            <div className="flex gap-4 justify-center">
              {gameState.communityCards.map((card, index) => (
                <div 
                  key={index} 
                  onClick={() => {
                    setIsSelectingBoardCard(true);
                    setIsSelectingCard(false);
                    setSelectedCardIndex(index);
                  }}
                  className="cursor-pointer transform transition-all duration-300 hover:scale-110"
                >
                  <CardComponent card={card} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProbabilityDisplay probabilities={gameState.probabilities} gamePhase={gameState.gamePhase} />

        <div className="text-center">
          <button
            onClick={handleNextPhase}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg font-bold transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            {gameState.gamePhase === 'river' ? '새 게임' : '다음 단계'}
          </button>
        </div>
      </div>
    </div>
  );
}