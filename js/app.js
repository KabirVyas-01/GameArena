/**
 * GAME ARENA - Main Application Controller
 * Created by KABIR VYAS
 */

const App = (() => {
  let activeFilter = 'all';

  return {
    init() {
      // Initialize Confetti
      Confetti.init();

      // Load Profile
      this.loadProfile();

      // Setup Sound Toggle
      this.initSoundToggle();

      // Setup Profile Modal
      this.initProfileModal();

      // Update Quick Stats Strip on Hub
      this.updateQuickStats();

      // Default to Hub Screen
      this.showScreen('hub');
    },

    // --- Screen Navigation ---
    showScreen(screenId) {
      document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
      });

      const target = document.getElementById(`screen-${screenId}`);
      if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      if (screenId === 'hub') {
        this.updateQuickStats();
      }
    },

    launchGame(gameKey) {
      SoundEngine.playClick();
      this.showScreen(gameKey);

      if (gameKey === 'rps') {
        RPSGame.init();
      } else if (gameKey === 'ttt') {
        TTTGame.init();
      } else if (gameKey === 'sudoku') {
        SudokuGame.init();
      }
    },

    // --- Sound Controls ---
    initSoundToggle() {
      const isMuted = localStorage.getItem('game_arena_muted') === 'true';
      SoundEngine.setMute(isMuted);
      this.updateSoundIcon(isMuted);

      const btn = document.getElementById('sound-toggle-btn');
      if (btn) {
        btn.onclick = () => {
          const muted = SoundEngine.toggleMute();
          this.updateSoundIcon(muted);
          if (!muted) SoundEngine.playClick();
        };
      }
    },

    updateSoundIcon(isMuted) {
      const icon = document.getElementById('sound-icon');
      if (icon) {
        icon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
      }
    },

    // --- Profile Management ---
    loadProfile() {
      const profile = StorageManager.getProfile();
      const nameEl = document.getElementById('nav-player-name');
      const avatarEl = document.getElementById('nav-player-avatar');
      if (nameEl) nameEl.textContent = profile.name;
      if (avatarEl) avatarEl.textContent = profile.avatar;
    },

    initProfileModal() {
      const openBtn = document.getElementById('open-profile-btn');
      if (openBtn) {
        openBtn.onclick = () => this.openProfileModal();
      }

      const avatarOptions = document.querySelectorAll('.avatar-opt');
      avatarOptions.forEach(opt => {
        opt.onclick = () => {
          avatarOptions.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          SoundEngine.playClick();
        };
      });
    },

    openProfileModal() {
      const profile = StorageManager.getProfile();
      const input = document.getElementById('profile-name-input');
      if (input) input.value = profile.name;

      document.querySelectorAll('.avatar-opt').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.avatar === profile.avatar);
      });

      document.getElementById('profile-modal').classList.add('active');
      SoundEngine.playClick();
    },

    closeProfileModal() {
      document.getElementById('profile-modal').classList.remove('active');
    },

    saveProfile() {
      const nameInput = document.getElementById('profile-name-input');
      const selectedAvatar = document.querySelector('.avatar-opt.selected');
      const avatar = selectedAvatar ? selectedAvatar.dataset.avatar : '🎮';
      const name = nameInput.value.trim() || 'Player 1';

      StorageManager.saveProfile(name, avatar);
      this.loadProfile();
      this.closeProfileModal();
      SoundEngine.playVictory();
    },

    // --- Quick Stats Dashboard ---
    updateQuickStats() {
      const stats = StorageManager.getAggregatedStats('all');
      const totalGames = document.getElementById('quick-total-games');
      const totalWins = document.getElementById('quick-total-wins');
      const winRate = document.getElementById('quick-win-rate');
      const bestSudoku = document.getElementById('quick-best-sudoku');

      if (totalGames) totalGames.textContent = stats.totalPlayed;
      if (totalWins) totalWins.textContent = stats.totalWins;
      if (winRate) winRate.textContent = stats.winRate;
      if (bestSudoku) bestSudoku.textContent = stats.bestSudokuTime;
    },

    // --- Stats & Match History Modal ---
    openStatsModal() {
      this.renderStatsModal();
      document.getElementById('stats-modal').classList.add('active');
      SoundEngine.playClick();
    },

    closeStatsModal() {
      document.getElementById('stats-modal').classList.remove('active');
    },

    filterStats(filterKey) {
      activeFilter = filterKey;
      document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filterKey || (filterKey === 'all' && tab.dataset.filter === 'all'));
      });
      SoundEngine.playClick();
      this.renderStatsModal();
    },

    renderStatsModal() {
      const stats = StorageManager.getAggregatedStats(activeFilter);

      // Update aggregates
      document.getElementById('modal-stat-played').textContent = stats.totalPlayed;
      document.getElementById('modal-stat-won').textContent = stats.totalWins;
      document.getElementById('modal-stat-winrate').textContent = stats.winRate;
      document.getElementById('modal-stat-best-sudoku').textContent = stats.bestSudokuTime;

      // Update table
      const tbody = document.getElementById('stats-table-body');
      if (!tbody) return;

      if (stats.filteredResults.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-dim); padding: 30px 0;">
              No match records found. Go play some games!
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = stats.filteredResults.map(r => {
        let tagClass = 'draw';
        if (r.isWin || r.result === 'Win' || r.result === 'Completed') tagClass = 'win';
        else if (r.result === 'Loss') tagClass = 'loss';

        return `
          <tr>
            <td>${r.dateTime}</td>
            <td><strong>${r.name}</strong></td>
            <td>${r.game}</td>
            <td><span class="result-tag ${tagClass}">${r.result}</span></td>
            <td>${r.detail}</td>
            <td>${r.timeTaken}</td>
          </tr>
        `;
      }).join('');
    },

    confirmClearData() {
      if (confirm('Are you sure you want to clear all game match records and statistics?')) {
        StorageManager.clearAll();
        this.renderStatsModal();
        this.updateQuickStats();
        SoundEngine.playError();
      }
    },

    // --- Victory / Match Dialog ---
    showVictoryModal({ icon, title, subtitle, detail, onPlayAgain }) {
      document.getElementById('victory-modal-icon').textContent = icon || '🏆';
      document.getElementById('victory-modal-title').textContent = title || 'VICTORY!';
      document.getElementById('victory-modal-subtitle').textContent = subtitle || '';
      document.getElementById('victory-details-card').innerHTML = detail || '';

      const playAgainBtn = document.getElementById('victory-play-again-btn');
      playAgainBtn.onclick = () => {
        this.closeVictoryModal();
        if (onPlayAgain) onPlayAgain();
      };

      document.getElementById('victory-modal').classList.add('active');
    },

    closeVictoryModal() {
      document.getElementById('victory-modal').classList.remove('active');
    }
  };
})();

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  const statsBtn = document.getElementById('open-stats-btn');
  if (statsBtn) {
    statsBtn.onclick = () => App.openStatsModal();
  }
});
