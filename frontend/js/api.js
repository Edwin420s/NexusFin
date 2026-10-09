/**
 * NexusFin API Client
 * Wraps REST endpoints with error handling, authentication headers, and fallback support.
 */

const API = {
  baseUrl: '',

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (typeof AppState !== 'undefined' && AppState.authToken) {
      headers['Authorization'] = `Bearer ${AppState.authToken}`;
    }
    return headers;
  },

  async get(path) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.text();
      let msg = err;
      try {
        const j = JSON.parse(err);
        msg = j.detail || err;
      } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      let msg = err;
      try {
        const j = JSON.parse(err);
        msg = j.detail || err;
      } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async uploadFile(path, file) {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (typeof AppState !== 'undefined' && AppState.authToken) {
      headers['Authorization'] = `Bearer ${AppState.authToken}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.text();
      let msg = err;
      try {
        const j = JSON.parse(err);
        msg = j.detail || err;
      } catch (e) {}
      throw new Error(msg);
    }
    return res.json();
  },

  // Authentication endpoints
  register(userData) {
    return this.post('/api/auth/register', userData);
  },

  login(credentials) {
    return this.post('/api/auth/login', credentials);
  },

  getMe() {
    return this.get('/api/auth/me');
  },

  logout() {
    return this.post('/api/auth/logout', {});
  },

  // High-level decision support endpoints
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
  }
};
