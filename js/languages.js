/* ================================================================
   LANGUAGES SECTION — Idiomas / Cronómetro
   Color theme: CYAN (#00b0ff)
   ================================================================ */
window.LanguagesSection = (() => {
  /* ── module state ── */
  let _calYear  = 2026;
  let _calMonth = 5;          // 0-indexed, default June 2026
  let _listeners    = [];     // [{el, evt, fn}]
  let _confettiTimer = null;
  let _confettiRAF   = null;

  /* ── timer state ── */
  let _timerSeconds    = 0;
  let _timerInterval   = null;
  let _isTimerRunning  = false;

  /* ── goal (editable) ── */
  const GOAL_KEY = 'lang_goal_minutes';
  const getGoal  = () => parseInt(localStorage.getItem(GOAL_KEY) || '60', 10);
  const setGoal  = (v) => localStorage.setItem(GOAL_KEY, Math.max(1, v));

  const MONTH_MIN     = 5;
  const MONTH_MAX     = 11;
  const CIRCUMFERENCE = 2 * Math.PI * 90;

  /* ── helpers ── */
  const on = (id, evt, fn) => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener(evt, fn); _listeners.push({ el, evt, fn }); }
  };

  const getMinutes  = () => { const l = Store.languages.getLog(Store.today()); return l ? (l.minutes || 0) : 0; };
  const getCompleted = () => { const l = Store.languages.getLog(Store.today()); return l ? !!l.completed : false; };

  const saveMinutes = (mins) => {
    const todayStr = Store.today();
    const existing = Store.languages.getLog(todayStr) || {};
    Store.languages.saveLog(todayStr, {
      minutes: Math.max(0, mins),
      completed: existing.completed || mins >= getGoal()
    });
  };

  /* ── format helpers ── */
  const pad  = (n) => n.toString().padStart(2, '0');
  const fmtS = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;  // MM:SS

  /* ── live timer ring (fills while timer runs) ── */
  const updateTimerRing = () => {
    const goal    = getGoal();
    const goalSec = goal * 60;
    const pct     = Math.min(_timerSeconds / goalSec, 1);
    const offset  = CIRCUMFERENCE - CIRCUMFERENCE * pct;

    const circle = document.getElementById('lang-timer-circle');
    const dispT  = document.getElementById('lang-timer-time');
    const dispG  = document.getElementById('lang-timer-goal-label');
    const svg    = document.getElementById('lang-ring-svg');

    if (circle) { circle.style.strokeDashoffset = offset; }
    if (dispT)  { dispT.textContent = fmtS(_timerSeconds); }
    if (dispG)  { dispG.textContent = `meta: ${goal} min`; }

    if (svg) {
      svg.style.filter = pct >= 1
        ? 'drop-shadow(0 0 30px var(--cyan)) drop-shadow(0 0 50px var(--cyan-glow))'
        : 'drop-shadow(0 0 20px var(--cyan-glow))';
    }

    /* pulse ring color when done */
    if (circle) { circle.style.stroke = pct >= 1 ? '#18ffff' : 'var(--cyan)'; }
  };

  /* ── timer controls ── */
  const setStartBtnState = (running) => {
    const btn = document.getElementById('lang-timer-start');
    if (!btn) return;
    if (running) {
      btn.textContent = '⏸ Pausar';
      btn.className = 'btn btn-ghost lang-ctrl-btn';
      btn.style.color = 'var(--cyan)';
      btn.style.borderColor = 'var(--cyan)';
    } else {
      btn.textContent = _timerSeconds > 0 ? '▶ Reanudar' : '▶ Iniciar';
      btn.className = 'btn btn-cyan lang-ctrl-btn';
      btn.style.color = '';
      btn.style.borderColor = '';
    }
  };

  /* ── daily saved total (bottom pill) ── */
  const updateTotalPill = () => {
    const el = document.getElementById('lang-total-pill');
    if (el) el.textContent = `Hoy: ${getMinutes()} min guardados`;
  };

  /* ── streak ── */
  const renderStreakInner = () => {
    const el = document.getElementById('lang-streak-inner');
    if (!el) return;
    const { current, max } = Store.languages.getStreak();
    const extra = current >= 30 ? '🔥🔥🔥 ' : (current >= 7 ? '🔥🔥 ' : '🔥 ');
    const glow  = current >= 7 ? '0 0 30px var(--cyan), 0 0 60px var(--cyan-glow)' : '0 0 16px var(--cyan-glow)';
    const pulse = current >= 7 ? ' lang-streak-pulse' : '';
    el.innerHTML = `
      <div style="text-align:center;">
        <div class="font-black${pulse}" style="font-size:clamp(3rem, 15vw, 4.5rem); color:var(--cyan);text-shadow:${glow};line-height:1.1;">${extra}${current}</div>
        <div class="text-sm text-muted mt-1" style="letter-spacing:1px;text-transform:uppercase;">días consecutivos</div>
        <div class="text-xs text-muted mt-2" style="opacity:0.6;">Récord: ${max} días</div>
      </div>`;
  };

  /* ── toggle ── */
  const updateToggle = () => {
    const track = document.getElementById('lang-toggle-track');
    const label = document.getElementById('lang-toggle-label');
    if (!track) return;
    const c = getCompleted();
    if (c) {
      track.classList.add('active');
      track.style.background = 'var(--cyan)';
      track.style.boxShadow  = '0 0 20px var(--cyan-glow)';
    } else {
      track.classList.remove('active');
      track.style.background = '';
      track.style.boxShadow  = '';
    }
    if (label) label.textContent = c ? '¡COMPLETADA!' : 'SESIÓN COMPLETADA';
  };

  const toggleCompleted = (forceOn) => {
    const todayStr = Store.today();
    const existing = Store.languages.getLog(todayStr) || {};
    const newVal   = forceOn === true ? true : !existing.completed;
    Store.languages.saveLog(todayStr, { minutes: existing.minutes || 0, completed: newVal });
    updateToggle();
    renderStreakInner();
    renderCalendarGrid();
    if (newVal) launchConfetti();
  };

  /* ── confetti ── */
  const launchConfetti = () => {
    const container = document.getElementById('lang-confetti');
    if (!container) return;
    container.innerHTML = '';
    container.style.display = 'block';
    const particles = [];
    const colors = ['#00b0ff','#00e5ff','#18ffff','#84ffff','#b2ebf2','#ffffff'];
    for (let i = 0; i < 60; i++) {
      const p    = document.createElement('div');
      const size = 4 + Math.random() * 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:${color};border-radius:${Math.random()>0.5?'50%':'2px'};pointer-events:none;`;
      container.appendChild(p);
      particles.push({ el:p, x:container.offsetWidth/2+(Math.random()-.5)*60, y:container.offsetHeight/2, vx:(Math.random()-.5)*8, vy:-4-Math.random()*8, rot:Math.random()*360, vr:(Math.random()-.5)*10, opacity:1 });
    }
    let frame = 0;
    const animate = () => {
      frame++;
      let alive = false;
      particles.forEach(pt => {
        pt.vy += 0.15; pt.x += pt.vx; pt.y += pt.vy; pt.rot += pt.vr; pt.opacity -= 0.012;
        if (pt.opacity > 0) { alive = true; pt.el.style.transform = `translate(${pt.x}px,${pt.y}px) rotate(${pt.rot}deg)`; pt.el.style.opacity = pt.opacity; }
        else { pt.el.style.display = 'none'; }
      });
      if (alive && frame < 180) { _confettiRAF = requestAnimationFrame(animate); }
      else { container.innerHTML = ''; container.style.display = 'none'; }
    };
    _confettiRAF = requestAnimationFrame(animate);
  };

  /* ── calendar ── */
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const renderCalendarGrid = () => {
    const container = document.getElementById('lang-cal-grid');
    const title     = document.getElementById('lang-cal-title');
    if (!container || !title) return;
    title.textContent = `${MONTHS[_calMonth]} ${_calYear}`;
    const firstDay    = new Date(_calYear, _calMonth, 1).getDay();
    const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();
    const todayStr    = Store.today();
    const logs        = Store.languages.getMonthLogs(_calYear, _calMonth + 1);
    const offset = (firstDay + 6) % 7;
    let html = '';
    for (let i = 0; i < offset; i++) html += '<div class="calendar-day" style="visibility:hidden"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dt  = new Date(_calYear, _calMonth, d);
      const ds  = Store.getDateStr(dt);
      const log = logs[ds];
      const isToday = ds === todayStr;
      const isPast  = dt < new Date(new Date().toDateString());
      let cls = 'calendar-day';
      if (log && log.completed) cls += ' completed';
      else if (isToday) cls += ' today';
      else if (isPast)  cls += ' missed';
      html += `<div class="${cls}">${d}</div>`;
    }
    container.innerHTML = html;
    container.querySelectorAll('.calendar-day.completed').forEach(el => {
      el.style.background = 'var(--cyan)'; el.style.color = '#000'; el.style.boxShadow = '0 0 12px var(--cyan-glow)';
    });
    container.querySelectorAll('.calendar-day.today:not(.completed)').forEach(el => { el.style.borderColor = 'var(--cyan)'; });
  };

  /* ── goal editor panel ── */
  const renderGoalEditor = () => {
    const goal = getGoal();
    return `
      <div id="lang-goal-panel" style="display:none;background:var(--bg-tertiary);border:1px solid var(--glass-border);border-radius:14px;padding:16px 20px;margin-bottom:16px;">
        <div class="text-sm font-semibold text-muted mb-2" style="letter-spacing:1px;text-transform:uppercase;">⚙ Meta de sesión</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <input id="lang-goal-input" type="number" min="1" max="480" value="${goal}"
            class="input-field" style="width:90px;text-align:center;padding:10px;font-size:1.1rem;font-weight:700;color:var(--cyan);">
          <span class="text-sm text-muted">minutos</span>
          <button id="lang-goal-save" class="btn btn-cyan btn-sm">Guardar meta</button>
        </div>
      </div>`;
  };

  /* ── main card HTML ── */
  const renderRingSVG = () => {
    const goal    = getGoal();
    const goalSec = goal * 60;
    const pct     = Math.min(_timerSeconds / goalSec, 1);
    const offset  = CIRCUMFERENCE - CIRCUMFERENCE * pct;

    return `
      <div class="card fade-in" style="text-align:center;padding:32px 24px;position:relative;overflow:hidden;">
        <div id="lang-confetti" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;display:none;overflow:hidden;z-index:10;"></div>

        <!-- Goal editor toggle -->
        <div style="position:absolute;top:16px;right:16px;">
          <button id="lang-goal-toggle" class="btn btn-icon btn-ghost" title="Editar meta" style="width:36px;height:36px;font-size:18px;" aria-label="Editar meta">⚙</button>
        </div>

        ${renderGoalEditor()}

        <!-- Ring (is the timer) -->
        <svg id="lang-ring-svg" viewBox="0 0 200 200" width="220" height="220" style="filter:drop-shadow(0 0 20px var(--cyan-glow));">
          <!-- track -->
          <circle cx="100" cy="100" r="90" fill="none" stroke="var(--bg-tertiary)" stroke-width="10"/>
          <!-- filled arc — driven by timer -->
          <circle id="lang-timer-circle" cx="100" cy="100" r="90" fill="none"
            stroke="var(--cyan)" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${CIRCUMFERENCE}"
            stroke-dashoffset="${offset}"
            transform="rotate(-90 100 100)"
            style="transition:stroke-dashoffset 0.5s ease;"/>
          <!-- time display MM:SS -->
          <text id="lang-timer-time" x="100" y="90" text-anchor="middle" dominant-baseline="middle"
            fill="#fff" font-size="36" font-weight="800" font-family="'Inter',monospace">${fmtS(_timerSeconds)}</text>
          <!-- goal label -->
          <text id="lang-timer-goal-label" x="100" y="125" text-anchor="middle"
            fill="var(--cyan)" font-size="12" font-weight="500" font-family="inherit" letter-spacing="2">meta: ${goal} min</text>
        </svg>

        <!-- Controls -->
        <div style="margin-top:24px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button id="lang-timer-start" class="${_isTimerRunning ? 'btn btn-ghost lang-ctrl-btn' : 'btn btn-cyan lang-ctrl-btn'}"
            style="min-width:130px;${_isTimerRunning ? 'color:var(--cyan);border-color:var(--cyan);' : ''}">
            ${_isTimerRunning ? '⏸ Pausar' : (_timerSeconds > 0 ? '▶ Reanudar' : '▶ Iniciar')}
          </button>
          <button id="lang-timer-save" class="btn btn-ghost lang-ctrl-btn" style="min-width:120px;">⏹ Guardar</button>
          <button id="lang-timer-reset" class="btn btn-icon btn-ghost" style="border-color:var(--danger);color:var(--danger);" title="Reiniciar" aria-label="Reiniciar">↻</button>
        </div>

        <!-- Daily total pill -->
        <div id="lang-total-pill" class="text-sm font-medium mt-3" style="color:var(--text-muted);">Hoy: ${getMinutes()} min guardados</div>

        <!-- Toggle -->
        <div style="margin-top:24px;display:flex;flex-direction:column;align-items:center;gap:8px;">
          <span id="lang-toggle-label" class="text-xs font-semibold" style="letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);">
            ${getCompleted() ? '¡COMPLETADA!' : 'SESIÓN COMPLETADA'}
          </span>
          <div class="toggle-container toggle-lg" id="lang-toggle-container" style="cursor:pointer;">
            <div id="lang-toggle-track" class="toggle-track${getCompleted() ? ' active' : ''}"
              style="${getCompleted() ? 'background:var(--cyan);box-shadow:0 0 20px var(--cyan-glow);' : ''}">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>
      </div>`;
  };

  const renderStreak = () => `
    <div class="card fade-in" style="padding:32px 24px;">
      <div id="lang-streak-inner"></div>
    </div>`;

  const renderCalendar = () => `
    <div class="card fade-in" style="padding:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <button id="lang-cal-prev" class="btn btn-icon btn-ghost" style="font-size:18px;">‹</button>
        <h3 id="lang-cal-title" class="card-title text-lg" style="color:var(--cyan);"></h3>
        <button id="lang-cal-next" class="btn btn-icon btn-ghost" style="font-size:18px;">›</button>
      </div>
      <div class="calendar-grid" style="margin-bottom:4px;">
        <div class="calendar-day-header">LUN</div><div class="calendar-day-header">MAR</div><div class="calendar-day-header">MIÉ</div>
        <div class="calendar-day-header">JUE</div><div class="calendar-day-header">VIE</div><div class="calendar-day-header">SÁB</div><div class="calendar-day-header">DOM</div>
      </div>
      <div id="lang-cal-grid" class="calendar-grid"></div>
    </div>`;

  /* ── PUBLIC API ── */
  return {
    render() {
      const today = new Date();
      _calYear  = today.getFullYear();
      _calMonth = today.getMonth();

      return `
        <div class="section-content fade-in">
          <style>
            .lang-streak-pulse{animation:langStreakPulse 2s ease-in-out infinite;}
            @keyframes langStreakPulse{0%,100%{text-shadow:0 0 16px var(--cyan-glow)}50%{text-shadow:0 0 40px var(--cyan),0 0 80px var(--cyan-glow)}}
            .lang-ctrl-btn{transition:all 0.2s ease!important;}
            .lang-ctrl-btn:hover{transform:translateY(-2px)!important;}
            .lang-ctrl-btn:active{transform:scale(0.97)!important;}
            .lang-desktop-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
            @media(max-width:768px){.lang-desktop-grid{grid-template-columns:1fr;}}
          </style>

          <div class="lang-desktop-grid">
            <div>${renderRingSVG()}</div>
            <div style="display:flex;flex-direction:column;gap:20px;">
              ${renderStreak()}
              ${renderCalendar()}
            </div>
          </div>
        </div>`;
    },

    init() {
      _listeners = [];

      /* streak & calendar */
      renderStreakInner();
      renderCalendarGrid();

      on('lang-cal-prev', 'click', () => {
        if (_calMonth <= MONTH_MIN && _calYear === 2026) return;
        _calMonth--;
        if (_calMonth < 0) { _calMonth = 11; _calYear--; }
        renderCalendarGrid();
      });
      on('lang-cal-next', 'click', () => {
        if (_calMonth >= MONTH_MAX && _calYear === 2026) return;
        _calMonth++;
        if (_calMonth > 11) { _calMonth = 0; _calYear++; }
        renderCalendarGrid();
      });

      /* ── goal editor ── */
      on('lang-goal-toggle', 'click', () => {
        const panel = document.getElementById('lang-goal-panel');
        if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
      on('lang-goal-save', 'click', () => {
        const input = document.getElementById('lang-goal-input');
        if (!input) return;
        const val = parseInt(input.value, 10);
        if (!val || val < 1) return;
        setGoal(val);
        /* update ring goal label */
        const gl = document.getElementById('lang-timer-goal-label');
        if (gl) gl.textContent = `meta: ${val} min`;
        /* re-render ring fill based on new goal */
        updateTimerRing();
        /* hide panel */
        const panel = document.getElementById('lang-goal-panel');
        if (panel) panel.style.display = 'none';
      });

      /* ── timer controls ── */
      const toggleTimer = () => {
        if (_isTimerRunning) {
          clearInterval(_timerInterval);
          _isTimerRunning = false;
        } else {
          _isTimerRunning = true;
          _timerInterval = setInterval(() => {
            _timerSeconds++;
            updateTimerRing();
            /* auto-complete when goal reached */
            if (_timerSeconds >= getGoal() * 60 && !getCompleted()) {
              const mins = Math.round(_timerSeconds / 60);
              saveMinutes(getMinutes() + mins);
              toggleCompleted(true);
              updateTotalPill();
              renderStreakInner();
              renderCalendarGrid();
              updateToggle();
            }
          }, 1000);
        }
        setStartBtnState(_isTimerRunning);
      };

      const saveTimer = () => {
        if (_timerSeconds > 0) {
          const minsToAdd = Math.max(1, Math.round(_timerSeconds / 60));
          const current   = getMinutes();
          saveMinutes(current + minsToAdd);
          updateTotalPill();
          renderStreakInner();
          renderCalendarGrid();
          if (current + minsToAdd >= getGoal() && !getCompleted()) toggleCompleted(true);
          updateToggle();
        }
        clearInterval(_timerInterval);
        _isTimerRunning = false;
        _timerSeconds   = 0;
        updateTimerRing();
        setStartBtnState(false);
        const btn = document.getElementById('lang-timer-start');
        if (btn) btn.textContent = '▶ Iniciar';
      };

      const resetTimer = () => {
        clearInterval(_timerInterval);
        _isTimerRunning = false;
        _timerSeconds   = 0;
        updateTimerRing();
        setStartBtnState(false);
        const btn = document.getElementById('lang-timer-start');
        if (btn) btn.textContent = '▶ Iniciar';
      };

      on('lang-timer-start', 'click', toggleTimer);
      on('lang-timer-save',  'click', saveTimer);
      on('lang-timer-reset', 'click', resetTimer);

      /* toggle */
      on('lang-toggle-container', 'click', () => { toggleCompleted(); });

      updateToggle();
      updateTimerRing();
      updateTotalPill();
    },

    destroy() {
      _listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
      _listeners = [];
      if (_confettiRAF)   cancelAnimationFrame(_confettiRAF);
      if (_confettiTimer) clearTimeout(_confettiTimer);
      if (_timerInterval) clearInterval(_timerInterval);
    }
  };
})();
