window.Store = {
  PREFIX: 'domina2026_',

  _get(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Store._get error:', key, e);
      return null;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Store._set error:', key, e);
    }
  },

  getDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  today() {
    return this.getDateStr(new Date());
  },

  formatCurrency(amount) {
    const num = Math.round(Number(amount) || 0);
    const isNegative = num < 0;
    const absStr = Math.abs(num).toString();
    let formatted = '';
    let count = 0;
    for (let i = absStr.length - 1; i >= 0; i--) {
      if (count > 0 && count % 3 === 0) {
        formatted = '.' + formatted;
      }
      formatted = absStr[i] + formatted;
      count++;
    }
    return (isNegative ? '-' : '') + '₲' + formatted;
  },

  training: {
    _key(dateStr) { return 'training_' + dateStr; },

    getLog(dateStr) {
      return window.Store._get(this._key(dateStr));
    },

    saveLog(dateStr, data) {
      window.Store._set(this._key(dateStr), {
        completed: !!data.completed,
        durationSeconds: Number(data.durationSeconds) || 0,
        routine: data.routine || ''
      });
    },

    getMonthLogs(year, month) {
      const logs = {};
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = window.Store.getDateStr(new Date(year, month, d));
        const log = this.getLog(dateStr);
        if (log) {
          logs[dateStr] = log;
        }
      }
      return logs;
    },

    getStreak() {
      let current = 0;
      let max = 0;
      let tempStreak = 0;

      const today = new Date();
      const todayStr = window.Store.getDateStr(today);
      const todayLog = this.getLog(todayStr);
      const dayOfWeek = today.getDay();

      let checkDate = new Date(today);

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
          checkDate.setDate(checkDate.getDate() - 1);
        }
      } else {
        if (!todayLog || !todayLog.completed) {
          checkDate.setDate(checkDate.getDate() - 1);
          while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }
      }

      for (let i = 0; i < 365; i++) {
        const dow = checkDate.getDay();
        if (dow === 0 || dow === 6) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        const ds = window.Store.getDateStr(checkDate);
        const log = this.getLog(ds);
        if (log && log.completed) {
          tempStreak++;
        } else {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }
      current = tempStreak;

      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(window.Store.PREFIX + 'training_')) {
          allKeys.push(k.replace(window.Store.PREFIX + 'training_', ''));
        }
      }
      allKeys.sort();

      let runStreak = 0;
      for (let i = 0; i < allKeys.length; i++) {
        const log = this.getLog(allKeys[i]);
        const d = new Date(allKeys[i] + 'T12:00:00');
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue;
        if (log && log.completed) {
          runStreak++;
          if (runStreak > max) max = runStreak;
        } else {
          runStreak = 0;
        }
      }

      if (current > max) max = current;

      return { current, max };
    }
  },

  languages: {
    _key(dateStr) { return 'languages_' + dateStr; },

    getLog(dateStr) {
      return window.Store._get(this._key(dateStr));
    },

    saveLog(dateStr, data) {
      window.Store._set(this._key(dateStr), {
        minutes: Number(data.minutes) || 0,
        completed: !!data.completed
      });
    },

    getMonthLogs(year, month) {
      const logs = {};
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = window.Store.getDateStr(new Date(year, month, d));
        const log = this.getLog(dateStr);
        if (log) {
          logs[dateStr] = log;
        }
      }
      return logs;
    },

    getStreak() {
      let current = 0;
      let max = 0;

      const today = new Date();
      const todayStr = window.Store.getDateStr(today);
      const todayLog = this.getLog(todayStr);

      let checkDate = new Date(today);
      if (!todayLog || !todayLog.completed) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      let tempStreak = 0;
      for (let i = 0; i < 365; i++) {
        const ds = window.Store.getDateStr(checkDate);
        const log = this.getLog(ds);
        if (log && log.completed) {
          tempStreak++;
        } else {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }
      current = tempStreak;

      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(window.Store.PREFIX + 'languages_')) {
          allKeys.push(k.replace(window.Store.PREFIX + 'languages_', ''));
        }
      }
      allKeys.sort();

      let runStreak = 0;
      for (let i = 0; i < allKeys.length; i++) {
        const log = this.getLog(allKeys[i]);
        if (log && log.completed) {
          runStreak++;
          if (runStreak > max) max = runStreak;
        } else {
          runStreak = 0;
        }
      }

      if (current > max) max = current;

      return { current, max };
    }
  },

  finances: {
    _txKey: 'finance_transactions',
    _goalKey: 'finance_savings_goal',
    _catKey: 'finance_categories',
    _creditKey: 'finance_credits',

    _defaultCategories: [
      { name: 'Comida', emoji: '🍔', color: '#ff6b6b' },
      { name: 'Negocio', emoji: '💼', color: '#ffd93d' },
      { name: 'Transporte', emoji: '🚗', color: '#6bcb77' },
      { name: 'Vivienda', emoji: '🏠', color: '#4d96ff' },
      { name: 'Entretenimiento', emoji: '🎮', color: '#ff6b9d' },
      { name: 'Servicios', emoji: '📱', color: '#c77dff' },
      { name: 'Salud', emoji: '💊', color: '#00e676' },
      { name: 'Educación', emoji: '📚', color: '#00b0ff' }
    ],

    _generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    addCredit(data) {
      const credits = window.Store._get(this._creditKey) || [];
      const c = {
        id: this._generateId(),
        description: data.description || '',
        installment: data.installment || '',
        amount: Math.abs(Number(data.amount) || 0),
        paymentDate: data.paymentDate || '',
        createdAt: new Date().toISOString()
      };
      credits.push(c);
      window.Store._set(this._creditKey, credits);
      return c;
    },

    deleteCredit(id) {
      let credits = window.Store._get(this._creditKey) || [];
      credits = credits.filter(c => c.id !== id);
      window.Store._set(this._creditKey, credits);
    },

    updateCredit(id, data) {
      let credits = window.Store._get(this._creditKey) || [];
      const index = credits.findIndex(c => c.id === id);
      if (index !== -1) {
        credits[index] = {
          ...credits[index],
          description: data.description !== undefined ? data.description : credits[index].description,
          installment: data.installment !== undefined ? data.installment : credits[index].installment,
          amount: data.amount !== undefined ? Math.abs(Number(data.amount) || 0) : credits[index].amount,
          paymentDate: data.paymentDate !== undefined ? data.paymentDate : credits[index].paymentDate
        };
        window.Store._set(this._creditKey, credits);
        return credits[index];
      }
      return null;
    },

    getCredits() {
      const credits = window.Store._get(this._creditKey) || [];
      return credits.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    addTransaction(data) {
      const transactions = window.Store._get(this._txKey) || [];
      const tx = {
        id: this._generateId(),
        type: data.type,
        amount: Math.abs(Number(data.amount) || 0),
        category: data.category || '',
        description: data.description || '',
        date: data.date || window.Store.today(),
        createdAt: new Date().toISOString()
      };
      transactions.push(tx);
      window.Store._set(this._txKey, transactions);
      return tx;
    },

    deleteTransaction(id) {
      let transactions = window.Store._get(this._txKey) || [];
      transactions = transactions.filter(t => t.id !== id);
      window.Store._set(this._txKey, transactions);
    },

    updateTransaction(id, data) {
      let transactions = window.Store._get(this._txKey) || [];
      const index = transactions.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions[index] = {
          ...transactions[index],
          type: data.type !== undefined ? data.type : transactions[index].type,
          amount: data.amount !== undefined ? Math.abs(Number(data.amount) || 0) : transactions[index].amount,
          category: data.category !== undefined ? data.category : transactions[index].category,
          description: data.description !== undefined ? data.description : transactions[index].description,
          date: data.date !== undefined ? data.date : transactions[index].date
        };
        window.Store._set(this._txKey, transactions);
        return transactions[index];
      }
      return null;
    },

    getTransactions(filters = {}) {
      let transactions = window.Store._get(this._txKey) || [];

      if (filters.type) {
        transactions = transactions.filter(t => t.type === filters.type);
      }
      if (filters.category) {
        transactions = transactions.filter(t => t.category === filters.category);
      }
      if (filters.year !== undefined) {
        transactions = transactions.filter(t => {
          const d = new Date(t.date + 'T12:00:00');
          return d.getFullYear() === filters.year;
        });
      }
      if (filters.month !== undefined) {
        transactions = transactions.filter(t => {
          const d = new Date(t.date + 'T12:00:00');
          return d.getMonth() === filters.month;
        });
      }

      transactions.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      return transactions;
    },

    getBalance() {
      const all = window.Store._get(this._txKey) || [];
      const credits = window.Store._get(this._creditKey) || [];
      let balance = 0;
      for (const tx of all) {
        if (tx.type === 'income') {
          balance += tx.amount;
        } else {
          balance -= tx.amount;
        }
      }
      for (const c of credits) {
        balance -= c.amount;
      }
      return balance;
    },

    getSavingsGoal() {
      return window.Store._get(this._goalKey) || 3000000;
    },

    setSavingsGoal(amount) {
      window.Store._set(this._goalKey, Number(amount) || 0);
    },

    getTotalSaved() {
      return Math.max(0, this.getBalance());
    },

    getCategories() {
      return window.Store._get(this._catKey) || [...this._defaultCategories];
    },

    setCategories(cats) {
      window.Store._set(this._catKey, cats);
    },

    addCategory(cat) {
      const cats = this.getCategories();
      const exists = cats.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
      if (exists) return false;
      cats.push({
        name: cat.name,
        emoji: cat.emoji || '📌',
        color: cat.color || '#888888'
      });
      this.setCategories(cats);
      return true;
    },

    removeCategory(name) {
      let cats = this.getCategories();
      cats = cats.filter(c => c.name !== name);
      this.setCategories(cats);
    },

    getCategoryTotals(type, year, month) {
      const txs = this.getTransactions({ type, year, month });
      const totals = {};
      for (const tx of txs) {
        const cat = tx.category || 'Sin categoría';
        totals[cat] = (totals[cat] || 0) + tx.amount;
      }
      return totals;
    }
  },

  university: {
    _key: 'university_data',
    
    getData() {
      return window.Store._get(this._key) || { targetDate: null, subjects: [] };
    },
    
    saveData(data) {
      window.Store._set(this._key, data);
    },

    initCountdown() {
      const data = this.getData();
      if (!data.targetDate) {
        // Set target date to exactly 1719 days from today
        const target = new Date();
        target.setDate(target.getDate() + 1719);
        data.targetDate = target.toISOString();
        this.saveData(data);
      }
      return data;
    },
    
    addSubject(name) {
      const data = this.getData();
      data.subjects.push({ id: Date.now().toString(), name, notes: [] });
      this.saveData(data);
    },
    
    deleteSubject(id) {
      const data = this.getData();
      data.subjects = data.subjects.filter(s => s.id !== id);
      this.saveData(data);
    },
    
    addNote(subjectId, noteText) {
      const data = this.getData();
      const subject = data.subjects.find(s => s.id === subjectId);
      if (subject) {
        subject.notes.push({ id: Date.now().toString(), text: noteText, done: false });
        this.saveData(data);
      }
    },
    
    deleteNote(subjectId, noteId) {
      const data = this.getData();
      const subject = data.subjects.find(s => s.id === subjectId);
      if (subject) {
        subject.notes = subject.notes.filter(n => n.id !== noteId);
        this.saveData(data);
      }
    },
    
    toggleNote(subjectId, noteId) {
      const data = this.getData();
      const subject = data.subjects.find(s => s.id === subjectId);
      if (subject) {
        const note = subject.notes.find(n => n.id === noteId);
        if (note) note.done = !note.done;
        this.saveData(data);
      }
    }
  },

  exportAllData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX)) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    return JSON.stringify(data, null, 2);
  },

  importAllData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (typeof data !== 'object' || data === null) return false;

      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(this.PREFIX)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
      return true;
    } catch (e) {
      console.error('Store.importAllData error:', e);
      return false;
    }
  }
};
