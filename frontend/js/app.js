/**
 * NexusFin Main Application Controller
 * Handles Multi-Page Workspaces, Persistence, and Interactive Flows
 */

const App = {
  async init() {
    AppState.load();
    this.bindEvents();
    UI.updateCurrencySymbols();
    UI.updateAuthDisplay();

    // Verify token validity in background if session exists
    if (AppState.authToken) {
      API.getMe().then(user => {
        AppState.currentUser = user;
        AppState.save();
        UI.updateAuthDisplay();
      }).catch(() => {
        AppState.clearAuth();
        UI.updateAuthDisplay();
      });
    }

    // Populate profile & offer forms if present on current page
    if (document.getElementById('monthlyIncome')) {
      UI.populateProfileForm(AppState.formProfile);
      UI.populateOfferForm(AppState.formOffer);
      if (AppState.applicantName) {
        const nameEl = document.getElementById('applicantName');
        if (nameEl) nameEl.value = AppState.applicantName;
      }
      UI.updateLiveCashflowSummary();
    }

    UI.updatePolicyThresholdLabels();

    // Rehydrate existing assessment if on assessment page
    if (AppState.currentAssessment && document.getElementById('assessmentResultsArea')) {
      UI.renderAssessmentResult(AppState.currentAssessment);
    }

    try {
      // 1. Fetch Presets if preset dropdown exists
      if (document.getElementById('presetSelect')) {
        const presetsRes = await API.fetchPresets();
        AppState.presets = presetsRes.presets || [];
        this.populatePresetDropdown(AppState.presets);
      }

      // 2. Fetch Consents & Audit Trail if on governance page
      if (document.getElementById('consentsContainer')) {
        await this.refreshConsents();
      }
      if (document.getElementById('auditTrailStream')) {
        await this.refreshAuditLog();
      }

      // 3. Setup comparison offers if on compare page
      if (document.getElementById('compareOffersConfigArea')) {
        if (!AppState.comparedOffers || AppState.comparedOffers.length === 0) {
          this.initComparisonOffers();
        } else {
          UI.renderComparisonConfig(AppState.comparedOffers);
        }
      }

      // 4. If on underwriter page, fetch partner assessments
      if (document.getElementById('partnerAssessmentsList')) {
        await this.refreshPartnerPortal();
      }

      // 5. If previous transaction analysis exists and on transactions page, render it
      if (AppState.lastTransactionAnalysis && document.getElementById('txAnalysisResultArea')) {
        UI.renderTransactionAnalysis(AppState.lastTransactionAnalysis);
      }
    } catch (err) {
      console.warn('Initialization note:', err);
    }
  },

  bindEvents() {
    // Mode switcher buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        if (mode) this.switchViewMode(mode);
      });
    });

    // Real-time Cash Flow Summary Live Updates
    ['monthlyIncome', 'essentialExpenses', 'existingDebt', 'liquidSavings', 'applicantName'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        UI.updateLiveCashflowSummary();
        UI.readProfileFromForm();
        UI.readApplicantNameFromForm();
      });
    });

    // Offer form inputs update
    ['offerName', 'providerName', 'loanPrincipal', 'interestRate', 'loanTerm', 'upfrontFee', 'monthlyFee', 'repaymentType', 'loanPurpose'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        UI.readOfferFromForm();
      });
    });

    // Custom Shock Simulator Slider
    const shockSlider = document.getElementById('customShockSlider');
    if (shockSlider) {
      shockSlider.addEventListener('input', (e) => {
        UI.updateCustomShock(e.target.value);
      });
    }

    // Currency Change
    const currencyEl = document.getElementById('currencySelect');
    if (currencyEl) {
      currencyEl.addEventListener('change', (e) => {
        AppState.currency = e.target.value;
        AppState.save();
        UI.updateCurrencySymbols();
        UI.updateLiveCashflowSummary();
        UI.updatePolicyThresholdLabels();
        this.initComparisonOffers();
        if (AppState.currentAssessment && document.getElementById('assessmentResultsArea')) {
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
        const lbl = document.getElementById('variabilityValLabel');
        if (lbl) lbl.textContent = `${e.target.value}%`;
        UI.readProfileFromForm();
      });
    }

    // Assess Buttons
    document.getElementById('assessBtn')?.addEventListener('click', () => {
      this.runAssessment();
    });

    document.getElementById('emptyStateAssessBtn')?.addEventListener('click', () => {
      this.runAssessment();
    });

    // Institutional Risk Policy Sliders & Controls
    const burdenSlider = document.getElementById('policyBurdenSlider');
    if (burdenSlider) {
      burdenSlider.addEventListener('input', (e) => {
        AppState.institutionalPolicy.maxDebtBurdenPct = parseFloat(e.target.value);
        AppState.save();
        UI.updatePolicyThresholdLabels();
        this.refreshPartnerPortal();
      });
    }

    const bufferInput = document.getElementById('policyBufferInput');
    if (bufferInput) {
      bufferInput.addEventListener('input', (e) => {
        AppState.institutionalPolicy.minPostBuffer = parseFloat(e.target.value) || 0;
        AppState.save();
        UI.updatePolicyThresholdLabels();
        this.refreshPartnerPortal();
      });
    }

    const runwaySlider = document.getElementById('policyRunwaySlider');
    if (runwaySlider) {
      runwaySlider.addEventListener('input', (e) => {
        AppState.institutionalPolicy.minSavingsRunwayMonths = parseFloat(e.target.value);
        AppState.save();
        UI.updatePolicyThresholdLabels();
        this.refreshPartnerPortal();
      });
    }

    const resetPolicyBtn = document.getElementById('resetPolicyBtn');
    if (resetPolicyBtn) {
      resetPolicyBtn.addEventListener('click', () => {
        AppState.institutionalPolicy = {
          maxDebtBurdenPct: 35.0,
          minPostBuffer: 5000.0,
          minSavingsRunwayMonths: 1.0,
        };
        AppState.save();
        if (burdenSlider) burdenSlider.value = 35;
        if (bufferInput) bufferInput.value = 5000;
        if (runwaySlider) runwaySlider.value = 1.0;
        UI.updatePolicyThresholdLabels();
        this.refreshPartnerPortal();
        UI.showToast('Institutional policy controls reset to benchmark standards.', 'info');
      });
    }

    // Compare Offers Buttons
    document.getElementById('addOfferBtn')?.addEventListener('click', () => {
      this.addCompareOffer();
    });

    document.getElementById('resetCompareBtn')?.addEventListener('click', () => {
      this.initComparisonOffers();
      UI.showToast('Benchmark credit offers reset to defaults.', 'info');
    });

    document.getElementById('runCompareBtn')?.addEventListener('click', () => {
      this.runComparison();
    });

    // Transaction Ingestion File Upload & Drag-and-Drop
    const fileInput = document.getElementById('txFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    const dropzone = document.querySelector('.upload-dropzone');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('drag-over');
        });
      });
      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files[0]) {
          this.handleFileUpload(files[0]);
        }
      });
    }

    // Apply Detected Transaction Data to Profile Button
    document.getElementById('applyDetectedBtn')?.addEventListener('click', () => {
      this.applyDetectedDataToProfile();
    });

    // Print Report Buttons
    document.getElementById('heroPrintReportBtn')?.addEventListener('click', () => {
      window.print();
    });
  },

  switchViewMode(mode) {
    AppState.viewMode = mode;
    AppState.save();
    if (mode === 'partner') {
      window.location.href = '/underwriter';
    } else {
      window.location.href = '/assessment';
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
    const nameEl = document.getElementById('applicantName');
    if (nameEl) nameEl.value = 'Household Profile';
    const incEl = document.getElementById('monthlyIncome');
    if (incEl) incEl.value = '';
    const varEl = document.getElementById('incomeVariability');
    if (varEl) varEl.value = '15';
    const varLbl = document.getElementById('variabilityValLabel');
    if (varLbl) varLbl.textContent = '15%';
    const expEl = document.getElementById('essentialExpenses');
    if (expEl) expEl.value = '';
    const debtEl = document.getElementById('existingDebt');
    if (debtEl) debtEl.value = '';
    const savEl = document.getElementById('liquidSavings');
    if (savEl) savEl.value = '';
    const goalEl = document.getElementById('goalSavings');
    if (goalEl) goalEl.value = '';
    const depEl = document.getElementById('householdDependents');
    if (depEl) depEl.value = '1';

    const offEl = document.getElementById('offerName');
    if (offEl) offEl.value = '';
    const provEl = document.getElementById('providerName');
    if (provEl) provEl.value = '';
    const princEl = document.getElementById('loanPrincipal');
    if (princEl) princEl.value = '';
    const rateEl = document.getElementById('interestRate');
    if (rateEl) rateEl.value = '';
    const termEl = document.getElementById('loanTerm');
    if (termEl) termEl.value = '';
    const upEl = document.getElementById('upfrontFee');
    if (upEl) upEl.value = '0';
    const feeEl = document.getElementById('monthlyFee');
    if (feeEl) feeEl.value = '0';

    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect) presetSelect.value = '';
    const resArea = document.getElementById('assessmentResultsArea');
    if (resArea) resArea.style.display = 'none';
    const emptyEl = document.getElementById('assessmentEmptyState');
    if (emptyEl) emptyEl.style.display = 'block';

    AppState.currentAssessment = null;
    AppState.save();
    UI.updateLiveCashflowSummary();
    if (incEl) incEl.focus();
    UI.showToast('Profile form cleared for custom input.', 'info');
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
    UI.showToast('Downloaded CSV transaction statement template.', 'success');
  },

  selectPreset(presetId) {
    const p = AppState.presets.find(x => x.id === presetId);
    if (!p) return;
    const nameEl = document.getElementById('applicantName');
    if (nameEl) nameEl.value = p.label;
    AppState.applicantName = p.label;
    UI.populateProfileForm(p.profile);
    UI.populateOfferForm(p.offer);
    UI.updateLiveCashflowSummary();
    this.initComparisonOffers();
    AppState.save();
    UI.showToast(`Loaded example profile: ${p.label}`, 'info');
  },

  async runAssessment() {
    const assessBtn = document.getElementById('assessBtn');
    if (assessBtn) {
      assessBtn.disabled = true;
      assessBtn.textContent = 'Calculating Affordability & Stress Scenarios...';
    }

    try {
      const applicantName = UI.readApplicantNameFromForm();
      const profile = UI.readProfileFromForm();
      const offer = UI.readOfferFromForm();
      const res = await API.assess(profile, offer, applicantName);
      AppState.currentAssessment = res;
      AppState.save();

      const emptyEl = document.getElementById('assessmentEmptyState');
      if (emptyEl) emptyEl.style.display = 'none';

      UI.renderAssessmentResult(res);
      this.refreshAuditLog();
      UI.showToast('Affordability assessment and stress models evaluated successfully.', 'success');
    } catch (err) {
      UI.showToast(`Assessment failed: ${err.message}`, 'error');
    } finally {
      if (assessBtn) {
        assessBtn.disabled = false;
        assessBtn.innerHTML = 'Assess Affordability & Resilience';
      }
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
        name: 'Community Cooperative Facility (Option B)',
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
    AppState.save();
    UI.renderComparisonConfig(AppState.comparedOffers);
  },

  addCompareOffer() {
    if (AppState.comparedOffers.length >= 5) {
      UI.showToast('Maximum of 5 offers can be compared simultaneously.', 'info');
      return;
    }
    const basePrincipal = AppState.formOffer?.principal || 30000;
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
    AppState.save();
    UI.renderComparisonConfig(AppState.comparedOffers);
    UI.showToast('Added comparison offer slot.', 'info');
  },

  removeCompareOffer(index) {
    if (AppState.comparedOffers.length <= 1) {
      UI.showToast('You must compare at least 1 credit offer.', 'info');
      return;
    }
    AppState.comparedOffers.splice(index, 1);
    AppState.save();
    UI.renderComparisonConfig(AppState.comparedOffers);
    UI.showToast('Removed comparison offer.', 'info');
  },

  async runComparison() {
    const compBtn = document.getElementById('runCompareBtn');
    if (compBtn) {
      compBtn.disabled = true;
      compBtn.textContent = 'Comparing Offers...';
    }

    try {
      const profile = UI.readProfileFromForm();
      const res = await API.compare(profile, AppState.comparedOffers);
      UI.renderComparisonTable(res);
      this.refreshAuditLog();
      UI.showToast('Standardized Key Facts comparison generated.', 'success');
    } catch (err) {
      UI.showToast(`Comparison failed: ${err.message}`, 'error');
    } finally {
      if (compBtn) {
        compBtn.disabled = false;
        compBtn.textContent = 'Generate Key Facts Comparison';
      }
    }
  },

  async loadSampleDataset(personaKey) {
    try {
      const data = await API.getSampleTransactions(personaKey);
      AppState.lastTransactionAnalysis = data;
      AppState.save();
      UI.renderTransactionAnalysis(data);
      UI.showToast(`Ingested sample transaction statement for ${personaKey}.`, 'success');
      this.refreshAuditLog();
    } catch (err) {
      UI.showToast(`Failed to load sample data: ${err.message}`, 'error');
    }
  },

  async handleFileUpload(file) {
    try {
      const data = await API.uploadTransactions(file);
      AppState.lastTransactionAnalysis = data;
      AppState.save();
      UI.renderTransactionAnalysis(data);
      UI.showToast(`Analyzed ${data.summary.transaction_count} transactions from ${file.name}.`, 'success');
      this.refreshAuditLog();
    } catch (err) {
      UI.showToast(`CSV Upload Failed: ${err.message}`, 'error');
    }
  },

  applyDetectedDataToProfile() {
    if (!AppState.lastTransactionAnalysis) {
      UI.showToast('Analyze a transaction CSV first before applying.', 'info');
      return;
    }
    const d = AppState.lastTransactionAnalysis;
    AppState.formProfile = AppState.formProfile || {};
    AppState.formProfile.income = {
      monthly: d.detected_income,
      variability_pct: d.income_variability_est_pct,
      employment_type: 'gig_worker'
    };
    AppState.formProfile.essential_expenses = d.detected_expenses;
    AppState.formProfile.existing_debt_payments = d.detected_debt_payments;
    AppState.save();

    if (document.getElementById('monthlyIncome')) {
      document.getElementById('monthlyIncome').value = d.detected_income;
      const varEl = document.getElementById('incomeVariability');
      if (varEl) varEl.value = d.income_variability_est_pct;
      const varLbl = document.getElementById('variabilityValLabel');
      if (varLbl) varLbl.textContent = `${d.income_variability_est_pct}%`;
      const expEl = document.getElementById('essentialExpenses');
      if (expEl) expEl.value = d.detected_expenses;
      const debtEl = document.getElementById('existingDebt');
      if (debtEl) debtEl.value = d.detected_debt_payments;
      UI.updateLiveCashflowSummary();
      UI.showToast('Profile updated with detected cash flows. Ready for assessment.', 'success');
    } else {
      UI.showToast('Detected cash flows saved! Redirecting to Affordability Workspace...', 'success');
      setTimeout(() => {
        window.location.href = '/assessment';
      }, 700);
    }
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
    if (!AppState.currentUser) {
      UI.showToast('Please sign in or create an account to manage personal data sharing permissions.', 'warning');
      UI.openAuthModal('login');
      await this.refreshConsents();
      return;
    }
    try {
      await API.updateConsent(sourceId, granted);
      UI.showToast(`Consent ${granted ? 'granted' : 'revoked'} for ${sourceId.replace(/_/g, ' ')}.`, 'info');
      this.refreshAuditLog();
    } catch (err) {
      UI.showToast(`Could not update consent: ${err.message}`, 'error');
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
    if (!AppState.currentUser || AppState.currentUser.role !== 'underwriter') {
      UI.renderUnderwriterAuthGate();
      return;
    }
    try {
      const data = await API.getPartnerAssessments();
      UI.renderPartnerPortal(data);
    } catch (err) {
      console.warn('Failed to load partner records:', err);
      UI.renderUnderwriterAuthGate();
    }
  },

  async submitUnderwriterDecision(assessmentId, idx) {
    if (!AppState.currentUser || AppState.currentUser.role !== 'underwriter') {
      UI.showToast('Access Denied: Non-registered users or borrower accounts cannot approve credit facilities. Please sign in as an underwriter.', 'warning');
      UI.openAuthModal('login');
      return;
    }

    const actSelect = document.getElementById(`decAction_${idx}`);
    const ratInput = document.getElementById(`decRationale_${idx}`);
    if (!actSelect) return;

    const decision = actSelect.value;
    const rationale = ratInput?.value?.trim() || `Institution determined ${decision} based on stress test metrics.`;
    const officerName = AppState.currentUser.full_name;

    try {
      await API.recordPartnerDecision(assessmentId, decision, rationale, officerName);
      UI.showToast(`Decision recorded: Facility ${decision.toUpperCase()} for record ${assessmentId}. Audit trail updated.`, 'success');
      await this.refreshPartnerPortal();
      await this.refreshAuditLog();
    } catch (err) {
      UI.showToast(`Failed to record underwriter decision: ${err.message}`, 'error');
    }
  },

  async handleRegister() {
    const fullName = document.getElementById('regFullName')?.value?.trim();
    const email = document.getElementById('regEmail')?.value?.trim();
    const password = document.getElementById('regPassword')?.value;
    const role = document.getElementById('regRole')?.value || 'borrower';

    if (!fullName || !email || !password) {
      UI.showToast('Please fill in all registration fields.', 'warning');
      return;
    }
    if (password.length < 8) {
      UI.showToast('Password must be at least 8 characters long.', 'warning');
      return;
    }

    try {
      const res = await API.register({ email, password, full_name: fullName, role });
      AppState.setAuth(res.user, res.access_token);
      UI.closeAuthModal();
      UI.updateAuthDisplay();
      if (document.getElementById('partnerAssessmentsList')) {
        await this.refreshPartnerPortal();
      }
      if (document.getElementById('consentsContainer')) {
        await this.refreshConsents();
      }
      if (document.getElementById('auditTrailStream')) {
        await this.refreshAuditLog();
      }
      UI.showToast(`Account created successfully! Welcome, ${res.user.full_name}.`, 'success');
    } catch (err) {
      UI.showToast(`Registration failed: ${err.message}`, 'error');
    }
  },

  async handleLogin() {
    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      UI.showToast('Please provide your email and password.', 'warning');
      return;
    }

    try {
      const res = await API.login({ email, password });
      AppState.setAuth(res.user, res.access_token);
      UI.closeAuthModal();
      UI.updateAuthDisplay();
      if (document.getElementById('partnerAssessmentsList')) {
        await this.refreshPartnerPortal();
      }
      if (document.getElementById('consentsContainer')) {
        await this.refreshConsents();
      }
      if (document.getElementById('auditTrailStream')) {
        await this.refreshAuditLog();
      }
      UI.showToast(`Signed in successfully as ${res.user.full_name}.`, 'success');
    } catch (err) {
      UI.showToast(`Sign in failed: ${err.message}`, 'error');
    }
  },

  async handleLogout() {
    try {
      await API.logout();
    } catch (e) {
      // Ignore network errors during logout
    }
    AppState.clearAuth();
    UI.updateAuthDisplay();
    if (document.getElementById('partnerAssessmentsList')) {
      UI.renderUnderwriterAuthGate();
    }
    if (document.getElementById('consentsContainer')) {
      await this.refreshConsents();
    }
    if (document.getElementById('auditTrailStream')) {
      await this.refreshAuditLog();
    }
    UI.showToast('Signed out successfully.', 'info');
  },

  async handleQuickLogin(email, password) {
    try {
      const res = await API.login({ email, password });
      AppState.setAuth(res.user, res.access_token);
      UI.closeAuthModal();
      UI.updateAuthDisplay();
      if (document.getElementById('partnerAssessmentsList')) {
        await this.refreshPartnerPortal();
      }
      if (document.getElementById('consentsContainer')) {
        await this.refreshConsents();
      }
      if (document.getElementById('auditTrailStream')) {
        await this.refreshAuditLog();
      }
      UI.showToast(`Signed in as ${res.user.full_name} (${res.user.role}).`, 'success');
    } catch (err) {
      UI.showToast(`Demo sign in failed: ${err.message}`, 'error');
    }
  }
};

// Bootstrap application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
