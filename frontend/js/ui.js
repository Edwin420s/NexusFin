/**
 * UI Rendering and DOM Components
 * NexusFin — Financial Decision Support Platform
 */

const UI = {
  // HTML sanitization helper to prevent Cross-Site Scripting (XSS)
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

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
    const curEl = document.getElementById('currencySelect');
    if (curEl && profile.currency) {
      curEl.value = profile.currency;
      AppState.currency = profile.currency;
      this.updateCurrencySymbols();
    }
    if (profile.income) {
      const incEl = document.getElementById('monthlyIncome');
      if (incEl) incEl.value = profile.income.monthly;
      const varEl = document.getElementById('incomeVariability');
      if (varEl) varEl.value = profile.income.variability_pct;
      const varLbl = document.getElementById('variabilityValLabel');
      if (varLbl) varLbl.textContent = `${profile.income.variability_pct}%`;
      const empEl = document.getElementById('employmentType');
      if (empEl && profile.income.employment_type) {
        empEl.value = profile.income.employment_type;
      }
    }
    const expEl = document.getElementById('essentialExpenses');
    if (expEl) expEl.value = profile.essential_expenses || 0;
    const debtEl = document.getElementById('existingDebt');
    if (debtEl) debtEl.value = profile.existing_debt_payments || 0;
    const savEl = document.getElementById('liquidSavings');
    if (savEl) savEl.value = profile.liquid_savings || 0;
    const goalEl = document.getElementById('goalSavings');
    if (goalEl) goalEl.value = profile.goal_savings || 0;
    const depEl = document.getElementById('householdDependents');
    if (depEl && profile.household_dependents !== undefined) {
      depEl.value = profile.household_dependents;
    }
    this.updateLiveCashflowSummary();
  },

  // Fill form inputs from an offer object
  populateOfferForm(offer) {
    if (!offer) return;
    const nameEl = document.getElementById('offerName');
    if (nameEl) nameEl.value = offer.name || 'Proposed Loan';
    const provEl = document.getElementById('providerName');
    if (provEl) provEl.value = offer.provider || 'Inclusive Digital Lender';
    const princEl = document.getElementById('loanPrincipal');
    if (princEl) princEl.value = offer.principal || 35000;
    const rateEl = document.getElementById('interestRate');
    if (rateEl) rateEl.value = offer.annual_interest_rate || 24;
    const termEl = document.getElementById('loanTerm');
    if (termEl) termEl.value = offer.term_months || 10;
    const upfrontEl = document.getElementById('upfrontFee');
    if (upfrontEl) upfrontEl.value = offer.upfront_fee || 0;
    const feeEl = document.getElementById('monthlyFee');
    if (feeEl) feeEl.value = offer.monthly_fee || 0;
    const repEl = document.getElementById('repaymentType');
    if (repEl) repEl.value = offer.repayment_type || 'amortizing';
    const purpEl = document.getElementById('loanPurpose');
    if (purpEl) purpEl.value = offer.purpose || 'Asset Acquisition';
  },

  // Read current profile from form (or fallback to persisted AppState.formProfile)
  readProfileFromForm() {
    const incEl = document.getElementById('monthlyIncome');
    if (!incEl) {
      return AppState.formProfile;
    }

    const curEl = document.getElementById('currencySelect');
    const varEl = document.getElementById('incomeVariability');
    const empEl = document.getElementById('employmentType');
    const expEl = document.getElementById('essentialExpenses');
    const debtEl = document.getElementById('existingDebt');
    const savEl = document.getElementById('liquidSavings');
    const goalEl = document.getElementById('goalSavings');
    const depEl = document.getElementById('householdDependents');

    const profile = {
      currency: curEl ? curEl.value : AppState.currency,
      income: {
        monthly: parseFloat(incEl.value) || 0,
        variability_pct: parseFloat(varEl?.value) || 0,
        employment_type: empEl?.value || 'gig_worker',
      },
      essential_expenses: parseFloat(expEl?.value) || 0,
      existing_debt_payments: parseFloat(debtEl?.value) || 0,
      liquid_savings: parseFloat(savEl?.value) || 0,
      goal_savings: parseFloat(goalEl?.value) || 0,
      household_dependents: parseInt(depEl?.value) || 1,
    };

    AppState.formProfile = profile;
    AppState.currency = profile.currency;
    AppState.save();
    return profile;
  },

  // Read current offer from form (or fallback to persisted AppState.formOffer)
  readOfferFromForm() {
    const princEl = document.getElementById('loanPrincipal');
    if (!princEl) {
      return AppState.formOffer;
    }

    const nameEl = document.getElementById('offerName');
    const provEl = document.getElementById('providerName');
    const rateEl = document.getElementById('interestRate');
    const termEl = document.getElementById('loanTerm');
    const upfrontEl = document.getElementById('upfrontFee');
    const feeEl = document.getElementById('monthlyFee');
    const repEl = document.getElementById('repaymentType');
    const purpEl = document.getElementById('loanPurpose');

    const offer = {
      name: nameEl?.value?.trim() || 'Proposed Credit',
      provider: provEl?.value?.trim() || 'Inclusive Lender',
      principal: parseFloat(princEl.value) || 1000,
      annual_interest_rate: parseFloat(rateEl?.value) || 0,
      term_months: parseInt(termEl?.value) || 1,
      upfront_fee: parseFloat(upfrontEl?.value) || 0,
      monthly_fee: parseFloat(feeEl?.value) || 0,
      repayment_type: repEl?.value || 'amortizing',
      purpose: purpEl?.value || 'Asset Acquisition',
    };

    AppState.formOffer = offer;
    AppState.save();
    return offer;
  },

  // Read current applicant / borrower name from form
  readApplicantNameFromForm() {
    const el = document.getElementById('applicantName');
    if (el && el.value.trim()) {
      AppState.applicantName = el.value.trim();
      AppState.save();
      return AppState.applicantName;
    }
    return AppState.applicantName || 'My Household Profile';
  },

  // Live Household Cash Flow Summary Bar
  updateLiveCashflowSummary() {
    const liveContainer = document.getElementById('liveCashflowSummary');
    if (!liveContainer) return;

    const incEl = document.getElementById('monthlyIncome');
    const expEl = document.getElementById('essentialExpenses');
    const debtEl = document.getElementById('existingDebt');
    const savEl = document.getElementById('liquidSavings');

    const income = incEl ? (parseFloat(incEl.value) || 0) : (AppState.formProfile?.income?.monthly || 0);
    const expenses = expEl ? (parseFloat(expEl.value) || 0) : (AppState.formProfile?.essential_expenses || 0);
    const debt = debtEl ? (parseFloat(debtEl.value) || 0) : (AppState.formProfile?.existing_debt_payments || 0);
    const savings = savEl ? (parseFloat(savEl.value) || 0) : (AppState.formProfile?.liquid_savings || 0);

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
    if (!resArea) return;
    resArea.style.display = 'block';

    const emptyEl = document.getElementById('assessmentEmptyState');
    if (emptyEl) emptyEl.style.display = 'none';

    // Status Banner
    const banner = document.getElementById('statusBanner');
    if (banner) {
      banner.className = `status-banner ${data.status}`;
      const iconHtml = data.status === 'fits'
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : data.status === 'review'
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      const iconBadge = document.getElementById('statusBadgeIcon');
      if (iconBadge) iconBadge.innerHTML = iconHtml;
      const titleEl = document.getElementById('statusTitle');
      if (titleEl) titleEl.textContent = data.status_label;
      const reasonEl = document.getElementById('statusReason');
      if (reasonEl) reasonEl.textContent = data.status_reason;
    }

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

    // Stress Scenarios Table
    const tbody = document.getElementById('stressTableBody');
    if (tbody) {
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
              <strong>${this.escapeHtml(s.name)}</strong>
              <div style="font-size: 11px; color: var(--ink-500);">${this.escapeHtml(s.description)}</div>
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
    }

    // Explainability Lists
    const expList = document.getElementById('explanationList');
    if (expList && data.explanation) expList.innerHTML = data.explanation.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
    const tradeList = document.getElementById('tradeOffsList');
    if (tradeList && data.trade_offs) tradeList.innerHTML = data.trade_offs.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
    const recList = document.getElementById('recommendationsList');
    if (recList && data.recommendations) recList.innerHTML = data.recommendations.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
    const methList = document.getElementById('methodologyList');
    if (methList && data.methodology) methList.innerHTML = data.methodology.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');

    // Synchronize interactive custom shock simulator
    this.updateCustomShock(AppState.customShockPct || -25);
  },

  // Render Multi-Offer Comparison Rows
  renderComparisonConfig(offers) {
    const container = document.getElementById('compareOffersConfigArea');
    if (!container) return;

    container.innerHTML = offers.map((offer, idx) => `
      <div class="offer-config-row" data-index="${idx}">
        <div>
          <label>Offer Name & Provider</label>
          <input type="text" class="comp-input" data-field="name" value="${this.escapeHtml(offer.name)}" placeholder="Loan Name">
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
        AppState.save();
      });
    });
  },

  // Render Comparison Results Table (Key Facts Statement)
  renderComparisonTable(compResult) {
    const area = document.getElementById('comparisonResultsArea');
    if (!area) return;
    area.style.display = 'block';

    const emptyComp = document.getElementById('comparisonEmptyState');
    if (emptyComp) emptyComp.style.display = 'none';

    const tbody = document.getElementById('comparisonTableBody');
    if (!tbody) return;

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
            <strong>${this.escapeHtml(row.offer_name)}</strong>
            <div style="font-size: 11px; color: var(--ink-500);">${this.escapeHtml(row.repayment_type)} @ ${row.annual_interest_rate}% APR</div>
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
            <span class="badge-status ${statusBadgeClass}">${this.escapeHtml(row.status_label || (row.shock_survivability + ' safe'))}</span>
            <div style="font-size:11px;color:var(--ink-500);margin-top:2px;">${row.shock_survivability} safe</div>
          </td>
        </tr>
      `;
    }).join('');

    // Comparative Notes
    const notesDiv = document.getElementById('comparisonNotes');
    if (notesDiv && compResult.comparative_notes) {
      notesDiv.innerHTML = compResult.comparative_notes.map(n => `<p>${this.escapeHtml(n)}</p>`).join('');
    }

    area.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // Render Transaction CSV Analysis
  renderTransactionAnalysis(data) {
    const resDiv = document.getElementById('txAnalysisResultArea');
    if (!resDiv) return;
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
    const insList = document.getElementById('txInsightsList');
    if (insList) insList.innerHTML = data.insights.map(i => `<li>${this.escapeHtml(i)}</li>`).join('');

    // Category Tags
    const catContainer = document.getElementById('txCategoryTags');
    if (catContainer && data.summary.categories) {
      catContainer.innerHTML = Object.entries(data.summary.categories).map(([cat, amt]) => `
        <div class="category-tag">
          <span>${this.escapeHtml(cat)}:</span> <b>${AppState.formatMoney(amt)}</b>
        </div>
      `).join('');
    }

    // Transaction rows preview (first 10)
    const txBody = document.getElementById('txPreviewTableBody');
    if (txBody && data.transactions) {
      txBody.innerHTML = data.transactions.slice(0, 10).map(t => {
        const isPositive = t.amount > 0;
        const amtStyle = isPositive ? 'color: var(--good-text); font-weight:700;' : 'color: var(--ink-800);';
        const prefix = isPositive ? '+' : '';
        return `
          <tr>
            <td>${this.escapeHtml(t.date)}</td>
            <td>${this.escapeHtml(t.description)}</td>
            <td><span class="badge-pill" style="font-size:10px;">${this.escapeHtml(t.category)}</span></td>
            <td style="${amtStyle}">${prefix}${AppState.formatMoney(t.amount)}</td>
          </tr>
        `;
      }).join('');
    }

    AppState.lastTransactionAnalysis = data;
    AppState.save();
  },

  // Render Consent Switch Cards
  renderConsentList(consents) {
    const container = document.getElementById('consentsContainer');
    if (!container) return;

    container.innerHTML = consents.map(c => `
      <div class="consent-card">
        <div style="flex:1;">
          <h4>${this.escapeHtml(c.title)}</h4>
          <p>${this.escapeHtml(c.description)}</p>
          <div style="font-size:12px;color:var(--ink-700);margin-bottom:6px;">
            <strong>Purpose:</strong> ${this.escapeHtml(c.purpose)}
          </div>
          <div class="consent-meta">
            <span><strong>Basis:</strong> ${this.escapeHtml(c.legal_basis)}</span>
            <span><strong>Retention:</strong> ${this.escapeHtml(c.retention_period)}</span>
          </div>
        </div>
        <label class="switch">
          <input type="checkbox" data-source-id="${this.escapeHtml(c.source_id)}" ${c.granted ? 'checked' : ''} onchange="App.handleConsentToggle('${this.escapeHtml(c.source_id)}', this.checked)">
          <span class="slider"></span>
        </label>
      </div>
    `).join('');
  },

  // Show non-blocking SaaS toast notification
  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${this.escapeHtml(message)}</span>
      <button style="background:none;border:none;color:inherit;cursor:pointer;font-size:16px;line-height:1;padding:0 0 0 8px;opacity:0.8;" onclick="this.parentElement.remove();">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  },

  // Render Audit Trail Logs (Clean Enterprise Compliance Stream with XSS escaping)
  renderAuditTrail(logs) {
    const container = document.getElementById('auditTrailStream');
    if (!container) return;

    if (!logs || logs.length === 0) {
      container.innerHTML = '<div style="color:var(--ink-500);padding:1.5rem;text-align:center;">No compliance events recorded in this session yet.</div>';
      return;
    }

    const formatEventTitle = (type) => {
      switch (type) {
        case 'ASSESSMENT_PERFORMED': return 'Affordability Stress Assessment';
        case 'UNDERWRITER_DECISION_RECORDED': return 'Underwriter Decision Logged';
        case 'CONSENT_GRANTED': return 'Data Access Consent Granted';
        case 'CONSENT_REVOKED': return 'Data Access Consent Revoked';
        case 'PARTNER_REVIEW_ACCESSED': return 'Portfolio Queue Inspected';
        case 'TRANSACTIONS_INGESTED': return 'Cash Flow Data Ingested';
        case 'ACCOUNT_REGISTERED': return 'New Account Registered';
        case 'USER_LOGIN': return 'User Authenticated';
        case 'USER_LOGOUT': return 'Session Terminated';
        default: return type.replace(/_/g, ' ');
      }
    };

    const formatActor = (actor) => {
      if (actor === 'consumer') return 'Borrower Self-Service';
      if (actor === 'lending_officer') return 'Credit Committee Officer';
      return this.escapeHtml(actor);
    };

    const formatDetails = (type, d) => {
      if (!d) return 'Operation executed and validated.';
      if (type === 'ASSESSMENT_PERFORMED') {
        const name = this.escapeHtml(d.applicant_name || 'Borrower Profile');
        const cur = this.escapeHtml(d.currency || '');
        const princ = d.principal ? `${cur} ${Number(d.principal).toLocaleString()}` : '';
        const status = this.escapeHtml(d.status ? d.status.toUpperCase() : 'EVALUATED');
        const score = d.resilience_score !== undefined ? ` • Resilience Index: ${d.resilience_score}/100` : '';
        return `Evaluated credit affordability and 6 stress scenarios for <strong>${name}</strong> (${princ}). Outcome: <strong>${status}</strong>${score}.`;
      }
      if (type === 'UNDERWRITER_DECISION_RECORDED') {
        const dec = this.escapeHtml(d.decision ? d.decision.toUpperCase() : 'DECIDED');
        const app = this.escapeHtml(d.applicant || 'Record');
        const rat = d.rationale ? `Rationale: "${this.escapeHtml(d.rationale)}"` : '';
        return `Recorded institutional facility disposition <strong>${dec}</strong> for <strong>${app}</strong>. ${rat}`;
      }
      if (type === 'ACCOUNT_REGISTERED') {
        return `New user account created for <strong>${this.escapeHtml(d.email)}</strong> with role: <strong>${this.escapeHtml(d.role)}</strong>.`;
      }
      if (type === 'USER_LOGIN') {
        return `Session established for <strong>${this.escapeHtml(d.email)}</strong> (${this.escapeHtml(d.role)}).`;
      }
      if (type === 'USER_LOGOUT') {
        return `Active session terminated for user ${this.escapeHtml(d.user_id)}.`;
      }
      if (type === 'CONSENT_GRANTED' || type === 'CONSENT_REVOKED') {
        const title = this.escapeHtml(d.title || d.source_id || 'Data Source');
        const status = d.status === 'granted' ? 'active authorization' : 'permission revoked';
        return `Data access rights for <strong>${title}</strong> updated to <strong>${status}</strong>.`;
      }
      if (type === 'PARTNER_REVIEW_ACCESSED') {
        const count = d.records_reviewed || 0;
        return `Authorized credit underwriter accessed active portfolio queue (${count} consented records inspected).`;
      }
      if (type === 'TRANSACTIONS_INGESTED') {
        return `Ingested transaction statement records (${this.escapeHtml(d.filename || 'export.csv')}) for cash-flow volatility modeling.`;
      }
      return Object.entries(d)
        .map(([k, v]) => `<strong>${this.escapeHtml(k.replace(/_/g, ' '))}:</strong> ${this.escapeHtml(v)}`)
        .join(' • ');
    };

    container.innerHTML = logs.map(l => {
      const dateStr = new Date(l.timestamp).toLocaleTimeString();
      const eventTitle = formatEventTitle(l.event_type);
      const actorLabel = formatActor(l.actor);
      const narrative = formatDetails(l.event_type, l.details);

      return `
        <div class="audit-entry-card">
          <div class="audit-entry-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="audit-badge-event">${eventTitle}</span>
              <span class="audit-badge-actor">${actorLabel}</span>
            </div>
            <span class="audit-timestamp">${dateStr}</span>
          </div>
          <div class="audit-entry-narrative">
            ${narrative}
          </div>
        </div>
      `;
    }).join('');
  },

  // Render Partner / Institutional Portal
  renderPartnerPortal(data) {
    const container = document.getElementById('partnerAssessmentsList');
    if (!container) return;

    if (!data.assessments || data.assessments.length === 0) {
      container.innerHTML = '<p class="muted">No assessments currently awaiting underwriter review. Run an assessment in Borrower Mode to generate records.</p>';
      return;
    }

    const policy = AppState.institutionalPolicy;

    container.innerHTML = data.assessments.map((item, idx) => {
      const appType = this.escapeHtml(item.applicant_type || 'Consented Credit Assessment');
      const appName = item.applicant_name ? `${this.escapeHtml(item.applicant_name)} — ` : `Assessment #${idx + 1} — `;
      const resilStatus = this.escapeHtml(item.resilience?.resilience_status || 'Needs Review');
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
              <span class="compliance-tag ${decClass}">RECORDED: ${this.escapeHtml(decVal.toUpperCase())}</span>
              <span style="font-size:11px;color:var(--ink-500);font-family:var(--font-mono);">${new Date(item.decision.decided_at || Date.now()).toLocaleString()}</span>
            </div>
            <div style="font-size:12.5px;color:var(--ink-800);margin-bottom:4px;">
              <strong>Underwriter Rationale:</strong> ${this.escapeHtml(item.decision.rationale || 'Standard institutional policy determination.')}
            </div>
            <div style="font-size:11px;color:var(--ink-600);">
              Recorded by: <strong>${this.escapeHtml(item.decision.officer_name || 'Senior Underwriter')}</strong>
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
              <input type="text" id="decRationale_${idx}" class="form-input" placeholder="Enter underwriter rationale / stipulations..." value="${this.escapeHtml(item.status_reason ? item.status_reason.slice(0, 75) + '...' : '')}" style="padding:7px 10px;font-size:12.5px;border:1px solid var(--ink-300);border-radius:var(--radius-sm);">
              <button type="button" class="btn-sm btn-primary" onclick="App.submitUnderwriterDecision('${this.escapeHtml(item.id)}', ${idx})">
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
            <span class="eyebrow-tag">${appType}</span>
            <h3 style="margin-top:2px;">${appName}${this.escapeHtml(item.offer.name)} (${item.currency} ${item.offer.principal.toLocaleString()})</h3>
            <p style="margin:2px 0 0;font-size:12px;color:var(--ink-500);">Generated: ${new Date(item.generated_at).toLocaleDateString()} • Purpose: ${this.escapeHtml(item.offer.purpose)}</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
            ${policyOverallTag}
            <span class="badge-status ${statusClass}">${this.escapeHtml(item.status_label)}</span>
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
            <span class="metric-subtext">${item.resilience?.summary ? this.escapeHtml(item.resilience.summary.slice(0, 52)) + '...' : 'Stress tested'}</span>
          </div>
        </div>

        <div class="disclosure-box" style="margin-bottom:0.75rem;">
          <strong>Underwriter Decision Support Note:</strong>
          ${this.escapeHtml(item.status_reason)}
        </div>

        ${decisionHtml}

        <div style="font-size:11px;color:var(--ink-500);font-style:italic;margin-top:8px;">
          Institutional Notice: NexusFin provides decision support. Final credit decisions remain with the financial institution.
        </div>
      </div>
    `;
    }).join('');
  },

  // Update Header Authentication Indicator
  updateAuthDisplay() {
    const controls = document.querySelector('.header-controls');
    if (!controls) return;

    let authEl = document.getElementById('headerAuthBar');
    if (!authEl) {
      authEl = document.createElement('div');
      authEl.id = 'headerAuthBar';
      authEl.style.display = 'flex';
      authEl.style.alignItems = 'center';
      authEl.style.gap = '8px';
      controls.appendChild(authEl);
    }

    if (AppState.currentUser) {
      const u = AppState.currentUser;
      const roleLabel = u.role === 'underwriter' ? 'Underwriter' : 'Borrower';
      authEl.innerHTML = `
        <span class="badge-pill" style="font-size:11.5px;padding:4px 10px;background:var(--accent-soft);color:var(--accent);font-weight:600;">
          ${this.escapeHtml(u.full_name)} (${roleLabel})
        </span>
        <button type="button" class="btn-sm btn-ghost" id="signOutBtn" style="padding:4px 8px;font-size:11.5px;cursor:pointer;">
          Sign Out
        </button>
      `;
      document.getElementById('signOutBtn')?.addEventListener('click', () => {
        App.handleLogout();
      });
    } else {
      authEl.innerHTML = `
        <button type="button" class="btn-hero btn-outline" id="openAuthModalBtn" style="padding:5px 12px;font-size:12px;cursor:pointer;">
          Sign In / Create Account
        </button>
      `;
      document.getElementById('openAuthModalBtn')?.addEventListener('click', () => {
        this.openAuthModal('register');
      });
    }
  },

  // Open Auth Modal (Register or Login)
  openAuthModal(defaultTab = 'register') {
    let modal = document.getElementById('authModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'authModal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-card" style="max-width:440px;width:90%;background:white;border-radius:var(--radius-lg);padding:24px;box-shadow:var(--shadow-xl);border:1px solid var(--ink-200);position:relative;">
          <button type="button" id="closeAuthModalX" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink-500);">&times;</button>
          
          <div style="display:flex;gap:12px;border-bottom:1px solid var(--ink-200);margin-bottom:18px;">
            <button type="button" id="tabAuthRegister" class="tab-nav-btn active" style="padding:8px 4px;font-size:13.5px;cursor:pointer;">Create Account</button>
            <button type="button" id="tabAuthLogin" class="tab-nav-btn" style="padding:8px 4px;font-size:13.5px;cursor:pointer;">Sign In</button>
          </div>

          <!-- Register Form Pane -->
          <div id="paneAuthRegister">
            <h3 style="margin:0 0 4px;font-size:17px;color:var(--ink-900);">Create NexusFin Account</h3>
            <p style="margin:0 0 14px;font-size:12.5px;color:var(--ink-500);">Secure account creation for borrowers and institutional underwriters.</p>
            
            <div class="form-group" style="margin-bottom:10px;">
              <label for="regFullName" style="font-size:12px;font-weight:600;">Full Name</label>
              <input type="text" id="regFullName" class="form-input" placeholder="e.g. Maria Santos" style="width:100%;padding:8px 10px;font-size:13px;border:1px solid var(--ink-300);border-radius:var(--radius-sm);">
            </div>

            <div class="form-group" style="margin-bottom:10px;">
              <label for="regEmail" style="font-size:12px;font-weight:600;">Email Address</label>
              <input type="email" id="regEmail" class="form-input" placeholder="name@example.com" style="width:100%;padding:8px 10px;font-size:13px;border:1px solid var(--ink-300);border-radius:var(--radius-sm);">
            </div>

            <div class="form-group" style="margin-bottom:10px;">
              <label for="regPassword" style="font-size:12px;font-weight:600;">Password (min 8 chars, 1 digit or symbol)</label>
              <input type="password" id="regPassword" class="form-input" placeholder="••••••••" style="width:100%;padding:8px 10px;font-size:13px;border:1px solid var(--ink-300);border-radius:var(--radius-sm);">
            </div>

            <div class="form-group" style="margin-bottom:14px;">
              <label for="regRole" style="font-size:12px;font-weight:600;">Account Purpose</label>
              <select id="regRole" style="width:100%;padding:8px 10px;font-size:13px;border:1px solid var(--ink-300);border-radius:var(--radius-sm);background:white;">
                <option value="borrower" selected>Borrower / Small Business (Self-Service)</option>
                <option value="underwriter">Institutional Underwriter / Credit Officer</option>
              </select>
            </div>

            <button type="button" id="btnSubmitRegister" class="btn-primary" style="width:100%;padding:10px;font-size:13.5px;cursor:pointer;">
              Create Free Account
            </button>
          </div>

          <!-- Login Form Pane -->
          <div id="paneAuthLogin" style="display:none;">
            <h3 style="margin:0 0 4px;font-size:17px;color:var(--ink-900);">Sign In</h3>
            <p style="margin:0 0 14px;font-size:12.5px;color:var(--ink-500);">Access your saved financial profile and assessment history.</p>

            <div class="form-group" style="margin-bottom:10px;">
              <label for="loginEmail" style="font-size:12px;font-weight:600;">Email Address</label>
              <input type="email" id="loginEmail" class="form-input" placeholder="name@example.com" style="width:100%;padding:8px 10px;font-size:13px;border:1px solid var(--ink-300);border-radius:var(--radius-sm);">
            </div>

            <div class="form-group" style="margin-bottom:14px;">
              <label for="loginPassword" style="font-size:12px;font-weight:600;">Password</label>
              <input type="password" id="loginPassword" class="form-input" placeholder="••••••••" style="width:100%;padding:8px 10px;font-size:13px;border:1px solid var(--ink-300);border-radius:var(--radius-sm);">
            </div>

            <button type="button" id="btnSubmitLogin" class="btn-primary" style="width:100%;padding:10px;font-size:13.5px;cursor:pointer;">
              Sign In
            </button>
          </div>

          <!-- Quick Test Demo Logins -->
          <div style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--ink-200);">
            <div style="font-size:11.5px;font-weight:700;color:var(--ink-500);text-transform:uppercase;margin-bottom:8px;letter-spacing:0.04em;">
              Quick 1-Click Demo Profiles:
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" id="quickDemoBorrower" class="btn-sm btn-outline" style="flex:1;font-size:11.5px;padding:6px;">Demo Borrower</button>
              <button type="button" id="quickDemoUnderwriter" class="btn-sm btn-outline" style="flex:1;font-size:11.5px;padding:6px;">Demo Underwriter</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Event bindings inside modal
      document.getElementById('closeAuthModalX')?.addEventListener('click', () => this.closeAuthModal());
      document.getElementById('tabAuthRegister')?.addEventListener('click', () => this.switchAuthTab('register'));
      document.getElementById('tabAuthLogin')?.addEventListener('click', () => this.switchAuthTab('login'));

      document.getElementById('btnSubmitRegister')?.addEventListener('click', () => App.handleRegister());
      document.getElementById('btnSubmitLogin')?.addEventListener('click', () => App.handleLogin());

      document.getElementById('quickDemoBorrower')?.addEventListener('click', () => {
        App.handleQuickLogin('borrower@nexusfin.org', 'NexusBorrower123!');
      });
      document.getElementById('quickDemoUnderwriter')?.addEventListener('click', () => {
        App.handleQuickLogin('underwriter@nexusfin.org', 'NexusOfficer123!');
      });
    }

    this.switchAuthTab(defaultTab);
    modal.style.display = 'flex';
  },

  switchAuthTab(tab) {
    const tabReg = document.getElementById('tabAuthRegister');
    const tabLog = document.getElementById('tabAuthLogin');
    const paneReg = document.getElementById('paneAuthRegister');
    const paneLog = document.getElementById('paneAuthLogin');

    if (tab === 'register') {
      tabReg?.classList.add('active');
      tabLog?.classList.remove('active');
      if (paneReg) paneReg.style.display = 'block';
      if (paneLog) paneLog.style.display = 'none';
    } else {
      tabLog?.classList.add('active');
      tabReg?.classList.remove('active');
      if (paneLog) paneLog.style.display = 'block';
      if (paneReg) paneReg.style.display = 'none';
    }
  },

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
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
