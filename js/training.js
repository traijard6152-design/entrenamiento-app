/* ================================================================
   TRAINING SECTION — Entrenamiento Físico
   Color theme: EMERALD (#00e676)
   ================================================================ */
window.TrainingSection = (() => {

  /* ── module state ── */
  let _calYear  = 2026;
  let _calMonth = 5;
  let _listeners = [];
  let _debounceTimer = null;

  /* ── session completion state ── */
  let _completed = false;

  /* ── rest timer state ── */
  let _restSeconds   = 0;
  let _restTarget    = 75;   // default 75 s
  let _restInterval  = null;
  let _restRunning   = false;

  const MONTH_MIN = 5;
  const MONTH_MAX = 11;

  /* ── exercise image map ──
     Key   = nombre exacto del ejercicio
     Value = ruta relativa a la imagen
  ── */
  const EX_IMAGES = {
    // DIA 1
    'Caminadora a ritmo ligero':        'DIA 1/Caminadora a ritmo ligero.png',
    'Caminadora rápida':                'DIA 1/Caminadora rápida.png',
    'Crunch abdominal':                 'DIA 1/Crunch abdominal.png',
    'Curl concentrado':                 'DIA 1/Curl concentrado.png',
    'Curl de bíceps alternado':         'DIA 1/Curl de bíceps alternado.png',
    'Curl martillo':                    'DIA 1/Curl martillo.png',
    'Elevaciones de piernas':           'DIA 1/Elevaciones de piernas.png',
    'Peso muerto rumano con mancuernas':'DIA 1/Peso muerto rumano con mancuernas.png',
    'Plancha':                          'DIA 1/Plancha.png',
    'Remo con mancuernas':              'DIA 1/Remo con mancuernas.png',
    'Remo inclinado agarre abierto':    'DIA 1/Remo inclinado agarre abierto.png',
    // DIA 2
    'Caminadora inclinada o rápida':    'DIA 2/Caminadora inclinada o rápida.png',
    'Caminadora':                       'DIA 2/Caminadora.png',
    'Crunch bicicleta':                 'DIA 2/Crunch bicicleta.png',
    'Elevaciones de pantorrillas':      'DIA 2/Elevaciones de pantorrillas.png',
    'Peso muerto rumano':               'DIA 2/Peso muerto rumano.png',
    'Plancha lateral':                  'DIA 2/Plancha lateral.png',
    'Sentadilla búlgara':               'DIA 2/Sentadilla búlgara.png',
    'Sentadillas con mancuernas':       'DIA 2/Sentadillas con mancuernas.png',
    'Zancadas':                         'DIA 2/Zancadas.png',
    // DIA 3
    'Aperturas con mancuernas':                         'DIA 3/Aperturas con mancuernas.jpg',
    'Caminadora: intervalos rápidos/lentos':            'DIA 3/Caminadora intervalos rápidoslentos.jpg',
    'Crunch':                                           'DIA 3/Crunch.jpg',
    'Extensión de tríceps sobre la cabeza':             'DIA 3/Extensión de tríceps sobre la cabeza.webp',
    'Flexiones de brazos':                              'DIA 3/Flexiones de brazos.jpg',
    'Flexiones':                                        'DIA 3/Flexiones de brazos.jpg',
    'Fondos entre sillas':                              'DIA 3/Fondos entre sillas.png',
    'Mountain climbers':                                'DIA 3/Mountain climbers.jpg',
    'Patada de tríceps':                                'DIA 3/Patada de tríceps.jpg',
    'Press de pecho con mancuernas en el suelo':        'DIA 3/Press de pecho con mancuernas en el suelo.png',
    // DIA 4
    'Elevaciones frontales':            'DIA 4/Elevaciones frontales.jpg',
    'Elevaciones laterales':            'DIA 4/Elevaciones laterales.jpg',
    'Press militar':                    'DIA 4/Press militar.jpg',
    'Pájaros para hombro posterior':    'DIA 4/Pájaros para hombro posterior.jpg',
    // Aliases para ejercicios con nombres similares entre días
    'Elevaciones de piernas':                    'DIA 1/Elevaciones de piernas.png',
    'Elevación de piernas':                      'DIA 1/Elevaciones de piernas.png',
    'Curl de bíceps':                            'DIA 1/Curl de bíceps alternado.png',
    'Caminadora: 1 min rápido + 1 min lento':   'DIA 3/Caminadora intervalos rápidoslentos.jpg',
  };

  const getExImage = (name) => EX_IMAGES[name] || null;

  /* ── workout data ── */
  const DAYS = [
    {
      id: 'day1',
      label: 'Día 1',
      title: 'Espalda + Bíceps + Abdomen',
      icon: '💪',
      color: 'var(--emerald)',
      groups: [
        {
          name: '🚶 Calentamiento (5 min)',
          exercises: [
            { name: 'Caminadora a ritmo ligero', sets: 1, reps: '5 min', video: 'https://www.youtube.com/embed/Ukj3sGMGEHE' }
          ]
        },
        {
          name: '🏋️ Espalda',
          exercises: [
            { name: 'Remo con mancuernas', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/pYcpY20QaE8' },
            { name: 'Remo inclinado agarre abierto', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/GZbfZ033f74' },
            { name: 'Peso muerto rumano con mancuernas', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/hCDzSR6bW10' }
          ]
        },
        {
          name: '💪 Bíceps',
          exercises: [
            { name: 'Curl de bíceps alternado', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/ykJmrZ5v0Oo' },
            { name: 'Curl martillo', sets: 3, reps: '12 reps', video: 'https://www.youtube.com/embed/zC3nLlEvin4' },
            { name: 'Curl concentrado', sets: 3, reps: '10 reps x brazo', video: 'https://www.youtube.com/embed/Jvj2wV0vOYU' }
          ]
        },
        {
          name: '🧘 Abdomen',
          exercises: [
            { name: 'Crunch abdominal', sets: 3, reps: '20 reps', video: 'https://www.youtube.com/embed/Xyd_fa5zoEU' },
            { name: 'Elevaciones de piernas', sets: 3, reps: '15 reps', video: 'https://www.youtube.com/embed/JB2oyawG9KI' },
            { name: 'Plancha', sets: 3, reps: '30–60 seg', video: 'https://www.youtube.com/embed/ASdvN_XEl_c' }
          ]
        },
        {
          name: '🏃 Cardio',
          exercises: [
            { name: 'Caminadora rápida', sets: 1, reps: '5 min', video: 'https://www.youtube.com/embed/Ukj3sGMGEHE' }
          ]
        }
      ]
    },
    {
      id: 'day2',
      label: 'Día 2',
      title: 'Piernas + Abdomen',
      icon: '🦵',
      color: '#69f0ae',
      groups: [
        {
          name: '🚶 Calentamiento (5 min)',
          exercises: [
            { name: 'Caminadora', sets: 1, reps: '5 min', video: 'https://www.youtube.com/embed/Ukj3sGMGEHE' }
          ]
        },
        {
          name: '🦵 Piernas',
          exercises: [
            { name: 'Sentadillas con mancuernas', sets: 4, reps: '15 reps', video: 'https://www.youtube.com/embed/aclHkVaku9U' },
            { name: 'Zancadas', sets: 4, reps: '12 reps x pierna', video: 'https://www.youtube.com/embed/wrwwXE_x-pQ' },
            { name: 'Peso muerto rumano', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/hCDzSR6bW10' },
            { name: 'Sentadilla búlgara', sets: 3, reps: '12 reps x pierna', video: 'https://www.youtube.com/embed/2C-uNgKwPLE' },
            { name: 'Elevaciones de pantorrillas', sets: 4, reps: '20 reps', video: 'https://www.youtube.com/embed/-M4-G8p1fCI' }
          ]
        },
        {
          name: '🧘 Abdomen',
          exercises: [
            { name: 'Crunch bicicleta', sets: 3, reps: '20 reps', video: 'https://www.youtube.com/embed/9FGilxCbdz8' },
            { name: 'Plancha lateral', sets: 3, reps: '30 seg x lado', video: 'https://www.youtube.com/embed/K2VljzCC16g' },
            { name: 'Elevaciones de piernas', sets: 3, reps: '15 reps', video: 'https://www.youtube.com/embed/JB2oyawG9KI' }
          ]
        },
        {
          name: '🏃 Cardio',
          exercises: [
            { name: 'Caminadora inclinada o rápida', sets: 1, reps: '10 min', video: 'https://www.youtube.com/embed/Ukj3sGMGEHE' }
          ]
        }
      ]
    },
    {
      id: 'day3',
      label: 'Día 3',
      title: 'Pecho + Tríceps + Abdomen',
      icon: '🤜',
      color: '#00e5ff',
      groups: [
        {
          name: '💪 Pecho',
          exercises: [
            { name: 'Flexiones de brazos', sets: 4, reps: 'Al fallo', video: 'https://www.youtube.com/embed/IODxDxX7oi4' },
            { name: 'Press de pecho con mancuernas en el suelo', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/PL-BDBD_n9Q' },
            { name: 'Aperturas con mancuernas', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/eozdVDA78K0' }
          ]
        },
        {
          name: '💪 Tríceps',
          exercises: [
            { name: 'Fondos entre sillas', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/6kALZikXxLc' },
            { name: 'Extensión de tríceps sobre la cabeza', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/YbX7Wd8jQ-Q' },
            { name: 'Patada de tríceps', sets: 3, reps: '15 reps', video: 'https://www.youtube.com/embed/l3WDbTeEHKY' }
          ]
        },
        {
          name: '🧘 Abdomen',
          exercises: [
            { name: 'Crunch', sets: 3, reps: '20 reps', video: 'https://www.youtube.com/embed/Xyd_fa5zoEU' },
            { name: 'Plancha', sets: 3, reps: '60 seg', video: 'https://www.youtube.com/embed/ASdvN_XEl_c' },
            { name: 'Mountain climbers', sets: 3, reps: '30 seg', video: 'https://www.youtube.com/embed/nmwgirgXLYM' }
          ]
        },
        {
          name: '🏃 Cardio',
          exercises: [
            { name: 'Caminadora: intervalos rápidos/lentos', sets: 1, reps: '10 min', video: 'https://www.youtube.com/embed/Ukj3sGMGEHE' }
          ]
        }
      ]
    },
    {
      id: 'day4',
      label: 'Día 4',
      title: 'Espalda + Hombros + Abdomen',
      icon: '🏋️',
      color: '#e040fb',
      groups: [
        {
          name: '🏋️ Espalda',
          exercises: [
            { name: 'Remo con mancuernas', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/pYcpY20QaE8' },
            { name: 'Peso muerto rumano', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/hCDzSR6bW10' }
          ]
        },
        {
          name: '💪 Hombros',
          exercises: [
            { name: 'Press militar', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/qEwKCR5JCog' },
            { name: 'Elevaciones laterales', sets: 4, reps: '15 reps', video: 'https://www.youtube.com/embed/3VcKaXpzqRo' },
            { name: 'Elevaciones frontales', sets: 3, reps: '15 reps', video: 'https://www.youtube.com/embed/gkfaOiDzOlY' },
            { name: 'Pájaros para hombro posterior', sets: 3, reps: '15 reps', video: 'https://www.youtube.com/embed/v8FeWs7XDOE' }
          ]
        },
        {
          name: '🧘 Abdomen',
          exercises: [
            { name: 'Crunch bicicleta', sets: 3, reps: '20 reps', video: 'https://www.youtube.com/embed/9FGilxCbdz8' },
            { name: 'Elevación de piernas', sets: 3, reps: '15 reps', video: 'https://www.youtube.com/embed/JB2oyawG9KI' },
            { name: 'Plancha', sets: 3, reps: '60 seg', video: 'https://www.youtube.com/embed/ASdvN_XEl_c' }
          ]
        },
        {
          name: '🏃 Cardio',
          exercises: [
            { name: 'Caminadora', sets: 1, reps: '10 min', video: 'https://www.youtube.com/embed/Ukj3sGMGEHE' }
          ]
        }
      ]
    },
    {
      id: 'day5',
      label: 'Día 5',
      title: 'Cuerpo Completo + Cardio',
      icon: '🔥',
      color: '#ffd600',
      groups: [
        {
          name: '🔄 Circuito (4 vueltas · 2 min descanso entre vueltas)',
          exercises: [
            { name: 'Sentadillas con mancuernas', sets: 4, reps: '15 reps', video: 'https://www.youtube.com/embed/aclHkVaku9U' },
            { name: 'Flexiones', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/IODxDxX7oi4' },
            { name: 'Remo con mancuernas', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/pYcpY20QaE8' },
            { name: 'Press militar', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/qEwKCR5JCog' },
            { name: 'Curl de bíceps', sets: 4, reps: '12 reps', video: 'https://www.youtube.com/embed/ykJmrZ5v0Oo' },
            { name: 'Zancadas', sets: 4, reps: '12 reps x pierna', video: 'https://www.youtube.com/embed/wrwwXE_x-pQ' }
          ]
        },
        {
          name: '🧘 Abdomen',
          exercises: [
            { name: 'Plancha', sets: 3, reps: '60 seg', video: 'https://www.youtube.com/embed/ASdvN_XEl_c' },
            { name: 'Crunch', sets: 3, reps: '20 reps', video: 'https://www.youtube.com/embed/Xyd_fa5zoEU' },
            { name: 'Elevaciones de piernas', sets: 3, reps: '15 reps', video: 'https://www.youtube.com/embed/JB2oyawG9KI' }
          ]
        },
        {
          name: '🏃 Cardio Final',
          exercises: [
            { name: 'Caminadora: 1 min rápido + 1 min lento', sets: 1, reps: '15 min', video: 'https://www.youtube.com/embed/Ukj3sGMGEHE' }
          ]
        }
      ]
    },
    {
      id: 'day6',
      label: 'Sábado',
      title: 'Descanso Activo',
      icon: '🛋️',
      color: '#b0bec5',
      groups: [
        {
          name: '🧘 Movilidad & Estiramientos',
          exercises: [
            { name: 'Estiramientos generales', sets: 1, reps: '10 min', video: 'https://www.youtube.com/embed/grM28JcM2M4' },
            { name: 'Foam roller (Masaje miofascial)', sets: 1, reps: '10 min', video: 'https://www.youtube.com/embed/8F22S96_kCQ' }
          ]
        },
        {
          name: '🚶 Actividad Ligera',
          exercises: [
            { name: 'Caminata al aire libre', sets: 1, reps: '20 min', video: 'https://www.youtube.com/embed/Ukj3sGMGEHE' }
          ]
        }
      ]
    },
    {
      id: 'day7',
      label: 'Domingo',
      title: 'Descanso Total',
      icon: '😴',
      color: '#b0bec5',
      groups: [
        {
          name: '🛌 Recuperación Pasiva',
          exercises: [
            { name: 'Respiración consciente o meditación', sets: 1, reps: '10 min', video: 'https://www.youtube.com/embed/grM28JcM2M4' },
            { name: 'Hidratación y descanso total', sets: 1, reps: 'Todo el día', video: 'https://www.youtube.com/embed/Ukj3sGMGEHE' }
          ]
        }
      ]
    }
  ];

  const WEIGHT_KEY = (dayId, exIdx) => `tr_weight_${dayId}_${exIdx}`;
  const DAY_PREF_KEY = 'tr_active_day';

  let _customDays = null;
  const getDays = () => {
    if (_customDays) return _customDays;
    const saved = localStorage.getItem('tr_custom_days_v3');
    if (saved) {
      try {
        _customDays = JSON.parse(saved);
        if (_customDays.length !== DAYS.length) {
           _customDays = JSON.parse(JSON.stringify(DAYS));
           saveDays();
        }
        return _customDays;
      } catch (e) {
        console.error('Error parsing custom days:', e);
      }
    }
    _customDays = JSON.parse(JSON.stringify(DAYS));
    return _customDays;
  };

  const saveDays = () => {
    localStorage.setItem('tr_custom_days_v3', JSON.stringify(_customDays));
  };

  const getActiveDay = () => {
    const saved = localStorage.getItem(DAY_PREF_KEY);
    if (saved) return parseInt(saved, 10);
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    if (dayOfWeek === 0) return 6; // Domingo (index 6)
    return dayOfWeek - 1; // Lunes=0, ..., Sábado=5
  };

  const setActiveDay = (idx) => localStorage.setItem(DAY_PREF_KEY, idx);

  const getWeight = (dayId, exIdx) => parseFloat(localStorage.getItem(WEIGHT_KEY(dayId, exIdx)) || '0') || 0;
  const saveWeight = (dayId, exIdx, val) => localStorage.setItem(WEIGHT_KEY(dayId, exIdx), val);

  const on = (id, evt, fn) => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener(evt, fn); _listeners.push({ el, evt, fn }); }
  };

  const onAll = (sel, evt, fn) => {
    document.querySelectorAll(sel).forEach(el => {
      el.addEventListener(evt, fn);
      _listeners.push({ el, evt, fn });
    });
  };

  /* ── helpers ── */
  const pad = n => String(n).padStart(2, '0');
  const fmt = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;


  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.8);
    } catch (_) {}
  };

  /* ── rest timer ── */
  const startRestTimer = (target) => {
    if (_restRunning) { clearInterval(_restInterval); _restRunning = false; }
    _restTarget  = target || _restTarget;
    _restSeconds = 0;
    _restRunning = true;
    updateRestDisplay();
    _restInterval = setInterval(() => {
      _restSeconds++;
      updateRestDisplay();
      if (_restSeconds >= _restTarget) {
        clearInterval(_restInterval);
        _restRunning = false;
        beep();
        const ring = document.getElementById('rest-ring-fill');
        if (ring) ring.style.stroke = '#00e676';
        const display = document.getElementById('rest-timer-display');
        if (display) display.style.color = 'var(--emerald)';
      }
    }, 1000);
  };

  const stopRestTimer = () => {
    clearInterval(_restInterval);
    _restRunning = false;
    _restSeconds = 0;
    updateRestDisplay();
  };

  const updateRestDisplay = () => {
    const display = document.getElementById('rest-timer-display');
    const ring    = document.getElementById('rest-ring-fill');
    const label   = document.getElementById('rest-timer-label');
    const pct     = Math.min(_restSeconds / _restTarget, 1);
    const CIRC    = 2 * Math.PI * 30;

    if (display) {
      display.textContent = fmt(_restSeconds);
      display.style.color = _restSeconds >= _restTarget ? 'var(--emerald)' : '#fff';
    }
    if (ring) {
      ring.style.stroke = pct >= 1 ? 'var(--emerald)' : 'var(--emerald)';
      ring.style.strokeDashoffset = CIRC - CIRC * pct;
    }
    if (label) label.textContent = _restRunning ? `${_restTarget}s target` : 'Descanso';
  };

  /* ── stats ── */
  const weekdaysSoFar = (y, m) => {
    const today = new Date();
    const last = (y === today.getFullYear() && m === today.getMonth()) ? today.getDate() : new Date(y, m+1, 0).getDate();
    let c = 0;
    for (let d = 1; d <= last; d++) { const wd = new Date(y,m,d).getDay(); if (wd!==0&&wd!==6) c++; }
    return c;
  };
  const completedThisMonth = () => {
    const today = new Date();
    const logs = Store.training.getMonthLogs(today.getFullYear(), today.getMonth()+1);
    let c = 0; for (const k in logs) if (logs[k]&&logs[k].completed) c++; return c;
  };
  const renderStatsInner = () => {
    const el = document.getElementById('training-stats-inner');
    if (!el) return;
    const streak = Store.training.getStreak();
    const today  = new Date();
    const done   = completedThisMonth();
    const total  = weekdaysSoFar(today.getFullYear(), today.getMonth());
    el.innerHTML = `
      <div class="tr-stat"><span class="tr-stat-icon">🔥</span><span class="tr-stat-val">${streak.current}</span><span class="tr-stat-lbl">Racha</span></div>
      <div class="tr-stat"><span class="tr-stat-icon">🏆</span><span class="tr-stat-val">${streak.max}</span><span class="tr-stat-lbl">Máx racha</span></div>
      <div class="tr-stat"><span class="tr-stat-icon">📅</span><span class="tr-stat-val">${done}/${total}</span><span class="tr-stat-lbl">Este mes</span></div>`;
  };

  /* ── calendar ── */
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const renderCalendarGrid = () => {
    const container = document.getElementById('training-cal-grid');
    const title     = document.getElementById('training-cal-title');
    if (!container || !title) return;
    title.textContent = `${MONTHS[_calMonth]} ${_calYear}`;
    const firstDay    = new Date(_calYear, _calMonth, 1).getDay();
    const daysInMonth = new Date(_calYear, _calMonth+1, 0).getDate();
    const todayStr    = Store.today();
    const logs        = Store.training.getMonthLogs(_calYear, _calMonth+1);
    const offset = (firstDay+6)%7;
    let html = '';
    for (let i = 0; i < offset; i++) html += '<div class="calendar-day" style="visibility:hidden"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(_calYear, _calMonth, d);
      const ds = Store.getDateStr(dt);
      const wd = dt.getDay();
      const isWeekend = wd===0||wd===6;
      const log = logs[ds];
      const isToday = ds===todayStr;
      const isPast  = dt < new Date(new Date().toDateString());
      let cls = 'calendar-day';
      if (isWeekend) cls += ' rest';
      else if (log&&log.completed) cls += ' completed';
      else if (isToday) cls += ' today';
      else if (isPast)  cls += ' missed';
      html += `<div class="${cls}">${d}</div>`;
    }
    container.innerHTML = html;
    container.querySelectorAll('.calendar-day.completed').forEach(el => { el.style.background='var(--emerald)'; el.style.color='#000'; el.style.boxShadow='0 0 12px var(--emerald-glow)'; });
    container.querySelectorAll('.calendar-day.today:not(.completed)').forEach(el => { el.style.borderColor='var(--emerald)'; });
  };

  /* ── render workout for active day ── */
  const renderDayWorkout = (dayIdx) => {
    const day = getDays()[dayIdx];
    if (!day) return '';

    let exGlobalIdx = 0;
    const groupsHtml = day.groups.map((group, groupIdx) => {
      const exHtml = group.exercises.map((ex, localIdx) => {
        const gIdx = exGlobalIdx++;
        const weight = getWeight(day.id, gIdx);
        const setsList = Array.from({length: ex.sets}, (_, i) => `
          <li class="tr-set-item" data-set="${i}">
            <span class="tr-set-num">Serie ${i+1}</span>
            <span class="tr-set-reps">${ex.reps}</span>
            <button class="tr-set-done-btn" data-exidx="${gIdx}" data-set="${i}" title="Marcar completada">✓</button>
          </li>`).join('');

        const imgSrc = getExImage(ex.name);
        return `
          <div class="tr-exercise-card" id="tr-ex-${day.id}-${gIdx}">
            <div class="tr-ex-header" style="display:flex; justify-content:space-between; align-items:center; cursor:default;">
              <div style="display:flex; flex-direction:column; gap:2px; flex:1;">
                <div class="tr-ex-name" id="tr-ex-name-text-${day.id}-${gIdx}">${ex.name}</div>
                <div class="tr-ex-meta" id="tr-ex-meta-text-${day.id}-${gIdx}" style="align-self:flex-start; margin-top:4px;">${ex.sets} × ${ex.reps}</div>
              </div>
              <button class="tr-edit-btn btn btn-icon btn-ghost" data-dayidx="${dayIdx}" data-groupidx="${groupIdx}" data-localidx="${localIdx}" data-exidx="${gIdx}" title="Editar Ejercicio" style="font-size:14px; padding:6px; color:var(--text-muted); cursor:pointer;">✏️</button>
            </div>
            <div class="tr-ex-body" id="tr-ex-body-${day.id}-${gIdx}">
              <!-- Imagen del ejercicio -->
              <div class="tr-ex-img-wrap">
                ${imgSrc ? `
                  <img
                    src="${imgSrc}"
                    alt="${ex.name}"
                    class="tr-ex-img"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                  />
                  <div class="tr-ex-img-fallback" style="display:none;">
                    <span>🏋️</span>
                    <span style="font-size:0.75rem;color:var(--text-muted);">Sin imagen</span>
                  </div>
                ` : `
                  <div class="tr-ex-img-fallback" style="display:flex;">
                    <span>🏋️</span>
                    <span style="font-size:0.75rem;color:var(--text-muted);">Sin imagen</span>
                  </div>
                `}
              </div>

              <!-- Weight counter -->
              <div class="tr-weight-row">
                <span class="tr-weight-label">⚖ Peso</span>
                <div class="tr-weight-ctrl">
                  <button class="tr-weight-btn minus" data-exidx="${gIdx}" data-dayid="${day.id}">−</button>
                  <span class="tr-weight-val" id="tr-w-${day.id}-${gIdx}">${weight > 0 ? weight + ' kg' : '— kg'}</span>
                  <button class="tr-weight-btn plus" data-exidx="${gIdx}" data-dayid="${day.id}">+</button>
                </div>
              </div>

              <!-- Series list -->
              <ul class="tr-sets-list">${setsList}</ul>

              <!-- Rest button -->
              <button class="tr-rest-btn" data-target="75">⏱ Descanso 60-90s</button>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="tr-group" data-dayidx="${dayIdx}" data-groupidx="${groupIdx}">
          <div class="tr-group-title" style="display:flex; justify-content:space-between; align-items:center;">
            <span>${group.name}</span>
            <button class="tr-add-ex-btn" data-dayidx="${dayIdx}" data-groupidx="${groupIdx}" style="background:transparent; border:none; color:var(--emerald); cursor:pointer; font-size:0.8rem; font-weight:600; display:flex; align-items:center; gap:4px; font-family:inherit; padding:4px 8px; border-radius:4px;">
              <span>+ Añadir</span>
            </button>
          </div>
          <div class="tr-group-exercises">
            ${exHtml}
          </div>
        </div>`;
    }).join('');

    return groupsHtml;
  };

  const getEditFormHtml = (dayIdx, groupIdx, localIdx, gIdx, ex) => {
    return `
      <div class="tr-ex-edit-form">
        <div style="font-weight:700;color:var(--emerald);font-size:0.9rem;margin-bottom:8px;">Editar Ejercicio</div>
        
        <div class="tr-edit-input-group">
          <label class="tr-edit-label">Nombre del Ejercicio</label>
          <input type="text" class="tr-edit-name-input tr-edit-input" value="${ex.name}">
        </div>
        
        <div class="tr-edit-row">
          <div class="tr-edit-input-group">
            <label class="tr-edit-label">Series</label>
            <input type="number" min="1" max="10" class="tr-edit-sets-input tr-edit-input" value="${ex.sets}">
          </div>
          
          <div class="tr-edit-input-group">
            <label class="tr-edit-label">Reps / Tiempo</label>
            <input type="text" class="tr-edit-reps-input tr-edit-input" value="${ex.reps}">
          </div>
        </div>

        <div class="tr-edit-input-group">
          <label class="tr-edit-label">Video de YouTube (Embed URL)</label>
          <input type="text" class="tr-edit-video-input tr-edit-input" value="${ex.video || ''}" placeholder="https://www.youtube.com/embed/...">
        </div>
        
        <div class="tr-edit-actions">
          <button class="tr-edit-delete-btn" data-dayidx="${dayIdx}" data-groupidx="${groupIdx}" data-localidx="${localIdx}">Eliminar</button>
          <div style="display:flex;gap:8px;">
            <button class="tr-edit-cancel-btn" data-dayidx="${dayIdx}" data-exidx="${gIdx}">Cancelar</button>
            <button class="tr-edit-save-btn" data-dayidx="${dayIdx}" data-groupidx="${groupIdx}" data-localidx="${localIdx}" data-exidx="${gIdx}">Guardar</button>
          </div>
        </div>
      </div>
    `;
  };

  /* ── PUBLIC API ── */
  return {
    render() {
      const today = new Date();
      _calYear  = today.getFullYear();
      _calMonth = today.getMonth();
      const activeDay = getActiveDay();
      const day = getDays()[activeDay];
      const CIRC = 2 * Math.PI * 30;

      const dayTabsHtml = getDays().map((d, i) => `
        <button class="tr-day-tab ${i === activeDay ? 'active' : ''}" data-dayidx="${i}">
          <span>${d.icon}</span>
          <span>${d.label}</span>
        </button>`).join('');

      return `
        <div class="section-content fade-in">
        <style>
          /* ── day tabs ── */
          .tr-day-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px;scrollbar-width:none;}
          .tr-day-tabs::-webkit-scrollbar{display:none;}
          .tr-day-tab{background:var(--bg-tertiary);border:1px solid var(--glass-border);color:var(--text-secondary);padding:6px 12px;border-radius:var(--radius-full);font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;gap:2px;font-family:inherit;min-width:60px;}
          .tr-day-tab:hover{background:rgba(0,230,118,0.1);color:var(--emerald);}
          .tr-day-tab.active{background:var(--emerald);color:#000;border-color:var(--emerald);box-shadow:0 0 16px var(--emerald-glow);}
          /* ── stats ── */
          .tr-stats-row{display:flex;justify-content:center;gap:28px;flex-wrap:wrap;}
          .tr-stat{display:flex;flex-direction:column;align-items:center;gap:2px;}
          .tr-stat-icon{font-size:1.4rem;}
          .tr-stat-val{font-size:1.4rem;font-weight:800;color:var(--emerald);text-shadow:0 0 12px var(--emerald-glow);}
          .tr-stat-lbl{font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;}
          /* ── rest timer ── */
          .tr-rest-widget{display:flex;align-items:center;gap:16px;background:var(--bg-tertiary);border:1px solid var(--glass-border);border-radius:14px;padding:12px 20px;margin-bottom:20px;flex-wrap:wrap;}
          .tr-rest-ring{flex-shrink:0;}
          .tr-rest-controls{display:flex;flex-direction:column;gap:6px;flex:1;}
          .tr-rest-btns{display:flex;gap:8px;flex-wrap:wrap;}
          .tr-rest-preset{background:var(--bg-tertiary);border:1px solid var(--glass-border);color:var(--text-secondary);padding:6px 14px;border-radius:var(--radius-full);font-size:0.8rem;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit;}
          .tr-rest-preset:hover{border-color:var(--emerald);color:var(--emerald);}
          .tr-rest-stop{background:rgba(255,23,68,0.15);border:1px solid var(--danger);color:var(--danger);padding:6px 14px;border-radius:var(--radius-full);font-size:0.8rem;font-weight:600;cursor:pointer;font-family:inherit;}
          /* ── day header ── */
          .tr-day-header{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
          .tr-day-icon{font-size:2.5rem;}
          .tr-day-title{font-size:1.4rem;font-weight:800;color:var(--emerald);}
          .tr-day-sub{font-size:0.8rem;color:var(--text-muted);margin-top:2px;}
          /* ── group ── */
          .tr-group{margin-bottom:24px;}
          .tr-group-title{font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--text-muted);margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--glass-border);}
          .tr-group-exercises{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
          @media(max-width:700px){.tr-group-exercises{grid-template-columns:1fr;}}
          /* ── exercise card ── */
          .tr-exercise-card{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:14px;overflow:hidden;transition:border-color 0.2s;}
          .tr-exercise-card.done{border-color:var(--emerald);box-shadow:0 0 16px var(--emerald-glow);}
          .tr-ex-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;cursor:pointer;gap:8px;}
          .tr-ex-name{font-weight:700;font-size:0.95rem;color:#fff;}
          .tr-ex-meta{font-size:0.78rem;color:var(--emerald);font-weight:600;white-space:nowrap;background:rgba(0,230,118,0.12);padding:3px 10px;border-radius:var(--radius-full);}
          .tr-ex-body{padding:0 18px 18px;display:flex;flex-direction:column;gap:14px;}
          /* ── video ── */
          .tr-video-wrap{}
          .tr-video-btn{display:flex;align-items:center;gap:8px;background:rgba(0,230,118,0.1);border:1px solid var(--emerald);color:var(--emerald);padding:8px 18px;border-radius:var(--radius-full);font-size:0.85rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;}
          /* ── exercise image ── */
          .tr-ex-img-wrap{width:100%;border-radius:10px;overflow:hidden;background:var(--bg-primary);min-height:160px;display:flex;align-items:center;justify-content:center;}
          .tr-ex-img{width:100%;height:180px;object-fit:cover;border-radius:10px;display:block;}
          .tr-ex-img-fallback{width:100%;height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-muted);font-size:2rem;}
          .tr-video-btn:hover{background:rgba(0,230,118,0.2);}
          .tr-video-play{font-size:1.1rem;}
          .tr-video-close{display:block;margin-top:8px;background:rgba(255,23,68,0.1);border:1px solid var(--danger);color:var(--danger);padding:6px 16px;border-radius:var(--radius-full);font-size:0.82rem;font-weight:600;cursor:pointer;font-family:inherit;}
          /* ── weight ── */
          .tr-weight-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}
          .tr-weight-label{font-size:0.8rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;}
          .tr-weight-ctrl{display:flex;align-items:center;gap:10px;background:var(--bg-primary);border:1px solid var(--glass-border);border-radius:var(--radius-full);padding:4px 6px;}
          .tr-weight-btn{width:32px;height:32px;border-radius:50%;border:none;font-size:1.2rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;display:flex;align-items:center;justify-content:center;}
          .tr-weight-btn.plus{background:var(--emerald);color:#000;}
          .tr-weight-btn.plus:hover{background:#00c853;}
          .tr-weight-btn.minus{background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--glass-border);}
          .tr-weight-btn.minus:hover{border-color:var(--danger);color:var(--danger);}
          .tr-weight-val{font-size:1rem;font-weight:700;min-width:60px;text-align:center;color:#fff;}
          /* ── sets list ── */
          .tr-sets-list{list-style:none;display:flex;flex-direction:column;gap:6px;}
          .tr-set-item{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px solid var(--glass-border);transition:all 0.2s;}
          .tr-set-item.done-set{background:rgba(0,230,118,0.1);border-color:var(--emerald);}
          .tr-set-num{font-size:0.8rem;color:var(--text-muted);font-weight:600;min-width:52px;}
          .tr-set-reps{flex:1;font-size:0.9rem;font-weight:600;color:#fff;}
          .tr-set-done-btn{width:28px;height:28px;border-radius:50%;border:1px solid var(--glass-border);background:transparent;color:var(--text-muted);font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;font-family:inherit;}
          .tr-set-item.done-set .tr-set-done-btn{background:var(--emerald);color:#000;border-color:var(--emerald);}
          .tr-set-done-btn:hover{border-color:var(--emerald);color:var(--emerald);}
          /* ── rest button ── */
          .tr-rest-btn{background:rgba(0,230,118,0.08);border:1px dashed var(--glass-border);color:var(--text-muted);padding:8px 18px;border-radius:var(--radius-full);font-size:0.82rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;align-self:flex-start;}
          .tr-rest-btn:hover{border-color:var(--emerald);color:var(--emerald);background:rgba(0,230,118,0.12);}
          /* ── toggle ── */
          .training-ring-pulse{animation:trPulse 1.5s ease-in-out infinite;}
          @keyframes trPulse{0%,100%{filter:drop-shadow(0 0 20px var(--emerald-glow))}50%{filter:drop-shadow(0 0 40px var(--emerald))}}
          /* ── layout ── */
          .tr-main-grid{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start;}
          @media(max-width:900px){.tr-main-grid{grid-template-columns:1fr;}}
          .tr-group-exercises{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
          @media(max-width:600px){.tr-group-exercises{grid-template-columns:1fr;}}
          /* ── calendar small ── */
          .tr-cal-small .calendar-grid{grid-template-columns:repeat(7,1fr);gap:2px;}
          .tr-cal-small .calendar-day{min-height:28px;font-size:0.7rem;border-radius:4px;padding:2px;}
          .tr-cal-small .calendar-day-header{font-size:0.62rem;padding:2px;}

          /* ── edit form ── */
          .tr-ex-edit-form{padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--bg-tertiary);border-radius:10px;margin-top:10px;}
          .tr-edit-input-group{display:flex;flex-direction:column;gap:4px;}
          .tr-edit-label{font-size:0.7rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}
          .tr-edit-input{background:var(--bg-primary);border:1px solid var(--glass-border);padding:8px 12px;border-radius:8px;color:#fff;font-family:inherit;font-size:0.9rem;width:100%;box-sizing:border-box;transition:border-color 0.2s;}
          .tr-edit-input:focus{border-color:var(--emerald);outline:none;}
          .tr-edit-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
          .tr-edit-actions{display:flex;justify-content:space-between;gap:8px;margin-top:6px;flex-wrap:wrap;}
          .tr-edit-delete-btn{background:rgba(255,23,68,0.15);border:1px solid var(--danger);color:var(--danger);padding:6px 14px;border-radius:var(--radius-full);font-size:0.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;}
          .tr-edit-delete-btn:hover{background:rgba(255,23,68,0.25);}
          .tr-edit-cancel-btn{background:var(--bg-primary);border:1px solid var(--glass-border);color:var(--text-secondary);padding:6px 14px;border-radius:var(--radius-full);font-size:0.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;}
          .tr-edit-cancel-btn:hover{border-color:var(--text-secondary);color:#fff;}
          .tr-edit-save-btn{background:var(--emerald);border:none;color:#000;padding:6px 14px;border-radius:var(--radius-full);font-size:0.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 0 10px var(--emerald-glow);}
          .tr-edit-save-btn:hover{box-shadow:0 0 16px var(--emerald);background:#00c853;}
        </style>

        <!-- Stats -->
        <div class="card fade-in" style="padding:16px 24px;margin-bottom:20px;">
          <div class="tr-stats-row" id="training-stats-inner"></div>
        </div>

        <!-- Day tabs -->
        <div class="tr-day-tabs" id="tr-day-tabs">${dayTabsHtml}</div>

        <!-- Rest timer widget -->
        <div class="tr-rest-widget">
          <div class="tr-rest-ring">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="30" fill="none" stroke="var(--bg-tertiary)" stroke-width="6"/>
              <circle id="rest-ring-fill" cx="40" cy="40" r="30" fill="none"
                stroke="var(--emerald)" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}"
                transform="rotate(-90 40 40)" style="transition:stroke-dashoffset 0.5s ease;"/>
              <text x="40" y="44" text-anchor="middle" fill="#fff" font-size="13" font-weight="700" font-family="inherit" id="rest-timer-display">00:00</text>
            </svg>
          </div>
          <div class="tr-rest-controls">
            <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);" id="rest-timer-label">Descanso entre series</div>
            <div class="tr-rest-btns">
              <button class="tr-rest-preset" data-secs="60">60s</button>
              <button class="tr-rest-preset" data-secs="75">75s</button>
              <button class="tr-rest-preset" data-secs="90">90s</button>
              <button class="tr-rest-preset" data-secs="120">2 min</button>
              <button class="tr-rest-stop">⏹ Detener</button>
            </div>
          </div>
        </div>

        <!-- Main content -->
        <div class="tr-main-grid">

          <!-- Left: workout -->
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="card fade-in" style="padding:24px;">
              ${(activeDay === 5 || activeDay === 6) ? `
                <div style="display:flex;align-items:center;gap:12px;background:rgba(0,230,118,0.08);border:1px dashed var(--emerald);border-radius:12px;padding:16px;margin-bottom:20px;">
                  <span style="font-size:24px;">🛋️</span>
                  <div>
                    <div style="font-weight:700;color:var(--emerald);">Día de Descanso</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);">Estiramientos y recuperación activa. ¡Recarga energías!</div>
                  </div>
                </div>
              ` : ''}
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="font-size:2.5rem;">${day.icon}</div>
                  <div>
                    <div class="tr-day-title">${day.title}</div>
                    <div class="tr-day-sub">60 min · Descanso 60-90s entre series</div>
                  </div>
                </div>
                <button id="tr-reset-day-btn" class="btn btn-ghost text-xs" data-dayidx="${activeDay}" style="color:var(--text-muted); border:1px solid var(--glass-border); border-radius:var(--radius-full); padding:6px 12px; font-weight:600; cursor:pointer; font-family:inherit;">
                  Restablecer
                </button>
              </div>
              <div id="tr-workout-body">
                ${renderDayWorkout(activeDay)}
              </div>
            </div>

            <!-- Toggle sesión completada -->
            <div class="card fade-in" style="text-align:center;padding:20px;display:flex;flex-direction:column;align-items:center;gap:8px;">
              <span id="training-toggle-label" class="text-xs font-semibold" style="letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);">
                ${_completed ? '¡TERMINADA!' : 'SESIÓN TERMINADA'}
              </span>
              <div class="toggle-container toggle-lg" id="training-toggle-container" style="cursor:pointer;">
                <div id="training-toggle-track" class="toggle-track${_completed ? ' active' : ''}"
                  style="${_completed ? 'background:var(--emerald);box-shadow:0 0 20px var(--emerald-glow);' : ''}">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: calendar (compact) -->
          <div class="card fade-in tr-cal-small" style="padding:16px;position:sticky;top:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <button id="training-cal-prev" class="btn btn-icon btn-ghost" style="font-size:14px;padding:4px;">‹</button>
              <h3 id="training-cal-title" style="font-size:0.8rem;font-weight:700;color:var(--emerald);"></h3>
              <button id="training-cal-next" class="btn btn-icon btn-ghost" style="font-size:14px;padding:4px;">›</button>
            </div>
            <div class="calendar-grid" style="margin-bottom:3px;">
              <div class="calendar-day-header">L</div><div class="calendar-day-header">M</div><div class="calendar-day-header">X</div>
              <div class="calendar-day-header">J</div><div class="calendar-day-header">V</div><div class="calendar-day-header">S</div><div class="calendar-day-header">D</div>
            </div>
            <div id="training-cal-grid" class="calendar-grid"></div>
          </div>

        </div>
        </div>`;
    },

    init() {
      _listeners = [];

      /* check today's log */
      const todayStr = Store.today();
      const log = Store.training.getLog(todayStr);
      _completed = !!(log && log.completed);

      /* stats & calendar */
      renderStatsInner();
      renderCalendarGrid();

      /* calendar nav */
      on('training-cal-prev', 'click', () => {
        if (_calMonth <= MONTH_MIN && _calYear === 2026) return;
        _calMonth--;
        if (_calMonth < 0) { _calMonth = 11; _calYear--; }
        renderCalendarGrid();
      });
      on('training-cal-next', 'click', () => {
        if (_calMonth >= MONTH_MAX && _calYear === 2026) return;
        _calMonth++;
        if (_calMonth > 11) { _calMonth = 0; _calYear++; }
        renderCalendarGrid();
      });

      /* toggle completed */
      on('training-toggle-container', 'click', () => {
        _completed = !_completed;
        const todayStr = Store.today();
        Store.training.saveLog(todayStr, { completed: _completed, durationSeconds: 3600, routine: getDays()[getActiveDay()].title });
        const track = document.getElementById('training-toggle-track');
        const label = document.getElementById('training-toggle-label');
        if (track) {
          track.classList.toggle('active', _completed);
          track.style.background = _completed ? 'var(--emerald)' : '';
          track.style.boxShadow  = _completed ? '0 0 20px var(--emerald-glow)' : '';
        }
        if (label) label.textContent = _completed ? '¡TERMINADA!' : 'SESIÓN TERMINADA';
        renderStatsInner();
        renderCalendarGrid();
      });

      /* day tabs */
      onAll('.tr-day-tab', 'click', (e) => {
        const btn = e.currentTarget;
        const idx = parseInt(btn.dataset.dayidx, 10);
        setActiveDay(idx);
        const container = document.getElementById('section-training');
        if (container) {
          this.destroy();
          container.innerHTML = this.render();
          this.init();
        }
      });

      /* rest timer presets */
      onAll('.tr-rest-preset', 'click', (e) => {
        const secs = parseInt(e.currentTarget.dataset.secs, 10);
        startRestTimer(secs);
      });
      on('', 'click', () => {}); // placeholder
      document.querySelectorAll('.tr-rest-stop').forEach(btn => {
        btn.addEventListener('click', stopRestTimer);
        _listeners.push({ el: btn, evt: 'click', fn: stopRestTimer });
      });

      this._bindExerciseEvents();
    },

    _bindExerciseEvents() {
      /* weight buttons */
      document.querySelectorAll('.tr-weight-btn').forEach(btn => {
        const handler = () => {
          const dayId  = btn.dataset.dayid;
          const exIdx  = parseInt(btn.dataset.exidx, 10);
          const isPlus = btn.classList.contains('plus');
          let w = getWeight(dayId, exIdx);
          const step = w < 10 ? 0.5 : 1;
          w = isPlus ? w + step : Math.max(0, w - step);
          w = Math.round(w * 2) / 2;
          saveWeight(dayId, exIdx, w);
          const el = document.getElementById(`tr-w-${dayId}-${exIdx}`);
          if (el) el.textContent = w > 0 ? `${w} kg` : '— kg';
        };
        btn.addEventListener('click', handler);
        _listeners.push({ el: btn, evt: 'click', fn: handler });
      });

      /* set done buttons */
      document.querySelectorAll('.tr-set-done-btn').forEach(btn => {
        const handler = () => {
          const li = btn.closest('.tr-set-item');
          if (li) {
            li.classList.toggle('done-set');
            btn.textContent = li.classList.contains('done-set') ? '✓' : '✓';
          }
          /* check if all sets done for this exercise */
          const card = btn.closest('.tr-exercise-card');
          if (card) {
            const allSets  = card.querySelectorAll('.tr-set-item');
            const doneSets = card.querySelectorAll('.tr-set-item.done-set');
            card.classList.toggle('done', allSets.length === doneSets.length && allSets.length > 0);
          }
        };
        btn.addEventListener('click', handler);
        _listeners.push({ el: btn, evt: 'click', fn: handler });
      });

      /* rest buttons inside exercise cards */
      document.querySelectorAll('.tr-rest-btn').forEach(btn => {
        const handler = () => {
          const secs = parseInt(btn.dataset.target || '75', 10);
          startRestTimer(secs);
          /* scroll to rest widget */
          const widget = document.querySelector('.tr-rest-widget');
          if (widget) widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        btn.addEventListener('click', handler);
        _listeners.push({ el: btn, evt: 'click', fn: handler });
      });

      /* video toggle buttons */
      document.querySelectorAll('.tr-video-btn').forEach(btn => {
        const handler = () => {
          const exId  = btn.dataset.exid;
          const src   = btn.dataset.src;
          const frame = document.getElementById(`tr-vid-${exId}`);
          if (!frame) return;
          const isOpen = frame.style.display !== 'none';
          if (isOpen) {
            frame.style.display = 'none';
            const iframe = frame.querySelector('iframe');
            if (iframe) iframe.src = '';
            btn.innerHTML = '<span class="tr-video-play">▶</span><span>Ver video</span>';
          } else {
            frame.style.display = 'block';
            const iframe = frame.querySelector('iframe');
            if (iframe) iframe.src = src;
            btn.innerHTML = '<span class="tr-video-play">⏸</span><span>Ocultar video</span>';
          }
        };
        btn.addEventListener('click', handler);
        _listeners.push({ el: btn, evt: 'click', fn: handler });
      });

      /* video close buttons */
      document.querySelectorAll('.tr-video-close').forEach(btn => {
        const handler = () => {
          const exId  = btn.dataset.exid;
          const frame = document.getElementById(`tr-vid-${exId}`);
          if (frame) {
            frame.style.display = 'none';
            const iframe = frame.querySelector('iframe');
            if (iframe) iframe.src = '';
          }
          const openBtn = document.querySelector(`.tr-video-btn[data-exid="${exId}"]`);
          if (openBtn) openBtn.innerHTML = '<span class="tr-video-play">▶</span><span>Ver video</span>';
        };
        btn.addEventListener('click', handler);
        _listeners.push({ el: btn, evt: 'click', fn: handler });
      });

      /* edit buttons */
      document.querySelectorAll('.tr-edit-btn').forEach(btn => {
        const handler = (e) => {
          e.stopPropagation();
          const dayIdx = parseInt(btn.dataset.dayidx, 10);
          const groupIdx = parseInt(btn.dataset.groupidx, 10);
          const localIdx = parseInt(btn.dataset.localidx, 10);
          const gIdx = parseInt(btn.dataset.exidx, 10);
          const card = document.getElementById(`tr-ex-${getDays()[dayIdx].id}-${gIdx}`);
          if (!card) return;

          const ex = getDays()[dayIdx].groups[groupIdx].exercises[localIdx];
          card.innerHTML = getEditFormHtml(dayIdx, groupIdx, localIdx, gIdx, ex);

          // Bind form-specific events
          const cancelBtn = card.querySelector('.tr-edit-cancel-btn');
          if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
              const container = document.getElementById('section-training');
              if (container) {
                this.destroy();
                container.innerHTML = this.render();
                this.init();
              }
            });
          }

          const saveBtn = card.querySelector('.tr-edit-save-btn');
          if (saveBtn) {
            saveBtn.addEventListener('click', () => {
              const nameInput = card.querySelector('.tr-edit-name-input');
              const setsInput = card.querySelector('.tr-edit-sets-input');
              const repsInput = card.querySelector('.tr-edit-reps-input');
              const videoInput = card.querySelector('.tr-edit-video-input');

              if (nameInput && nameInput.value.trim()) {
                const days = getDays();
                const targetEx = days[dayIdx].groups[groupIdx].exercises[localIdx];
                targetEx.name = nameInput.value.trim();
                targetEx.sets = Math.max(1, parseInt(setsInput.value, 10) || 1);
                targetEx.reps = repsInput.value.trim() || '12 reps';
                targetEx.video = videoInput.value.trim() || 'https://www.youtube.com/embed/Ukj3sGMGEHE';
                saveDays();

                // Re-render
                const container = document.getElementById('section-training');
                if (container) {
                  this.destroy();
                  container.innerHTML = this.render();
                  this.init();
                }
              }
            });
          }

          const deleteBtn = card.querySelector('.tr-edit-delete-btn');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
              if (confirm('¿Seguro que querés eliminar este ejercicio?')) {
                const days = getDays();
                days[dayIdx].groups[groupIdx].exercises.splice(localIdx, 1);
                saveDays();

                // Re-render
                const container = document.getElementById('section-training');
                if (container) {
                  this.destroy();
                  container.innerHTML = this.render();
                  this.init();
                }
              }
            });
          }
        };
        btn.addEventListener('click', handler);
        _listeners.push({ el: btn, evt: 'click', fn: handler });
      });

      /* add exercise buttons */
      document.querySelectorAll('.tr-add-ex-btn').forEach(btn => {
        const handler = (e) => {
          e.stopPropagation();
          const dayIdx = parseInt(btn.dataset.dayidx, 10);
          const groupIdx = parseInt(btn.dataset.groupidx, 10);
          const days = getDays();
          days[dayIdx].groups[groupIdx].exercises.push({
            name: 'Nuevo Ejercicio',
            sets: 3,
            reps: '12 reps',
            video: 'https://www.youtube.com/embed/Ukj3sGMGEHE'
          });
          saveDays();

          // Re-render
          const container = document.getElementById('section-training');
          if (container) {
            this.destroy();
            container.innerHTML = this.render();
            this.init();
            
            // Automatically find and put the newly added exercise in edit mode
            // It will be the last exercise inside the specific group
            const groupEl = container.querySelector(`.tr-group[data-dayidx="${dayIdx}"][data-groupidx="${groupIdx}"]`);
            if (groupEl) {
              const cards = groupEl.querySelectorAll('.tr-exercise-card');
              if (cards.length > 0) {
                const lastCard = cards[cards.length - 1];
                const editBtn = lastCard.querySelector('.tr-edit-btn');
                if (editBtn) editBtn.click();
              }
            }
          }
        };
        btn.addEventListener('click', handler);
        _listeners.push({ el: btn, evt: 'click', fn: handler });
      });

      /* reset day button */
      const resetBtn = document.getElementById('tr-reset-day-btn');
      if (resetBtn) {
        const handler = () => {
          const dayIdx = parseInt(resetBtn.dataset.dayidx, 10);
          if (confirm('¿Seguro que querés restablecer la rutina de este día a su estado original? Se perderán tus cambios personalizados.')) {
            const days = getDays();
            days[dayIdx] = JSON.parse(JSON.stringify(DAYS[dayIdx]));
            saveDays();

            // Re-render
            const container = document.getElementById('section-training');
            if (container) {
              this.destroy();
              container.innerHTML = this.render();
              this.init();
            }
          }
        };
        resetBtn.addEventListener('click', handler);
        _listeners.push({ el: resetBtn, evt: 'click', fn: handler });
      }
    },

    destroy() {
      _listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
      _listeners = [];
      clearTimeout(_debounceTimer);
      clearInterval(_restInterval);
      const tt = document.getElementById('training-tooltip');
      if (tt) tt.remove();
    }
  };
})();
