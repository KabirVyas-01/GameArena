/**
 * GAME ARENA - Web Audio API Sound Synthesizer
 * Zero external audio assets required.
 * Created by KABIR VYAS
 */

const SoundEngine = (() => {
  let audioCtx = null;
  let isMuted = false;

  const initAudio = () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  const playTone = (freq, type = 'sine', duration = 0.15, gainVal = 0.15) => {
    if (isMuted) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  };

  return {
    toggleMute() {
      isMuted = !isMuted;
      localStorage.setItem('game_arena_muted', isMuted ? 'true' : 'false');
      return isMuted;
    },

    isMuted() {
      return isMuted;
    },

    setMute(mute) {
      isMuted = mute;
    },

    // UI Click
    playClick() {
      playTone(600, 'sine', 0.08, 0.1);
    },

    // Move / Place Mark
    playMove() {
      playTone(480, 'sine', 0.12, 0.15);
    },

    // Weapon Pick
    playPick() {
      playTone(520, 'triangle', 0.1, 0.15);
    },

    // Number Placed in Sudoku
    playNumberPlace() {
      playTone(587.33, 'triangle', 0.12, 0.15); // D5
    },

    // Error Buzz
    playError() {
      if (isMuted) return;
      initAudio();
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch (e) {}
    },

    // Victory Fanfare
    playVictory() {
      if (isMuted) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((note, index) => {
        setTimeout(() => {
          playTone(note, 'triangle', 0.28, 0.2);
        }, index * 100);
      });
    },

    // Defeat Jingle
    playDefeat() {
      if (isMuted) return;
      const notes = [440, 415.3, 392, 349.23];
      notes.forEach((note, index) => {
        setTimeout(() => {
          playTone(note, 'sawtooth', 0.2, 0.12);
        }, index * 120);
      });
    },

    // Tie / Draw Chime
    playDraw() {
      if (isMuted) return;
      const notes = [440, 440];
      notes.forEach((note, index) => {
        setTimeout(() => {
          playTone(note, 'sine', 0.18, 0.12);
        }, index * 140);
      });
    }
  };
})();
