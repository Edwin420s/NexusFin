/**
 * Global Application State with Multi-Page LocalStorage Persistence
 * NexusFin — Financial Decision Support Platform
 */

const AppState = {
  currency: 'PHP',
  currencySymbols: {
    PHP: '₱',
    KES: 'KSh',
    SGD: 'S$',
    IDR: 'Rp',
    MYR: 'RM',
    THB: '฿',
    VND: '₫',
    USD: '$',
    EUR: '€',
    GBP: '£'
  },
  activeTab: 'assessment',
  viewMode: 'consumer', // 'consumer' | 'partner'
  presets: [],
  currentAssessment: null,
  comparedOffers: [],
  lastTransactionAnalysis: null,
  applicantName: 'My Household Profile',
  customShockPct: -25,
  institutionalPolicy: {
    maxDebtBurdenPct: 35.0,
    minPostBuffer: 5000.0,
    minSavingsRunwayMonths: 1.0,
  },
  formProfile: {
    currency: 'PHP',
    income: {
      monthly: 38000,
      variability_pct: 20,
      employment_type: 'gig_worker'
    },
    essential_expenses: 21000,
    existing_debt_payments: 4500,
    liquid_savings: 18000,
    goal_savings: 3000,
    household_dependents: 2
  },
  formOffer: {
    name: 'Digital Fast Microloan',
    provider: 'Digital Nano-Fintech',
    principal: 35000,
    annual_interest_rate: 24.0,
    term_months: 10,
    upfront_fee: 800,
    monthly_fee: 150,
    repayment_type: 'amortizing',
    purpose: 'Asset Acquisition'
  },

  getSymbol() {
    return this.currencySymbols[this.currency] || this.currency;
  },

  formatMoney(amount) {
    const sym = this.getSymbol();
    const val = Number(amount || 0);
    const isNegative = val < 0;
    const absFormatted = Math.abs(val).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return isNegative ? `-${sym} ${absFormatted}` : `${sym} ${absFormatted}`;
  },

  save() {
    try {
      const payload = {
        currency: this.currency,
        viewMode: this.viewMode,
        applicantName: this.applicantName,
        customShockPct: this.customShockPct,
        institutionalPolicy: this.institutionalPolicy,
        formProfile: this.formProfile,
        formOffer: this.formOffer,
        comparedOffers: this.comparedOffers,
        currentAssessment: this.currentAssessment,
        lastTransactionAnalysis: this.lastTransactionAnalysis
      };
      localStorage.setItem('nexusfin_state_v1', JSON.stringify(payload));
    } catch (e) {
      console.warn('AppState save warning:', e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem('nexusfin_state_v1');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.currency) this.currency = data.currency;
      if (data.viewMode) this.viewMode = data.viewMode;
      if (data.applicantName) this.applicantName = data.applicantName;
      if (data.customShockPct !== undefined) this.customShockPct = data.customShockPct;
      if (data.institutionalPolicy) this.institutionalPolicy = { ...this.institutionalPolicy, ...data.institutionalPolicy };
      if (data.formProfile) this.formProfile = { ...this.formProfile, ...data.formProfile };
      if (data.formOffer) this.formOffer = { ...this.formOffer, ...data.formOffer };
      if (Array.isArray(data.comparedOffers) && data.comparedOffers.length > 0) this.comparedOffers = data.comparedOffers;
      if (data.currentAssessment) this.currentAssessment = data.currentAssessment;
      if (data.lastTransactionAnalysis) this.lastTransactionAnalysis = data.lastTransactionAnalysis;
    } catch (e) {
      console.warn('AppState load warning:', e);
    }
  }
};
