/**
 * UI Rendering and DOM Components
 */

const UI = {
  // Update currency labels across the form inputs
  updateCurrencySymbols() {
    const sym = AppState.getSymbol();
    document.querySelectorAll('.currency-symbol-label').forEach(el => {
      el.textContent = sym;
    });
  },

  // Fill form inputs from a profile object
  populateProfileForm(profile) {
    if (!profile) return;
    if (profile.currency) {
      document.getElementById('currencySelect').value = profile.currency;
      AppState.currency = profile.currency;
      this.updateCurrencySymbols();
    }
    if (profile.income) {
      document.getElementById('monthlyIncome').value = profile.income.monthly;
      document.getElementById('incomeVariability').value = profile.income.variability_pct;
      document.getElementById('variabilityValLabel').textContent = `${profile.income.variability_pct}%`;
      if (profile.income.employment_type) {
        document.getElementById('employmentType').value = profile.income.employment_type;
      }
    }
    document.getElementById('essentialExpenses').value = profile.essential_expenses || 0;
    document.getElementById('existingDebt').value = profile.existing_debt_payments || 0;
    document.getElementById('liquidSavings').value = profile.liquid_savings || 0;
    document.getElementById('goalSavings').value = profile.goal_savings || 0;
    if (profile.household_dependents !== undefined) {
      document.getElementById('householdDependents').value = profile.household_dependents;
    }
  },

  // Fill form inputs from an offer object
  populateOfferForm(offer) {
    if (!offer) return;
    document.getElementById('offerName').value = offer.name || 'Proposed Loan';
    document.getElementById('providerName').value = offer.provider || 'Inclusive Digital Lender';
    document.getElementById('loanPrincipal').value = offer.principal || 30000;
    document.getElementById('interestRate').value = offer.annual_interest_rate || 18;
    document.getElementById('loanTerm').value = offer.term_months || 12;
    document.getElementById('upfrontFee').value = offer.upfront_fee || 0;
    document.getElementById('monthlyFee').value = offer.monthly_fee || 0;
    document.getElementById('repaymentType').value = offer.repayment_type || 'amortizing';
    document.getElementById('loanPurpose').value = offer.purpose || 'Working Capital / MSME';
  },

  // Read current profile from form
  readProfileFromForm() {
    return {
      currency: document.getElementById('currencySelect').value,
      income: {
        monthly: parseFloat(document.getElementById('monthlyIncome').value) || 0,
        variability_pct: parseFloat(document.getElementById('incomeVariability').value) || 0,
        employment_type: document.getElementById('employmentType').value,
      },
      essential_expenses: parseFloat(document.getElementById('essentialExpenses').value) || 0,
      existing_debt_payments: parseFloat(document.getElementById('existingDebt').value) || 0,
      liquid_savings: parseFloat(document.getElementById('liquidSavings').value) || 0,
      goal_savings: parseFloat(document.getElementById('goalSavings').value) || 0,
      household_dependents: parseInt(document.getElementById('householdDependents').value) || 1,
    };
  },

  // Read current offer from form
  readOfferFromForm() {
    return {
      name: document.getElementById('offerName').value || 'Proposed Credit',
      provider: document.getElementById('providerName').value || 'Inclusive Lender',
      principal: parseFloat(document.getElementById('loanPrincipal').value) || 1000,
      annual_interest_rate: parseFloat(document.getElementById('interestRate').value) || 0,
      term_months: parseInt(document.getElementById('loanTerm').value) || 1,
      upfront_fee: parseFloat(document.getElementById('upfrontFee').value) || 0,
      monthly_fee: parseFloat(document.getElementById('monthlyFee').value) || 0,
      repayment_type: document.getElementById('repaymentType').value,
      purpose: document.getElementById('loanPurpose').value,
    };
  },

  // Read current applicant / borrower name from form
  readApplicantNameFromForm() {
    const el = document.getElementById('applicantName');
    return el && el.value.trim() ? el.value.trim() : 'Household Profile';
  },

  // Live Household Cash Flow Summary Bar
  updateLiveCashflowSummary() {
    const income = parseFloat(document.getElementById('monthlyIncome')?.value) || 0;
    const expenses = parseFloat(document.getElementById('essentialExpenses')?.value) || 0;
    const debt = parseFloat(document.getElementById('existingDebt')?.value) || 0;
    const savings = parseFloat(document.getElementById('liquidSavings')?.value) || 0;

    const totalOutflow = expenses + debt;
    const netCashflow = income - totalOutflow;
    const runway = expenses > 0 ? (savings / expenses).toFixed(1) : '0.0';

    const setEl = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setEl('liveGrossIncome', AppState.formatMoney(income));
    setEl('liveTotalOutflow', AppState.formatMoney(totalOutflow));

    const netEl = document.getElementById('liveNetCashflow');
    if (netEl) {
      netEl.textContent = AppState.formatMoney(netCashflow);
      netEl.style.color = netCashflow >= 0 ? 'var(--good-text)' : 'var(--deficit-text)';
    }

    setEl('liveReserveRunway', `${runway} Mos`);
  },

  // Interactive Custom Income Shock Simulator
  updateCustomShock(shockPct) {
    AppState.customShockPct = parseFloat(shockPct);
    const badge = document.getElementById('customShockBadge');
    if (badge) {
      badge.textContent = `${shockPct >= 0 ? '+' : ''}${shockPct}% ${shockPct < 0 ? 'Contraction' : 'Expansion'}`;
    }

    const profile = this.readProfileFromForm();
    const offer = this.readOfferFromForm();
    const monthlyPayment = AppState.currentAssessment?.metrics?.monthly_repayment || (offer.principal / offer.term_months);

    const baseIncome = profile.income.monthly;
    const factor = 1 + (AppState.customShockPct / 100);
    const stressedIncome = baseIncome * factor;
    const commitments = profile.essential_expenses + profile.existing_debt_payments + monthlyPayment;
    const stressedBuffer = stressedIncome - commitments;
    const stressBurden = stressedIncome > 0 ? ((profile.existing_debt_payments + monthlyPayment) / stressedIncome * 100) : 100;

    const setEl = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setEl('customStressedIncome', AppState.formatMoney(stressedIncome));
    setEl('customStressedCommitments', AppState.formatMoney(commitments));

    const bufEl = document.getElementById('customStressedBuffer');
    if (bufEl) {
      bufEl.textContent = AppState.formatMoney(stressedBuffer);
      bufEl.style.color = stressedBuffer >= 0 ? 'var(--good-text)' : 'var(--deficit-text)';
    }

    setEl('customStressedBurden', `${stressBurden.toFixed(1)}%`);

    const verdictEl = document.getElementById('customStressVerdict');
    if (verdictEl) {
      if (stressedBuffer >= 1000) {
        verdictEl.style.background = '#ecfdf5';
        verdictEl.style.color = '#065f46';
        verdictEl.textContent = `At ${shockPct}% income shift, monthly buffer remains resilient at ${AppState.formatMoney(stressedBuffer)}. Instalments remain sustainable without depleting liquid reserves.`;
      } else if (stressedBuffer >= 0) {
        verdictEl.style.background = '#fffbeb';
        verdictEl.style.color = '#92400e';
        verdictEl.textContent = `At ${shockPct}% income shift, monthly buffer contracts to a tight ${AppState.formatMoney(stressedBuffer)}. Discretionary spending should be curtailed to prevent debt distress.`;
      } else {
        verdictEl.style.background = '#fef2f2';
        verdictEl.style.color = '#991b1b';
        verdictEl.textContent = `At ${shockPct}% income shift, cash flow falls into a monthly deficit of ${AppState.formatMoney(Math.abs(stressedBuffer))}. Borrower requires emergency savings drawdowns or restructuring.`;
      }
    }
  },

  // Update Institutional Policy labels
  updatePolicyThresholdLabels() {
    const p = AppState.institutionalPolicy;
    const burdenLbl = document.getElementById('policyBurdenLabel');
    if (burdenLbl) burdenLbl.textContent = `${p.maxDebtBurdenPct}%`;
    const bufLbl = document.getElementById('policyBufferLabel');
    if (bufLbl) bufLbl.textContent = AppState.formatMoney(p.minPostBuffer);
    const runLbl = document.getElementById('policyRunwayLabel');
    if (runLbl) runLbl.textContent = `${p.minSavingsRunwayMonths.toFixed(1)} Mo`;
  },

  // Render Full Assessment Results
  renderAssessmentResult(data) {
    const resArea = document.getElementById('assessmentResultsArea');
    resArea.style.display = 'block';

    // Status Banner
    const banner = document.getElementById('statusBanner');
    banner.className = `status-banner ${data.status}`;
    const iconHtml = data.status === 'fits'
      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : data.status === 'review'
      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    document.getElementById('statusBadgeIcon').innerHTML = iconHtml;
    document.getElementById('statusTitle').textContent = data.status_label;
    document.getElementById('statusReason').textContent = data.status_reason;

    // Helper
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // Metrics Row
    setVal('valMonthlyPayment', AppState.formatMoney(data.metrics.monthly_repayment));
    setVal('valTotalRepayment', AppState.formatMoney(data.metrics.total_repayment));
    setVal('valTotalCost', AppState.formatMoney(data.metrics.total_cost_of_credit));
    setVal('valPostBuffer', AppState.formatMoney(data.metrics.post_credit_buffer));
    setVal('valAfterSavingsBuffer', AppState.formatMoney(data.metrics.after_savings_buffer !== undefined ? data.metrics.after_savings_buffer : data.metrics.post_credit_buffer));
    setVal('valDebtBurden', `${data.metrics.debt_service_burden_pct.toFixed(1)}%`);

    if (data.metrics.goal_savings > 0) {
      setVal('valPostBufferSubtext', 'Before voluntary savings');
      setVal('valSavingsGoalSubtext', `After ${AppState.formatMoney(data.metrics.goal_savings)} savings goal`);
    } else {
      setVal('valPostBufferSubtext', 'Remaining disposable cash');
      setVal('valSavingsGoalSubtext', 'No planned savings goal');
    }

    // Savings runway subtext
    const savingsTxt = data.metrics.liquid_savings_months !== null
      ? `${data.metrics.liquid_savings_months.toFixed(1)} months reserve`
      : 'No savings buffer';
    setVal('valSavingsRunway', savingsTxt);

    // Multidimensional Financial Resilience Overview
    setVal('resilienceSummaryText', data.resilience.summary);

    const baseBadge = document.getElementById('resilienceBaselineBadge');
    if (baseBadge) {
      const bStatus = data.resilience.baseline_status || (data.metrics.post_credit_buffer >= 0 ? 'Manageable' : 'Deficit');
      baseBadge.textContent = `Baseline: ${bStatus}`;
      baseBadge.className = `badge-status ${bStatus === 'Deficit' ? 'deficit' : 'healthy'}`;
    }

    const shockBadge = document.getElementById('resilienceShockBadge');
    if (shockBadge) {
      const sStatus = data.resilience.resilience_status || 'Needs Review';
      shockBadge.textContent = `Shock Resilience: ${sStatus}`;
      shockBadge.className = `badge-status ${sStatus === 'Needs Review' ? 'tight' : 'healthy'}`;
    }

    // Resilience Indicator Items
    setVal('resilValBuffer', `+${AppState.formatMoney(data.metrics.post_credit_buffer)}`);
    setVal('resilNoteBuffer', data.metrics.post_credit_buffer >= 0 ? 'Positive cash-flow margin' : 'Immediate cash deficit');

    setVal('resilValBurden', `${data.metrics.debt_service_burden_pct.toFixed(1)}%`);
    setVal('resilNoteBurden', data.metrics.debt_service_burden_pct <= 35 ? 'Within standard 35% safe ceiling' : 'Elevated debt concentration');

    const runwayTxt = data.metrics.liquid_savings_months !== null ? `${data.metrics.liquid_savings_months.toFixed(1)} months` : '0 months';
    setVal('resilValRunway', runwayTxt);
    setVal('resilNoteRunway', data.metrics.liquid_savings_months !== null ? 'Living costs reserve cushion' : 'No liquid emergency buffer');

    // 4 Stress Shock Resilience indicators
    const shock10 = data.scenarios.find(s => s.name.includes('10%'));
    const shock10Def = shock10 ? shock10.buffer : (data.resilience.shock_buffer_10 ?? 0);
    const shock10El = document.getElementById('resilValShock10');
    if (shock10El) {
      shock10El.textContent = shock10Def < 0 ? AppState.formatMoney(shock10Def) : `+${AppState.formatMoney(shock10Def)}`;
      shock10El.className = `resil-value ${shock10Def < 0 ? 'deficit' : 'healthy'}`;
    }
    setVal('resilNoteShock10', shock10Def < 0 ? 'Deficit incurred' : 'Buffer retained');

    const shock25 = data.scenarios.find(s => s.name.includes('25%'));
    const shockDef = shock25 ? shock25.buffer : (data.resilience.shock_deficit_25 ?? 0);
    const shockEl = document.getElementById('resilValShock');
    if (shockEl) {
      shockEl.textContent = shockDef < 0 ? AppState.formatMoney(shockDef) : `+${AppState.formatMoney(shockDef)}`;
      shockEl.className = `resil-value ${shockDef < 0 ? 'deficit' : 'healthy'}`;
    }
    setVal('resilNoteShock', shockDef < 0 ? 'Deficit incurred' : 'Buffer retained');

    const shockExp = data.scenarios.find(s => s.name.includes('Expenses') || s.name.includes('+20%'));
    const shockExpDef = shockExp ? shockExp.buffer : (data.resilience.shock_buffer_exp ?? 0);
    const shockExpEl = document.getElementById('resilValShockExp');
    if (shockExpEl) {
      shockExpEl.textContent = shockExpDef < 0 ? AppState.formatMoney(shockExpDef) : `+${AppState.formatMoney(shockExpDef)}`;
      shockExpEl.className = `resil-value ${shockExpDef < 0 ? 'deficit' : 'healthy'}`;
    }
    setVal('resilNoteShockExp', shockExpDef < 0 ? 'Deficit incurred' : 'Buffer retained');

    const shockComb = data.scenarios.find(s => s.name.includes('Combined'));
    const shockCombDef = shockComb ? shockComb.buffer : (data.resilience.combined_deficit ?? 0);
    const shockCombEl = document.getElementById('resilValShockComb');
    if (shockCombEl) {
      shockCombEl.textContent = shockCombDef < 0 ? AppState.formatMoney(shockCombDef) : `+${AppState.formatMoney(shockCombDef)}`;
      shockCombEl.className = `resil-value ${shockCombDef < 0 ? 'deficit' : 'healthy'}`;
    }
    setVal('resilNoteShockComb', shockCombDef < 0 ? 'Deficit incurred' : 'Buffer retained');

    setVal('resilienceConclusionText', data.resilience.conclusion || 'Manageable today — vulnerable under income shock');

    // Stress Scenarios Table (7 columns: Scenario, Income, Essential Expenses, Existing Debt, New Repayment, Remaining Buffer, Status)
    const tbody = document.getElementById('stressTableBody');
    tbody.innerHTML = data.scenarios.map(s => {
      const isDeficit = s.buffer < 0;
      const isReview = s.status === 'review' || s.status_label === 'Review';
      const bufferClass = isDeficit ? 'badge-status deficit' : isReview ? 'badge-status tight' : 'badge-status healthy';
      const bufferLabel = isDeficit ? AppState.formatMoney(s.buffer) : `+${AppState.formatMoney(s.buffer)}`;
      const statusBadgeClass = isDeficit ? 'deficit' : isReview ? 'tight' : 'healthy';
      const statusLabel = s.status_label || (isDeficit ? 'Deficit' : isReview ? 'Review' : 'Manageable');

      return `
        <tr>
          <td>
            <strong>${s.name}</strong>
            <div style="font-size: 11px; color: var(--ink-500);">${s.description}</div>
          </td>
          <td style="text-align:right;">${AppState.formatMoney(s.income)}</td>
          <td style="text-align:right;">${AppState.formatMoney(s.expenses)}</td>
          <td style="text-align:right;">${AppState.formatMoney(s.debt_payments)}</td>
          <td style="text-align:right;"><strong>${AppState.formatMoney(s.monthly_repayment)}</strong></td>
          <td style="text-align:right;"><span class="${bufferClass}">${bufferLabel}</span></td>
          <td style="text-align:center;"><span class="badge-status ${statusBadgeClass}">${statusLabel}</span></td>
        </tr>
      `;
    }).join('');

    // Explainability Lists
    document.getElementById('explanationList').innerHTML = data.explanation.map(item => `<li>${item}</li>`).join('');
    document.getElementById('tradeOffsList').innerHTML = data.trade_offs.map(item => `<li>${item}</li>`).join('');
    document.getElementById('recommendationsList').innerHTML = data.recommendations.map(item => `<li>${item}</li>`).join('');
    document.getElementById('methodologyList').innerHTML = data.methodology.map(item => `<li>${item}</li>`).join('');

    // Synchronize interactive custom shock simulator
    this.updateCustomShock(AppState.customShockPct || -25);

    // Smooth scroll down to results
    resArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // Render Multi-Offer Comparison Rows
  renderComparisonConfig(offers) {
    const container = document.getElementById('compareOffersConfigArea');
    container.innerHTML = offers.map((offer, idx) => `
      <div class="offer-config-row" data-index="${idx}">
        <div>
          <label>Offer Name & Provider</label>
          <input type="text" class="comp-input" data-field="name" value="${offer.name}" placeholder="Loan Name">
        </div>
        <div>
          <label>Principal (${AppState.getSymbol()})</label>
          <input type="number" class="comp-input" data-field="principal" value="${offer.principal}">
        </div>
        <div>
          <label>Annual Interest %</label>
          <input type="number" class="comp-input" data-field="annual_interest_rate" value="${offer.annual_interest_rate}" step="0.5">
        </div>
        <div>
          <label>Term (Months)</label>
          <input type="number" class="comp-input" data-field="term_months" value="${offer.term_months}">
        </div>
        <div>
          <label>Model</label>
          <select class="comp-input" data-field="repayment_type">
            <option value="amortizing" ${offer.repayment_type === 'amortizing' ? 'selected' : ''}>Amortizing</option>
            <option value="flat" ${offer.repayment_type === 'flat' ? 'selected' : ''}>Flat Rate</option>
          </select>
        </div>
        <div>
          <button class="btn-remove-offer" onclick="App.removeCompareOffer(${idx})" title="Remove offer">&times;</button>
        </div>
      </div>
    `).join('');

    // Bind real-time input change
    container.querySelectorAll('.comp-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const row = e.target.closest('.offer-config-row');
        const idx = parseInt(row.dataset.index);
        const field = e.target.dataset.field;
        const val = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        AppState.comparedOffers[idx][field] = val;
      });
    });
  },

  // Render Comparison Results Table (Key Facts Statement)
  renderComparisonTable(compResult) {
    const area = document.getElementById('comparisonResultsArea');
    area.style.display = 'block';

    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = compResult.results.map(row => {
      const bestMonthlyTag = row.is_best_monthly ? '<span class="key-facts-highlight">Lowest Monthly</span>' : '';
      const lowestCostTag = row.is_lowest_total_cost ? '<span class="key-facts-highlight" style="background:#bbf7d0;color:#14532d;">Lowest Total Cost</span>' : '';
      const highestResilTag = row.is_highest_resilience ? '<span class="key-facts-highlight" style="background:#e0e7ff;color:#3730a3;">Most Resilient</span>' : '';

      const isDeficit = row.status === 'deficit' || row.status === 'high-pressure';
      const isReview = row.status === 'review' || (row.status_label && row.status_label.toLowerCase().includes('review'));
      const statusBadgeClass = isDeficit ? 'deficit' : isReview ? 'tight' : 'healthy';

      return `
        <tr>
          <td>
            <strong>${row.offer_name}</strong>
            <div style="font-size: 11px; color: var(--ink-500);">${row.repayment_type} @ ${row.annual_interest_rate}% APR</div>
            ${bestMonthlyTag} ${lowestCostTag} ${highestResilTag}
          </td>
          <td style="text-align:right;">${AppState.formatMoney(row.principal)}</td>
          <td style="text-align:center;">${row.term_months} mos</td>
          <td style="text-align:right;"><strong>${AppState.formatMoney(row.monthly_repayment)}</strong></td>
          <td style="text-align:right;">${AppState.formatMoney(row.total_repayment)}</td>
          <td style="text-align:right;"><strong style="color:var(--accent);">${AppState.formatMoney(row.total_cost_of_credit)}</strong></td>
          <td style="text-align:right;">${AppState.formatMoney(row.post_credit_buffer)}</td>
          <td style="text-align:right;">${row.debt_service_burden_pct.toFixed(1)}%</td>
          <td style="text-align:center;">
            <span class="badge-status ${statusBadgeClass}">${row.status_label || (row.shock_survivability + ' safe')}</span>
            <div style="font-size:11px;color:var(--ink-500);margin-top:2px;">${row.shock_survivability} safe</div>
          </td>
        </tr>
      `;
    }).join('');

    // Comparative Notes
    const notesDiv = document.getElementById('comparisonNotes');
    notesDiv.innerHTML = compResult.comparative_notes.map(n => `<p>${n}</p>`).join('');

    area.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // Render Transaction CSV Analysis
  renderTransactionAnalysis(data) {
    const resDiv = document.getElementById('txAnalysisResultArea');
    resDiv.style.display = 'block';

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('txCountBadge', `${data.summary.transaction_count} Transactions`);
    setVal('txInflows', AppState.formatMoney(data.summary.total_inflows));
    setVal('txOutflows', AppState.formatMoney(data.summary.total_outflows));
    setVal('txNetCashflow', AppState.formatMoney(data.summary.net_cashflow));
    setVal('txVariabilityEst', `${data.income_variability_est_pct}%`);
    setVal('txDetectedDebt', AppState.formatMoney(data.detected_debt_payments));

    // Insights bullets
    document.getElementById('txInsightsList').innerHTML = data.insights.map(i => `<li>${i}</li>`).join('');

    // Category Tags
    const catContainer = document.getElementById('txCategoryTags');
    catContainer.innerHTML = Object.entries(data.summary.categories).map(([cat, amt]) => `
      <div class="category-tag">
        <span>${cat}:</span> <b>${AppState.formatMoney(amt)}</b>
      </div>
    `).join('');

    // Transaction rows preview (first 10)
    const txBody = document.getElementById('txPreviewTableBody');
    txBody.innerHTML = data.transactions.slice(0, 10).map(t => {
      const isPositive = t.amount > 0;
      const amtStyle = isPositive ? 'color: var(--good-text); font-weight:700;' : 'color: var(--ink-800);';
      const prefix = isPositive ? '+' : '';
      return `
        <tr>
          <td>${t.date}</td>
          <td>${t.description}</td>
          <td><span class="badge-pill" style="font-size:10px;">${t.category}</span></td>
          <td style="${amtStyle}">${prefix}${AppState.formatMoney(t.amount)}</td>
        </tr>
      `;
    }).join('');

    AppState.lastTransactionAnalysis = data;
  },

  // Render Consent Switch Cards
  renderConsentList(consents) {
    const container = document.getElementById('consentsContainer');
    container.innerHTML = consents.map(c => `
      <div class="consent-card">
        <div style="flex:1;">
          <h4>${c.title}</h4>
          <p>${c.description}</p>
          <div style="font-size:12px;color:var(--ink-700);margin-bottom:6px;">
            <strong>Purpose:</strong> ${c.purpose}
          </div>
          <div class="consent-meta">
            <span><strong>Basis:</strong> ${c.legal_basis}</span>
            <span><strong>Retention:</strong> ${c.retention_period}</span>
          </div>
        </div>
        <label class="switch">
          <input type="checkbox" data-source-id="${c.source_id}" ${c.granted ? 'checked' : ''} onchange="App.handleConsentToggle('${c.source_id}', this.checked)">
          <span class="slider"></span>
        </label>
      </div>
    `).join('');
  },

  // Render Audit Trail Logs
  renderAuditTrail(logs) {
    const container = document.getElementById('auditTrailStream');
    if (!logs || logs.length === 0) {
      container.innerHTML = '<div style="color:var(--ink-500);padding:10px;">No audit logs recorded yet.</div>';
      return;
    }
    container.innerHTML = logs.map(l => {
      const dateStr = new Date(l.timestamp).toLocaleTimeString();
      return `
        <div class="audit-entry">
          <span class="time">[${dateStr}]</span>
          <span class="event">${l.event_type}</span>
          <span>actor: ${l.actor} | ${JSON.stringify(l.details)}</span>
        </div>
      `;
    }).join('');
  },

  // Render Partner / Institutional Portal
  renderPartnerPortal(data) {
    const container = document.getElementById('partnerAssessmentsList');
    if (!data.assessments || data.assessments.length === 0) {
      container.innerHTML = '<p class="muted">No assessments currently awaiting underwriter review. Run an assessment in Consumer Mode to generate records.</p>';
      return;
    }

    const policy = AppState.institutionalPolicy;

    container.innerHTML = data.assessments.map((item, idx) => {
      const appType = item.applicant_type || 'Consented Credit Assessment';
      const appName = item.applicant_name ? `${item.applicant_name} — ` : `Assessment #${idx + 1} — `;
      const resilStatus = item.resilience?.resilience_status || 'Needs Review';
      const resilClass = resilStatus === 'Needs Review' ? 'tight' : 'healthy';
      const statusClass = item.status === 'fits' ? 'healthy' : item.status === 'review' ? 'tight' : 'deficit';

      // Dynamic Policy Rule Evaluations
      const burdenPass = item.metrics.debt_service_burden_pct <= policy.maxDebtBurdenPct;
      const bufferPass = item.metrics.post_credit_buffer >= policy.minPostBuffer;
      const runwayMonths = item.metrics.liquid_savings_months !== null && item.metrics.liquid_savings_months !== undefined ? item.metrics.liquid_savings_months : 0;
      const runwayPass = runwayMonths >= policy.minSavingsRunwayMonths;

      const policyPass = burdenPass && bufferPass && runwayPass;
      const policyOverallTag = policyPass
        ? '<span class="compliance-tag pass">Policy Compliant</span>'
        : (!burdenPass || item.metrics.post_credit_buffer < 0)
        ? '<span class="compliance-tag fail">Policy Breach</span>'
        : '<span class="compliance-tag review">Underwriting Review Required</span>';

      const burdenTag = burdenPass
        ? `<span class="compliance-tag pass">Burden &le; ${policy.maxDebtBurdenPct}%</span>`
        : `<span class="compliance-tag fail">Burden ${item.metrics.debt_service_burden_pct.toFixed(1)}% &gt; ${policy.maxDebtBurdenPct}%</span>`;

      const bufferTag = bufferPass
        ? `<span class="compliance-tag pass">Buffer &ge; ${AppState.formatMoney(policy.minPostBuffer)}</span>`
        : item.metrics.post_credit_buffer >= 0
        ? `<span class="compliance-tag review">Buffer ${item.currency} ${item.metrics.post_credit_buffer.toFixed(0)} &lt; ${AppState.formatMoney(policy.minPostBuffer)}</span>`
        : `<span class="compliance-tag fail">Deficit ${item.currency} ${item.metrics.post_credit_buffer.toFixed(0)}</span>`;

      const runwayTag = runwayPass
        ? `<span class="compliance-tag pass">Runway &ge; ${policy.minSavingsRunwayMonths.toFixed(1)} Mo</span>`
        : `<span class="compliance-tag review">Runway ${runwayMonths.toFixed(1)} Mo &lt; ${policy.minSavingsRunwayMonths.toFixed(1)} Mo</span>`;

      // Render Underwriting Decision Box (if decided or open)
      let decisionHtml = '';
      if (item.decision) {
        const decVal = item.decision.decision || 'approved';
        const decClass = decVal === 'approved' ? 'pass' : decVal === 'conditional' ? 'review' : 'fail';
        decisionHtml = `
          <div class="underwriter-decision-box" style="border-left: 3px solid ${decVal === 'approved' ? 'var(--good-text)' : decVal === 'conditional' ? 'var(--warn-text)' : 'var(--deficit-text)'};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
              <span class="compliance-tag ${decClass}">RECORDED: ${decVal.toUpperCase()}</span>
              <span style="font-size:11px;color:var(--ink-500);font-family:var(--font-mono);">${new Date(item.decision.decided_at || Date.now()).toLocaleString()}</span>
            </div>
            <div style="font-size:12.5px;color:var(--ink-800);margin-bottom:4px;">
              <strong>Underwriter Rationale:</strong> ${item.decision.rationale || 'Standard institutional policy determination.'}
            </div>
            <div style="font-size:11px;color:var(--ink-600);">
              Recorded by: <strong>${item.decision.officer_name || 'Senior Underwriter'}</strong>
            </div>
          </div>
        `;
      } else {
        decisionHtml = `
          <div class="underwriter-decision-box">
            <div style="font-size:12px;font-weight:700;color:var(--ink-800);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em;">
              Institutional Underwriting Decision Form
            </div>
            <div style="display:grid;grid-template-columns: 180px 1fr auto; gap:10px; align-items:center;">
              <select id="decAction_${idx}" class="form-input" style="padding:7px 10px;font-size:12.5px;border:1px solid var(--ink-300);border-radius:var(--radius-sm);background:white;">
                <option value="approved">Approve Facility</option>
                <option value="conditional" ${item.status === 'review' ? 'selected' : ''}>Conditional Approval</option>
                <option value="declined" ${item.status === 'deficit' ? 'selected' : ''}>Decline Facility</option>
              </select>
              <input type="text" id="decRationale_${idx}" class="form-input" placeholder="Enter underwriter rationale / stipulations..." value="${item.status_reason ? item.status_reason.slice(0, 75) + '...' : ''}" style="padding:7px 10px;font-size:12.5px;border:1px solid var(--ink-300);border-radius:var(--radius-sm);">
              <button type="button" class="btn-sm btn-primary" onclick="App.submitUnderwriterDecision('${item.id}', ${idx})">
                Record Decision
              </button>
            </div>
          </div>
        `;
      }

      return `
      <div class="panel" style="margin-bottom:1.5rem;border-left:4px solid var(--accent);">
        <div class="panel-header">
          <div>
            <span class="eyebrow-tag">${appType.toUpperCase()}</span>
            <h3 style="margin-top:2px;">${appName}${item.offer.name} (${item.currency} ${item.offer.principal.toLocaleString()})</h3>
            <p style="margin:2px 0 0;font-size:12px;color:var(--ink-500);">Generated: ${new Date(item.generated_at).toLocaleDateString()} • Purpose: ${item.offer.purpose}</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
            ${policyOverallTag}
            <span class="badge-status ${statusClass}">${item.status_label}</span>
          </div>
        </div>

        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
          ${burdenTag}
          ${bufferTag}
          ${runwayTag}
        </div>

        <div class="grid-three-col" style="margin-bottom:1rem;">
          <div class="metric-card">
            <span class="metric-label">Debt-Service Burden</span>
            <span class="metric-value">${item.metrics.debt_service_burden_pct.toFixed(1)}%</span>
            <span class="metric-subtext">Existing debt + new instalment</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Post-Loan Buffer</span>
            <span class="metric-value">${item.currency} ${item.metrics.post_credit_buffer.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            <span class="metric-subtext">After planned savings: ${item.currency} ${(item.metrics.after_savings_buffer !== undefined ? item.metrics.after_savings_buffer : item.metrics.post_credit_buffer).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Resilience Assessment</span>
            <span class="metric-value" style="font-size:18px;"><span class="badge-status ${resilClass}">${resilStatus}</span></span>
            <span class="metric-subtext">${item.resilience?.summary ? item.resilience.summary.slice(0, 52) + '...' : 'Stress tested'}</span>
          </div>
        </div>

        <div class="disclosure-box" style="margin-bottom:0.75rem;">
          <strong>Underwriter Decision Support Note:</strong>
          ${item.status_reason}
        </div>

        ${decisionHtml}

        <div style="font-size:11px;color:var(--ink-500);font-style:italic;margin-top:8px;">
          Institutional Notice: NexusFin provides decision support. Final credit decisions remain with the financial institution.
        </div>
      </div>
    `;
    }).join('');
  },

  openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('active');
  },

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  }
};
