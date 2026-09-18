/**
 * GAME ARENA - 6x6 Sudoku (Beginner & Pro Modes)
 * Features Procedural Backtracking Board Generator & Solver
 * Created by KABIR VYAS
 */

const SudokuGame = (() => {
  let difficulty = 'beginner'; // 'beginner' (18 clues) or 'pro' (11 clues)
  let solutionBoard = []; // 6x6 full solved grid
  let initialPuzzle = []; // 6x6 starter grid (numbers & 0s)
  let currentBoard = [];  // 6x6 user active grid
  let notes = {};         // key: `${r}-${c}`, value: Set of candidate numbers
  let moveHistory = [];   // for undo functionality
  let selectedCell = null; // { row, col }
  let isPencilMode = false;
  let mistakes = 0;
  const MAX_MISTAKES = 3;

  let timerSeconds = 0;
  let timerInterval = null;
  let isGameActive = false;

  // --- Procedural 6x6 Generator & Backtracking Solver ---

  const isValidPlacement = (grid, r, c, num) => {
    // Row check
    for (let col = 0; col < 6; col++) {
      if (grid[r][col] === num) return false;
    }
    // Column check
    for (let row = 0; row < 6; row++) {
      if (grid[row][c] === num) return false;
    }
    // 2x3 Subgrid check (2 rows, 3 cols per box)
    const boxStartRow = Math.floor(r / 2) * 2;
    const boxStartCol = Math.floor(c / 3) * 3;
    for (let row = boxStartRow; row < boxStartRow + 2; row++) {
      for (let col = boxStartCol; col < boxStartCol + 3; col++) {
        if (grid[row][col] === num) return false;
      }
    }
    return true;
  };

  const findEmptyCell = (grid) => {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (grid[r][c] === 0) return { r, c };
      }
    }
    return null;
  };

  const solveGrid = (grid) => {
    const empty = findEmptyCell(grid);
    if (!empty) return true;

    const { r, c } = empty;
    const nums = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);

    for (const num of nums) {
      if (isValidPlacement(grid, r, c, num)) {
        grid[r][c] = num;
        if (solveGrid(grid)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  };

  const generateFullSolution = () => {
    const grid = Array(6).fill(0).map(() => Array(6).fill(0));
    solveGrid(grid);
    return grid;
  };

  const createPuzzle = (solution, clueCount) => {
    const puzzle = solution.map(row => [...row]);
    const cellsToRemove = 36 - clueCount;
    let removed = 0;

    const positions = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        positions.push({ r, c });
      }
    }
    positions.sort(() => Math.random() - 0.5);

    for (const pos of positions) {
      if (removed >= cellsToRemove) break;
      puzzle[pos.r][pos.c] = 0;
      removed++;
    }

    return puzzle;
  };

  // --- Timer Controls ---
  const startTimer = () => {
    clearInterval(timerInterval);
    timerSeconds = 0;
    document.getElementById('sudoku-timer').textContent = '00:00';
    timerInterval = setInterval(() => {
      timerSeconds++;
      const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const secs = String(timerSeconds % 60).padStart(2, '0');
      document.getElementById('sudoku-timer').textContent = `${mins}:${secs}`;
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerInterval);
  };

  // --- Rendering & UI ---
  const renderGrid = () => {
    const container = document.getElementById('sudoku-grid');
    container.innerHTML = '';

    const selectedVal = selectedCell ? currentBoard[selectedCell.row][selectedCell.col] : null;

    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        const val = currentBoard[r][c];
        const isFixed = initialPuzzle[r][c] !== 0;

        if (isFixed) {
          cell.classList.add('fixed');
          cell.textContent = val;
        } else if (val !== 0) {
          cell.textContent = val;
        } else {
          // Render pencil notes if any
          const cellNotes = notes[`${r}-${c}`];
          if (cellNotes && cellNotes.size > 0) {
            const notesGrid = document.createElement('div');
            notesGrid.className = 'pencil-notes-grid';
            for (let n = 1; n <= 6; n++) {
              const numSpan = document.createElement('span');
              numSpan.className = 'pencil-num';
              numSpan.textContent = cellNotes.has(n) ? n : '';
              notesGrid.appendChild(numSpan);
            }
            cell.appendChild(notesGrid);
          }
        }

        // Selection & Highlighting
        if (selectedCell) {
          if (selectedCell.row === r && selectedCell.col === c) {
            cell.classList.add('selected');
          } else if (
            selectedCell.row === r || 
            selectedCell.col === c || 
            (Math.floor(selectedCell.row / 2) === Math.floor(r / 2) && Math.floor(selectedCell.col / 3) === Math.floor(c / 3))
          ) {
            cell.classList.add('highlighted');
          }

          if (val !== 0 && selectedVal !== 0 && val === selectedVal) {
            cell.classList.add('same-number');
          }
        }

        cell.onclick = () => selectCell(r, c);
        container.appendChild(cell);
      }
    }
  };

  const selectCell = (r, c) => {
    selectedCell = { row: r, col: c };
    SoundEngine.playClick();
    renderGrid();
  };

  const checkVictory = () => {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (currentBoard[r][c] !== solutionBoard[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  return {
    init() {
      this.bindKeyboard();
      this.generateNewPuzzle();
    },

    bindKeyboard() {
      window.addEventListener('keydown', (e) => {
        const screen = document.getElementById('screen-sudoku');
        if (!screen || !screen.classList.contains('active')) return;

        if (e.key >= '1' && e.key <= '6') {
          this.inputNumber(parseInt(e.key));
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          this.eraseSelected();
        } else if (e.key === 'n' || e.key === 'N') {
          this.togglePencilMode();
        } else if (selectedCell) {
          let { row, col } = selectedCell;
          if (e.key === 'ArrowUp' && row > 0) row--;
          else if (e.key === 'ArrowDown' && row < 5) row++;
          else if (e.key === 'ArrowLeft' && col > 0) col--;
          else if (e.key === 'ArrowRight' && col < 5) col++;
          selectCell(row, col);
        }
      });
    },

    setDifficulty(diff) {
      if (difficulty === diff) return;
      difficulty = diff;
      document.getElementById('sud-tab-beginner').className = `diff-tab ${diff === 'beginner' ? 'active' : ''}`;
      document.getElementById('sud-tab-pro').className = `diff-tab ${diff === 'pro' ? 'active' : ''}`;
      document.getElementById('sudoku-diff-display').textContent = diff === 'beginner' ? 'Beginner' : 'Pro';
      this.generateNewPuzzle();
    },

    generateNewPuzzle() {
      // Beginner: 18 clues, Pro: 11 clues
      const clues = difficulty === 'beginner' ? 18 : 11;
      
      solutionBoard = generateFullSolution();
      initialPuzzle = createPuzzle(solutionBoard, clues);
      currentBoard = initialPuzzle.map(row => [...row]);
      notes = {};
      moveHistory = [];
      selectedCell = null;
      mistakes = 0;
      isGameActive = true;

      document.getElementById('sudoku-mistakes').textContent = `0 / ${MAX_MISTAKES}`;
      startTimer();
      renderGrid();
    },

    togglePencilMode() {
      isPencilMode = !isPencilMode;
      const btn = document.getElementById('sudoku-pencil-btn');
      btn.classList.toggle('active', isPencilMode);
      btn.querySelector('span').textContent = isPencilMode ? 'Notes (ON)' : 'Notes (OFF)';
      SoundEngine.playClick();
    },

    inputNumber(num) {
      if (!isGameActive || !selectedCell) return;
      const { row, col } = selectedCell;

      // Cannot modify fixed starter clues
      if (initialPuzzle[row][col] !== 0) return;

      const cellKey = `${row}-${col}`;

      if (isPencilMode) {
        // Add/remove candidate note
        if (!notes[cellKey]) notes[cellKey] = new Set();
        if (notes[cellKey].has(num)) {
          notes[cellKey].delete(num);
        } else {
          notes[cellKey].add(num);
        }
        currentBoard[row][col] = 0;
        SoundEngine.playClick();
        renderGrid();
        return;
      }

      // Normal entry mode
      const prevVal = currentBoard[row][col];
      if (prevVal === num) return;

      moveHistory.push({
        row,
        col,
        prevVal,
        newVal: num,
        prevNotes: notes[cellKey] ? new Set(notes[cellKey]) : null
      });

      // Clear pencil notes for this cell
      delete notes[cellKey];

      // Validate against procedural solution
      if (solutionBoard[row][col] === num) {
        currentBoard[row][col] = num;
        SoundEngine.playNumberPlace();
        renderGrid();

        // Check if entire puzzle is solved
        if (checkVictory()) {
          this.handleVictory();
        }
      } else {
        currentBoard[row][col] = num;
        mistakes++;
        document.getElementById('sudoku-mistakes').textContent = `${mistakes} / ${MAX_MISTAKES}`;
        SoundEngine.playError();
        renderGrid();

        // Highlight error cell
        const cellElem = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
        if (cellElem) cellElem.classList.add('error');

        setTimeout(() => {
          currentBoard[row][col] = 0;
          renderGrid();
        }, 500);

        if (mistakes >= MAX_MISTAKES) {
          this.handleGameOver();
        }
      }
    },

    eraseSelected() {
      if (!isGameActive || !selectedCell) return;
      const { row, col } = selectedCell;
      if (initialPuzzle[row][col] !== 0) return;

      const cellKey = `${row}-${col}`;
      if (currentBoard[row][col] !== 0 || (notes[cellKey] && notes[cellKey].size > 0)) {
        moveHistory.push({
          row,
          col,
          prevVal: currentBoard[row][col],
          newVal: 0,
          prevNotes: notes[cellKey] ? new Set(notes[cellKey]) : null
        });
        currentBoard[row][col] = 0;
        delete notes[cellKey];
        SoundEngine.playClick();
        renderGrid();
      }
    },

    undoMove() {
      if (!isGameActive || moveHistory.length === 0) return;
      const lastMove = moveHistory.pop();
      const { row, col, prevVal, prevNotes } = lastMove;

      currentBoard[row][col] = prevVal;
      const cellKey = `${row}-${col}`;
      if (prevNotes) {
        notes[cellKey] = prevNotes;
      } else {
        delete notes[cellKey];
      }
      selectCell(row, col);
      SoundEngine.playClick();
    },

    giveHint() {
      if (!isGameActive) return;
      // Find empty cell
      const empties = [];
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          if (currentBoard[r][c] === 0) {
            empties.push({ r, c });
          }
        }
      }

      if (empties.length === 0) return;
      const chosen = empties[Math.floor(Math.random() * empties.length)];
      const { r, c } = chosen;

      currentBoard[r][c] = solutionBoard[r][c];
      delete notes[`${r}-${c}`];
      selectCell(r, c);
      SoundEngine.playNumberPlace();

      if (checkVictory()) {
        this.handleVictory();
      }
    },

    handleVictory() {
      isGameActive = false;
      stopTimer();
      SoundEngine.playVictory();
      Confetti.launch(160);

      const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const secs = String(timerSeconds % 60).padStart(2, '0');
      const timeFormatted = `${mins}:${secs}`;
      const profile = StorageManager.getProfile();

      StorageManager.saveResult('Sudoku 6x6', {
        playerName: profile.name,
        result: 'Completed',
        detail: `${difficulty === 'beginner' ? 'Beginner' : 'Pro'} Mode`,
        timeTaken: `${timerSeconds.toFixed(1)} sec (${timeFormatted})`,
        isWin: true
      });

      App.updateQuickStats();

      App.showVictoryModal({
        icon: '🧩',
        title: 'SUDOKU SOLVED!',
        subtitle: `Awesome job, ${profile.name}! You conquered the 6x6 puzzle!`,
        detail: `Mode: <strong>${difficulty.toUpperCase()}</strong> &bull; Time: <strong>${timeFormatted}</strong> &bull; Mistakes: <strong>${mistakes}/${MAX_MISTAKES}</strong>`,
        onPlayAgain: () => SudokuGame.generateNewPuzzle()
      });
    },

    handleGameOver() {
      isGameActive = false;
      stopTimer();
      SoundEngine.playDefeat();
      const profile = StorageManager.getProfile();

      StorageManager.saveResult('Sudoku 6x6', {
        playerName: profile.name,
        result: 'Loss',
        detail: `${difficulty === 'beginner' ? 'Beginner' : 'Pro'} (Max Mistakes)`,
        timeTaken: `${timerSeconds} sec`,
        isWin: false
      });

      App.updateQuickStats();

      App.showVictoryModal({
        icon: '❌',
        title: 'GAME OVER',
        subtitle: 'You reached the limit of 3 mistakes.',
        detail: `Difficulty: <strong>${difficulty.toUpperCase()}</strong>. Better luck next time!`,
        onPlayAgain: () => SudokuGame.generateNewPuzzle()
      });
    }
  };
})();
