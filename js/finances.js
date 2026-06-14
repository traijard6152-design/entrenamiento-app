window.FinancesSection = {
  _timers: [],
  _listeners: [],
  _animFrame: null,
  _selectedMonth: new Date().getMonth(), // 0-indexed (5 = Junio)

  render() {
    const balanceTotal = Store.finances.getBalance();
    const saved = Store.finances.getTotalSaved();
    const goal = Store.finances.getSavingsGoal();
    const pct = goal > 0 ? Math.min(100, Math.round((saved / goal) * 100)) : 0;
    const remaining = Math.max(0, goal - saved);
    
    const currentYear = 2026;
    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    
    const allTx = Store.finances.getTransactions({});
    const allCredits = Store.finances.getCredits ? Store.finances.getCredits() : [];
    
    // Inject credits into allTx as expenses so they are mathematically deducted everywhere
    allCredits.forEach(c => {
      if (!c.paymentDate) return;
      allTx.push({
        id: 'credit-' + c.id,
        type: 'expense',
        amount: c.amount,
        category: 'Crédito/Deuda',
        description: `💳 ${c.description || 'Crédito'} (Cuota ${c.installment || '-'})`,
        date: c.paymentDate,
        isCreditVirtual: true
      });
    });
    

    // Calcular arrastre (rollover) de meses anteriores
    let rolloverBalance = 0;
    if (this._selectedMonth > 5) {
      const prevTx = allTx.filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return d.getMonth() >= 5 && d.getMonth() < this._selectedMonth && d.getFullYear() === currentYear;
      });
      const prevIncome = prevTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const prevExpense = prevTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      rolloverBalance = prevIncome - prevExpense;
    }

    // Filtramos las transacciones solo para el mes seleccionado
    const monthTx = allTx.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getMonth() === this._selectedMonth && d.getFullYear() === currentYear;
    });

    // Inyectar transacción virtual de arrastre si existe
    if (rolloverBalance !== 0) {
      monthTx.unshift({
        id: 'rollover-virtual',
        type: rolloverBalance > 0 ? 'income' : 'expense',
        amount: Math.abs(rolloverBalance),
        category: 'Mes Anterior',
        description: rolloverBalance > 0 ? 'Sobrante mes anterior' : 'Pérdida mes anterior',
        date: currentYear + '-' + String(this._selectedMonth + 1).padStart(2, '0') + '-01',
        isVirtual: true
      });
    }

    // Calcular totales del mes seleccionado (incluyendo el virtual)
    const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const monthBalance = monthIncome - monthExpense;

    // Calcular Balance Pre-21 (días 1 al 20)
    const pre21Tx = monthTx.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getDate() <= 20;
    });
    const pre21Income = pre21Tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const pre21Expense = pre21Tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const pre21Balance = pre21Income - pre21Expense;

    // Categorías del mes seleccionado (calculado dinámicamente para incluir la categoría virtual)
    const catTotals = {};
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const maxCatAmount = catEntries.length > 0 ? catEntries[0][1] : 0;
    
    const categories = Store.finances.getCategories();
    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c; });
    catMap['Mes Anterior'] = { emoji: '🔄', color: '#9e9e9e' };

    // Calculate total global debt
    const totalDebt = allCredits.reduce((s, c) => s + c.amount, 0);

    // Filter for current month
    const monthCredits = allCredits.filter(c => {
      if (!c.paymentDate) return false;
      let month = -1;
      let year = -1;
      


      if (c.paymentDate.includes('-')) {
        const parts = c.paymentDate.split('-');
        if (parts.length === 3) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1; // 0-indexed
        }
      } else if (c.paymentDate.includes('/')) {
        const parts = c.paymentDate.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          year = parseInt(parts[2], 10);
          month = parseInt(parts[1], 10) - 1;
        }
      } else {
        const d = new Date(c.paymentDate + 'T12:00:00');
        if (!isNaN(d)) {
          year = d.getFullYear();
          month = d.getMonth();
        }
      }
      return month === this._selectedMonth && year === currentYear;
    });

    const creditsHtml = monthCredits.length === 0 ? `
      <div class="empty-state" style="padding:16px 0;">
        <div style="font-size:1.8rem; margin-bottom:4px;">✨</div>
        <div class="text-sm text-muted">No tienes cuotas que venzan en este mes</div>
      </div>
    ` : monthCredits.map(c => {
      const d = new Date(c.paymentDate + 'T12:00:00');
      const dateStr = !isNaN(d) ? d.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' }) : c.paymentDate;
      return `
      <div class="finances-tx-row" style="padding:12px; border:1px solid rgba(255,255,255,0.05); border-radius:12px; background:var(--bg-secondary);">
        <div class="finances-tx-info" style="display:flex; flex-direction:column; gap:4px; flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="finances-tx-desc" style="font-size:1rem; color:var(--text-primary);">💳 ${c.description || 'Crédito'}</span>
            <span style="font-size:0.8rem; color:var(--text-muted); background:var(--glass-bg); padding:2px 8px; border-radius:12px; border:1px solid var(--glass-border);">Cuota: ${c.installment || '-'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <span style="font-size:0.85rem; color:var(--danger);">Vence: ${dateStr}</span>
            <span class="finances-tx-amount expense" style="font-size:1.1rem;">₲ ${c.amount.toLocaleString('es-PY')}</span>
          </div>
        </div>
        <button class="finances-credit-edit-btn" data-id="${c.id}" style="background:rgba(255,255,255,0.1); color:var(--text-primary); border:1px solid rgba(255,255,255,0.2); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-left:12px; flex-shrink:0;" title="Editar">✏️</button>
        <button class="finances-credit-delete-btn" data-id="${c.id}" style="background:rgba(255,23,68,0.15); color:var(--danger); border:1px solid var(--danger); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-left:8px; font-weight:bold; flex-shrink:0;">✕</button>
      </div>
      `;
    }).join('');

    // Selector de meses (solo mostrar de Junio a Diciembre para 2026)
    const availableMonths = [5, 6, 7, 8, 9, 10, 11]; // Junio a Diciembre
    const monthsHtml = availableMonths.map(m => {
      const isActive = m === this._selectedMonth;
      return `<button class="finances-month-tab ${isActive ? 'active' : ''}" data-month="${m}">${monthNames[m]}</button>`;
    }).join('');

    return `
<style>
  @keyframes finances-countup { from { opacity: 0.6; } to { opacity: 1; } }
  @keyframes finances-slideDown {
    from { max-height: 0; opacity: 0; transform: translateY(-12px); }
    to { max-height: 600px; opacity: 1; transform: translateY(0); }
  }
  @keyframes finances-slideUp {
    from { max-height: 600px; opacity: 1; }
    to { max-height: 0; opacity: 0; }
  }
  @keyframes finances-pulse-green {
    0%, 100% { box-shadow: 0 0 8px rgba(0,230,118,0.3); }
    50% { box-shadow: 0 0 24px rgba(0,230,118,0.6); }
  }
  @keyframes finances-pulse-red {
    0%, 100% { box-shadow: 0 0 8px rgba(255,23,68,0.3); }
    50% { box-shadow: 0 0 24px rgba(255,23,68,0.6); }
  }
  @keyframes finances-flash {
    0% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
  @keyframes finances-bar-grow {
    from { width: 0%; }
  }
  @keyframes finances-fade-in-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .finances-month-selector {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 24px;
    padding-bottom: 4px;
  }
  .finances-month-tab {
    background: var(--bg-tertiary);
    border: 1px solid var(--glass-border);
    color: var(--text-secondary);
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
  }
  .finances-month-tab:hover { background: rgba(255,255,255,0.1); }
  .finances-month-tab.active {
    background: var(--amber);
    color: #0a0a0f;
    border-color: var(--amber);
    box-shadow: 0 0 12px var(--amber-glow);
  }

  #finances-balance-amount {
    font-size: 3rem;
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1.1;
    transition: color var(--transition-normal);
  }
  #finances-balance-amount.positive { color: var(--success); text-shadow: 0 0 30px rgba(0,230,118,0.4); }
  #finances-balance-amount.negative { color: var(--danger); text-shadow: 0 0 30px rgba(255,23,68,0.4); }

  .finances-summary-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 12px;
  }
  .finances-summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 80px;
  }
  .finances-summary-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
  }
  .finances-summary-value {
    font-size: clamp(0.9rem, 3.5vw, 1.25rem);
    font-weight: 700;
  }
  .finances-summary-value.income { color: var(--success); }
  .finances-summary-value.expense { color: var(--danger); }

  .finances-action-btns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .finances-btn-income,
  .finances-btn-expense {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 18px 16px;
    border: none;
    border-radius: var(--radius-lg);
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }
  .finances-btn-income {
    background: linear-gradient(135deg, #00c853, #00e676);
    color: #0a0a0f;
    box-shadow: 0 4px 20px rgba(0,230,118,0.3);
  }
  .finances-btn-income:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(0,230,118,0.5);
    animation: finances-pulse-green 1.5s infinite;
  }
  .finances-btn-expense {
    background: linear-gradient(135deg, #d50000, #ff1744);
    color: #fff;
    box-shadow: 0 4px 20px rgba(255,23,68,0.3);
  }
  .finances-btn-expense:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(255,23,68,0.5);
    animation: finances-pulse-red 1.5s infinite;
  }
  .finances-btn-income:active,
  .finances-btn-expense:active {
    transform: translateY(0) scale(0.97);
  }

  .finances-form-container {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.4s ease, opacity 0.3s ease;
  }
  .finances-form-container.open {
    max-height: 600px;
    opacity: 1;
    animation: finances-slideDown 0.4s ease forwards;
  }
  .finances-form-container.closing {
    animation: finances-slideUp 0.3s ease forwards;
  }
  .finances-form-inner {
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .finances-amount-input {
    width: 100%;
    padding: 16px;
    font-size: 1.8rem;
    font-weight: 800;
    text-align: center;
    background: var(--bg-primary);
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    outline: none;
    transition: border-color var(--transition-normal);
  }
  .finances-amount-input:focus {
    border-color: var(--amber);
    box-shadow: 0 0 16px var(--amber-glow);
  }
  .finances-amount-input::placeholder {
    color: var(--text-muted);
    font-weight: 400;
    font-size: 1.2rem;
  }
  .finances-cat-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .finances-cat-chip {
    padding: 8px 14px;
    border-radius: var(--radius-full);
    border: 2px solid var(--glass-border);
    background: var(--glass-bg);
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    user-select: none;
  }
  .finances-cat-chip:hover {
    background: rgba(255,255,255,0.1);
    transform: translateY(-1px);
  }
  .finances-cat-chip.active {
    color: #0a0a0f;
    border-color: transparent;
    transform: scale(1.05);
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  }
  .finances-form-actions {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }
  .finances-form-actions .btn {
    flex: 1;
  }

  .finances-toast {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ffd600, #ffab00);
    color: #0a0a0f;
    padding: 12px 28px;
    border-radius: var(--radius-full);
    font-weight: 700;
    font-size: 0.95rem;
    z-index: 9999;
    pointer-events: none;
    animation: finances-flash 2s ease forwards;
    box-shadow: 0 4px 24px rgba(255,214,0,0.5);
  }

  .finances-savings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .finances-savings-amount {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--amber);
    text-shadow: 0 0 16px var(--amber-glow);
  }
  .finances-savings-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }
  .finances-savings-pct {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 600;
  }
  .finances-edit-goal-btn {
    background: none;
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    padding: 4px 10px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .finances-edit-goal-btn:hover {
    color: var(--amber);
    border-color: var(--amber);
    background: rgba(255,214,0,0.08);
  }
  .finances-goal-edit-row {
    display: none;
    gap: 8px;
    margin-top: 8px;
    align-items: center;
  }
  .finances-goal-edit-row.open { display: flex; }
  .finances-goal-edit-row input {
    flex: 1;
    padding: 8px 12px;
    font-size: 1rem;
    font-weight: 600;
    background: var(--bg-primary);
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    outline: none;
  }
  .finances-goal-edit-row input:focus { border-color: var(--amber); }

  .finances-progress-fill-amber {
    background: linear-gradient(90deg, #ff8f00, #ffd600);
    box-shadow: 0 0 12px var(--amber-glow);
    height: 100%;
    border-radius: inherit;
    transition: width 0.8s cubic-bezier(0.25,0.46,0.45,0.94);
  }

  .finances-cat-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--glass-border);
    animation: finances-fade-in-up 0.4s ease both;
  }
  .finances-cat-row:last-child { border-bottom: none; }
  .finances-cat-emoji { font-size: 1.3rem; width: 28px; text-align: center; flex-shrink: 0; }
  .finances-cat-name { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); min-width: 80px; flex-shrink: 0; }
  .finances-cat-bar-wrap {
    flex: 1;
    height: 10px;
    background: var(--bg-primary);
    border-radius: var(--radius-full);
    overflow: hidden;
    min-width: 60px;
  }
  .finances-cat-bar-fill {
    height: 100%;
    border-radius: inherit;
    animation: finances-bar-grow 0.8s cubic-bezier(0.25,0.46,0.45,0.94) both;
  }
  .finances-cat-amount {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
    min-width: 90px;
    text-align: right;
    flex-shrink: 0;
  }

  .finances-filter-chips {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .finances-tx-list {
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.15) transparent;
  }
  .finances-tx-list::-webkit-scrollbar { width: 5px; }
  .finances-tx-list::-webkit-scrollbar-track { background: transparent; }
  .finances-tx-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 8px; }

  .finances-tx-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 4px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background var(--transition-fast);
    border-radius: var(--radius-sm);
  }
  .finances-tx-row:hover {
    background: rgba(255,255,255,0.03);
  }
  .finances-tx-row:last-child { border-bottom: none; }
  .finances-tx-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
    border: 1px solid var(--glass-border);
  }
  .finances-tx-info { flex: 1; min-width: 0; }
  .finances-tx-desc {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .finances-tx-date {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 2px;
  }
  .finances-tx-amount {
    font-size: 0.95rem;
    font-weight: 700;
    flex-shrink: 0;
    text-align: right;
  }
  .finances-tx-amount.income { color: var(--success); }
  .finances-tx-amount.expense { color: var(--danger); }
  .finances-tx-delete {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }
  .finances-tx-row:hover .finances-tx-delete { opacity: 1; }
  .finances-tx-delete:hover {
    background: rgba(255,23,68,0.15);
    color: var(--danger);
  }

  .finances-grid-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 768px) {
    .finances-grid-main { grid-template-columns: 1fr; }
    #finances-balance-amount { font-size: 2.4rem; }
    .finances-btn-income, .finances-btn-expense { padding: 14px 12px; font-size: 0.95rem; }
    .finances-amount-input { font-size: 1.4rem; padding: 12px; }
    .finances-savings-amount { font-size: 1.3rem; }
    .finances-cat-name { min-width: 60px; font-size: 0.78rem; }
    .finances-cat-amount { min-width: 70px; font-size: 0.78rem; }
  }
</style>

<div class="section-content">

  <!-- BALANCE GENERAL (Global) -->
  <div class="card mb-4 fade-in" style="padding:24px 20px;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="text-align:left;">
        <div class="text-xs font-semibold text-muted mb-1" style="letter-spacing:2px; text-transform:uppercase;">Liquidez Total</div>
        <div id="finances-balance-amount" class="${balanceTotal >= 0 ? 'positive' : 'negative'}" data-target="${balanceTotal}" style="margin:0;">₲0</div>
      </div>
      <div style="text-align:right; cursor:pointer;" id="finances-debt-toggle-btn">
        <div class="text-xs font-semibold text-muted mb-1" style="letter-spacing:2px; text-transform:uppercase;">Deuda Total</div>
        <div id="finances-total-debt-amount" class="negative" data-target="${totalDebt}" style="font-size:1.6rem; margin:0; color:var(--danger);">₲0</div>
        <div style="font-size:0.75rem; color:var(--cyan); margin-top:4px;">Ver cuotas ▼</div>
      </div>
    </div>

    <!-- Panel de Cuotas Expandible -->
    <div id="finances-debt-panel" style="display:none; margin-top:20px; border-top:1px solid rgba(255,255,255,0.05); padding-top:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <span style="font-weight:bold; color:var(--amber);">Cuotas del Mes</span>
        <button class="btn btn-emerald btn-icon" id="finances-btn-add-credit" style="padding:6px 12px; font-size:0.85rem; font-weight:700;">+ Agregar</button>
      </div>

      <!-- Formulario Nuevo Crédito -->
      <div id="finances-credit-form" style="display:none; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:16px; border-radius:12px; margin-bottom:16px; gap:8px; flex-direction:column;">
        <input class="input-field" id="finance-credit-desc" type="text" placeholder="Descripción (Ej. Préstamo Auto)">
        <div style="display:flex; gap:8px;">
          <input class="input-field" id="finance-credit-installment" type="text" placeholder="Cuota (Ej. 1/12)" style="flex:1;">
          <input class="input-field" id="finance-credit-amount" type="text" inputmode="numeric" placeholder="Cantidad ₲" style="flex:2;">
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.85rem; color:var(--text-secondary); white-space:nowrap;">Vence el:</span>
          <input class="input-field" id="finance-credit-day" type="date" style="flex:1; color-scheme:dark;">
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn btn-amber" id="finance-credit-save" style="flex:1; font-weight:bold;">Guardar</button>
          <button class="btn btn-ghost" id="finance-credit-cancel" style="flex:1;">Cancelar</button>
        </div>
      </div>

      <!-- Lista de Créditos del Mes -->
      <div id="finances-credit-list" style="display:flex; flex-direction:column; gap:12px;">
        ${creditsHtml}
      </div>
    </div>
  </div>

  <!-- Selector de Meses -->
  <div class="finances-month-selector fade-in" id="finances-month-selector">
    ${monthsHtml}
  </div>

  <div class="card mb-4 fade-in" style="text-align:center; padding:16px 20px; border-color:var(--amber);">
    <div class="text-xs font-semibold text-muted mb-1" style="letter-spacing:2px; text-transform:uppercase;">Balance de ${monthNames[this._selectedMonth]}</div>
    <div class="finances-summary-row" style="margin-top:8px;">
      <div class="finances-summary-item">
        <span class="finances-summary-label">Ingresos</span>
        <span class="finances-summary-value income" id="finances-month-income" data-target="${monthIncome}">₲0</span>
      </div>
      <div class="finances-summary-item">
        <span class="finances-summary-label">Balance Mes</span>
        <span class="finances-summary-value" style="color:var(--cyan);" id="finances-month-balance" data-target="${monthBalance}">₲0</span>
      </div>
      <div class="finances-summary-item">
        <span class="finances-summary-label">Gastos</span>
        <span class="finances-summary-value expense" id="finances-month-expense" data-target="${monthExpense}">₲0</span>
      </div>
    </div>
    <div style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; align-items:center; gap:4px;">
      <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted);">Balance Pre-21 (Días 1-20)</span>
      <span id="finances-month-pre21" style="font-size:1.1rem; font-weight:700; color:var(--amber);" data-target="${pre21Balance}">₲0</span>
    </div>
  </div>

  <!-- ROW: Register Express + Savings -->
  <div class="finances-grid-main mb-4">

    <!-- REGISTRO EXPRESS -->
    <div class="card slide-up" style="animation-delay:0.1s;">
      <div class="card-header"><div class="card-title" style="color:var(--amber);">⚡ Registro Express</div></div>
      <div class="finances-action-btns">
        <button class="finances-btn-income" id="finances-btn-income">💰 INGRESO</button>
        <button class="finances-btn-expense" id="finances-btn-expense">💸 GASTO</button>
      </div>
      <div class="finances-form-container" id="finances-form-container">
        <div class="finances-form-inner">
          <input class="finances-amount-input" id="finances-input-amount" type="text" inputmode="numeric" placeholder="Monto en ₲" autocomplete="off">
          <div class="finances-cat-chips" id="finances-cat-chips">
            ${categories.map(c => `<span class="finances-cat-chip" data-cat="${c.name}" style="--chip-color:${c.color}">${c.emoji} ${c.name}</span>`).join('')}
          </div>
          <input class="input-field" id="finances-input-desc" type="text" placeholder="Descripción (opcional)" autocomplete="off">
          <input class="input-field" id="finances-input-date" type="date" value="${Store.today()}">
          <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; color:var(--text-secondary); margin-top:4px; margin-bottom:8px; cursor:pointer; padding-left:4px;">
            <input type="checkbox" id="finances-apply-all-months" style="accent-color:var(--amber); width:16px; height:16px;">
            Aplicar a todos los meses del año
          </label>
          <div class="finances-form-actions">
            <button class="btn btn-amber" id="finances-btn-save" style="font-weight:700; letter-spacing:1px;">REGISTRAR</button>
            <button class="btn btn-ghost" id="finances-btn-cancel">CANCELAR</button>
          </div>
        </div>
      </div>
    </div>

    <!-- META DE AHORRO -->
    <div class="card slide-up" style="animation-delay:0.15s;">
      <div class="finances-savings-header">
        <div class="card-title" style="color:var(--amber);">🎯 Meta de Ahorro 2026</div>
        <button class="finances-edit-goal-btn" id="finances-edit-goal-btn">✏️ Editar</button>
      </div>
      <div class="finances-savings-amount" id="finances-saved-display">${Store.formatCurrency(saved)}</div>
      <div class="text-xs text-muted mb-2" style="margin-top:2px;">de ${Store.formatCurrency(goal)}</div>
      <div class="progress-bar progress-bar-lg">
        <div class="finances-progress-fill-amber" id="finances-progress-bar" style="width:${pct}%;"></div>
      </div>
      <div class="finances-savings-meta">
        <span class="finances-savings-pct" id="finances-savings-pct">${pct}% completado — Faltan ${Store.formatCurrency(remaining)}</span>
      </div>
      <div class="finances-goal-edit-row" id="finances-goal-edit-row">
        <input type="text" inputmode="numeric" id="finances-goal-input" placeholder="Nueva meta en ₲" value="${goal}">
        <button class="btn btn-amber btn-icon" id="finances-goal-save" style="padding:8px 14px;">✓</button>
        <button class="btn btn-ghost btn-icon" id="finances-goal-cancel" style="padding:8px 14px;">✕</button>
      </div>
    </div>
  </div>


  <!-- ROW: Category Breakdown + Transaction History -->
  <div class="finances-grid-main">

    <!-- DESGLOSE POR CATEGORÍA DEL MES -->
    <div class="card slide-up" style="animation-delay:0.2s;">
      <div class="card-header">
        <div class="card-title" style="color:var(--amber);">📊 Gastos de ${monthNames[this._selectedMonth]}</div>
      </div>
      <div id="finances-cat-breakdown">
        ${catEntries.length === 0 ? `
          <div class="empty-state" style="padding:24px 0;">
            <div style="font-size:2rem; margin-bottom:8px;">📭</div>
            <div class="text-sm text-muted">No hay gastos en este mes</div>
          </div>
        ` : catEntries.map((entry, i) => {
          const cat = catMap[entry[0]] || { emoji: '📦', color: '#888' };
          const barW = maxCatAmount > 0 ? Math.round((entry[1] / maxCatAmount) * 100) : 0;
          return `<div class="finances-cat-row" style="animation-delay:${0.05 * i}s;">
            <span class="finances-cat-emoji">${cat.emoji}</span>
            <span class="finances-cat-name">${entry[0]}</span>
            <div class="finances-cat-bar-wrap">
              <div class="finances-cat-bar-fill" style="width:${barW}%; background:${cat.color}; box-shadow:0 0 8px ${cat.color}44; animation-delay:${0.1 * i}s;"></div>
            </div>
            <span class="finances-cat-amount">${Store.formatCurrency(entry[1])}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- HISTORIAL DE TRANSACCIONES DEL MES -->
    <div class="card slide-up" style="animation-delay:0.25s;">
      <div class="card-header">
        <div class="card-title" style="color:var(--amber);">📋 Transacciones (${monthNames[this._selectedMonth]})</div>
      </div>
      <div class="finances-filter-chips" id="finances-filter-chips">
        <span class="chip active" data-filter="all">Todos</span>
        <span class="chip" data-filter="income">Ingresos</span>
        <span class="chip" data-filter="expense">Gastos</span>
      </div>
      <div class="finances-tx-list" id="finances-tx-list">
        ${(() => {
          const mixedTx = [...monthTx];
          mixedTx.sort((a, b) => b.date.localeCompare(a.date));

          if (mixedTx.length === 0) {
            return `
              <div class="empty-state" style="padding:32px 0;">
                <div style="font-size:2rem; margin-bottom:8px;">📝</div>
                <div class="text-sm text-muted">No hay transacciones este mes</div>
              </div>
            `;
          }

          return mixedTx.map(tx => {
            const cat = catMap[tx.category] || { emoji: tx.isCreditVirtual ? '💳' : '📦', color: tx.isCreditVirtual ? '#ff1744' : '#888' };
            const label = tx.description || tx.category;
            const isIncome = tx.type === 'income';
            const isVirtual = tx.isVirtual;
            const isCreditVirtual = tx.isCreditVirtual;
            
            return `<div class="finances-tx-row" data-type="${tx.type}" data-id="${tx.id}" style="${isCreditVirtual ? 'border-left:4px solid var(--danger);' : ''}">
              <div class="finances-tx-icon" style="background:${cat.color}18; border-color:${cat.color}44;">${cat.emoji}</div>
              <div class="finances-tx-info">
                <div class="finances-tx-desc" style="${isCreditVirtual ? 'color:var(--danger); font-weight:bold;' : ''}">${label}</div>
                <div class="finances-tx-date">${isVirtual ? 'Día 1 (Arrastre)' : (isCreditVirtual ? `Vence: ${tx.date}` : tx.date)}</div>
              </div>
              <div class="finances-tx-amount ${tx.type}">${isIncome ? '+' : '-'}${Store.formatCurrency(tx.amount)}</div>
              ${(isVirtual || isCreditVirtual) ? '' : `
                <div style="display:flex; gap:4px; margin-left:8px;">
                  <button class="finances-tx-edit" data-txid="${tx.id}" title="Editar" style="background:transparent; border:none; color:var(--text-primary); cursor:pointer; font-size:1.1rem; padding:4px;">✏️</button>
                  <button class="finances-tx-delete" data-txid="${tx.id}" title="Eliminar">×</button>
                </div>
              `}
            </div>`;
          }).join('');
        })()}
      </div>
    </div>
  </div>

</div>`;
  },

  init() {
    // Wipe old credits ONCE to start fresh as requested by user
    if (!localStorage.getItem('finances_v14_wiped_credits')) {
      Store._set('finance_credits', []);
      localStorage.setItem('finances_v14_wiped_credits', 'true');
    }

    this._currentType = null;
    this._selectedCategory = null;
    this._currentFilter = 'all';

    this._animateCountUp();
    this._bindBalanceButtons();
    this._bindForm();
    this._bindSavingsGoal();
    this._bindFilterChips();
    this._bindTransactionActions();
    this._bindMonthSelector();
    this._bindCredits();
  },

  destroy() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
    this._listeners.forEach(([el, ev, fn]) => {
      if (el) el.removeEventListener(ev, fn);
    });
    this._listeners = [];
  },

  _on(id, event, handler) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return;
    el.addEventListener(event, handler);
    this._listeners.push([el, event, handler]);
  },

  _animateCountUp() {
    const balEl = document.getElementById('finances-balance-amount');
    const incEl = document.getElementById('finances-month-income');
    const expEl = document.getElementById('finances-month-expense');
    const monthBalEl = document.getElementById('finances-month-balance');
    const pre21El = document.getElementById('finances-month-pre21');
    const totalDebtEl = document.getElementById('finances-total-debt-amount');
    if (!balEl) return;

    const targets = [
      { el: balEl, target: parseInt(balEl.dataset.target) || 0 },
      { el: incEl, target: parseInt(incEl.dataset.target) || 0 },
      { el: expEl, target: parseInt(expEl.dataset.target) || 0 },
      { el: monthBalEl, target: parseInt(monthBalEl.dataset.target) || 0 }
    ];
    if (pre21El) {
      targets.push({ el: pre21El, target: parseInt(pre21El.dataset.target) || 0 });
    }
    if (totalDebtEl) {
      targets.push({ el: totalDebtEl, target: parseInt(totalDebtEl.dataset.target) || 0 });
    }

    const duration = 1000;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      targets.forEach(t => {
        const current = Math.round(t.target * ease);
        if (t.el) t.el.textContent = Store.formatCurrency(current);
      });

      if (progress < 1) {
        this._animFrame = requestAnimationFrame(step);
      }
    };

    this._animFrame = requestAnimationFrame(step);
  },

  _bindMonthSelector() {
    const monthBtns = document.querySelectorAll('.finances-month-tab');
    monthBtns.forEach(btn => {
      this._on(btn, 'click', (e) => {
        const selected = parseInt(e.target.dataset.month, 10);
        if (selected !== this._selectedMonth) {
          this._selectedMonth = selected;
          if (typeof window.App !== 'undefined' && window.App.renderCurrentSection) {
            window.App.renderCurrentSection();
          } else {
            // Recargar vista si no hay App (fallback)
            const container = document.getElementById('section-finances');
            if (container) {
              container.innerHTML = this.render();
              this.destroy();
              this.init();
            }
          }
        }
      });
    });
  },

  _bindBalanceButtons() {
    this._on('finances-btn-income', 'click', () => this._openForm('income'));
    this._on('finances-btn-expense', 'click', () => this._openForm('expense'));
  },

  _openForm(type) {
    this._currentType = type;
    this._selectedCategory = null;
    const container = document.getElementById('finances-form-container');
    const amountInput = document.getElementById('finances-input-amount');
    const descInput = document.getElementById('finances-input-desc');
    const dateInput = document.getElementById('finances-input-date');
    if (!container) return;

    container.classList.remove('closing');
    container.classList.add('open');

    if (amountInput) { amountInput.value = ''; }
    if (descInput) { descInput.value = ''; }
    if (dateInput) { dateInput.value = Store.today(); }

    const chips = document.querySelectorAll('#finances-cat-chips .finances-cat-chip');
    chips.forEach(c => c.classList.remove('active'));

    const btnIncome = document.getElementById('finances-btn-income');
    const btnExpense = document.getElementById('finances-btn-expense');
    if (type === 'income') {
      if (btnIncome) { btnIncome.style.outline = '3px solid var(--success)'; btnIncome.style.outlineOffset = '3px'; }
      if (btnExpense) { btnExpense.style.outline = 'none'; }
    } else {
      if (btnExpense) { btnExpense.style.outline = '3px solid var(--danger)'; btnExpense.style.outlineOffset = '3px'; }
      if (btnIncome) { btnIncome.style.outline = 'none'; }
    }

    if (amountInput) {
      const t = setTimeout(() => amountInput.focus(), 350);
      this._timers.push(t);
    }
  },

  _closeForm() {
    const container = document.getElementById('finances-form-container');
    if (!container) return;
    container.classList.add('closing');
    const t = setTimeout(() => {
      container.classList.remove('open', 'closing');
    }, 300);
    this._timers.push(t);

    const btnIncome = document.getElementById('finances-btn-income');
    const btnExpense = document.getElementById('finances-btn-expense');
    if (btnIncome) btnIncome.style.outline = 'none';
    if (btnExpense) btnExpense.style.outline = 'none';

    this._currentType = null;
    this._selectedCategory = null;
  },

  _bindForm() {
    const chipContainer = document.getElementById('finances-cat-chips');
    if (chipContainer) {
      this._on(chipContainer, 'click', (e) => {
        const chip = e.target.closest('.finances-cat-chip');
        if (!chip) return;
        const chips = chipContainer.querySelectorAll('.finances-cat-chip');
        chips.forEach(c => {
          c.classList.remove('active');
          c.style.background = '';
          c.style.borderColor = '';
          c.style.color = '';
        });
        chip.classList.add('active');
        const color = chip.style.getPropertyValue('--chip-color');
        chip.style.background = color;
        chip.style.borderColor = color;
        chip.style.color = '#0a0a0f';
        this._selectedCategory = chip.dataset.cat;
      });
    }

    this._on('finances-input-amount', 'input', (e) => {
      let raw = e.target.value.replace(/\D/g, '');
      if (raw === '') { e.target.value = ''; return; }
      const num = parseInt(raw, 10);
      e.target.value = num.toLocaleString('es-PY');
    });

    this._on('finances-btn-save', 'click', () => this._saveTransaction());
    this._on('finances-btn-cancel', 'click', () => this._closeForm());
  },

  _saveTransaction() {
    const amountRaw = (document.getElementById('finances-input-amount')?.value || '').replace(/\D/g, '');
    const amount = parseInt(amountRaw, 10);
    if (!amount || amount <= 0) {
      const input = document.getElementById('finances-input-amount');
      if (input) { input.style.borderColor = 'var(--danger)'; input.focus(); }
      return;
    }
    if (!this._selectedCategory) {
      const chips = document.getElementById('finances-cat-chips');
      if (chips) { chips.style.outline = '2px solid var(--danger)'; chips.style.outlineOffset = '2px'; chips.style.borderRadius = '8px'; }
      const t = setTimeout(() => { if (chips) { chips.style.outline = 'none'; } }, 1500);
      this._timers.push(t);
      return;
    }
    const desc = document.getElementById('finances-input-desc')?.value || '';
    const date = document.getElementById('finances-input-date')?.value || Store.today();
    const applyAll = document.getElementById('finances-apply-all-months')?.checked;

    const form = document.getElementById('finances-form-modal');
    const editingId = form ? form.dataset.editingId : null;

    if (editingId) {
      Store.finances.updateTransaction(editingId, {
        type: this._currentType,
        amount: amount,
        category: this._selectedCategory,
        description: desc,
        date: date
      });
      delete form.dataset.editingId;
    } else {
      if (applyAll) {
        const [y, m, d] = date.split('-');
        for (let i = 1; i <= 12; i++) {
          const monthStr = i.toString().padStart(2, '0');
          const maxDays = new Date(parseInt(y, 10), i, 0).getDate();
          const safeDay = Math.min(parseInt(d, 10), maxDays).toString().padStart(2, '0');
          const iterDate = `${y}-${monthStr}-${safeDay}`;
          Store.finances.addTransaction({
            type: this._currentType,
            amount: amount,
            category: this._selectedCategory,
            description: desc,
            date: iterDate
          });
        }
      } else {
        Store.finances.addTransaction({
          type: this._currentType,
          amount: amount,
          category: this._selectedCategory,
          description: desc,
          date: date
        });
      }
    }

    this._closeForm();
    this._showToast('✅ Transacción registrada');

    const t = setTimeout(() => {
      if (typeof window.App !== 'undefined' && window.App.renderCurrentSection) {
        window.App.renderCurrentSection();
      } else {
        const container = document.getElementById('section-finances');
        if (container) {
          container.innerHTML = this.render();
          this.destroy();
          this.init();
        }
      }
    }, 400);
    this._timers.push(t);
  },

  _bindSavingsGoal() {
    const editBtn = document.getElementById('finances-edit-goal-btn');
    const row = document.getElementById('finances-goal-edit-row');
    const saveBtn = document.getElementById('finances-goal-save');
    const cancelBtn = document.getElementById('finances-goal-cancel');
    const input = document.getElementById('finances-goal-input');

    if (!editBtn || !row) return;

    this._on(editBtn, 'click', () => {
      row.classList.add('open');
      if (input) {
        const t = setTimeout(() => input.focus(), 50);
        this._timers.push(t);
      }
    });

    this._on(cancelBtn, 'click', () => {
      row.classList.remove('open');
    });

    this._on(saveBtn, 'click', () => {
      if (!input) return;
      const raw = input.value.replace(/\D/g, '');
      const val = parseInt(raw, 10);
      if (val > 0) {
        Store.finances.setSavingsGoal(val);
        row.classList.remove('open');
        if (typeof window.App !== 'undefined' && window.App.renderCurrentSection) {
          window.App.renderCurrentSection();
        }
      }
    });

    this._on(input, 'input', (e) => {
      let raw = e.target.value.replace(/\D/g, '');
      if (raw === '') { e.target.value = ''; return; }
      const num = parseInt(raw, 10);
      e.target.value = num.toLocaleString('es-PY');
    });
  },

  _bindFilterChips() {
    const chips = document.querySelectorAll('#finances-filter-chips .chip');
    chips.forEach(chip => {
      this._on(chip, 'click', (e) => {
        chips.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this._currentFilter = e.target.dataset.filter;
        this._filterTransactions();
      });
    });
  },

  _filterTransactions() {
    const rows = document.querySelectorAll('.finances-tx-row');
    rows.forEach(row => {
      if (this._currentFilter === 'all') {
        row.style.display = 'flex';
      } else if (this._currentFilter === row.dataset.type) {
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
    });
  },

  _bindTransactionActions() {
    const list = document.getElementById('finances-tx-list');
    if (!list) return;

    this._on(list, 'click', (e) => {
      const delBtn = e.target.closest('.finances-tx-delete');
      const editBtn = e.target.closest('.finances-tx-edit');
      
      if (delBtn) {
        const txid = delBtn.dataset.txid;
        if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
          Store.finances.deleteTransaction(txid);
          const row = delBtn.closest('.finances-tx-row');
          if (row) {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            const t = setTimeout(() => {
              if (typeof window.App !== 'undefined' && window.App.renderCurrentSection) {
                window.App.renderCurrentSection();
              }
            }, 300);
            this._timers.push(t);
          }
        }
      } else if (editBtn) {
        const txid = editBtn.dataset.txid;
        const allTx = Store.finances.getTransactions({});
        const tx = allTx.find(t => t.id === txid);
        if (tx) {
          this._openForm(tx.type);
          
          document.getElementById('finances-input-amount').value = Store.formatCurrency(tx.amount).replace('₲', '');
          document.getElementById('finances-input-desc').value = tx.description || '';
          document.getElementById('finances-input-date').value = tx.date || '';
          
          const chipContainer = document.getElementById('finances-cat-chips');
          if (chipContainer) {
            const chips = chipContainer.querySelectorAll('.finances-cat-chip');
            chips.forEach(c => {
              c.classList.remove('active');
              c.style.background = '';
              c.style.borderColor = '';
              c.style.color = '';
              if (c.dataset.cat === tx.category) {
                c.classList.add('active');
                const color = c.style.getPropertyValue('--chip-color');
                c.style.background = color;
                c.style.borderColor = color;
                c.style.color = '#0a0a0f';
                this._selectedCategory = tx.category;
              }
            });
          }
          
          const applyAllRow = document.getElementById('finances-apply-all-months')?.parentElement;
          if (applyAllRow) applyAllRow.style.display = 'none';

          const form = document.getElementById('finances-form-modal');
          if (form) form.dataset.editingId = txid;
        }
      }
    });
  },

  _bindCredits() {
    this._on('finances-debt-toggle-btn', 'click', () => {
      const panel = document.getElementById('finances-debt-panel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    });

    this._on('finances-btn-add-credit', 'click', () => {
      const form = document.getElementById('finances-credit-form');
      if (form) {
        if (form.style.display === 'flex') {
          form.style.display = 'none';
        } else {
          form.style.display = 'flex';
          delete form.dataset.editingId;
          document.getElementById('finance-credit-desc').value = '';
          document.getElementById('finance-credit-installment').value = '';
          document.getElementById('finance-credit-amount').value = '';
          document.getElementById('finance-credit-day').value = '';
        }
      }
    });

    this._on('finance-credit-cancel', 'click', () => {
      const form = document.getElementById('finances-credit-form');
      if (form) {
        form.style.display = 'none';
        delete form.dataset.editingId;
        document.getElementById('finance-credit-desc').value = '';
        document.getElementById('finance-credit-installment').value = '';
        document.getElementById('finance-credit-amount').value = '';
        document.getElementById('finance-credit-day').value = '';
      }
    });

    this._on('finance-credit-save', 'click', () => {
      const desc = document.getElementById('finance-credit-desc')?.value;
      const inst = document.getElementById('finance-credit-installment')?.value;
      const amtRaw = document.getElementById('finance-credit-amount')?.value.replace(/\D/g, '');
      const amt = parseInt(amtRaw, 10);
      const day = document.getElementById('finance-credit-day')?.value;

      if (!desc || !amt || !day) {
        this._showToast('⚠️ Faltan datos del crédito');
        return;
      }

      const form = document.getElementById('finances-credit-form');
      const editingId = form ? form.dataset.editingId : null;

      if (editingId) {
        Store.finances.updateCredit(editingId, {
          description: desc,
          installment: inst,
          amount: amt,
          paymentDate: day
        });
        delete form.dataset.editingId;
      } else {
        Store.finances.addCredit({
          description: desc,
          installment: inst,
          amount: amt,
          paymentDate: day
        });
      }

      if (typeof window.App !== 'undefined' && window.App.renderCurrentSection) {
        window.App.renderCurrentSection();
      } else {
        const container = document.getElementById('section-finances');
        if (container) {
          container.innerHTML = this.render();
          this.destroy();
          this.init();
        }
      }
    });

    const list = document.getElementById('finances-credit-list');
    if (list) {
      this._on(list, 'click', (e) => {
        const deleteBtn = e.target.closest('.finances-credit-delete-btn');
        const editBtn = e.target.closest('.finances-credit-edit-btn');
        
        if (deleteBtn) {
          const cid = deleteBtn.dataset.id;
          if (confirm('¿Eliminar este crédito/deuda?')) {
            Store.finances.deleteCredit(cid);
            if (typeof window.App !== 'undefined' && window.App.renderCurrentSection) {
              window.App.renderCurrentSection();
            }
          }
        } else if (editBtn) {
          const cid = editBtn.dataset.id;
          const allCredits = Store.finances.getCredits ? Store.finances.getCredits() : [];
          const credit = allCredits.find(c => c.id === cid);
          if (credit) {
            document.getElementById('finance-credit-desc').value = credit.description || '';
            document.getElementById('finance-credit-installment').value = credit.installment || '';
            document.getElementById('finance-credit-amount').value = Store.formatCurrency(credit.amount).replace('₲', '');
            document.getElementById('finance-credit-day').value = credit.paymentDate || '';
            
            const form = document.getElementById('finances-credit-form');
            if (form) {
              form.dataset.editingId = cid;
              form.style.display = 'flex';
            }
            
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    }

    this._on('finance-credit-amount', 'input', (e) => {
      let raw = e.target.value.replace(/\D/g, '');
      if (raw === '') { e.target.value = ''; return; }
      const num = parseInt(raw, 10);
      e.target.value = num.toLocaleString('es-PY');
    });
  },

  _showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'finances-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    const t = setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2100);
    this._timers.push(t);
  }
};
