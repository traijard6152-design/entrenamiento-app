const App = {
  currentSection: null,
  sections: {},

  init() {
    this.sections = {
      training: window.TrainingSection,
      languages: window.LanguagesSection,
      finances: window.FinancesSection,
      university: window.UniversitySection,
      analytics: window.AnalyticsSection
    };

    this.setupNav();
    this.setupSettings();
    this.updateSidebarDate();
    this.navigateTo('training');
    this.registerSW();
  },

  navigateTo(sectionName) {
    if (this.currentSection && this.sections[this.currentSection]) {
      const prev = this.sections[this.currentSection];
      if (typeof prev.destroy === 'function') {
        prev.destroy();
      }
    }

    document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const container = document.getElementById(`section-${sectionName}`);
    const section = this.sections[sectionName];

    if (container && section) {
      container.innerHTML = section.render();
      container.classList.add('active');
      requestAnimationFrame(() => {
        if (typeof section.init === 'function') {
          section.init();
        }
      });
    }

    document.querySelectorAll(`.nav-item[data-section="${sectionName}"]`).forEach(n => {
      n.classList.add('active');
    });

    this.currentSection = sectionName;
  },

  setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        if (section && section !== this.currentSection) {
          this.navigateTo(section);
        }
      });
    });
  },

  setupSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('settings-close-btn');
    const modal = document.getElementById('settings-modal');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeSettings());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeSettings();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    if (importBtn) {
      importBtn.addEventListener('click', () => {
        if (importFile) importFile.click();
      });
    }

    if (importFile) {
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.importData(file);
        importFile.value = '';
      });
    }

    const catAddBtn = document.getElementById('cat-add-btn');
    if (catAddBtn) {
      catAddBtn.addEventListener('click', () => this.addCategory());
    }
  },

  openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.renderCategoryManager();
    }
  },

  closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  exportData() {
    const jsonData = Store.exportAllData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = Store.today();
    a.href = url;
    a.download = `domina2026_backup_${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const success = Store.importAllData(e.target.result);
      if (success) {
        window.location.reload();
      } else {
        alert('Error al importar datos. Verificá que el archivo sea válido.');
      }
    };
    reader.readAsText(file);
  },

  renderCategoryManager() {
    const listEl = document.getElementById('category-list');
    if (!listEl) return;

    const categories = Store.finances.getCategories();
    listEl.innerHTML = categories.map(cat => `
      <div class="category-item" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:var(--radius-md);background:var(--bg-tertiary);margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.25rem;">${cat.emoji}</span>
          <span class="font-medium">${cat.name}</span>
          <span style="width:14px;height:14px;border-radius:50%;background:${cat.color};display:inline-block;"></span>
        </div>
        <button class="btn btn-icon btn-ghost cat-delete-btn" data-cat="${cat.name}" style="width:32px;height:32px;color:var(--danger);font-size:1.1rem;" aria-label="Eliminar ${cat.name}">×</button>
      </div>
    `).join('');

    listEl.querySelectorAll('.cat-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-cat');
        if (name) {
          Store.finances.removeCategory(name);
          this.renderCategoryManager();
        }
      });
    });
  },

  addCategory() {
    const nameInput = document.getElementById('cat-name-input');
    const emojiInput = document.getElementById('cat-emoji-input');
    const colorInput = document.getElementById('cat-color-input');

    if (!nameInput || !nameInput.value.trim()) return;

    const added = Store.finances.addCategory({
      name: nameInput.value.trim(),
      emoji: emojiInput ? emojiInput.value.trim() || '📌' : '📌',
      color: colorInput ? colorInput.value : '#888888'
    });

    if (added) {
      nameInput.value = '';
      if (emojiInput) emojiInput.value = '';
      if (colorInput) colorInput.value = '#00e676';
      this.renderCategoryManager();
    }
  },

  updateSidebarDate() {
    const el = document.getElementById('sidebar-date');
    if (el) {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      el.textContent = now.toLocaleDateString('es-PY', options);
    }
  },

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW registration failed:', err));
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Try to lock orientation to portrait
  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait').catch(err => console.log('Orientation lock failed:', err));
    }
  } catch (e) {}

  // Initialize storage first
  App.init();
});
