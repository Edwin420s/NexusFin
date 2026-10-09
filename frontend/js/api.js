/**
 * NexusFin API Client
 * Wraps REST endpoints with error handling and fallback support.
 */

const API = {
  baseUrl: '',

  async get(path) {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API Error (${res.status}): ${err}`);
    }
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API Error (${res.status}): ${err}`);
    }
    return res.json();
  },

  async uploadFile(path, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upload Error (${res.status}): ${err}`);
    }
    return res.json();
  },

  // High-level endpoints
  fetchPresets() {
    return this.get('/api/presets');
  },

  assess(profile, offer, applicantName = 'Self-Service Applicant') {
    return this.post('/api/assess', {
      applicant_name: applicantName,
      profile,
      offer
    });
  },

  compare(profile, offers) {
    return this.post('/api/compare', { profile, offers });
  },

  getSampleTransactions(personaKey) {
    return this.get(`/api/transactions/sample/${personaKey}`);
  },

  uploadTransactions(file) {
    return this.uploadFile('/api/transactions', file);
  },

  getConsents() {
    return this.get('/api/consent');
  },

  updateConsent(sourceId, granted) {
    return this.post('/api/consent', {
      source_id: sourceId,
      granted: granted,
      actor: 'consumer'
    });
  },

  getAuditLog() {
    return this.get('/api/audit-log');
  },

  getPartnerAssessments() {
    return this.get('/api/partner/assessments');
  },

  recordPartnerDecision(assessmentId, decision, rationale, officerName = 'Senior Credit Underwriter') {
    return this.post('/api/partner/decision', {
      assessment_id: assessmentId,
      decision: decision,
      rationale: rationale,
      officer_name: officerName
    });
  },

  getPitchDeckInfo() {
    return this.get('/api/pitch-deck/info');
  },

  getPitchDeckSlides() {
    return this.get('/api/pitch-deck/slides');
  }
};
