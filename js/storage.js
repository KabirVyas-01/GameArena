/**
 * GAME ARENA - LocalStorage State & Stats Management
 * Created by KABIR VYAS
 */

const StorageManager = (() => {
  const RESULTS_KEY = 'game_arena_results';
  const PROFILE_KEY = 'game_arena_profile';

  // Format Date-Time to match Python format: YYYY-MM-DD HH:MM:SS
  const formatDateTime = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, '0');
    const YYYY = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const DD = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
  };

  return {
    // --- Profile Management ---
    getProfile() {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
      return { name: 'Player 1', avatar: '🎮' };
    },

    saveProfile(name, avatar) {
      const profile = {
        name: name.trim() || 'Player 1',
        avatar: avatar || '🎮'
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return profile;
    },

    // --- Match Results Storage ---
    getResults() {
      const saved = localStorage.getItem(RESULTS_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
      return [];
    },

    saveResult(gameName, resultInfo) {
      const profile = this.getProfile();
      const results = this.getResults();

      const newEntry = {
        id: Date.now().toString(),
        name: resultInfo.playerName || profile.name,
        game: gameName,
        dateTime: formatDateTime(),
        result: resultInfo.result || '', // 'Win', 'Loss', 'Draw', 'Completed'
        detail: resultInfo.detail || '', // e.g. '3-1 vs Bot', 'X Won', 'Beginner'
        timeTaken: resultInfo.timeTaken || '--',
        isWin: resultInfo.isWin === true
      };

      results.unshift(newEntry); // Prepend so newest is at the top
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
      return newEntry;
    },

    // --- Statistics Aggregation ---
    getAggregatedStats(gameFilter = 'all') {
      const results = this.getResults();
      const filtered = gameFilter === 'all' 
        ? results 
        : results.filter(r => r.game.toLowerCase() === gameFilter.toLowerCase());

      const totalPlayed = filtered.length;
      const totalWins = filtered.filter(r => r.isWin || r.result === 'Win' || r.result === 'Completed').length;
      const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;

      // Calculate fastest sudoku time if any
      const sudokuGames = results.filter(r => r.game === 'Sudoku 6x6' && (r.isWin || r.result === 'Completed'));
      let bestSudokuSec = null;
      sudokuGames.forEach(g => {
        if (g.timeTaken && g.timeTaken.includes('sec')) {
          const sec = parseFloat(g.timeTaken);
          if (!isNaN(sec)) {
            if (bestSudokuSec === null || sec < bestSudokuSec) {
              bestSudokuSec = sec;
            }
          }
        }
      });

      return {
        totalPlayed,
        totalWins,
        winRate: `${winRate}%`,
        bestSudokuTime: bestSudokuSec !== null ? `${bestSudokuSec.toFixed(1)}s` : '--',
        filteredResults: filtered
      };
    },

    // --- Export Data ---
    exportCSV() {
      const results = this.getResults();
      if (results.length === 0) {
        alert('No game records to export yet!');
        return;
      }

      const headers = ['Date-Time', 'Player', 'Game', 'Result', 'Detail', 'Time Taken'];
      const rows = results.map(r => [
        `"${r.dateTime}"`,
        `"${r.name}"`,
        `"${r.game}"`,
        `"${r.result}"`,
        `"${r.detail}"`,
        `"${r.timeTaken}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `game_arena_results_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    exportJSON() {
      const results = this.getResults();
      if (results.length === 0) {
        alert('No game records to export yet!');
        return;
      }

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', dataStr);
      link.setAttribute('download', `game_arena_results_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    clearAll() {
      localStorage.removeItem(RESULTS_KEY);
    }
  };
})();
