/**
 * NexusFin Main Application Controller
 */

const App = {
  async init() {
    this.bindEvents();
    UI.updateCurrencySymbols();

    try {
      // 1. Fetch Presets for example loader
      const presetsRes = await API.fetchPresets();
      AppState.presets = presetsRes.presets || [];
      this.populatePresetDropdown(AppState.presets);

      // Run baseline initial assessment
      this.runAssessment();

      // 2. Fetch Consents & Audit Trail
      this.refreshConsents();
      this.refreshAuditLog();

      // 3. Setup default comparison offers
      this.initComparisonOffers();
    } catch (err) {
      console.warn('Initialization note:', err);
    }
  },

  bindEvents() {
    // Tab Navigation
    document.querySelectorAll('.tab-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = e.currentTarget.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // View Mode Toggle (Consumer vs Partner)
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchViewMode(mode);
      });
    });

    // Currency Change
    const currencyEl = document.getElementById('currencySelect');
    if (currencyEl) {
      currencyEl.addEventListener('change', (e) => {
        AppState.currency = e.target.value;
        UI.updateCurrencySymbols();
        this.initComparisonOffers();
        if (AppState.currentAssessment) {
          this.runAssessment();
        }
      });
    }

    // Example Profile Preset Change
    const presetEl = document.getElementById('presetSelect');
    if (presetEl) {
      presetEl.addEventListener('change', (e) => {
        const pid = e.target.value;
        if (pid) {
          this.selectPreset(pid);
          this.runAssessment();
        }
      });
    }

    // Clear Form Button
    const clearBtn = document.getElementById('clearProfileBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearProfile();
      });
    }

    // Download CSV Template Button
    const downloadCsvBtn = document.getElementById('downloadCsvTemplateBtn');
    if (downloadCsvBtn) {
      downloadCsvBtn.addEventListener('click', () => {
        this.downloadCsvTemplate();
      });
    }

    // Income Variability Slider sync
    const varSlider = document.getElementById('incomeVariability');
    if (varSlider) {
      varSlider.addEventListener('input', (e) => {
        document.getElementById('variabilityValLabel').textContent = `${e.target.value}%`;
      });
    }

    // Assess Button
    document.getElementById('assessBtn')?.addEventListener('click', () => {
      this.runAssessment();
    });

    // Compare Offers Buttons
    document.getElementById('addOfferBtn')?.addEventListener('click', () => {
      this.addCompareOffer();
    });

    document.getElementById('runCompareBtn')?.addEventListener('click', () => {
      this.runComparison();
    });

    // Transaction Ingestion File Upload
    const fileInput = document.getElementById('txFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    // Apply Detected Transaction Data to Profile Button
    document.getElementById('applyDetectedBtn')?.addEventListener('click', () => {
      this.applyDetectedDataToProfile();
    });

    // Hero Action Buttons
    document.getElementById('heroViewMethodologyBtn')?.addEventListener('click', () => {
      this.switchTab('methodology');
    });

    document.getElementById('heroPrintReportBtn')?.addEventListener('click', () => {
      window.print();
    });
  },

  switchTab(tabId) {
    // Alias pitchdeck to methodology
    const resolvedId = (tabId === 'pitchdeck') ? 'methodology' : tabId;
    AppState.activeTab = resolvedId;

    document.querySelectorAll('.tab-nav-btn').forEach(b => {
      const bTab = b.dataset.tab;
      const bResolved = (bTab === 'pitchdeck') ? 'methodology' : bTab;
      b.classList.toggle('active', bResolved === resolvedId);
    });

    document.querySelectorAll('.tab-pane').forEach(p => {
      const pId = p.id;
      const pResolved = (pId === 'pitchdeck') ? 'methodology' : pId;
      p.classList.toggle('active', pResolved === resolvedId);
    });

    // Trigger on-demand tab refreshes
    if (resolvedId === 'privacy') {
      this.refreshConsents();
      this.refreshAuditLog();
    } else if (resolvedId === 'partner') {
      this.refreshPartnerPortal();
    }
  },

  switchViewMode(mode) {
    AppState.viewMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    if (mode === 'partner') {
      this.switchTab('partner');
    } else {
      this.switchTab('assessment');
    }
  },

  populatePresetDropdown(presets) {
    const select = document.getElementById('presetSelect');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Load Example Profile...</option>' +
      presets.map(p => `
        <option value="${p.id}">${p.label}</option>
      `).join('');
  },

  clearProfile() {
    document.getElementById('monthlyIncome').value = '';
    document.getElementById('incomeVariability').value = '15';
    document.getElementById('variabilityValLabel').textContent = '15%';
    document.getElementById('essentialExpenses').value = '';
    document.getElementById('existingDebt').value = '';
    document.getElementById('liquidSavings').value = '';
    document.getElementById('goalSavings').value = '';
    document.getElementById('householdDependents').value = '1';
    document.getElementById('offerName').value = '';
    document.getElementById('providerName').value = '';
    document.getElementById('loanPrincipal').value = '';
    document.getElementById('interestRate').value = '';
    document.getElementById('loanTerm').value = '';
    document.getElementById('upfrontFee').value = '0';
    document.getElementById('monthlyFee').value = '0';
    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect) presetSelect.value = '';
    const resArea = document.getElementById('assessmentResultsArea');
    if (resArea) resArea.style.display = 'none';
    AppState.currentAssessment = null;
    document.getElementById('monthlyIncome').focus();
  },

  downloadCsvTemplate() {
    const csvContent = "date,description,amount\n" +
      "2026-09-01,Client Consulting Payment,35000\n" +
      "2026-09-03,Supermarket Groceries,-4200\n" +
      "2026-09-05,Electricity & Water Utilities,-2100\n" +
      "2026-09-08,Residential Rent,-12000\n" +
      "2026-09-12,Equipment Installment Debit,-3500\n" +
      "2026-09-15,Digital Invoice Payout,28000\n" +
      "2026-09-20,Internet Subscription,-1500\n" +
      "2026-09-25,Emergency Buffer Stash,-5000\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nexusfin_transaction_statement_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  selectPreset(presetId) {
    const p = AppState.presets.find(x => x.id === presetId);
    if (!p) return;
    UI.populateProfileForm(p.profile);
    UI.populateOfferForm(p.offer);
    this.initComparisonOffers();
  },

  async runAssessment() {
    const assessBtn = document.getElementById('assessBtn');
    assessBtn.disabled = true;
    assessBtn.textContent = 'Calculating Affordability & Stress Scenarios...';

    try {
      const profile = UI.readProfileFromForm();
      const offer = UI.readOfferFromForm();
      const res = await API.assess(profile, offer);
      AppState.currentAssessment = res;
      UI.renderAssessmentResult(res);
      this.refreshAuditLog();
    } catch (err) {
      alert(`Assessment failed: ${err.message}`);
    } finally {
      assessBtn.disabled = false;
      assessBtn.innerHTML = 'Assess Affordability & Resilience';
    }
  },

  initComparisonOffers() {
    const currentOffer = UI.readOfferFromForm();
    AppState.comparedOffers = [
      {
        ...currentOffer,
        name: `${currentOffer.name} (Option A)`,
      },
      {
        name: 'Community SACCO / Co-op Loan (Option B)',
        provider: 'Community Cooperative',
        principal: currentOffer.principal,
        annual_interest_rate: Math.max(8, currentOffer.annual_interest_rate - 6),
        term_months: Math.min(24, currentOffer.term_months + 6),
        upfront_fee: 300,
        monthly_fee: 0,
        repayment_type: 'amortizing',
        purpose: currentOffer.purpose,
      },
      {
        name: 'Digital Nano-Loan Flat Rate (Option C)',
        provider: 'Fast Instant App',
        principal: currentOffer.principal,
        annual_interest_rate: currentOffer.annual_interest_rate + 4,
        term_months: Math.max(6, currentOffer.term_months - 4),
        upfront_fee: 800,
        monthly_fee: 100,
        repayment_type: 'flat',
        purpose: currentOffer.purpose,
      }
    ];
    UI.renderComparisonConfig(AppState.comparedOffers);
  },

  addCompareOffer() {
    if (AppState.comparedOffers.length >= 5) {
      alert('Maximum of 5 offers can be compared simultaneously.');
      return;
    }
    const basePrincipal = parseFloat(document.getElementById('loanPrincipal').value) || 30000;
    AppState.comparedOffers.push({
      name: `Custom Option ${AppState.comparedOffers.length + 1}`,
      provider: 'Alternative Lender',
      principal: basePrincipal,
      annual_interest_rate: 16.0,
      term_months: 12,
      upfront_fee: 0,
      monthly_fee: 0,
      repayment_type: 'amortizing',
      purpose: 'Working Capital / MSME',
    });
    UI.renderComparisonConfig(AppState.comparedOffers);
  },

  removeCompareOffer(index) {
    if (AppState.comparedOffers.length <= 1) {
      alert('You must compare at least 1 credit offer.');
      return;
    }
    AppState.comparedOffers.splice(index, 1);
    UI.renderComparisonConfig(AppState.comparedOffers);
  },

  async runComparison() {
    const compBtn = document.getElementById('runCompareBtn');
    compBtn.disabled = true;
    compBtn.textContent = 'Comparing Offers...';

    try {
      const profile = UI.readProfileFromForm();
      const res = await API.compare(profile, AppState.comparedOffers);
      UI.renderComparisonTable(res);
      this.refreshAuditLog();
    } catch (err) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      compBtn.disabled = false;
      compBtn.textContent = 'Generate Key Facts Comparison';
    }
  },

  async loadSampleDataset(personaKey) {
    try {
      const data = await API.getSampleTransactions(personaKey);
      AppState.lastTransactionAnalysis = data;
      UI.renderTransactionAnalysis(data);
      this.refreshAuditLog();
    } catch (err) {
      alert(`Failed to load sample data: ${err.message}`);
    }
  },

  async handleFileUpload(file) {
    try {
      const data = await API.uploadTransactions(file);
      AppState.lastTransactionAnalysis = data;
      UI.renderTransactionAnalysis(data);
      this.refreshAuditLog();
    } catch (err) {
      alert(`CSV Upload Failed: ${err.message}`);
    }
  },

  applyDetectedDataToProfile() {
    if (!AppState.lastTransactionAnalysis) {
      alert('Analyze a transaction CSV first before applying.');
      return;
    }
    const d = AppState.lastTransactionAnalysis;
    document.getElementById('monthlyIncome').value = d.detected_income;
    document.getElementById('incomeVariability').value = d.income_variability_est_pct;
    document.getElementById('variabilityValLabel').textContent = `${d.income_variability_est_pct}%`;
    document.getElementById('essentialExpenses').value = d.detected_expenses;
    document.getElementById('existingDebt').value = d.detected_debt_payments;

    alert('Profile updated with detected transaction values! Switched to Assessment tab.');
    this.switchTab('assessment');
  },

  async refreshConsents() {
    try {
      const res = await API.getConsents();
      UI.renderConsentList(res.consents || []);
    } catch (err) {
      console.error('Failed to load consents:', err);
    }
  },

  async handleConsentToggle(sourceId, granted) {
    try {
      await API.updateConsent(sourceId, granted);
      this.refreshAuditLog();
    } catch (err) {
      alert(`Could not update consent: ${err.message}`);
    }
  },

  async refreshAuditLog() {
    try {
      const res = await API.getAuditLog();
      UI.renderAuditTrail(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit log:', err);
    }
  },

  async refreshPartnerPortal() {
    try {
      const data = await API.getPartnerAssessments();
      UI.renderPartnerPortal(data);
    } catch (err) {
      console.error('Failed to load partner records:', err);
    }
  }
};

// Bootstrap application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
