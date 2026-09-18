/**
 * GAME ARENA - Rock Paper Scissors (Best of 5 Only)
 * Created by KABIR VYAS
 */

const RPSGame = (() => {
  const CHOICES = ['rock', 'paper', 'scissors'];
  const EMOJIS = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️'
  };

  let userScore = 0;
  let botScore = 0;
  let currentRound = 1;
  let isAnimating = false;
  let roundHistory = [];

  const updateUI = () => {
    const profile = StorageManager.getProfile();
    document.getElementById('rps-player-name').textContent = profile.name;
    document.getElementById('rps-player-avatar').textContent = profile.avatar;
    document.getElementById('rps-user-score').textContent = userScore;
    document.getElementById('rps-bot-score').textContent = botScore;
    document.getElementById('rps-round-label').textContent = `Round ${currentRound}`;

    // Update round dots (up to 3 dots each)
    const userDots = document.getElementById('rps-user-dots').children;
    const botDots = document.getElementById('rps-bot-dots').children;

    for (let i = 0; i < 3; i++) {
      if (userDots[i]) userDots[i].className = `dot ${i < userScore ? 'filled' : ''}`;
      if (botDots[i]) botDots[i].className = `dot ${i < botScore ? 'filled' : ''}`;
    }
  };

  const renderHistory = () => {
    const list = document.getElementById('rps-rounds-list');
    if (roundHistory.length === 0) {
      list.innerHTML = '<p class="empty-history-text">No rounds played in this match yet.</p>';
      return;
    }

    list.innerHTML = roundHistory.map(r => `
      <div class="rps-round-row">
        <span>Round ${r.round}: You (${EMOJIS[r.user]}) vs Bot (${EMOJIS[r.bot]})</span>
        <strong style="color: ${r.resultColor}">${r.resultText}</strong>
      </div>
    `).join('');
  };

  const disableButtons = (disabled) => {
    document.querySelectorAll('.rps-btn').forEach(btn => {
      btn.disabled = disabled;
    });
  };

  return {
    init() {
      this.resetMatch();
    },

    resetMatch() {
      userScore = 0;
      botScore = 0;
      currentRound = 1;
      isAnimating = false;
      roundHistory = [];

      document.getElementById('rps-user-hand').textContent = '✊';
      document.getElementById('rps-bot-hand').textContent = '🤖';
      
      const banner = document.getElementById('rps-status-banner');
      banner.textContent = 'Make your choice to begin!';
      banner.className = 'rps-status-banner';

      disableButtons(false);
      updateUI();
      renderHistory();
    },

    playRound(userChoice) {
      if (isAnimating || userScore >= 3 || botScore >= 3) return;

      isAnimating = true;
      disableButtons(true);
      SoundEngine.playPick();

      const userHand = document.getElementById('rps-user-hand');
      const botHand = document.getElementById('rps-bot-hand');
      const banner = document.getElementById('rps-status-banner');

      // Reveal choices cleanly
      const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];

      setTimeout(() => {
        userHand.textContent = EMOJIS[userChoice];
        botHand.textContent = EMOJIS[botChoice];

        // Determine round winner
        let roundWinner = 'tie';
        let resultText = "It's a Tie!";
        let resultColor = 'var(--accent-gold)';

        if (userChoice === botChoice) {
          roundWinner = 'tie';
          banner.textContent = "🤝 It's a Tie!";
          banner.className = 'rps-status-banner tie';
          SoundEngine.playDraw();
        } else if (
          (userChoice === 'rock' && botChoice === 'scissors') ||
          (userChoice === 'paper' && botChoice === 'rock') ||
          (userChoice === 'scissors' && botChoice === 'paper')
        ) {
          roundWinner = 'user';
          userScore++;
          banner.textContent = '🎉 You won this round!';
          banner.className = 'rps-status-banner win';
          resultText = 'You Won';
          resultColor = 'var(--accent-emerald)';
          SoundEngine.playMove();
        } else {
          roundWinner = 'bot';
          botScore++;
          banner.textContent = '🤖 Bot won this round!';
          banner.className = 'rps-status-banner loss';
          resultText = 'Bot Won';
          resultColor = 'var(--accent-rose)';
          SoundEngine.playError();
        }

        // Add to history
        roundHistory.unshift({
          round: currentRound,
          user: userChoice,
          bot: botChoice,
          resultText,
          resultColor
        });

        currentRound++;
        updateUI();
        renderHistory();

        if (userScore >= 3 || botScore >= 3) {
          setTimeout(() => {
            this.finishMatch();
          }, 400);
        } else {
          isAnimating = false;
          disableButtons(false);
        }
      }, 250);
    },

    finishMatch() {
      const isUserWinner = userScore > botScore;
      const profile = StorageManager.getProfile();

      // Save match result
      StorageManager.saveResult('Rock-Paper-Scissors', {
        playerName: profile.name,
        result: isUserWinner ? 'Win' : 'Loss',
        detail: `Final Score: ${userScore} - ${botScore}`,
        timeTaken: `${currentRound - 1} Rounds`,
        isWin: isUserWinner
      });

      // Update hub quick stats
      App.updateQuickStats();

      // Celebration or Defeat sound & dialog
      if (isUserWinner) {
        SoundEngine.playVictory();
        Confetti.launch(150);
        App.showVictoryModal({
          icon: '🏆',
          title: 'MATCH VICTORY!',
          subtitle: `Congratulations ${profile.name}! You defeated the Arena Bot in Best of 5!`,
          detail: `Final Score: <strong>${userScore} - ${botScore}</strong> (${currentRound - 1} total rounds)`,
          onPlayAgain: () => RPSGame.resetMatch()
        });
      } else {
        SoundEngine.playDefeat();
        App.showVictoryModal({
          icon: '🤖',
          title: 'DEFEAT!',
          subtitle: 'The Arena Bot claimed the Best of 5 match victory.',
          detail: `Final Score: <strong>${userScore} - ${botScore}</strong> (${currentRound - 1} total rounds)`,
          onPlayAgain: () => RPSGame.resetMatch()
        });
      }

      isAnimating = false;
    }
  };
})();
