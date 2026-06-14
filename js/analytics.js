/* ================================================================
   ANALYTICS SECTION — Centro de Comando y Análisis
   Color theme: VIOLET (#d500f9)
   ================================================================ */
window.AnalyticsSection = (() => {
  let _chartInstance = null;
  let _animFrameId = null;
  const TROPHIES_KEY = 'domina2026_trophies';
  const START_DATE = '2026-06-10';
  const END_DATE = '2026-12-31';

  function _getTrophyUnlocks() {
    try {
      return JSON.parse(localStorage.getItem(TROPHIES_KEY)) || {};
    } catch { return {}; }
  }

  function _saveTrophyUnlocks(data) {
    localStorage.setItem(TROPHIES_KEY, JSON.stringify(data));
  }

  function _isWeekday(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay();
    return day >= 1 && day <= 5;
  }

  function _calcDailyScore(dateStr) {
    let score = 0;
    const trainingLog = Store.training.getLog(dateStr);
    if (!_isWeekday(dateStr)) {
      score += 50;
    } else if (trainingLog && trainingLog.completed) {
      score += 50;
    }
    const langLog = Store.languages.getLog(dateStr);
    if (langLog && langLog.completed) {
      score += 50;
    }
    return Math.min(100, Math.round(score));
  }

  function _getScoreColor(score) {
    if (score <= 33) return '#ff1744';
    if (score <= 66) return '#ffd600';
    return '#00e676';
  }

  function _getScoreGlow(score) {
    if (score <= 33) return 'rgba(255,23,68,0.4)';
    if (score <= 66) return 'rgba(255,214,0,0.4)';
    return 'rgba(0,230,118,0.4)';
  }

  function _getMonday(d) {
    const date = new Date(d.getTime());
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  function _getWeeklyData() {
    const weeks = [];
    const today = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - (i * 7));
      const monday = _getMonday(d);
      
      let sum = 0;
      let count = 0;
      
      for (let j = 0; j < 7; j++) {
        const curr = new Date(monday);
        curr.setDate(curr.getDate() + j);
        if (curr <= today) {
          sum += _calcDailyScore(Store.getDateStr(curr));
          count++;
        }
      }
      
      const avg = count === 0 ? 0 : Math.round(sum / count);
      const mStr = monday.getDate() + '/' + (monday.getMonth()+1);
      weeks.push({ label: 'Sem ' + mStr, score: avg });
    }
    
    return weeks;
  }

  function _getDailyData() {
    const days = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = Store.getDateStr(d);
      const score = _calcDailyScore(dateStr);
      
      const label = d.getDate() + '/' + (d.getMonth() + 1);
      days.push({ label: label, score: score });
    }
    
    return days;
  }

  function _checkTrophies() {
    const unlocks = _getTrophyUnlocks();
    const today = Store.today();
    let changed = false;

    const tStreak = Store.training.getStreak();
    const lStreak = Store.languages.getStreak();
    const saved = Store.finances.getTotalSaved();
    const goal = Store.finances.getSavingsGoal();

    const conditions = {
      't_7': tStreak.current >= 7,
      't_30': tStreak.max >= 30,
      't_90': tStreak.max >= 90,
      'l_7': lStreak.current >= 7,
      'l_30': lStreak.max >= 30,
      'l_100': lStreak.max >= 100,
      'f_10': saved >= goal * 0.1,
      'f_50': saved >= goal * 0.5,
      'f_100': saved >= goal && goal > 0,
      'c_30': tStreak.current >= 30 && lStreak.current >= 30
    };

    // Check perfect week/month lazily if not unlocked
    if (!unlocks['perf_w'] || !unlocks['perf_m']) {
      let perfectWeek = false;
      let perfectMonth = false;
      const weeklyData = _getWeeklyData();
      if (weeklyData.some(w => w.score === 100)) perfectWeek = true;

      // perfect month check
      const d = new Date();
      const mLogsT = Store.training.getMonthLogs(d.getFullYear(), d.getMonth());
      const mLogsL = Store.languages.getMonthLogs(d.getFullYear(), d.getMonth());
      // simplified check for demo purposes
      if (Object.keys(mLogsT).length >= 20 && Object.keys(mLogsL).length >= 28) {
        perfectMonth = true;
      }

      conditions['perf_w'] = perfectWeek;
      conditions['perf_m'] = perfectMonth;
    }

    for (const [id, met] of Object.entries(conditions)) {
      if (met && !unlocks[id]) {
        unlocks[id] = today;
        changed = true;
      }
    }

    if (changed) _saveTrophyUnlocks(unlocks);
    return unlocks;
  }

  return {
    render() {
      const today = Store.today();
      const score = _calcDailyScore(today);
      const color = _getScoreColor(score);
      const glow = _getScoreGlow(score);

      const tStreak = Store.training.getStreak();
      const lStreak = Store.languages.getStreak();
      const balance = Store.finances.getBalance();

      const unlocks = _checkTrophies();

      const trophies = [
        { id: 't_7', icon: '🏋️', title: 'Guerrero Principiante', desc: '7 días de ejercicio' },
        { id: 't_30', icon: '🏋️', title: 'Guerrero Imparable', desc: '30 días de ejercicio' },
        { id: 't_90', icon: '🏋️', title: 'Máquina de Hierro', desc: '90 días de ejercicio' },
        { id: 'l_7', icon: '🗣️', title: 'Políglota Novato', desc: '7 días de Duolingo' },
        { id: 'l_30', icon: '🗣️', title: 'Políglota Dedicado', desc: '30 días de Duolingo' },
        { id: 'l_100', icon: '🗣️', title: 'Maestro Lingüista', desc: '100 días de Duolingo' },
        { id: 'f_10', icon: '💰', title: 'Primer Ahorro', desc: '10% de la meta' },
        { id: 'f_50', icon: '💰', title: 'Medio Camino', desc: '50% de la meta' },
        { id: 'f_100', icon: '💰', title: 'Meta Alcanzada', desc: '100% de la meta' },
        { id: 'perf_w', icon: '📊', title: 'Semana Perfecta', desc: '100% disciplina 7 días' },
        { id: 'perf_m', icon: '📊', title: 'Mes Perfecto', desc: '100% disciplina 30 días' },
        { id: 'c_30', icon: '🔥', title: 'Racha Combinada', desc: '30 días ejercicio e idiomas' }
      ];

      const trainingLog = Store.training.getLog(today);
      const isWeekend = !_isWeekday(today);
      const langLog = Store.languages.getLog(today);
      const hasTx = Store.finances.getTransactions({}).some(t => t.date === today);

      const tStatus = isWeekend ? '✅' : (trainingLog && trainingLog.completed ? '✅' : '❌');
      const lStatus = (langLog && langLog.completed) ? '✅' : '❌';
      const fStatus = hasTx ? '✅' : '❌';

      const startDate = new Date(START_DATE);
      const endDate = new Date(END_DATE);
      const now = new Date();
      const daysSince = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const periodPct = Math.min(100, Math.max(0, (daysSince / totalDays) * 100));

      return `
<style>
  .analytics-trophy {
    background: var(--bg-tertiary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 16px;
    text-align: center;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }
  .analytics-trophy.locked {
    opacity: 0.5;
    filter: grayscale(100%);
  }
  .analytics-trophy.unlocked {
    background: var(--bg-card);
    border-color: var(--violet);
    box-shadow: 0 0 15px rgba(213,0,249,0.15);
  }
  .analytics-trophy.unlocked:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 0 25px rgba(213,0,249,0.3);
  }
  .analytics-trophy-icon { font-size: 2.5rem; margin-bottom: 8px; }
  .analytics-trophy-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; }
  .analytics-trophy-desc { font-size: 0.75rem; color: var(--text-muted); }
  .analytics-trophy-date { font-size: 0.7rem; color: var(--violet); margin-top: 8px; font-weight: 600; }
  
  .analytics-mini-card {
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
</style>
<div class="section-content">
  
  <!-- Score & Overview Grid -->
  <div class="grid grid-2" style="margin-bottom: 24px;">
    
    <!-- Puntuación Diaria -->
    <div class="card fade-in" style="display:flex; flex-direction:column; align-items:center;">
      <h3 class="card-title text-center" style="color:var(--text-secondary); margin-bottom: 16px;">Disciplina Diaria</h3>
      <div style="position:relative; width: 180px; height: 180px; margin-bottom: 16px;">
        <svg viewBox="0 0 36 36" style="width:100%; height:100%;">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-tertiary)" stroke-width="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="${score}, 100" style="filter:drop-shadow(0 0 4px ${glow}); transition: stroke-dasharray 1s ease-out;" />
        </svg>
        <div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <span style="font-size:2.5rem; font-weight:900; color:${color}; text-shadow:0 0 10px ${glow};">${score}%</span>
        </div>
      </div>
      <div style="display:flex; justify-content:center; gap: 16px; width:100%; border-top: 1px solid var(--glass-border); padding-top: 16px;">
        <div style="text-align:center;"><div style="font-size:1.2rem;">${tStatus}</div><div class="text-xs text-muted mt-1">Entreno</div></div>
        <div style="text-align:center;"><div style="font-size:1.2rem;">${lStatus}</div><div class="text-xs text-muted mt-1">Idiomas</div></div>
      </div>
    </div>

    <!-- Rachas y Resumen -->
    <div class="fade-in" style="display:flex; flex-direction:column; gap: 16px;">
      <div class="analytics-mini-card" style="border-left: 4px solid var(--emerald);">
        <div style="font-size: 2rem;">🏋️</div>
        <div>
          <div class="text-sm text-muted">Racha Entrenamiento</div>
          <div class="text-xl font-bold" style="color:var(--emerald);">${tStreak.current} días</div>
        </div>
      </div>
      <div class="analytics-mini-card" style="border-left: 4px solid var(--cyan);">
        <div style="font-size: 2rem;">🗣️</div>
        <div>
          <div class="text-sm text-muted">Racha Idiomas</div>
          <div class="text-xl font-bold" style="color:var(--cyan);">${lStreak.current} días</div>
        </div>
      </div>
      <div class="analytics-mini-card" style="border-left: 4px solid var(--amber);">
        <div style="font-size: 2rem;">💰</div>
        <div>
          <div class="text-sm text-muted">Balance Liquidez</div>
          <div class="text-xl font-bold" style="color:var(--amber);">${Store.formatCurrency(balance)}</div>
        </div>
      </div>
    </div>

  </div>

  <!-- Tendencia Chart -->
  <div class="card slide-up" style="margin-bottom: 24px; animation-delay: 0.1s;">
    <div class="card-header"><h3 class="card-title" style="color:var(--violet);">📈 Tendencia Diaria</h3></div>
    <div style="height: 250px; position:relative;">
      <canvas id="analytics-chart"></canvas>
    </div>
  </div>

  <!-- Period Summary -->
  <div class="card slide-up" style="margin-bottom: 24px; animation-delay: 0.15s; text-align:center;">
    <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
      <span class="text-sm font-semibold">${daysSince} días desde el inicio</span>
      <span class="text-sm font-semibold">${daysLeft} días restantes</span>
    </div>
    <div class="progress-bar progress-bar-lg">
      <div class="progress-fill" style="width:${periodPct}%; background:linear-gradient(90deg, #aa00ff, #d500f9); box-shadow:0 0 10px rgba(213,0,249,0.5);"></div>
    </div>
  </div>

  <!-- Muro de Trofeos -->
  <div class="card slide-up" style="animation-delay: 0.2s;">
    <div class="card-header"><h3 class="card-title" style="color:var(--violet);">🏆 Muro de Trofeos</h3></div>
    <div class="grid grid-3">
      ${trophies.map(t => {
        const isUnlocked = !!unlocks[t.id];
        return `
          <div class="analytics-trophy ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="analytics-trophy-icon">${isUnlocked ? t.icon : '🔒'}</div>
            <div class="analytics-trophy-title" style="${isUnlocked ? 'color:#fff;' : 'color:var(--text-muted);'}">${t.title}</div>
            <div class="analytics-trophy-desc">${t.desc}</div>
            ${isUnlocked ? `<div class="analytics-trophy-date">Desbloqueado: ${unlocks[t.id]}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  </div>

</div>`;
    },

    init() {
      if (!window.Chart) return;
      
      const ctx = document.getElementById('analytics-chart');
      if (!ctx) return;

      const chartData = _getDailyData();
      
      _chartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: chartData.map(d => d.label),
          datasets: [{
            label: 'Disciplina %',
            data: chartData.map(d => d.score),
            backgroundColor: 'rgba(213, 0, 249, 0.15)',
            borderColor: '#d500f9',
            borderWidth: 2,
            pointBackgroundColor: '#d500f9',
            pointBorderColor: '#12121a',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(10,10,15,0.95)',
              titleColor: '#d500f9',
              bodyColor: '#fff',
              borderColor: 'rgba(213,0,249,0.3)',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 10,
              callbacks: {
                label: function(context) { return 'Disciplina: ' + context.parsed.y + '%'; }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
              ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11, weight: '500' } }
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
              ticks: {
                color: 'rgba(255,255,255,0.5)',
                font: { size: 11 },
                stepSize: 25,
                callback: function(val) { return val + '%'; }
              }
            }
          },
          animation: { duration: 1200, easing: 'easeOutQuart' }
        }
      });
    },

    destroy() {
      if (_chartInstance) {
        _chartInstance.destroy();
        _chartInstance = null;
      }
    }
  };
})();
