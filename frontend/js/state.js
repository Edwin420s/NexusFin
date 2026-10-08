/**
 * Global Application State
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
    USD: '$'
  },
  activeTab: 'assessment',
  viewMode: 'consumer', // 'consumer' | 'partner'
  presets: [],
  currentAssessment: null,
  comparedOffers: [],
  lastTransactionAnalysis: null,

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
  }
};
