/* =========================================================
   HudStore — data layer for Al Hud Hud Veterinary Clinic
   ---------------------------------------------------------
   DUAL MODE:
   • LIVE mode — when assets/js/config.js contains a Firebase
     Realtime Database URL, all data (patients, services,
     offers) is stored in Firebase via its REST API. Owner
     links are `status.html?id=...` and update in REAL TIME
     on the owner's phone (server-sent events + polling).
   • LOCAL mode — no config: data lives in localStorage and
     owner links carry an encoded snapshot of the status.

   Page code never needs to know which mode is active —
   every method below is async and identical in both modes.
   ========================================================= */

const HudStore = (() => {
  const KEY = 'hudhud_clinic_v1';
  const CFG = (typeof window !== 'undefined' && window.HUD_CONFIG) || {};
  const DB = (CFG.databaseURL || '').trim().replace(/\/+$/, '');
  const LIVE = /^https:\/\//.test(DB);

  const DEFAULT_SERVICES = [
    { id: 'svc_checkup',  icon: 'stethoscope', name: 'Wellness Exams',      desc: 'Comprehensive nose-to-tail health checks with personalised care plans for every life stage.' },
    { id: 'svc_vaccine',  icon: 'syringe',     name: 'Vaccinations',        desc: 'Core & lifestyle vaccines with digital reminders so your pet never misses a booster.' },
    { id: 'svc_surgery',  icon: 'scalpel',     name: 'Surgery',             desc: 'Advanced soft-tissue & orthopedic procedures in a fully equipped sterile theatre.' },
    { id: 'svc_dental',   icon: 'tooth',       name: 'Dental Care',         desc: 'Ultrasonic scaling, polishing and extractions for a healthy, pain-free smile.' },
    { id: 'svc_grooming', icon: 'scissors',    name: 'Grooming & Spa',      desc: 'Breed-standard styling, medicated baths and nail care by certified groomers.' },
    { id: 'svc_lab',      icon: 'flask',       name: 'In-House Laboratory', desc: 'Same-visit blood work, cytology and diagnostics for faster answers.' },
    { id: 'svc_imaging',  icon: 'scan',        name: 'Digital Imaging',     desc: 'High-resolution X-ray and ultrasound for precise, non-invasive diagnosis.' },
    { id: 'svc_boarding', icon: 'home',        name: 'Boarding & Daycare',  desc: 'Climate-controlled suites with daily play, monitoring and lots of love.' },
  ];

  const DEFAULT_OFFERS = [
    { id: 'off_1', title: 'New Patient Special', desc: 'First wellness exam 30% off for newly registered pets.', badge: '30% OFF', expires: '' },
  ];

  const _uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* Default super admin — created on first run.
     Username: superadmin   Password: admin123  (change after first login!) */
  const SUPER_DEFAULTS = { username: 'superadmin', password: 'admin123', name: 'Super Admin' };

  /* simple deterministic hash (djb2 + salt) — client-side gate only.
     Real security arrives with Firebase Auth / database rules. */
  function hashPw(pw) {
    const s = 'hudhud::' + pw;
    let h1 = 5381, h2 = 52711;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 = ((h1 * 33) ^ c) >>> 0;
      h2 = ((h2 * 31) + c) >>> 0;
    }
    return h1.toString(36) + '.' + h2.toString(36);
  }

  /* ================= LOCAL backend ================= */
  function _read() {
    let db = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) db = JSON.parse(raw);
    } catch (e) { /* corrupted -> reset */ }
    if (!db) db = { services: DEFAULT_SERVICES, offers: DEFAULT_OFFERS, patients: [] };
    db.users = db.users || [];
    db.audit = db.audit || [];
    db.surgeries = db.surgeries || [];
    db.billing = db.billing || [];
    localStorage.setItem(KEY, JSON.stringify(db));
    return db;
  }
  function _write(db) { localStorage.setItem(KEY, JSON.stringify(db)); }

  /* ================= REMOTE backend (Firebase RTDB REST) ================= */
  async function rGet(path) {
    const res = await fetch(`${DB}/${path}.json`);
    if (!res.ok) throw new Error('Firebase read failed: ' + res.status);
    return res.json();
  }
  async function rPut(path, val) {
    const res = await fetch(`${DB}/${path}.json`, { method: 'PUT', body: JSON.stringify(val) });
    if (!res.ok) throw new Error('Firebase write failed: ' + res.status);
  }
  async function rDel(path) { await fetch(`${DB}/${path}.json`, { method: 'DELETE' }); }

  async function rCollection(name, defaults) {
    let obj = await rGet(name);
    if (!obj) { // first run -> seed defaults
      obj = {};
      (defaults || []).forEach(item => { obj[item.id] = item; });
      await rPut(name, obj);
    }
    return Object.values(obj);
  }

  /* ================= base64url helpers (snapshot links) ================= */
  function encodeData(obj) {
    const json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeData(str) {
    try {
      let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) { return null; }
  }

  return {
    /* true when Firebase is connected -> links auto-update */
    isLive() { return LIVE; },

    /* ================= SERVICES ================= */
    async getServices() {
      if (LIVE) return rCollection('services', DEFAULT_SERVICES);
      return _read().services;
    },
    async addService({ icon, name, desc }) {
      const svc = { id: _uid('svc'), icon: icon || 'paw', name, desc };
      if (LIVE) { await this.getServices(); await rPut('services/' + svc.id, svc); return svc; }
      const db = _read(); db.services.push(svc); _write(db); return svc;
    },
    async updateService(id, { icon, name, desc }) {
      if (LIVE) {
        const svc = await rGet('services/' + id);
        if (!svc) return null;
        if (icon !== undefined) svc.icon = icon;
        if (name !== undefined) svc.name = name;
        if (desc !== undefined) svc.desc = desc;
        await rPut('services/' + id, svc);
        return svc;
      }
      const db = _read();
      const i = db.services.findIndex(s => s.id === id);
      if (i === -1) return null;
      if (icon !== undefined) db.services[i].icon = icon;
      if (name !== undefined) db.services[i].name = name;
      if (desc !== undefined) db.services[i].desc = desc;
      _write(db);
      return db.services[i];
    },
    async deleteService(id) {
      if (LIVE) return rDel('services/' + id);
      const db = _read(); db.services = db.services.filter(s => s.id !== id); _write(db);
    },

    /* ================= OFFERS ================= */
    async getOffers() {
      if (LIVE) return rCollection('offers', DEFAULT_OFFERS);
      return _read().offers;
    },
    async addOffer({ title, desc, badge, expires }) {
      const off = { id: _uid('off'), title, desc, badge: badge || '', expires: expires || '' };
      if (LIVE) { await this.getOffers(); await rPut('offers/' + off.id, off); return off; }
      const db = _read(); db.offers.push(off); _write(db); return off;
    },
    async deleteOffer(id) {
      if (LIVE) return rDel('offers/' + id);
      const db = _read(); db.offers = db.offers.filter(o => o.id !== id); _write(db);
    },

    /* ================= PATIENTS ================= */
    async getPatients() {
      let list;
      if (LIVE) list = Object.values((await rGet('patients')) || {});
      else list = _read().patients.slice();
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },
    async getPatient(id) {
      if (LIVE) return (await rGet('patients/' + id)) || null;
      return _read().patients.find(p => p.id === id) || null;
    },
    async addPatient({ petName, species, breed, age, ownerName, ownerPhone, reason, notes }) {
      const now = Date.now();
      const pat = {
        id: _uid('pet'),
        petName, species, breed: breed || '', age: age || '',
        ownerName, ownerPhone: ownerPhone || '', reason: reason || '', notes: notes || '',
        status: 'Admitted',
        createdAt: now,
        timeline: [{ status: 'Admitted', note: reason ? `Admitted for ${reason}.` : 'Patient registered at the clinic.', at: now }],
      };
      if (LIVE) { await rPut('patients/' + pat.id, pat); return pat; }
      const db = _read(); db.patients.push(pat); _write(db); return pat;
    },
    async updateStatus(id, status, note) {
      const pat = await this.getPatient(id);
      if (!pat) return null;
      pat.status = status;
      pat.timeline = pat.timeline || [];
      pat.timeline.push({ status, note: note || '', at: Date.now() });
      if (LIVE) { await rPut('patients/' + id, pat); return pat; }
      const db = _read();
      const i = db.patients.findIndex(p => p.id === id);
      if (i > -1) db.patients[i] = pat;
      _write(db); return pat;
    },
    async deletePatient(id) {
      if (LIVE) return rDel('patients/' + id);
      const db = _read(); db.patients = db.patients.filter(p => p.id !== id); _write(db);
    },

    /* ================= REAL-TIME WATCH =================
       Calls cb(patient) whenever the record changes.
       LIVE  -> Firebase server-sent events (instant) + 60s safety poll
       LOCAL -> storage events (fires across tabs on the same device) */
    watchPatient(id, cb) {
      const refresh = async () => {
        const p = await this.getPatient(id).catch(() => null);
        if (p) cb(p);
      };
      if (LIVE) {
        try {
          const es = new EventSource(`${DB}/patients/${id}.json`);
          es.addEventListener('put', refresh);
          es.addEventListener('patch', refresh);
          es.onerror = () => { /* SSE may drop; polling covers it */ };
        } catch (e) { /* EventSource unsupported -> polling only */ }
        setInterval(refresh, 60000);
      } else {
        window.addEventListener('storage', (ev) => { if (ev.key === KEY) refresh(); });
      }
    },

    /* ================= OWNER SHARE LINK =================
       LIVE  -> ?id= link, always shows current status.
       LOCAL -> ?id= AND a snapshot in the hash, so the link still
                opens on devices that can't reach the clinic data. */
    buildOwnerLink(patient) {
      const base = location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '');
      if (LIVE) return `${base}status.html?id=${patient.id}`;
      const snapshot = {
        id: patient.id, petName: patient.petName, species: patient.species,
        breed: patient.breed, age: patient.age, ownerName: patient.ownerName,
        status: patient.status, timeline: patient.timeline, createdAt: patient.createdAt,
      };
      return `${base}status.html?id=${patient.id}#p=${encodeData(snapshot)}`;
    },

    /* ================= SURGERIES ================= */
    async getSurgeries() {
      let list;
      if (LIVE) list = Object.values((await rGet('surgeries')) || {});
      else list = _read().surgeries.slice();
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },
    async getSurgery(id) {
      if (LIVE) return (await rGet('surgeries/' + id)) || null;
      return _read().surgeries.find(s => s.id === id) || null;
    },
    async addSurgery(data) {
      const sg = {
        id: _uid('srg'),
        createdAt: Date.now(),
        /* case */
        patientId: '', patientName: '', type: '', category: 'Soft Tissue',
        priority: 'Elective', theatre: 'OR 1', scheduledFor: '', estDuration: '',
        status: 'Scheduled',            // Scheduled | Pre-Op | In Surgery | In Recovery | Completed | Cancelled
        /* surgical team */
        surgeon: '', anesthetist: '', assistant: '',
        /* pre-op */
        asa: 'I — Healthy',
        checklist: { exam: false, bloodwork: false, imaging: false, fasting: false, iv: false, meds: false, ownerBriefed: false },
        consent: 'Not Signed',          // Not Signed | Pending | Signed
        /* anesthesia */
        anesthesiaProtocol: '',
        /* intra-op */
        startedAt: '', endedAt: '', duration: '',
        complications: 'None',          // None | Minor | Major
        complicationNotes: '', bloodLoss: '', implants: '',
        /* post-op */
        outcomeGrade: '',               // Excellent | Good | Fair | Guarded | Poor
        outcome: '', recoveryNotes: '', postOpMeds: '', followUp: '', dischargeNotes: '',
        /* billing */
        estCost: '', totalCost: '', deposit: '', invoiceNo: '',
        payment: 'Unpaid',              // Unpaid | Awaiting Payment | Partially Paid | Paid
        notes: '',
        ...data,
      };
      if (LIVE) { await rPut('surgeries/' + sg.id, sg); return sg; }
      const db = _read(); db.surgeries.push(sg); _write(db); return sg;
    },
    async updateSurgery(id, fields) {
      const sg = await this.getSurgery(id);
      if (!sg) return null;
      Object.assign(sg, fields);
      if (LIVE) { await rPut('surgeries/' + id, sg); return sg; }
      const db = _read();
      const i = db.surgeries.findIndex(s => s.id === id);
      if (i > -1) db.surgeries[i] = sg;
      _write(db); return sg;
    },
    async deleteSurgery(id) {
      if (LIVE) return rDel('surgeries/' + id);
      const db = _read(); db.surgeries = db.surgeries.filter(s => s.id !== id); _write(db);
    },

    SURGERY_STATUSES: ['Scheduled', 'Pre-Op', 'In Surgery', 'In Recovery', 'Completed', 'Cancelled'],
    PAYMENT_STATUSES: ['Unpaid', 'Awaiting Payment', 'Partially Paid', 'Paid'],
    CONSENT_STATUSES: ['Not Signed', 'Pending', 'Signed'],
    SURGERY_CATEGORIES: ['Soft Tissue', 'Orthopedic', 'Dental', 'Ophthalmic', 'Emergency', 'Spay / Neuter', 'Oncologic', 'Other'],
    SURGERY_PRIORITIES: ['Elective', 'Urgent', 'Emergency'],
    ASA_GRADES: ['I — Healthy', 'II — Mild disease', 'III — Severe disease', 'IV — Life-threatening', 'V — Critical'],
    COMPLICATION_LEVELS: ['None', 'Minor', 'Major'],
    OUTCOME_GRADES: ['Excellent', 'Good', 'Fair', 'Guarded', 'Poor'],
    ADMISSION_REASONS: ['Wellness Exam', 'Vaccination', 'Grooming', 'Surgery', 'Dental', 'Diagnostics / Lab', 'Emergency', 'Boarding', 'Follow-up', 'Other'],
    CHECKLIST_ITEMS: [
      ['exam', 'Pre-op physical exam'],
      ['bloodwork', 'Bloodwork reviewed'],
      ['imaging', 'Imaging reviewed'],
      ['fasting', 'Fasting confirmed'],
      ['iv', 'IV catheter placed'],
      ['meds', 'Pre-meds administered'],
      ['ownerBriefed', 'Owner briefed on risks'],
    ],

    /* ================= BILLING =================
       A ledger of transactions linked to each patient.
       kind: 'charge'  — something the owner owes (invoice line)
       kind: 'payment' — money received
       Balance per patient = charges − payments. */
    async getTransactions(patientId) {
      let list;
      if (LIVE) list = Object.values((await rGet('billing')) || {});
      else list = _read().billing.slice();
      if (patientId) list = list.filter(t => t.patientId === patientId);
      return list.sort((a, b) => (b.at || 0) - (a.at || 0));
    },
    async addCharge({ patientId, patientName, description, amount, dueDate, ref }) {
      const t = {
        id: _uid('trx'), kind: 'charge',
        patientId, patientName: patientName || '',
        description: description || 'Charge', amount: Math.abs(+amount) || 0,
        dueDate: dueDate || '', ref: ref || '',
        at: Date.now(),
      };
      if (LIVE) { await rPut('billing/' + t.id, t); return t; }
      const db = _read(); db.billing.push(t); _write(db); return t;
    },
    async addPayment({ patientId, patientName, amount, method, note }) {
      const t = {
        id: _uid('trx'), kind: 'payment',
        patientId, patientName: patientName || '',
        description: note || '', amount: Math.abs(+amount) || 0,
        method: method || 'Cash',
        at: Date.now(),
      };
      if (LIVE) { await rPut('billing/' + t.id, t); return t; }
      const db = _read(); db.billing.push(t); _write(db); return t;
    },
    async deleteTransaction(id) {
      if (LIVE) return rDel('billing/' + id);
      const db = _read(); db.billing = db.billing.filter(t => t.id !== id); _write(db);
    },
    /* { patientId: { charged, paid, balance, nextDue } } */
    async getBalances() {
      const txs = await this.getTransactions();
      const map = {};
      txs.forEach(t => {
        const m = map[t.patientId] = map[t.patientId] || { charged: 0, paid: 0, balance: 0, nextDue: '' };
        if (t.kind === 'charge') {
          m.charged += t.amount;
          if (t.dueDate && (!m.nextDue || t.dueDate < m.nextDue)) m.nextDue = t.dueDate;
        } else m.paid += t.amount;
      });
      Object.values(map).forEach(m => m.balance = +(m.charged - m.paid).toFixed(2));
      return map;
    },

    PAYMENT_METHODS: ['Cash', 'Card', 'Bank Transfer', 'Online', 'Other'],

    /* ================= ADMIN ACCOUNTS =================
       One super admin (seeded on first run) + any number of
       staff admins. Super admin can manage accounts and view
       the audit trail; staff admins manage clinic data only. */
    async getUsers() {
      let users;
      if (LIVE) users = Object.values((await rGet('users')) || {});
      else users = _read().users;
      if (!users.length) { // seed the super admin
        const su = {
          id: 'usr_super', name: SUPER_DEFAULTS.name, username: SUPER_DEFAULTS.username,
          pwHash: hashPw(SUPER_DEFAULTS.password), role: 'super', createdAt: Date.now(),
        };
        if (LIVE) await rPut('users/' + su.id, su);
        else { const db = _read(); db.users.push(su); _write(db); }
        users = [su];
      }
      return users.sort((a, b) => (a.role === 'super' ? -1 : 1) - (b.role === 'super' ? -1 : 1) || (a.createdAt || 0) - (b.createdAt || 0));
    },
    async login(username, password) {
      const users = await this.getUsers();
      const u = users.find(x => x.username.toLowerCase() === String(username).trim().toLowerCase());
      if (!u || u.pwHash !== hashPw(password)) return null;
      return { id: u.id, name: u.name, username: u.username, role: u.role };
    },
    async addUser({ name, username, password }, actor) {
      const users = await this.getUsers();
      const uname = String(username).trim().toLowerCase();
      if (users.some(u => u.username.toLowerCase() === uname)) throw new Error('Username already exists');
      const u = { id: _uid('usr'), name: name.trim(), username: uname, pwHash: hashPw(password), role: 'admin', createdAt: Date.now() };
      if (LIVE) await rPut('users/' + u.id, u);
      else { const db = _read(); db.users.push(u); _write(db); }
      await this.logAudit(actor, 'Created admin account', `${u.name} (@${u.username})`);
      return u;
    },
    async deleteUser(id, actor) {
      const users = await this.getUsers();
      const u = users.find(x => x.id === id);
      if (!u || u.role === 'super') throw new Error('Cannot delete the super admin');
      if (LIVE) await rDel('users/' + id);
      else { const db = _read(); db.users = db.users.filter(x => x.id !== id); _write(db); }
      await this.logAudit(actor, 'Deleted admin account', `${u.name} (@${u.username})`);
    },
    async changePassword(userId, newPassword, actor) {
      const users = await this.getUsers();
      const u = users.find(x => x.id === userId);
      if (!u) throw new Error('User not found');
      u.pwHash = hashPw(newPassword);
      if (LIVE) await rPut('users/' + u.id, u);
      else { const db = _read(); const i = db.users.findIndex(x => x.id === userId); db.users[i] = u; _write(db); }
      await this.logAudit(actor, 'Changed password', `for ${u.name} (@${u.username})`);
    },

    /* ================= AUDIT TRAIL ================= */
    async logAudit(actor, action, details) {
      const entry = {
        id: _uid('log'), at: Date.now(),
        actorName: actor?.name || 'Unknown', actorRole: actor?.role || '-',
        action, details: details || '',
      };
      if (LIVE) { await rPut('audit/' + entry.id, entry); return entry; }
      const db = _read();
      db.audit.push(entry);
      if (db.audit.length > 800) db.audit = db.audit.slice(-800); // cap local log
      _write(db); return entry;
    },
    async getAudit(limit = 300) {
      let list;
      if (LIVE) list = Object.values((await rGet('audit')) || {});
      else list = _read().audit.slice();
      return list.sort((a, b) => b.at - a.at).slice(0, limit);
    },

    decodeData, encodeData,

    STATUSES: ['Admitted', 'Under Examination', 'In Treatment', 'In Surgery', 'Recovering', 'Ready for Pickup', 'Discharged'],
  };
})();
