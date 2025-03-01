'use client';

import { useState, useEffect } from 'react';
import { GameState, Player, Card, Action } from '../types/poker';
import { initializeGame, dealCards, dealCommunityCards, makeAIDecision } from '../utils/poker';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(initializeGame());
  const [message, setMessage] = useState<string>('게임을 시작합니다.');

  const startNewRound = () => {
    const newGameState = initializeGame();
    const { hands, remainingDeck } = dealCards(newGameState.deck, 6);
    
    newGameState.players.forEach((player, index) => {
      player.hand = hands[index];
    });
    
    newGameState.deck = remainingDeck;
    setGameState(newGameState);
    setMessage('새 라운드가 시작되었습니다.');
  };

  const handlePlayerAction = (action: Action, betAmount?: number) => {
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayer];

    switch (action) {
      case 'fold':
        currentPlayer.hasFolded = true;
        setMessage(`${currentPlayer.name}가 폴드했습니다.`);
        break;
      case 'call':
        const callAmount = newGameState.currentBet - currentPlayer.currentBet;
        currentPlayer.chips -= callAmount;
        currentPlayer.currentBet = newGameState.currentBet;
        newGameState.pot += callAmount;
        setMessage(`${currentPlayer.name}가 콜했습니다.`);
        break;
      case 'raise':
        if (betAmount && betAmount > currentPlayer.currentBet) {
          currentPlayer.chips -= betAmount;
          currentPlayer.currentBet = betAmount;
          newGameState.currentBet = betAmount;
          newGameState.pot += betAmount;
          setMessage(`${currentPlayer.name}가 ${betAmount}만큼 레이즈했습니다.`);
        }
        break;
    }

    // 다음 플레이어로 이동
    newGameState.currentPlayer = (newGameState.currentPlayer + 1) % 6;
    setGameState(newGameState);

    // AI 플레이어 턴 처리
    if (newGameState.players[newGameState.currentPlayer].isAI) {
      handleAITurn(newGameState);
    }
  };

  const handleAITurn = (currentGameState: GameState) => {
    const aiPlayer = currentGameState.players[currentGameState.currentPlayer];
    const decision = makeAIDecision(aiPlayer, currentGameState);
    handlePlayerAction(decision.action, decision.amount);
  };

  return (
    <main className="min-h-screen bg-green-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 text-white text-center text-2xl">{message}</div>
        
        {/* 커뮤니티 카드 */}
        <div className="bg-green-700 p-4 rounded-lg mb-4">
          <h2 className="text-white mb-2">커뮤니티 카드</h2>
          <div className="flex gap-2">
            {gameState.communityCards.map((card, index) => (
              <div key={index} className="bg-white p-2 rounded">
                {card.rank} {card.suit}
              </div>
            ))}
          </div>
        </div>

        {/* 플레이어 영역 */}
        <div className="grid grid-cols-3 gap-4">
          {gameState.players.map((player, index) => (
            <div
              key={player.id}
              className={`bg-green-600 p-4 rounded-lg ${
                gameState.currentPlayer === index ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              <h3 className="text-white mb-2">{player.name}</h3>
              <div className="text-white">칩스: {player.chips}</div>
              <div className="text-white">현재 베팅: {player.currentBet}</div>
              {!player.isAI && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handlePlayerAction('fold')}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    폴드
                  </button>
                  <button
                    onClick={() => handlePlayerAction('call')}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    콜
                  </button>
                  <button
                    onClick={() => handlePlayerAction('raise', 50)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    레이즈
                  </button>
                </div>
              )}
              {!player.isAI && player.hand.map((card, cardIndex) => (
                <div key={cardIndex} className="bg-white mt-2 p-2 rounded">
                  {card.rank} {card.suit}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 게임 컨트롤 */}
        <div className="mt-4 text-center">
          <button
            onClick={startNewRound}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            새 게임 시작
          </button>
        </div>
      </div>
    </main>
  );
} 