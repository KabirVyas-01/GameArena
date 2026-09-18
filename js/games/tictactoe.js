/**
 * GAME ARENA - Tic-Tac-Toe (vs Bot & Duel Mode)
 * Created by KABIR VYAS
 */

const TTTGame = (() => {
  let board = Array(9).fill('');
  let currentTurn = 'X'; // 'X' always goes first
  let gameMode = 'bot'; // 'bot' or 'duel'
  let isGameOver = false;
  let isBotThinking = false;
  let p1Wins = 0;
  let p2Wins = 0;

  const WIN_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const updateHUD = () => {
    const profile = StorageManager.getProfile();
    const p1Name = profile.name;
    const p2Name = gameMode === 'bot' ? 'Arena Bot' : 'Player 2';

    document.getElementById('ttt-p1-name').textContent = p1Name;
    document.getElementById('ttt-p2-name').textContent = p2Name;
    document.getElementById('ttt-p1-score').textContent = `${p1Wins} Wins`;
    document.getElementById('ttt-p2-score').textContent = `${p2Wins} Wins`;

    // Turn Highlights
    const p1Card = document.getElementById('ttt-p1-card');
    const p2Card = document.getElementById('ttt-p2-card');
    const turnText = document.getElementById('ttt-turn-text');

    if (!isGameOver) {
      if (currentTurn === 'X') {
        p1Card.classList.add('active-turn');
        p2Card.classList.remove('active-turn');
        turnText.textContent = `${p1Name}'s Turn (X)`;
      } else {
        p1Card.classList.remove('active-turn');
        p2Card.classList.add('active-turn');
        turnText.textContent = gameMode === 'bot' ? "Arena Bot is thinking..." : `${p2Name}'s Turn (O)`;
      }
    } else {
      p1Card.classList.remove('active-turn');
      p2Card.classList.remove('active-turn');
    }
  };

  const renderBoard = () => {
    const cells = document.querySelectorAll('.ttt-cell');
    cells.forEach((cell, idx) => {
      cell.textContent = board[idx];
      cell.className = 'ttt-cell';
      if (board[idx] === 'X') cell.classList.add('x-mark');
      if (board[idx] === 'O') cell.classList.add('o-mark');
      cell.disabled = isGameOver || isBotThinking || board[idx] !== '';
    });
  };

  const checkWinner = (grid) => {
    for (const combo of WIN_COMBINATIONS) {
      const [a, b, c] = combo;
      if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
        return { winner: grid[a], combo };
      }
    }
    if (grid.every(cell => cell !== '')) {
      return { winner: 'Draw', combo: null };
    }
    return null;
  };

  const drawStrikeLine = (combo) => {
    const line = document.getElementById('ttt-strike-line');
    if (!combo) {
      line.style.display = 'none';
      return;
    }

    const [a, , c] = combo;
    line.style.display = 'block';

    // Horizontal rows
    if (combo[0] === 0 && combo[2] === 2) {
      line.style.top = '16.66%';
      line.style.left = '5%';
      line.style.width = '90%';
      line.style.height = '6px';
      line.style.transform = 'none';
    } else if (combo[0] === 3 && combo[2] === 5) {
      line.style.top = '50%';
      line.style.left = '5%';
      line.style.width = '90%';
      line.style.height = '6px';
      line.style.transform = 'translateY(-50%)';
    } else if (combo[0] === 6 && combo[2] === 8) {
      line.style.top = '83.33%';
      line.style.left = '5%';
      line.style.width = '90%';
      line.style.height = '6px';
      line.style.transform = 'none';
    }
    // Vertical columns
    else if (combo[0] === 0 && combo[2] === 6) {
      line.style.left = '16.66%';
      line.style.top = '5%';
      line.style.height = '90%';
      line.style.width = '6px';
      line.style.transform = 'none';
    } else if (combo[0] === 1 && combo[2] === 7) {
      line.style.left = '50%';
      line.style.top = '5%';
      line.style.height = '90%';
      line.style.width = '6px';
      line.style.transform = 'translateX(-50%)';
    } else if (combo[0] === 2 && combo[2] === 8) {
      line.style.left = '83.33%';
      line.style.top = '5%';
      line.style.height = '90%';
      line.style.width = '6px';
      line.style.transform = 'none';
    }
    // Diagonals
    else if (combo[0] === 0 && combo[2] === 8) {
      line.style.top = '50%';
      line.style.left = '5%';
      line.style.width = '125%';
      line.style.height = '6px';
      line.style.transform = 'rotate(45deg) translateY(-50%)';
      line.style.transformOrigin = '0% 50%';
    } else if (combo[0] === 2 && combo[2] === 6) {
      line.style.top = '50%';
      line.style.right = '5%';
      line.style.left = 'auto';
      line.style.width = '125%';
      line.style.height = '6px';
      line.style.transform = 'rotate(-45deg) translateY(-50%)';
      line.style.transformOrigin = '100% 50%';
    }
  };

  const getSmartBotMove = () => {
    // 1. Win if bot has winning move
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        if (checkWinner(board)?.winner === 'O') {
          board[i] = '';
          return i;
        }
        board[i] = '';
      }
    }

    // 2. Block user from winning
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        if (checkWinner(board)?.winner === 'X') {
          board[i] = '';
          return i;
        }
        board[i] = '';
      }
    }

    // 3. Take Center if available
    if (board[4] === '') return 4;

    // 4. Take available Corners
    const corners = [0, 2, 6, 8].filter(i => board[i] === '');
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Random empty
    const empties = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    return empties[Math.floor(Math.random() * empties.length)];
  };

  return {
    init() {
      this.resetGame();
    },

    setMode(mode) {
      if (gameMode === mode) return;
      gameMode = mode;
      p1Wins = 0;
      p2Wins = 0;

      document.getElementById('ttt-tab-bot').className = `mode-tab ${mode === 'bot' ? 'active' : ''}`;
      document.getElementById('ttt-tab-duel').className = `mode-tab ${mode === 'duel' ? 'active' : ''}`;

      this.resetGame();
    },

    resetGame() {
      board = Array(9).fill('');
      currentTurn = 'X';
      isGameOver = false;
      isBotThinking = false;

      drawStrikeLine(null);
      document.getElementById('ttt-banner').textContent = 'Tap any square to place your mark';
      document.getElementById('ttt-play-again-btn').classList.add('hidden');

      updateHUD();
      renderBoard();
    },

    handleCellClick(index) {
      if (isGameOver || isBotThinking || board[index] !== '') return;

      board[index] = currentTurn;
      SoundEngine.playMove();
      renderBoard();

      const result = checkWinner(board);
      if (result) {
        this.handleGameEnd(result);
        return;
      }

      // Switch Turn
      currentTurn = currentTurn === 'X' ? 'O' : 'X';
      updateHUD();

      // Bot turn handling
      if (gameMode === 'bot' && currentTurn === 'O') {
        isBotThinking = true;
        renderBoard();
        setTimeout(() => {
          if (isGameOver) return;
          const botIdx = getSmartBotMove();
          if (botIdx !== undefined) {
            board[botIdx] = 'O';
            SoundEngine.playMove();
          }
          isBotThinking = false;

          const botResult = checkWinner(board);
          if (botResult) {
            this.handleGameEnd(botResult);
          } else {
            currentTurn = 'X';
            updateHUD();
            renderBoard();
          }
        }, 400);
      }
    },

    handleGameEnd(result) {
      isGameOver = true;
      const profile = StorageManager.getProfile();
      const banner = document.getElementById('ttt-banner');
      const nextBtn = document.getElementById('ttt-play-again-btn');
      nextBtn.classList.remove('hidden');

      if (result.winner === 'Draw') {
        banner.textContent = "🤝 It's a Draw!";
        SoundEngine.playDraw();
        StorageManager.saveResult('Tic-Tac-Toe', {
          playerName: profile.name,
          result: 'Draw',
          detail: gameMode === 'bot' ? 'vs Bot Mode' : 'Duel Mode (2P)',
          timeTaken: 'Match End',
          isWin: false
        });
      } else {
        drawStrikeLine(result.combo);
        const winnerSymbol = result.winner;
        const isP1 = winnerSymbol === 'X';

        if (isP1) {
          p1Wins++;
          banner.textContent = `🎉 ${profile.name} (X) Won!`;
          SoundEngine.playVictory();
          Confetti.launch(120);

          StorageManager.saveResult('Tic-Tac-Toe', {
            playerName: profile.name,
            result: 'Win',
            detail: gameMode === 'bot' ? 'vs Bot Mode' : 'Duel Mode (2P)',
            timeTaken: 'Match End',
            isWin: true
          });
        } else {
          p2Wins++;
          const p2Name = gameMode === 'bot' ? 'Arena Bot' : 'Player 2';
          banner.textContent = `👑 ${p2Name} (O) Won!`;

          if (gameMode === 'bot') {
            SoundEngine.playDefeat();
          } else {
            SoundEngine.playVictory();
            Confetti.launch(120);
          }

          StorageManager.saveResult('Tic-Tac-Toe', {
            playerName: gameMode === 'duel' ? 'Player 2' : profile.name,
            result: gameMode === 'duel' ? 'Win' : 'Loss',
            detail: gameMode === 'bot' ? 'vs Bot Mode' : 'Duel Mode (2P)',
            timeTaken: 'Match End',
            isWin: gameMode === 'duel'
          });
        }
      }

      updateHUD();
      renderBoard();
      App.updateQuickStats();
    }
  };
})();
