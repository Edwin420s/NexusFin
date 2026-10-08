/**
 * NexusFin Main Application Controller
 */

const App = {
  async init() {
    this.bindEvents();
    UI.updateCurrencySymbols();

    try {
      // 1. Fetch ASEAN Presets
      const presetsRes = await API.fetchPresets();
      AppState.presets = presetsRes.presets || [];
      this.populatePresetDropdown(AppState.presets);

      // Default to Carlos - Manila Gig Rider
      if (AppState.presets.length > 0) {
        this.selectPreset(AppState.presets[0].id);
        this.runAssessment();
      }

      // 2. Fetch Consents & Audit Trail
      this.refreshConsents();
      this.refreshAuditLog();

      // 3. Setup default comparison offers
      this.initComparisonOffers();

      // 4. Load Pitch Deck slides
      this.loadPitchDeck();
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
    document.getElementById('currencySelect').addEventListener('change', (e) => {
      AppState.currency = e.target.value;
      UI.updateCurrencySymbols();
      // Also update comparison offers currency
      this.initComparisonOffers();
    });

    // Persona Preset Change
    document.getElementById('presetSelect').addEventListener('change', (e) => {
      const pid = e.target.value;
      if (pid) {
        this.selectPreset(pid);
        this.runAssessment();
      }
    });

    // Income Variability Slider sync
    const varSlider = document.getElementById('incomeVariability');
    varSlider.addEventListener('input', (e) => {
      document.getElementById('variabilityValLabel').textContent = `${e.target.value}%`;
    });

    // Assess Button
    document.getElementById('assessBtn').addEventListener('click', () => {
      this.runAssessment();
    });

    // Compare Offers Buttons
    document.getElementById('addOfferBtn').addEventListener('click', () => {
      this.addCompareOffer();
    });

    document.getElementById('runCompareBtn').addEventListener('click', () => {
      this.runComparison();
    });

    // Transaction Ingestion File Upload
    const fileInput = document.getElementById('txFileInput');
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    // Apply Detected Transaction Data to Profile Button
    document.getElementById('applyDetectedBtn').addEventListener('click', () => {
      this.applyDetectedDataToProfile();
    });

    // Hero Action Buttons
    document.getElementById('heroViewSlidesBtn')?.addEventListener('click', () => {
      this.switchTab('pitchdeck');
    });

    document.getElementById('heroViewSubmissionBtn')?.addEventListener('click', () => {
      UI.openModal('submissionModal');
    });

    document.getElementById('tabViewSubmissionBtn')?.addEventListener('click', () => {
      UI.openModal('submissionModal');
    });

    document.getElementById('heroPrintReportBtn')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('openFullscreenDeckBtn')?.addEventListener('click', () => {
      UI.openModal('pitchDeckModal');
    });

    // Slide Navigation Buttons
    document.getElementById('btnPrevSlide')?.addEventListener('click', () => {
      this.prevSlide();
    });

    document.getElementById('btnNextSlide')?.addEventListener('click', () => {
      this.nextSlide();
    });

    // Modal Close Buttons
    document.getElementById('closePitchDeckModal')?.addEventListener('click', () => {
      UI.closeModal('pitchDeckModal');
    });

    document.getElementById('closePitchDeckModalFooter')?.addEventListener('click', () => {
      UI.closeModal('pitchDeckModal');
    });

    document.getElementById('closeSubmissionModal')?.addEventListener('click', () => {
      UI.closeModal('submissionModal');
    });

    document.getElementById('closeSubmissionModalFooter')?.addEventListener('click', () => {
      UI.closeModal('submissionModal');
    });

    // Backdrop clicks to close modals
    ['pitchDeckModal', 'submissionModal'].forEach(id => {
      const m = document.getElementById(id);
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) UI.closeModal(id);
        });
      }
    });

    // Keyboard Navigation for Slides and Modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UI.closeModal('pitchDeckModal');
        UI.closeModal('submissionModal');
      } else if (e.key === 'ArrowLeft') {
        if (AppState.activeTab === 'pitchdeck' || document.getElementById('pitchDeckModal')?.classList.contains('active')) {
          this.prevSlide();
        }
      } else if (e.key === 'ArrowRight') {
        if (AppState.activeTab === 'pitchdeck' || document.getElementById('pitchDeckModal')?.classList.contains('active')) {
          this.nextSlide();
        }
      }
    });
  },

  switchTab(tabId) {
    AppState.activeTab = tabId;
    document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    const activeBtn = document.querySelector(`.tab-nav-btn[data-tab="${tabId}"]`);
    const activePane = document.getElementById(tabId);
    if (activeBtn) activeBtn.classList.add('active');
    if (activePane) activePane.classList.add('active');

    // Trigger on-demand tab refreshes
    if (tabId === 'privacy') {
      this.refreshConsents();
      this.refreshAuditLog();
    } else if (tabId === 'partner') {
      this.refreshPartnerPortal();
    } else if (tabId === 'pitchdeck') {
      if (AppState.slides.length > 0) {
        this.goToSlide(AppState.currentSlideIndex);
      }
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
    select.innerHTML = presets.map(p => `
      <option value="${p.id}">${p.label}</option>
    `).join('');
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
      assessBtn.innerHTML = '⚡ Assess Affordability & Resilience';
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
      compBtn.textContent = '📊 Generate Key Facts Comparison';
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

    alert('✓ Profile updated with detected transaction values! Switched to Assessment tab.');
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
  },

  async loadPitchDeck() {
    try {
      const res = await API.getPitchDeckSlides();
      AppState.slides = res.slides || [];
      if (AppState.slides.length > 0) {
        UI.initSlidePills(AppState.slides.length, (idx) => this.goToSlide(idx));
        this.goToSlide(0);
      }
    } catch (err) {
      console.warn('Failed to load pitch deck slides:', err);
    }
  },

  goToSlide(index) {
    if (!AppState.slides || AppState.slides.length === 0) return;
    if (index < 0) index = 0;
    if (index >= AppState.slides.length) index = AppState.slides.length - 1;
    AppState.currentSlideIndex = index;

    UI.renderSlide(AppState.slides[index], index, AppState.slides.length);
    UI.renderModalSlide(AppState.slides[index], index, AppState.slides.length);

    // Rebind modal navigation buttons
    document.getElementById('modalPrevSlide')?.addEventListener('click', () => this.prevSlide());
    document.getElementById('modalNextSlide')?.addEventListener('click', () => this.nextSlide());
  },

  prevSlide() {
    this.goToSlide(AppState.currentSlideIndex - 1);
  },

  nextSlide() {
    this.goToSlide(AppState.currentSlideIndex + 1);
  }
};

// Bootstrap application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
