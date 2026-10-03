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

  // Render Full Assessment Results
  renderAssessmentResult(data) {
    const resArea = document.getElementById('assessmentResultsArea');
    resArea.style.display = 'block';

    // Status Banner
    const banner = document.getElementById('statusBanner');
    banner.className = `status-banner ${data.status}`;
    const iconChar = data.status === 'fits' ? '✓' : data.status === 'review' ? '!' : '✕';
    document.getElementById('statusBadgeIcon').textContent = iconChar;
    document.getElementById('statusTitle').textContent = data.status_label;
    document.getElementById('statusReason').textContent = data.status_reason;

    // Metrics Row
    const sym = data.currency_symbol || AppState.getSymbol();
    document.getElementById('valMonthlyPayment').textContent = AppState.formatMoney(data.metrics.monthly_repayment);
    document.getElementById('valTotalRepayment').textContent = AppState.formatMoney(data.metrics.total_repayment);
    document.getElementById('valTotalCost').textContent = AppState.formatMoney(data.metrics.total_cost_of_credit);
    document.getElementById('valPostBuffer').textContent = AppState.formatMoney(data.metrics.post_credit_buffer);
    document.getElementById('valDebtBurden').textContent = `${data.metrics.debt_service_burden_pct}%`;

    // Savings runway subtext
    const savingsTxt = data.metrics.liquid_savings_months !== null
      ? `${data.metrics.liquid_savings_months.toFixed(1)} months reserve`
      : 'No savings buffer';
    document.getElementById('valSavingsRunway').textContent = savingsTxt;

    // Resilience Dial
    document.getElementById('resilienceScoreNum').textContent = data.resilience.total_score;
    document.getElementById('resilienceTierName').textContent = data.resilience.tier;
    document.getElementById('resilienceSummaryText').textContent = data.resilience.summary;
    document.getElementById('scoreBufferPts').textContent = `${data.resilience.buffer_adequacy_pts}/30`;
    document.getElementById('scoreDebtPts').textContent = `${data.resilience.debt_burden_pts}/25`;
    document.getElementById('scoreReservePts').textContent = `${data.resilience.emergency_reserve_pts}/25`;
    document.getElementById('scoreStabilityPts').textContent = `${data.resilience.income_stability_pts}/20`;

    // Stress Scenarios Table
    const tbody = document.getElementById('stressTableBody');
    tbody.innerHTML = data.scenarios.map(s => {
      const bufferClass = s.is_positive ? 'badge-status healthy' : 'badge-status deficit';
      const bufferLabel = s.is_positive ? `+${AppState.formatMoney(s.buffer)}` : AppState.formatMoney(s.buffer);
      return `
        <tr>
          <td>
            <strong>${s.name}</strong>
            <div style="font-size: 11px; color: var(--ink-500);">${s.description}</div>
          </td>
          <td>${AppState.formatMoney(s.income)}</td>
          <td>${AppState.formatMoney(s.expenses)}</td>
          <td><strong>${AppState.formatMoney(s.monthly_repayment)}</strong></td>
          <td><span class="${bufferClass}">${bufferLabel}</span></td>
          <td>${s.debt_service_burden_pct.toFixed(1)}%</td>
          <td><span class="badge-status ${s.status}">${s.status}</span></td>
        </tr>
      `;
    }).join('');

    // Explainability Lists
    document.getElementById('explanationList').innerHTML = data.explanation.map(item => `<li>${item}</li>`).join('');
    document.getElementById('tradeOffsList').innerHTML = data.trade_offs.map(item => `<li>${item}</li>`).join('');
    document.getElementById('recommendationsList').innerHTML = data.recommendations.map(item => `<li>${item}</li>`).join('');
    document.getElementById('methodologyList').innerHTML = data.methodology.map(item => `<li>${item}</li>`).join('');

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
          <button class="btn-remove-offer" onclick="App.removeCompareOffer(${idx})" title="Remove offer">✕</button>
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

      return `
        <tr>
          <td>
            <strong>${row.offer_name}</strong>
            <div style="font-size: 11px; color: var(--ink-500);">${row.repayment_type} @ ${row.annual_interest_rate}% APR</div>
            ${bestMonthlyTag} ${lowestCostTag} ${highestResilTag}
          </td>
          <td>${AppState.formatMoney(row.principal)}</td>
          <td>${row.term_months} mos</td>
          <td><strong>${AppState.formatMoney(row.monthly_repayment)}</strong></td>
          <td>${AppState.formatMoney(row.total_repayment)}</td>
          <td><strong style="color:var(--accent);">${AppState.formatMoney(row.total_cost_of_credit)}</strong></td>
          <td>${AppState.formatMoney(row.post_credit_buffer)}</td>
          <td>${row.debt_service_burden_pct.toFixed(1)}%</td>
          <td>
            <strong>${row.resilience_score}/100</strong>
            <div style="font-size:11px;color:var(--ink-500);">${row.shock_survivability} shocks safe</div>
          </td>
        </tr>
      `;
    }).join('');

    // Comparative Notes
    const notesDiv = document.getElementById('comparisonNotes');
    notesDiv.innerHTML = compResult.comparative_notes.map(n => `<p>💡 ${n}</p>`).join('');

    area.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // Render Transaction CSV Analysis
  renderTransactionAnalysis(data) {
    const resDiv = document.getElementById('txAnalysisResultArea');
    resDiv.style.display = 'block';

    document.getElementById('txCountBadge').textContent = `${data.summary.transaction_count} Transactions`;
    document.getElementById('txInflows').textContent = AppState.formatMoney(data.summary.total_inflows);
    document.getElementById('txOutflows').textContent = AppState.formatMoney(data.summary.total_outflows);
    document.getElementById('txNetCashflow').textContent = AppState.formatMoney(data.summary.net_cashflow);
    document.getElementById('txVariabilityEst').textContent = `${data.income_variability_est_pct}%`;
    document.getElementById('txDetectedDebt').textContent = AppState.formatMoney(data.detected_debt_payments);

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

    container.innerHTML = data.assessments.map((item, idx) => `
      <div class="panel" style="margin-bottom:1.5rem;border-left:4px solid var(--accent);">
        <div class="panel-header">
          <div>
            <span class="eyebrow-tag">CONSENTED APPLICANT FILE #${idx + 1}</span>
            <h3>${item.offer.name} (${item.currency} ${item.offer.principal.toLocaleString()})</h3>
            <p>Generated: ${new Date(item.generated_at).toLocaleString()} • Purpose: ${item.offer.purpose}</p>
          </div>
          <div>
            <span class="badge-status ${item.status}">${item.status_label}</span>
          </div>
        </div>
        <div class="grid-three-col" style="margin-bottom:1rem;">
          <div class="metric-card">
            <span class="metric-label">Debt-Service Burden</span>
            <span class="metric-value">${item.metrics.debt_service_burden_pct}%</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Post-Loan Buffer</span>
            <span class="metric-value">${item.currency} ${item.metrics.post_credit_buffer.toLocaleString()}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Resilience Score</span>
            <span class="metric-value">${item.resilience.total_score}/100</span>
          </div>
        </div>
        <div class="disclosure-box">
          <strong>Underwriter Decision Support Note:</strong>
          ${item.status_reason}
        </div>
      </div>
    `).join('');
  }
};
