/* ================================================================
   UNIVERSITY SECTION — Universidad
   Color theme: VIOLET (#d500f9)
   Goal: Track subjects, missing notes, and graduation countdown
   ================================================================ */
window.UniversitySection = (() => {
  let _listeners = [];
  let _animFrame = null;

  /* ── helpers ── */
  const on = (id, evt, fn) => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener(evt, fn); _listeners.push({ el, evt, fn }); }
  };

  const getDaysRemaining = () => {
    const data = Store.university.initCountdown();
    const targetDate = new Date(data.targetDate);
    const now = new Date();
    // Reset time to ignore hours/mins difference
    targetDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  /* ── render helpers ── */
  const renderCountdown = () => {
    const days = getDaysRemaining();
    
    return `
      <div class="card fade-in" style="text-align:center; padding:32px 24px; position:relative; overflow:hidden;">
        <div style="position:absolute; top:-50px; left:50%; transform:translateX(-50%); width:200px; height:200px; background:var(--violet); filter:blur(100px); opacity:0.15; border-radius:50%; pointer-events:none;"></div>
        
        <div style="font-size:3rem; margin-bottom:12px;">🎓</div>
        <h2 class="text-sm font-semibold text-muted mb-2" style="letter-spacing:2px; text-transform:uppercase;">Días para graduación</h2>
        
        <div id="uni-countdown-number" style="font-size:5rem; font-weight:900; line-height:1; color:var(--violet); text-shadow:0 0 30px var(--violet-glow); font-variant-numeric:tabular-nums; letter-spacing:-2px;">
          ${days}
        </div>
        
        <div class="progress-bar progress-bar-lg mt-5" style="max-width:300px; margin-left:auto; margin-right:auto;">
          <!-- Assuming a generic 5 year degree is ~1825 days, progress is based on 1719 days remaining initially -->
          <div class="progress-fill" style="background:linear-gradient(90deg, var(--violet-dim), var(--violet)); box-shadow:0 0 12px var(--violet-glow); width:${Math.min(100, Math.max(0, 100 - (days / 1719 * 100)))}%;"></div>
        </div>
      </div>
    `;
  };

  const renderSubject = (subject) => {
    const notesHtml = subject.notes.length === 0 ? 
      `<div class="text-xs text-muted" style="font-style:italic; padding:8px 0;">No hay faltantes registrados.</div>` :
      subject.notes.map(note => `
        <div class="uni-note-item" style="display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
          <div class="uni-note-checkbox ${note.done ? 'done' : ''}" data-subid="${subject.id}" data-noteid="${note.id}" style="width:20px; height:20px; border-radius:6px; border:2px solid var(--violet); cursor:pointer; flex-shrink:0; display:grid; place-items:center; transition:all 0.2s;">
            ${note.done ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
          </div>
          <div style="flex:1; font-size:0.9rem; line-height:1.4; color:${note.done ? 'var(--text-muted)' : 'var(--text-primary)'}; text-decoration:${note.done ? 'line-through' : 'none'}; transition:all 0.2s;">
            ${note.text}
          </div>
          <button class="uni-note-delete-btn" data-subid="${subject.id}" data-noteid="${note.id}" style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem; opacity:0.6; padding:0 4px;">×</button>
        </div>
      `).join('');

    return `
      <div class="card slide-up" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 class="font-bold text-lg" style="color:var(--text-primary); display:flex; align-items:center; gap:8px;">
            <span style="color:var(--violet);">📚</span> ${subject.name}
          </h3>
          <button class="uni-sub-delete-btn btn btn-icon-sm" data-subid="${subject.id}" style="color:var(--danger); background:rgba(255,23,68,0.1);">×</button>
        </div>
        
        <div class="uni-notes-list" style="margin-bottom:16px; max-height:200px; overflow-y:auto; padding-right:4px;">
          ${notesHtml}
        </div>
        
        <div style="display:flex; gap:8px;">
          <input type="text" class="input-field input-field-sm uni-note-input" data-subid="${subject.id}" placeholder="¿Qué te falta?" style="flex:1;">
          <button class="btn btn-sm btn-violet uni-note-add-btn" data-subid="${subject.id}">Añadir</button>
        </div>
      </div>
    `;
  };

  const renderSubjectsGrid = () => {
    const data = Store.university.getData();
    if (data.subjects.length === 0) {
      return `
        <div class="card fade-in" style="text-align:center; padding:48px 24px; border:1px dashed var(--glass-border);">
          <div style="font-size:3rem; margin-bottom:16px; opacity:0.5;">📝</div>
          <h3 class="text-lg font-semibold text-muted">Aún no hay materias</h3>
          <p class="text-sm text-muted mt-2">Añade tus materias para llevar un registro de lo que te falta hacer en cada una.</p>
        </div>
      `;
    }
    
    return `
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">
        ${data.subjects.map(s => renderSubject(s)).join('')}
      </div>
    `;
  };

  const reRenderSubjects = () => {
    const container = document.getElementById('uni-subjects-container');
    if (container) {
      container.innerHTML = renderSubjectsGrid();
      attachSubjectEvents();
    }
  };

  const attachSubjectEvents = () => {
    // Add note
    document.querySelectorAll('.uni-note-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const subId = e.currentTarget.dataset.subid;
        const input = document.querySelector(`.uni-note-input[data-subid="${subId}"]`);
        if (input && input.value.trim()) {
          Store.university.addNote(subId, input.value.trim());
          reRenderSubjects();
        }
      });
    });

    // Add note via Enter key
    document.querySelectorAll('.uni-note-input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const subId = e.currentTarget.dataset.subid;
          if (input.value.trim()) {
            Store.university.addNote(subId, input.value.trim());
            reRenderSubjects();
          }
        }
      });
    });

    // Delete note
    document.querySelectorAll('.uni-note-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const subId = e.currentTarget.dataset.subid;
        const noteId = e.currentTarget.dataset.noteid;
        Store.university.deleteNote(subId, noteId);
        reRenderSubjects();
      });
    });

    // Toggle note
    document.querySelectorAll('.uni-note-checkbox').forEach(box => {
      box.addEventListener('click', (e) => {
        const subId = e.currentTarget.dataset.subid;
        const noteId = e.currentTarget.dataset.noteid;
        Store.university.toggleNote(subId, noteId);
        reRenderSubjects();
      });
    });

    // Delete subject
    document.querySelectorAll('.uni-sub-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm('¿Seguro que deseas eliminar esta materia y todas sus notas?')) {
          const subId = e.currentTarget.dataset.subid;
          Store.university.deleteSubject(subId);
          reRenderSubjects();
        }
      });
    });
  };

  /* ── PUBLIC API ── */
  return {
    render() {
      return `
        <div class="section-content fade-in">
          <style>
            .uni-note-checkbox.done {
              background: var(--violet);
              box-shadow: 0 0 10px var(--violet-glow);
            }
            .uni-note-delete-btn:hover {
              opacity: 1 !important;
            }
            .uni-notes-list::-webkit-scrollbar {
              width: 4px;
            }
            .uni-notes-list::-webkit-scrollbar-track {
              background: transparent;
            }
            .uni-notes-list::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.1);
              border-radius: 4px;
            }
            .uni-sub-delete-btn {
              transition: all 0.2s;
            }
            .uni-sub-delete-btn:hover {
              background: var(--danger) !important;
              color: white !important;
              box-shadow: 0 0 15px var(--danger-glow);
            }
          </style>

          <div style="display:flex; flex-direction:column; gap:24px;">
            ${renderCountdown()}
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
              <h2 class="text-xl font-bold" style="color:var(--text-primary); text-transform:uppercase; letter-spacing:1px;">Mis Materias</h2>
            </div>
            
            <div class="card" style="padding:20px; border-color:rgba(213,0,249,0.3);">
              <h3 class="text-sm font-semibold mb-3" style="color:var(--violet);">Añadir nueva materia</h3>
              <div style="display:flex; gap:12px;">
                <input type="text" id="uni-new-sub-input" class="input-field" placeholder="Nombre de la materia (ej. Análisis Matemático)" style="flex:1;">
                <button id="uni-new-sub-btn" class="btn btn-violet" style="white-space:nowrap; padding-left:32px; padding-right:32px;">+ Agregar</button>
              </div>
            </div>

            <div id="uni-subjects-container">
              ${renderSubjectsGrid()}
            </div>
          </div>
        </div>
      `;
    },

    init() {
      _listeners = [];
      
      Store.university.initCountdown();

      attachSubjectEvents();

      const newSubBtn = document.getElementById('uni-new-sub-btn');
      const newSubInput = document.getElementById('uni-new-sub-input');

      const addSubject = () => {
        const val = newSubInput.value.trim();
        if (val) {
          Store.university.addSubject(val);
          newSubInput.value = '';
          reRenderSubjects();
        }
      };

      if (newSubBtn) {
        newSubBtn.addEventListener('click', addSubject);
        _listeners.push({ el: newSubBtn, evt: 'click', fn: addSubject });
      }

      if (newSubInput) {
        const handler = (e) => { if (e.key === 'Enter') addSubject(); };
        newSubInput.addEventListener('keypress', handler);
        _listeners.push({ el: newSubInput, evt: 'keypress', fn: handler });
      }
    },

    destroy() {
      _listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn));
      _listeners = [];
    }
  };
})();
