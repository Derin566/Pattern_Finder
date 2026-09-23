/**
 * Pattern Quest - Visual Pattern Recognition & Working Memory Mini-Game
 * Screening/Research Prototype for Cognitive & Early Dyslexia Analysis
 * 
 * Notice: This is a research prototype, NOT a medical diagnostic tool.
 */

// ==========================================
// 1. SOUND ENGINE (Web Audio API)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    // Pentatonic scale frequencies for warm, pleasant, musical tones (C4 to C6)
    this.frequencies = [
      261.63, 293.66, 329.63, 392.00, 440.00, 
      523.25, 587.33, 659.25, 783.99, 880.00, 
      987.77, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00
    ];
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(frequency, duration = 0.35, type = 'sine', volume = 0.25) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      // Envelope: gentle attack, exponential decay
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playTileHighlight(tileIndex) {
    const freq = this.frequencies[tileIndex % this.frequencies.length] || 440;
    this.playTone(freq, 0.45, 'triangle', 0.28);
  }

  playTileClick(tileIndex) {
    const freq = this.frequencies[tileIndex % this.frequencies.length] || 440;
    this.playTone(freq, 0.25, 'sine', 0.3);
  }

  playSuccessChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99]; // C5, E5, G5
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.35, 'sine', 0.25);
      }, idx * 110);
    });
  }

  playRetryCue() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Neutral, warm descending note (E4 -> C4) - encouraging and gentle
    this.playTone(329.63, 0.25, 'sine', 0.2);
    setTimeout(() => {
      this.playTone(261.63, 0.35, 'sine', 0.2);
    }, 180);
  }

  playFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const melody = [523.25, 659.25, 783.99, 1046.50];
    melody.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.45, 'triangle', 0.3);
      }, idx * 140);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

// ==========================================
// 2. DATA COLLECTOR & BEHAVIORAL TELEMETRY
// ==========================================
class DataCollector {
  constructor() {
    this.sessionId = this.generateUUID();
    this.startTime = new Date().toISOString();
    this.rounds = [];
  }

  generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  }

  recordRound(data) {
    this.rounds.push({
      session_id: this.sessionId,
      round_number: data.round_number,
      difficulty_level: data.difficulty_level,
      grid_size: data.grid_size,
      pattern_length: data.pattern_length,
      correct_or_incorrect: data.correct_or_incorrect,
      reaction_time_ms: Math.round(data.reaction_time_ms),
      total_completion_time_ms: Math.round(data.total_completion_time_ms),
      number_of_clicks: data.number_of_clicks,
      number_of_wrong_clicks: data.number_of_wrong_clicks,
      number_of_attempts: data.number_of_attempts,
      pattern_positions: [...data.pattern_positions],
      selected_positions: [...data.selected_positions],
      timestamp: new Date().toISOString()
    });
  }

  calculateSummary() {
    const totalRounds = this.rounds.length;
    if (totalRounds === 0) {
      return {
        totalRounds: 0,
        accuracyPct: 0,
        avgReactionTimeMs: 0,
        avgReactionTimeSec: '0.00',
        avgCompletionTimeMs: 0,
        avgCompletionTimeSec: '0.00',
        wrongClickRatePct: 0,
        maxPatternLength: 0,
        highestLevel: 1,
        totalRetries: 0,
        levelBreakdown: {},
        improvement: { accuracyTrend: 'N/A', reactionTimeTrendMs: 0 }
      };
    }

    const correctRounds = this.rounds.filter(r => r.correct_or_incorrect).length;
    const accuracyPct = Math.round((correctRounds / totalRounds) * 100);

    const validRTs = this.rounds.map(r => r.reaction_time_ms).filter(rt => rt > 0);
    const avgReactionTimeMs = validRTs.length > 0 
      ? Math.round(validRTs.reduce((a, b) => a + b, 0) / validRTs.length) 
      : 0;

    const validCTs = this.rounds.map(r => r.total_completion_time_ms).filter(ct => ct > 0);
    const avgCompletionTimeMs = validCTs.length > 0 
      ? Math.round(validCTs.reduce((a, b) => a + b, 0) / validCTs.length) 
      : 0;

    const totalClicks = this.rounds.reduce((acc, r) => acc + r.number_of_clicks, 0);
    const totalWrongClicks = this.rounds.reduce((acc, r) => acc + r.number_of_wrong_clicks, 0);
    const wrongClickRatePct = totalClicks > 0 
      ? Math.round((totalWrongClicks / totalClicks) * 100) 
      : 0;

    // Max pattern length successfully completed
    const correctLengths = this.rounds.filter(r => r.correct_or_incorrect).map(r => r.pattern_length);
    const maxPatternLength = correctLengths.length > 0 ? Math.max(...correctLengths) : 0;

    // Highest level reached
    const highestLevel = Math.max(...this.rounds.map(r => r.difficulty_level));

    // Retries count (attempts beyond attempt 1)
    const totalRetries = this.rounds.reduce((acc, r) => acc + (r.number_of_attempts - 1), 0);

    // Performance by difficulty level
    const levelBreakdown = {};
    for (let lvl = 1; lvl <= 5; lvl++) {
      const lvlRounds = this.rounds.filter(r => r.difficulty_level === lvl);
      if (lvlRounds.length > 0) {
        const lvlCorrect = lvlRounds.filter(r => r.correct_or_incorrect).length;
        const lvlAcc = Math.round((lvlCorrect / lvlRounds.length) * 100);
        const lvlAvgRT = Math.round(lvlRounds.reduce((a, b) => a + b.reaction_time_ms, 0) / lvlRounds.length);
        levelBreakdown[lvl] = {
          roundsPlayed: lvlRounds.length,
          correct: lvlCorrect,
          accuracyPct: lvlAcc,
          avgReactionTimeMs: lvlAvgRT
        };
      }
    }

    // Improvement across rounds (first half vs second half)
    const midPoint = Math.floor(totalRounds / 2);
    let firstHalfAcc = 0;
    let secondHalfAcc = 0;
    let rtDeltaMs = 0;

    if (midPoint > 0) {
      const firstHalf = this.rounds.slice(0, midPoint);
      const secondHalf = this.rounds.slice(midPoint);

      const firstCorr = firstHalf.filter(r => r.correct_or_incorrect).length;
      const secondCorr = secondHalf.filter(r => r.correct_or_incorrect).length;

      firstHalfAcc = Math.round((firstCorr / firstHalf.length) * 100);
      secondHalfAcc = Math.round((secondCorr / secondHalf.length) * 100);

      const firstAvgRT = firstHalf.reduce((a, b) => a + b.reaction_time_ms, 0) / firstHalf.length;
      const secondAvgRT = secondHalf.reduce((a, b) => a + b.reaction_time_ms, 0) / secondHalf.length;
      rtDeltaMs = Math.round(firstAvgRT - secondAvgRT); // positive means faster in second half
    }

    return {
      totalRounds,
      correctRounds,
      accuracyPct,
      avgReactionTimeMs,
      avgReactionTimeSec: (avgReactionTimeMs / 1000).toFixed(2),
      avgCompletionTimeMs,
      avgCompletionTimeSec: (avgCompletionTimeMs / 1000).toFixed(2),
      wrongClickRatePct,
      maxPatternLength,
      highestLevel,
      totalRetries,
      levelBreakdown,
      improvement: {
        firstHalfAccuracyPct: firstHalfAcc,
        secondHalfAccuracyPct: secondHalfAcc,
        reactionTimeDeltaMs: rtDeltaMs
      }
    };
  }

  exportJSON() {
    const summary = this.calculateSummary();
    const payload = {
      project: "Pattern Quest Early Dyslexia Screening Prototype",
      version: "1.0.0",
      session_metadata: {
        session_id: this.sessionId,
        started_at: this.startTime,
        completed_at: new Date().toISOString(),
        total_rounds_collected: this.rounds.length
      },
      summary_measurements: summary,
      round_behavioral_data: this.rounds
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pattern_quest_session_${this.sessionId.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  exportCSV() {
    if (this.rounds.length === 0) return;

    // Standard RFC-4180 CSV headers for direct pandas.read_csv ingestion
    const headers = [
      "session_id",
      "round_number",
      "difficulty_level",
      "grid_size",
      "pattern_length",
      "correct_or_incorrect",
      "reaction_time_ms",
      "total_completion_time_ms",
      "number_of_clicks",
      "number_of_wrong_clicks",
      "number_of_attempts",
      "pattern_positions",
      "selected_positions",
      "timestamp"
    ];

    const rows = this.rounds.map(r => {
      return [
        r.session_id,
        r.round_number,
        r.difficulty_level,
        r.grid_size,
        r.pattern_length,
        r.correct_or_incorrect,
        r.reaction_time_ms,
        r.total_completion_time_ms,
        r.number_of_clicks,
        r.number_of_wrong_clicks,
        r.number_of_attempts,
        `"${JSON.stringify(r.pattern_positions)}"`,
        `"${JSON.stringify(r.selected_positions)}"`,
        r.timestamp
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(","), ...rows].join("\n"));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `pattern_quest_session_${this.sessionId.slice(0, 8)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

// ==========================================
// 3. GAME ENGINE & LOGIC
// ==========================================
class GameEngine {
  constructor(soundEngine, dataCollector) {
    this.sound = soundEngine;
    this.data = dataCollector;

    // Difficulty Configuration
    this.levelConfigs = {
      1: { gridSize: 3, patternLength: 2, label: 'Level 1' },
      2: { gridSize: 3, patternLength: 3, label: 'Level 2' },
      3: { gridSize: 3, patternLength: 4, label: 'Level 3' },
      4: { gridSize: 4, patternLength: 4, label: 'Level 4' },
      5: { gridSize: 4, patternLength: 5, label: 'Level 5' }
    };

    this.totalRounds = 10;
    this.currentRoundNumber = 1;
    this.currentLevel = 1;
    this.consecutiveFailures = 0; // for adaptive difficulty stabilization

    // Timing Constants
    this.HIGHLIGHT_DURATION_MS = 600;
    this.INTER_TILE_PAUSE_MS = 250;

    // Current Round State
    this.currentPattern = [];
    this.userSelectedIndices = [];
    this.userStep = 0;
    this.roundAttempts = 1;
    this.maxAttemptsPerRound = 2;
    this.roundWrongClicks = 0;
    this.roundTotalClicks = 0;

    // Timing State
    this.inputEnabledTimestamp = null;
    this.firstClickTimestamp = null;
    this.lastClickTimestamp = null;
    this.isInputAllowed = false;
    this.lastClickEpoch = 0; // Debounce guard (< 80ms)

    // DOM Elements Cache
    this.elements = {};
  }

  bindElements() {
    this.elements = {
      // Screens
      welcomeScreen: document.getElementById('welcomeScreen'),
      gameScreen: document.getElementById('gameScreen'),
      resultsScreen: document.getElementById('resultsScreen'),
      
      // Controls & Buttons
      startGameBtn: document.getElementById('startGameBtn'),
      soundToggleBtn: document.getElementById('soundToggleBtn'),
      soundIcon: document.getElementById('soundIcon'),
      restartHeaderBtn: document.getElementById('restartHeaderBtn'),
      giveUpRestartBtn: document.getElementById('giveUpRestartBtn'),
      playAgainBtn: document.getElementById('playAgainBtn'),
      sessionRoundsSelect: document.getElementById('sessionRoundsSelect'),

      // Gameplay HUD
      roundCounter: document.getElementById('roundCounter'),
      roundProgressBar: document.getElementById('roundProgressBar'),
      roundProgressFill: document.getElementById('roundProgressFill'),
      levelBadge: document.getElementById('levelBadge'),
      levelText: document.getElementById('levelText'),
      gridDimText: document.getElementById('gridDimText'),
      statusBanner: document.getElementById('statusBanner'),
      statusIcon: document.getElementById('statusIcon'),
      statusText: document.getElementById('statusText'),
      gameGrid: document.getElementById('gameGrid'),
      attemptIndicator: document.getElementById('attemptIndicator'),

      // Summary
      summaryAccuracy: document.getElementById('summaryAccuracy'),
      summaryReactionTime: document.getElementById('summaryReactionTime'),
      summaryCompletionTime: document.getElementById('summaryCompletionTime'),
      summaryHighestLevel: document.getElementById('summaryHighestLevel'),
      summaryMaxPattern: document.getElementById('summaryMaxPattern'),
      summaryWrongClickRate: document.getElementById('summaryWrongClickRate'),
      levelBreakdownContainer: document.getElementById('levelBreakdownContainer'),
      downloadJsonBtn: document.getElementById('downloadJsonBtn'),
      downloadCsvBtn: document.getElementById('downloadCsvBtn'),
      toggleDataViewBtn: document.getElementById('toggleDataViewBtn'),
      rawDataTableContainer: document.getElementById('rawDataTableContainer'),
      rawDataTableBody: document.getElementById('rawDataTableBody'),

      // Restart Modal
      restartModal: document.getElementById('restartModal'),
      cancelRestartBtn: document.getElementById('cancelRestartBtn'),
      confirmRestartBtn: document.getElementById('confirmRestartBtn')
    };

    this.attachListeners();
  }

  attachListeners() {
    this.elements.startGameBtn.addEventListener('click', () => {
      this.sound.initContext();
      this.totalRounds = parseInt(this.elements.sessionRoundsSelect.value, 10) || 10;
      this.startGame();
    });

    this.elements.soundToggleBtn.addEventListener('click', () => {
      const muted = this.sound.toggleMute();
      this.elements.soundIcon.textContent = muted ? '??' : '??';
    });

    this.elements.restartHeaderBtn.addEventListener('click', () => this.showRestartModal());
    this.elements.giveUpRestartBtn.addEventListener('click', () => this.showRestartModal());
    this.elements.cancelRestartBtn.addEventListener('click', () => this.hideRestartModal());
    this.elements.confirmRestartBtn.addEventListener('click', () => {
      this.hideRestartModal();
      this.resetToWelcome();
    });

    this.elements.playAgainBtn.addEventListener('click', () => {
      this.resetToWelcome();
    });

    this.elements.downloadJsonBtn.addEventListener('click', () => {
      this.data.exportJSON();
    });

    this.elements.downloadCsvBtn.addEventListener('click', () => {
      this.data.exportCSV();
    });

    this.elements.toggleDataViewBtn.addEventListener('click', () => {
      const isHidden = this.elements.rawDataTableContainer.style.display === 'none';
      this.elements.rawDataTableContainer.style.display = isHidden ? 'block' : 'none';
      this.elements.toggleDataViewBtn.querySelector('span').textContent = isHidden 
        ? '?? Hide Recorded Session Data Table' 
        : '??? View Recorded Session Data Table';
    });
  }

  showScreen(screenName) {
    this.elements.welcomeScreen.classList.remove('active');
    this.elements.gameScreen.classList.remove('active');
    this.elements.resultsScreen.classList.remove('active');

    if (screenName === 'welcome') {
      this.elements.welcomeScreen.classList.add('active');
      this.elements.restartHeaderBtn.style.display = 'none';
    } else if (screenName === 'game') {
      this.elements.gameScreen.classList.add('active');
      this.elements.restartHeaderBtn.style.display = 'flex';
    } else if (screenName === 'results') {
      this.elements.resultsScreen.classList.add('active');
      this.elements.restartHeaderBtn.style.display = 'none';
    }
  }

  showRestartModal() {
    this.elements.restartModal.style.display = 'flex';
  }

  hideRestartModal() {
    this.elements.restartModal.style.display = 'none';
  }

  resetToWelcome() {
    this.data = new DataCollector(); // new session id
    this.currentRoundNumber = 1;
    this.currentLevel = 1;
    this.consecutiveFailures = 0;
    this.showScreen('welcome');
  }

  startGame() {
    this.currentRoundNumber = 1;
    this.currentLevel = 1;
    this.consecutiveFailures = 0;
    this.showScreen('game');
    this.startRound();
  }

  /**
   * Random non-repeating pattern generator
   */
  generateRandomSequence(totalTiles, length) {
    const pool = Array.from({ length: totalTiles }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, length);
  }

  startRound() {
    const config = this.levelConfigs[this.currentLevel] || this.levelConfigs[1];
    const totalTiles = config.gridSize * config.gridSize;

    // Reset round tracking variables
    this.currentPattern = this.generateRandomSequence(totalTiles, config.patternLength);
    this.userSelectedIndices = [];
    this.userStep = 0;
    this.roundAttempts = 1;
    this.roundWrongClicks = 0;
    this.roundTotalClicks = 0;
    this.inputEnabledTimestamp = null;
    this.firstClickTimestamp = null;

    this.renderHUD();
    this.renderGrid(config.gridSize);
    this.updateAttemptIndicator();

    // Start presentation after short entrance delay
    setTimeout(() => {
      this.presentSequence();
    }, 450);
  }

  renderHUD() {
    const config = this.levelConfigs[this.currentLevel] || this.levelConfigs[1];
    this.elements.roundCounter.textContent = `${this.currentRoundNumber} / ${this.totalRounds}`;
    const pct = Math.round((this.currentRoundNumber / this.totalRounds) * 100);
    this.elements.roundProgressFill.style.width = `${pct}%`;
    this.elements.roundProgressBar.setAttribute('aria-valuenow', this.currentRoundNumber);
    this.elements.roundProgressBar.setAttribute('aria-valuemax', this.totalRounds);

    this.elements.levelText.textContent = `Level ${this.currentLevel}`;
    this.elements.gridDimText.textContent = `(${config.gridSize}?${config.gridSize})`;
  }

  renderGrid(gridSize) {
    const gridEl = this.elements.gameGrid;
    gridEl.innerHTML = '';
    gridEl.className = `game-grid grid-${gridSize}x${gridSize}`;

    const totalTiles = gridSize * gridSize;
    for (let i = 0; i < totalTiles; i++) {
      const tile = document.createElement('button');
      tile.className = 'tile';
      tile.dataset.index = i;
      tile.setAttribute('role', 'gridcell');
      tile.setAttribute('aria-label', `Tile ${i + 1}`);
      tile.setAttribute('tabindex', '0');

      tile.addEventListener('click', (e) => this.handleTileClick(i, tile, e));
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleTileClick(i, tile, e);
        }
      });

      gridEl.appendChild(tile);
    }
  }

  updateAttemptIndicator() {
    const dots = this.elements.attemptIndicator.querySelectorAll('.attempt-dot');
    dots.forEach((dot, index) => {
      dot.className = 'attempt-dot';
      if (index + 1 === this.roundAttempts) {
        dot.classList.add('active');
      } else if (index + 1 < this.roundAttempts) {
        dot.classList.add('failed');
      }
    });
  }

  setBannerStatus(state, message, icon) {
    this.elements.statusBanner.className = `status-banner banner-${state}`;
    this.elements.statusIcon.textContent = icon;
    this.elements.statusText.textContent = message;
  }

  /**
   * Sequence Playback Logic
   */
  presentSequence() {
    this.isInputAllowed = false;
    this.elements.gameGrid.classList.add('grid-disabled');
    this.setBannerStatus('watch', 'Watch carefully...', '??');

    let step = 0;
    const playNext = () => {
      if (step >= this.currentPattern.length) {
        // Presentation complete
        setTimeout(() => {
          this.enableUserInput();
        }, 350);
        return;
      }

      const tileIndex = this.currentPattern[step];
      const tileEl = this.elements.gameGrid.querySelector(`[data-index="${tileIndex}"]`);

      if (tileEl) {
        tileEl.classList.add('highlighted');
        this.sound.playTileHighlight(tileIndex);

        setTimeout(() => {
          tileEl.classList.remove('highlighted');
          step++;
          setTimeout(playNext, this.INTER_TILE_PAUSE_MS);
        }, this.HIGHLIGHT_DURATION_MS);
      } else {
        step++;
        playNext();
      }
    };

    playNext();
  }

  enableUserInput() {
    this.isInputAllowed = true;
    this.elements.gameGrid.classList.remove('grid-disabled');
    this.setBannerStatus('turn', 'Your turn! Tap the tiles', '??');
    this.inputEnabledTimestamp = performance.now();
    this.firstClickTimestamp = null;
    this.userStep = 0;
    this.userSelectedIndices = [];
  }

  /**
   * User Interaction Handler
   */
  handleTileClick(tileIndex, tileEl, event) {
    if (!this.isInputAllowed) return;

    // Debounce protection (< 80ms)
    const now = performance.now();
    if (now - this.lastClickEpoch < 80) return;
    this.lastClickEpoch = now;

    // Record initial reaction time on first click
    if (this.firstClickTimestamp === null && this.inputEnabledTimestamp !== null) {
      this.firstClickTimestamp = now;
    }
    this.lastClickTimestamp = now;

    this.roundTotalClicks++;
    this.userSelectedIndices.push(tileIndex);

    const expectedIndex = this.currentPattern[this.userStep];

    if (tileIndex === expectedIndex) {
      // Correct click
      tileEl.classList.add('selected');
      this.sound.playTileClick(tileIndex);

      setTimeout(() => {
        tileEl.classList.remove('selected');
      }, 250);

      this.userStep++;

      // Check if complete pattern successfully matched
      if (this.userStep === this.currentPattern.length) {
        this.handleRoundSuccess();
      }
    } else {
      // Incorrect click
      this.roundWrongClicks++;
      tileEl.classList.add('wrong');
      this.sound.playRetryCue();

      setTimeout(() => {
        tileEl.classList.remove('wrong');
      }, 400);

      this.handleRoundFailure();
    }
  }

  handleRoundSuccess() {
    this.isInputAllowed = false;
    this.elements.gameGrid.classList.add('grid-disabled');
    this.setBannerStatus('success', 'Great!', '?');
    this.sound.playSuccessChime();

    const reactionTimeMs = (this.firstClickTimestamp && this.inputEnabledTimestamp)
      ? (this.firstClickTimestamp - this.inputEnabledTimestamp)
      : 0;

    const completionTimeMs = (this.lastClickTimestamp && this.inputEnabledTimestamp)
      ? (this.lastClickTimestamp - this.inputEnabledTimestamp)
      : 0;

    const config = this.levelConfigs[this.currentLevel] || this.levelConfigs[1];

    // Save telemetry
    this.data.recordRound({
      round_number: this.currentRoundNumber,
      difficulty_level: this.currentLevel,
      grid_size: config.gridSize,
      pattern_length: config.patternLength,
      correct_or_incorrect: true,
      reaction_time_ms: reactionTimeMs,
      total_completion_time_ms: completionTimeMs,
      number_of_clicks: this.roundTotalClicks,
      number_of_wrong_clicks: this.roundWrongClicks,
      number_of_attempts: this.roundAttempts,
      pattern_positions: this.currentPattern,
      selected_positions: this.userSelectedIndices
    });

    // Adaptive difficulty advancement
    this.consecutiveFailures = 0;
    if (this.currentLevel < 5) {
      this.currentLevel++;
    }

    setTimeout(() => {
      this.advanceToNextRound();
    }, 1200);
  }

  handleRoundFailure() {
    this.isInputAllowed = false;
    this.elements.gameGrid.classList.add('grid-disabled');

    if (this.roundAttempts < this.maxAttemptsPerRound) {
      // Allow retry of the same pattern
      this.roundAttempts++;
      this.updateAttemptIndicator();
      this.setBannerStatus('retry', 'Try again!', '??');

      setTimeout(() => {
        this.presentSequence();
      }, 1000);
    } else {
      // Out of attempts for this round: record round as incorrect
      this.setBannerStatus('retry', 'Good try! Next round', '??');

      const reactionTimeMs = (this.firstClickTimestamp && this.inputEnabledTimestamp)
        ? (this.firstClickTimestamp - this.inputEnabledTimestamp)
        : 0;

      const completionTimeMs = (this.lastClickTimestamp && this.inputEnabledTimestamp)
        ? (this.lastClickTimestamp - this.inputEnabledTimestamp)
        : 0;

      const config = this.levelConfigs[this.currentLevel] || this.levelConfigs[1];

      this.data.recordRound({
        round_number: this.currentRoundNumber,
        difficulty_level: this.currentLevel,
        grid_size: config.gridSize,
        pattern_length: config.patternLength,
        correct_or_incorrect: false,
        reaction_time_ms: reactionTimeMs,
        total_completion_time_ms: completionTimeMs,
        number_of_clicks: this.roundTotalClicks,
        number_of_wrong_clicks: this.roundWrongClicks,
        number_of_attempts: this.roundAttempts,
        pattern_positions: this.currentPattern,
        selected_positions: this.userSelectedIndices
      });

      // Adaptive difficulty stabilization:
      // Keep difficulty stable to avoid frustration
      this.consecutiveFailures++;

      setTimeout(() => {
        this.advanceToNextRound();
      }, 1400);
    }
  }

  advanceToNextRound() {
    if (this.currentRoundNumber < this.totalRounds) {
      this.currentRoundNumber++;
      this.startRound();
    } else {
      this.finishSession();
    }
  }

  /**
   * Session Complete & Summary View
   */
  finishSession() {
    this.showScreen('results');
    this.sound.playFanfare();

    const summary = this.data.calculateSummary();

    // Populate summary cards
    this.elements.summaryAccuracy.textContent = `${summary.accuracyPct}%`;
    this.elements.summaryReactionTime.textContent = `${summary.avgReactionTimeSec}s`;
    this.elements.summaryCompletionTime.textContent = `${summary.avgCompletionTimeSec}s`;
    this.elements.summaryHighestLevel.textContent = `Level ${summary.highestLevel}`;
    this.elements.summaryMaxPattern.textContent = `${summary.maxPatternLength} tiles`;
    this.elements.summaryWrongClickRate.textContent = `${summary.wrongClickRatePct}%`;

    // Populate level breakdown list
    const breakdownContainer = this.elements.levelBreakdownContainer;
    breakdownContainer.innerHTML = '';

    const levels = Object.keys(summary.levelBreakdown);
    if (levels.length === 0) {
      breakdownContainer.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">No round data available.</p>';
    } else {
      levels.forEach(lvl => {
        const item = summary.levelBreakdown[lvl];
        const row = document.createElement('div');
        row.className = 'level-row';
        row.innerHTML = `
          <div class="level-row-title">Level ${lvl} (${item.roundsPlayed} ${item.roundsPlayed === 1 ? 'round' : 'rounds'})</div>
          <div class="level-row-stats">
            <span>Accuracy: <strong class="level-stat-badge">${item.accuracyPct}%</strong></span>
            <span>Avg RT: <strong class="level-stat-badge">${item.avgReactionTimeMs}ms</strong></span>
          </div>
        `;
        breakdownContainer.appendChild(row);
      });
    }

    // Populate raw data table
    const tableBody = this.elements.rawDataTableBody;
    tableBody.innerHTML = '';
    this.data.rounds.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>#${r.round_number}</strong></td>
        <td>L${r.difficulty_level}</td>
        <td>${r.grid_size}?${r.grid_size}</td>
        <td>${r.pattern_length}</td>
        <td><span class="${r.correct_or_incorrect ? 'tag-success' : 'tag-fail'}">${r.correct_or_incorrect ? '? Correct' : '? Missed'}</span></td>
        <td>${r.reaction_time_ms}</td>
        <td>${r.total_completion_time_ms}</td>
        <td>${r.number_of_wrong_clicks}</td>
        <td>${r.number_of_attempts}</td>
      `;
      tableBody.appendChild(tr);
    });
  }
}

// ==========================================
// 4. APP INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const soundEngine = new SoundEngine();
  const dataCollector = new DataCollector();
  const gameEngine = new GameEngine(soundEngine, dataCollector);

  gameEngine.bindElements();
});
