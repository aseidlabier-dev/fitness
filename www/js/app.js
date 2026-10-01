// --- Database Layer (Dexie.js) ---
const db = new Dexie('FitnessDB');
db.version(3).stores({
    devices: '++id, name, number, *weightRange, photo, notes',
    sessions: '++id, date, deviceId, weight, count, reps, timestamp, notes'
});
db.version(4).stores({
    devices: '++id, name, number, *weightRange, photo, notes, step',
    sessions: '++id, date, deviceId, weight, *increases, maxWeight, count, reps, timestamp, notes, intensityHint'
});

// Toast notification helper
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2200);
}

// --- UI Components Layer ---
const ui = {
    content: document.getElementById('content'),
    pages: {
        home: document.getElementById('home-screen'),
        training: document.getElementById('training-page'),
        overview: document.getElementById('overview-page'),
        stats: document.getElementById('stats-page'),
        admin: document.getElementById('admin-page')
    },

    async showPage(pageId) {
        Object.values(this.pages).forEach(p => p.classList.remove('active'));
        if (this.pages[pageId]) {
            this.pages[pageId].classList.add('active');
            return await this.renderPage(pageId);
        }
    },

    async renderPage(pageId) {
        switch(pageId) {
            case 'admin': await this.renderAdmin(); break;
            case 'training': await this.renderTraining(); break;
            case 'overview': await this.renderOverview(); break;
            case 'stats': await this.renderStats(); break;
        }
    },

    async renderAdmin() {
        const rawDevices = await db.devices.toArray();
        const devices = rawDevices.sort((a, b) => (a.number || '').localeCompare((b.number || ''), undefined, {numeric: true}));
        this.pages.admin.innerHTML = `
            <div class="title-row">
                <h2>Geräte-Verwaltung</h2>
                <button class="btn btn-primary" id="add-device-btn">+ Neues Gerät</button>
            </div>
            <div id="device-list">
                ${devices.map(d => `
                    <div class="card device-card">
                        <div style="display:flex; gap:15px; align-items:center;">
                            ${d.photo ? `<img src="${d.photo}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">` : '<div style="width:60px; height:60px; background:#2a2a2a; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">🏋️</div>'}
                            <div style="flex-grow:1;">
                                <h3 style="margin-bottom:2px;">${d.name} ${d.number ? `<span style="color:var(--text-sub); font-size:0.9rem;">(#${d.number})</span>` : ''}</h3>
                                ${d.notes ? `<p style="font-size:0.85rem; padding-top:2px; color:var(--text-sub); font-style:italic;">${d.notes}</p>` : ''}
                            </div>
                            <button class="btn btn-secondary btn-sm edit-device" data-id="${d.id}" title="Bearbeiten">✏️</button>
                            <button class="btn btn-secondary btn-sm delete-device text-danger" data-id="${d.id}" style="color:var(--danger)" title="Löschen">🗑️</button>
                        </div>
                    </div>
                `).join('') || '<div class="card"><p style="color:var(--text-sub);">Noch keine Geräte vorhanden. Klicken Sie oben auf "+ Neues Gerät".</p></div>'}
            </div>
            <div class="card" style="margin-top:40px; border-color:var(--danger); background:rgba(207,102,121,0.05);">
                <h3 style="color:var(--danger); margin-bottom:10px;">Gefahrenzone</h3>
                <p style="font-size:0.85rem; margin-bottom:15px;">Hier können alle Trainingsdaten gelöscht werden. Die Geräte bleiben erhalten.</p>
                <button class="btn btn-secondary text-danger" id="clear-history-btn" style="color:var(--danger); border:1px solid var(--danger);">Alle Trainingseinheiten löschen</button>
            </div>
        `;
    },

    async renderTraining() {
        const rawDevices = await db.devices.toArray();
        const devices = rawDevices.sort((a, b) => (a.number || '').localeCompare((b.number || ''), undefined, {numeric: true}));
        const today = new Date().toISOString().split('T')[0];
        
        this.pages.training.innerHTML = `
            <h2>Heute trainieren</h2>
            <div class="card">
                <label>Datum</label>
                <input type="date" id="training-date" value="${today}">
                
                <label>Gerät auswählen</label>
                <select id="training-device-select">
                    <option value="">-- Gerät wählen --</option>
                    ${devices.map(d => `<option value="${d.id}">${d.name} ${d.number ? `(#${d.number})` : ''}</option>`).join('')}
                </select>
            </div>
            
            <div id="last-session-info" class="card session-info-card" style="display:none;">
                <div class="session-info-title">
                    <span>⏱️ Letztes Training:</span>
                    <span id="last-session-date-badge" class="badge badge-primary"></span>
                </div>
                <div class="session-info-grid">
                    <div class="info-item">
                        <span class="info-label">Anfangsgewicht</span>
                        <span id="last-session-start-val" class="info-val">-</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Steigerungen</span>
                        <div id="last-session-inc-val" class="info-val">-</div>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Maximal erreicht</span>
                        <span id="last-session-max-val" class="info-val highlight">-</span>
                    </div>
                    <div class="info-item" id="last-session-notes-container" style="display:none;">
                        <span class="info-label">Notiz / Vorsatz</span>
                        <span id="last-session-notes-val" class="info-val" style="font-size:0.9rem; font-style:italic;">-</span>
                    </div>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" id="copy-last-values-btn" style="width:100%; border:1px solid rgba(0,170,255,0.4); color:var(--primary);">
                    📋 Werte vom letzten Mal übernehmen
                </button>
            </div>

            <div id="training-entry-form" class="card" style="display:none;">
                <h3 style="margin-bottom:14px; color:var(--primary); font-size:1.1rem;">Aktuelle Übung eingeben</h3>
                
                <label>Anfangsgewicht (kg)</label>
                <div class="weight-stepper-box">
                    <button type="button" class="stepper-btn" id="start-weight-minus" title="Verringern">-</button>
                    <input type="number" id="train-start-weight" class="stepper-input" step="0.5" min="0" placeholder="0">
                    <button type="button" class="stepper-btn" id="start-weight-plus" title="Erhöhen">+</button>
                    <span class="stepper-unit">kg</span>
                </div>

                <div class="section-title-row">
                    <label style="margin-bottom:0;">Steigerungen in der Übung (max. 4)</label>
                    <span id="increase-counter-badge" class="badge">0 / 4</span>
                </div>
                
                <div id="increases-container">
                    <!-- Bis zu 4 Steigerungen werden hier dynamisch eingefügt -->
                </div>
                
                <button type="button" class="btn btn-dashed" id="add-increase-btn">+ Steigerung hinzufügen</button>
                
                <div style="margin-top:16px; display:grid; grid-template-columns:1fr; gap:12px;">
                    <div>
                        <label>Notizen zur Übung (Optional)</label>
                        <input type="text" id="train-notes" placeholder="z.B. Sitzposition 3, leicht gefallen...">
                    </div>
                    <div>
                        <label>Vorsatz fürs nächste Mal</label>
                        <select id="train-intensity-hint">
                            <option value="">Beibehalten (Keine Änderung)</option>
                            <option value="increase">📈 Gewicht beim nächsten Mal steigern</option>
                            <option value="decrease">📉 Gewicht beim nächsten Mal verringern</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary" id="save-session-btn" style="width:100%; margin-top:14px;">Übung speichern</button>
            </div>

            <div id="today-entries" class="card">
                <h3 style="margin-bottom:12px;">Heutige Einträge</h3>
                <div id="today-entries-list"></div>
            </div>
        `;
    },

    async renderOverview() {
        this.pages.overview.innerHTML = `
            <div class="title-row">
                <h2>Trainingsübersicht</h2>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-secondary btn-sm" id="export-md-btn">Joplin (.md)</button>
                    <button class="btn btn-secondary btn-sm" id="export-pdf-btn">PDF</button>
                </div>
            </div>
            <div class="card">
                <label>Datum filtern</label>
                <input type="date" id="overview-date">
            </div>
            <div id="overview-list"></div>
        `;
    },

    async renderStats() {
        const rawDevices = await db.devices.toArray();
        const devices = rawDevices.sort((a, b) => (a.number || '').localeCompare((b.number || ''), undefined, {numeric: true}));
        this.pages.stats.innerHTML = `
            <h2>Entwicklung Training</h2>
            <div class="card">
                <label>Gerät auswählen</label>
                <select id="stats-device-select">
                    <option value="">-- Gerät wählen --</option>
                    ${devices.map(d => `<option value="${d.id}">${d.name} ${d.number ? `(#${d.number})` : ''}</option>`).join('')}
                </select>
            </div>
            
            <div id="stats-detail" style="display:none;">
                <div class="card device-info-header" style="display:flex; gap:18px; align-items:center;">
                    <img id="stats-device-img" src="" style="width:90px; height:90px; border-radius:12px; object-fit:cover; display:none;">
                    <div id="stats-device-placeholder" style="width:90px; height:90px; background:#2a2a2a; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:2.2rem;">🏋️</div>
                    <div>
                        <h3 id="stats-device-name" style="font-size:1.3rem;">Gerät</h3>
                        <p id="stats-device-meta" style="color:var(--text-sub); font-size:0.9rem;"></p>
                    </div>
                </div>

                <div class="card">
                    <h3 style="margin-bottom:12px;">Grafische Übersicht</h3>
                    <h4 style="font-size:0.9rem; color:var(--text-sub); margin-bottom:8px;">Gewichtsverlauf (Anfangsgewicht vs. Maximalgewicht)</h4>
                    <canvas id="stats-chart-weight" style="margin-bottom:28px; max-height:260px;"></canvas>
                    
                    <h4 style="font-size:0.9rem; color:var(--text-sub); margin-bottom:8px;">Steigerungs-Umfang in der Übung (kg Zuwachs)</h4>
                    <canvas id="stats-chart-volume" style="max-height:220px;"></canvas>
                </div>

                <div class="card">
                    <h3 style="margin-bottom:12px;">Verlauf</h3>
                    <div id="stats-table-container" style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; min-width:320px;">
                            <thead>
                                <tr style="border-bottom:1px solid var(--accent-grey); text-align:left; color:var(--text-sub); font-size:0.85rem;">
                                    <th style="padding:10px 6px;">Datum</th>
                                    <th style="padding:10px 6px;">Anfangsgewicht</th>
                                    <th style="padding:10px 6px;">Steigerungen</th>
                                    <th style="padding:10px 6px;">Max. Gewicht</th>
                                    <th style="padding:10px 6px;">Notizen</th>
                                </tr>
                            </thead>
                            <tbody id="stats-history-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};

// --- App Controller Layer ---
class FitnessApp {
    constructor() {
        this.activePage = 'home';
        this.charts = {
            weight: null,
            volume: null
        };
        this.deferredPrompt = null;
        this.currentDevice = null;
        this.currentLastSession = null;
        this.init();
    }

    init() {
        // Install banner logic for standard browsers (Chrome, Edge, etc.)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            const banner = document.getElementById('install-banner');
            const installBtn = document.getElementById('install-app-btn');
            if (banner && installBtn) {
                banner.style.display = 'block';
                installBtn.style.display = 'inline-block';
            }
        });

        // Install banner logic for iOS devices
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        };
        const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

        if (isIos() && !isInStandaloneMode()) {
            const banner = document.getElementById('install-banner');
            const iosInstruction = document.getElementById('ios-install-instruction');
            if (banner && iosInstruction) {
                banner.style.display = 'block';
                iosInstruction.style.display = 'block';
            }
        }

        this.requestPersistentStorage();

        // Click Event Delegation
        document.addEventListener('click', async (e) => {
            const installBtn = e.target.closest('#install-app-btn');
            if (installBtn && this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    const banner = document.getElementById('install-banner');
                    if (banner) banner.style.display = 'none';
                }
                this.deferredPrompt = null;
                return;
            }

            const navBtn = e.target.closest('.nav-btn, .hero-btn');
            if (navBtn) {
                const pageId = navBtn.dataset.page;
                if (pageId) await this.navigateTo(pageId);
                return;
            }

            // Admin Actions
            const addBtn = e.target.closest('#add-device-btn');
            if (addBtn) {
                this.showDeviceModal();
                return;
            }

            const editBtn = e.target.closest('.edit-device');
            if (editBtn) {
                this.showDeviceModal(editBtn.dataset.id);
                return;
            }

            const deleteBtn = e.target.closest('.delete-device');
            if (deleteBtn) {
                this.deleteDevice(deleteBtn.dataset.id);
                return;
            }

            const deleteSessionBtn = e.target.closest('.delete-session');
            if (deleteSessionBtn) {
                this.deleteSession(deleteSessionBtn.dataset.id);
                return;
            }
            
            // Training Actions: Anfangsgewicht Stepper
            const startMinus = e.target.closest('#start-weight-minus');
            if (startMinus) {
                this.stepWeightInput('train-start-weight', -1);
                return;
            }

            const startPlus = e.target.closest('#start-weight-plus');
            if (startPlus) {
                this.stepWeightInput('train-start-weight', 1);
                return;
            }

            // Training Actions: Steigerung Stepper (+ / -)
            const incMinus = e.target.closest('.inc-minus');
            if (incMinus) {
                const row = incMinus.closest('.increase-row');
                const inp = row.querySelector('.increase-weight-input');
                this.stepWeightInputElement(inp, -1);
                return;
            }

            const incPlus = e.target.closest('.inc-plus');
            if (incPlus) {
                const row = incPlus.closest('.increase-row');
                const inp = row.querySelector('.increase-weight-input');
                this.stepWeightInputElement(inp, 1);
                return;
            }

            // Training Actions: Steigerung hinzufügen
            const addIncBtn = e.target.closest('#add-increase-btn');
            if (addIncBtn) {
                this.addIncreaseRow();
                return;
            }

            // Training Actions: Steigerung löschen
            const removeIncBtn = e.target.closest('.btn-remove-increase');
            if (removeIncBtn) {
                const row = removeIncBtn.closest('.increase-row');
                if (row) {
                    row.remove();
                    this.updateIncreaseRowNumbers();
                }
                return;
            }

            // Copy last session values
            const copyBtn = e.target.closest('#copy-last-values-btn');
            if (copyBtn) {
                this.copyLastSessionValues();
                return;
            }

            // Save session
            const saveBtn = e.target.closest('#save-session-btn');
            if (saveBtn) {
                this.saveTrainingSession();
                return;
            }
            
            // Export
            const mdBtn = e.target.closest('#export-md-btn');
            if (mdBtn) this.exportMarkdown();

            const pdfBtn = e.target.closest('#export-pdf-btn');
            if (pdfBtn) this.exportPDF();

            const clearBtn = e.target.closest('#clear-history-btn');
            if (clearBtn) this.clearAllHistory();
        });

        // Event for Changes
        document.addEventListener('change', async (e) => {
            if (e.target.id === 'training-device-select') this.handleTrainingDeviceChange(e.target.value);
            if (e.target.id === 'stats-device-select') this.handleStatsDeviceChange(e.target.value);
            if (e.target.id === 'overview-date') this.handleOverviewChange(e.target.value);
            if (e.target.id === 'training-date') this.renderTodayEntries();
        });

        // Modal Close
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.onclick = () => {
                document.getElementById('modal-container').classList.add('hidden');
            };
        }

        this.navigateTo('home');
    }

    async requestPersistentStorage() {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persisted();
            if (!isPersisted) {
                await navigator.storage.persist().catch(console.error);
            }
        }
    }

    async navigateTo(pageId) {
        this.activePage = pageId;
        
        // Update Nav UI
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageId);
        });

        const titles = {
            home: 'Fitness App',
            training: 'Heutiges Training',
            overview: 'Trainingsübersicht',
            stats: 'Entwicklung Training',
            admin: 'Geräte-Verwaltung'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = titles[pageId] || 'Fitness';

        const result = await ui.showPage(pageId);

        // Auto-load sub-data
        if (pageId === 'training') this.renderTodayEntries();
        if (pageId === 'overview') {
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('overview-date');
            if (dateInput) {
                dateInput.value = today;
                this.handleOverviewChange(today);
            }
        }
        return result;
    }

    // --- Helper: Weight Stepping ---
    stepWeightInput(inputId, direction) {
        const inp = document.getElementById(inputId);
        if (!inp) return;
        this.stepWeightInputElement(inp, direction);
    }

    stepWeightInputElement(inp, direction) {
        const step = 2.5; // Standard-Schrittweite beim Tippen auf +/-
        let current = parseFloat(inp.value);
        if (isNaN(current)) current = 0;
        
        let newVal = Math.round((current + direction * step) * 10) / 10;
        if (newVal < 0) newVal = 0;
        
        inp.value = newVal;
    }

    // --- Admin Logic ---
    async showDeviceModal(id = null) {
        let device = { name: '', number: '', photo: null, notes: '' };
        if (id) {
            device = await db.devices.get(parseInt(id));
        }

        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = id ? 'Gerät bearbeiten' : 'Neues Gerät';
        modalBody.innerHTML = `
            <form id="device-form" style="max-height: 70vh; overflow-y: auto; padding-right: 5px;">
                <input type="hidden" id="device-id" value="${id || ''}">
                <label>Name des Gerätes</label>
                <input type="text" id="dev-name" value="${device.name || ''}" placeholder="z.B. Brustpresse, Latzug..." required>
                
                <label>Nummer (Optional)</label>
                <input type="text" id="dev-number" value="${device.number || ''}" placeholder="z.B. 12">
                
                <label>Anmerkungen / Notizen (Optional)</label>
                <textarea id="dev-notes" style="height:70px; resize:none;" placeholder="Übungsausführung, Geräteeinstellungen...">${device.notes || ''}</textarea>

                <label>Foto hinzufügen (Optional)</label>
                <input type="file" id="dev-photo-input" accept="image/*">
                ${device.photo ? `<img id="dev-photo-preview" src="${device.photo}" style="width:100%; height:140px; object-fit:contain; background:#111; margin-bottom:12px; border-radius:8px;">` : '<img id="dev-photo-preview" style="display:none; width:100%; height:140px; object-fit:contain; background:#111; margin-bottom:12px; border-radius:8px;">'}
                
                <button type="submit" class="btn btn-primary" style="width:100%;">Gerät speichern</button>
            </form>
        `;

        document.getElementById('modal-container').classList.remove('hidden');

        // Photo preview & Base64 conversion
        const photoInput = document.getElementById('dev-photo-input');
        const photoPreview = document.getElementById('dev-photo-preview');
        photoInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    photoPreview.src = re.target.result;
                    photoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        };

        const devForm = document.getElementById('device-form');
        devForm.onsubmit = async (sf) => {
            sf.preventDefault();
            const devId = document.getElementById('device-id').value;
            const name = document.getElementById('dev-name').value.trim();
            const number = document.getElementById('dev-number').value.trim();

            // Duplicate Check
            const existingName = await db.devices.where('name').equalsIgnoreCase(name).first();
            if (existingName && (!devId || existingName.id !== parseInt(devId))) {
                return alert(`Fehler: Ein Gerät mit dem Namen "${name}" existiert bereits.`);
            }

            if (number) {
                const existingNumber = await db.devices.where('number').equals(number).first();
                if (existingNumber && (!devId || existingNumber.id !== parseInt(devId))) {
                    return alert(`Fehler: Ein Gerät mit der Nummer "${number}" existiert bereits.`);
                }
            }

            const data = {
                name,
                number,
                notes: document.getElementById('dev-notes').value.trim(),
                photo: photoPreview.src && photoPreview.style.display !== 'none' ? photoPreview.src : (device.photo || null)
            };

            if (devId) {
                await db.devices.update(parseInt(devId), data);
            } else {
                await db.devices.add(data);
            }
            
            document.getElementById('modal-container').classList.add('hidden');
            showToast('Gerät gespeichert!');
            ui.renderAdmin();
        };
    }

    async deleteDevice(id) {
        if (confirm('Dieses Gerät wirklich löschen? Alle zugehörigen Trainingsdaten bleiben in der Historie.')) {
            await db.devices.delete(parseInt(id));
            showToast('Gerät gelöscht');
            ui.renderAdmin();
        }
    }

    async clearAllHistory() {
        if (confirm('ACHTUNG: Möchten Sie wirklich ALLE Trainingsdaten löschen? Die Geräte-Konfiguration bleibt erhalten.')) {
            await db.sessions.clear();
            alert('Alle Trainingsdaten wurden gelöscht.');
            if (this.activePage === 'overview') this.navigateTo('overview');
            if (this.activePage === 'training') this.renderTodayEntries();
        }
    }

    // --- Training Logic ---
    async handleTrainingDeviceChange(deviceId) {
        const formEl = document.getElementById('training-entry-form');
        const lastSessionEl = document.getElementById('last-session-info');
        
        if (!deviceId) {
            if (formEl) formEl.style.display = 'none';
            if (lastSessionEl) lastSessionEl.style.display = 'none';
            this.currentDevice = null;
            this.currentLastSession = null;
            return;
        }

        const device = await db.devices.get(parseInt(deviceId));
        this.currentDevice = device;

        // Retrieve last session for this device
        const sessions = await db.sessions.where('deviceId').equals(parseInt(deviceId)).toArray();
        sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0) || (b.date || '').localeCompare(a.date || ''));
        const lastSession = sessions[0] || null;
        this.currentLastSession = lastSession;

        if (lastSession) {
            const dateParts = lastSession.date ? lastSession.date.split('-') : [];
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : (lastSession.date || '-');
            
            document.getElementById('last-session-date-badge').textContent = formattedDate;
            document.getElementById('last-session-start-val').textContent = `${lastSession.weight} kg`;
            
            const incContainer = document.getElementById('last-session-inc-val');
            if (lastSession.increases && Array.isArray(lastSession.increases) && lastSession.increases.length > 0) {
                incContainer.innerHTML = lastSession.increases.map((w, idx) => `
                    <span class="tag-increase">${idx + 1}. ${w} kg</span>
                `).join(' ');
            } else if (lastSession.reps) {
                incContainer.innerHTML = `<span style="font-size:0.85rem; color:var(--text-sub);">${lastSession.count || 1}x${lastSession.reps} Wdh. (altes Format)</span>`;
            } else {
                incContainer.innerHTML = `<span style="color:var(--text-sub); font-style:italic;">Keine Steigerungen</span>`;
            }

            const maxW = lastSession.maxWeight || lastSession.weight;
            document.getElementById('last-session-max-val').textContent = `${maxW} kg`;

            const notesContainer = document.getElementById('last-session-notes-container');
            let notesText = '';
            if (lastSession.intensityHint === 'increase') {
                notesText += '📈 Vorsatz: Gewicht steigern! ';
            } else if (lastSession.intensityHint === 'decrease') {
                notesText += '📉 Vorsatz: Gewicht verringern! ';
            }
            if (lastSession.notes) {
                notesText += (notesText ? ' | ' : '') + lastSession.notes;
            }
            
            if (notesText) {
                document.getElementById('last-session-notes-val').textContent = notesText;
                notesContainer.style.display = 'block';
            } else {
                notesContainer.style.display = 'none';
            }

            lastSessionEl.style.display = 'block';
        } else {
            lastSessionEl.style.display = 'none';
        }

        // Initialize entry form (without min/max restrictions)
        const startInput = document.getElementById('train-start-weight');
        const defaultStart = lastSession ? lastSession.weight : 20;
        startInput.value = defaultStart;
        startInput.removeAttribute('min');
        startInput.removeAttribute('max');
        startInput.step = '0.5';

        // Clear existing increase rows
        const incBox = document.getElementById('increases-container');
        if (incBox) incBox.innerHTML = '';
        this.updateIncreaseRowNumbers();

        if (formEl) formEl.style.display = 'block';
    }

    copyLastSessionValues() {
        if (!this.currentLastSession) return;
        
        // Copy Anfangsgewicht
        const startInput = document.getElementById('train-start-weight');
        if (startInput) startInput.value = this.currentLastSession.weight;

        // Copy Steigerungen
        const incBox = document.getElementById('increases-container');
        if (incBox) {
            incBox.innerHTML = '';
            if (this.currentLastSession.increases && Array.isArray(this.currentLastSession.increases)) {
                this.currentLastSession.increases.slice(0, 4).forEach(w => {
                    this.addIncreaseRow(w);
                });
            }
        }
        this.updateIncreaseRowNumbers();
        showToast('Werte vom letzten Mal übernommen! 📋');
    }

    addIncreaseRow(weight = null) {
        const container = document.getElementById('increases-container');
        if (!container) return;
        
        const currentCount = container.children.length;
        if (currentCount >= 4) {
            alert('Maximal 4 Steigerungen in der Übung möglich.');
            return;
        }

        // Default weight if not provided
        if (weight === null) {
            if (currentCount > 0) {
                const prevRow = container.lastElementChild;
                const prevVal = parseFloat(prevRow.querySelector('.increase-weight-input').value) || 0;
                weight = Math.round((prevVal + 2.5) * 10) / 10;
            } else {
                const startVal = parseFloat(document.getElementById('train-start-weight').value) || 0;
                weight = Math.round((startVal + 2.5) * 10) / 10;
            }
        }

        const div = document.createElement('div');
        div.className = 'increase-row';
        div.innerHTML = `
            <span class="increase-badge">${currentCount + 1}. Steigerung</span>
            <div class="weight-stepper-box" style="margin-bottom:0; flex:1;">
                <button type="button" class="stepper-btn inc-minus" title="Verringern">-</button>
                <input type="number" class="stepper-input increase-weight-input" step="0.5" value="${weight}">
                <button type="button" class="stepper-btn inc-plus" title="Erhöhen">+</button>
                <span class="stepper-unit">kg</span>
            </div>
            <button type="button" class="btn-remove-increase" title="Steigerung entfernen">🗑️</button>
        `;
        container.appendChild(div);
        
        this.updateIncreaseRowNumbers();
    }

    updateIncreaseRowNumbers() {
        const container = document.getElementById('increases-container');
        if (!container) return;

        const rows = Array.from(container.children);
        rows.forEach((row, index) => {
            const badge = row.querySelector('.increase-badge');
            if (badge) badge.textContent = `${index + 1}. Steigerung`;
        });

        const countBadge = document.getElementById('increase-counter-badge');
        if (countBadge) {
            countBadge.textContent = `${rows.length} / 4`;
            countBadge.className = rows.length >= 4 ? 'badge badge-success' : 'badge';
        }

        const addBtn = document.getElementById('add-increase-btn');
        if (addBtn) {
            if (rows.length >= 4) {
                addBtn.disabled = true;
                addBtn.textContent = '✓ Max. 4 Steigerungen erreicht';
                addBtn.style.opacity = '0.6';
                addBtn.style.cursor = 'not-allowed';
            } else {
                addBtn.disabled = false;
                addBtn.textContent = `+ Steigerung hinzufügen (${rows.length}/4)`;
                addBtn.style.opacity = '1';
                addBtn.style.cursor = 'pointer';
            }
        }
    }

    async saveTrainingSession() {
        const deviceSelect = document.getElementById('training-device-select');
        const deviceId = parseInt(deviceSelect.value);
        if (!deviceId) return alert('Bitte ein Gerät auswählen.');
        
        const date = document.getElementById('training-date').value;
        if (!date) return alert('Bitte ein Datum wählen.');

        const startWeightVal = parseFloat(document.getElementById('train-start-weight').value);
        if (isNaN(startWeightVal) || startWeightVal < 0) {
            return alert('Bitte ein gültiges Anfangsgewicht eingeben.');
        }

        const increaseInputs = Array.from(document.querySelectorAll('#increases-container .increase-weight-input'));
        const increases = increaseInputs.map(inp => parseFloat(inp.value)).filter(w => !isNaN(w));

        const maxWeight = increases.length > 0 ? Math.max(startWeightVal, ...increases) : startWeightVal;
        const notes = document.getElementById('train-notes').value.trim();
        const hint = document.getElementById('train-intensity-hint') ? document.getElementById('train-intensity-hint').value : '';
        const timestamp = Date.now();

        const entry = {
            date: date,
            deviceId: deviceId,
            weight: startWeightVal, // Anfangsgewicht
            increases: increases,   // Bis zu 4 Steigerungen
            maxWeight: maxWeight,   // Höchstes Gewicht
            count: 1 + increases.length,
            reps: 0,
            notes: notes,
            intensityHint: hint,
            timestamp: timestamp
        };

        await db.sessions.add(entry);
        showToast('Übung gespeichert! 🎉');

        // Reset notes and hint
        document.getElementById('train-notes').value = '';
        if (document.getElementById('train-intensity-hint')) {
            document.getElementById('train-intensity-hint').value = '';
        }

        // Update last session display for this device
        await this.handleTrainingDeviceChange(deviceId);

        // Update list of today's entries
        this.renderTodayEntries();
    }

    async renderTodayEntries() {
        const dateInput = document.getElementById('training-date');
        if (!dateInput) return;
        const date = dateInput.value;
        const sessions = await db.sessions.where('date').equals(date).toArray();
        const devices = await db.devices.toArray();
        const devMap = Object.fromEntries(devices.map(d => [d.id, d]));

        const list = document.getElementById('today-entries-list');
        if (!list) return;

        if (sessions.length === 0) {
            list.innerHTML = '<p style="color:var(--text-sub); font-size:0.9rem;">Noch keine Einträge für dieses Datum.</p>';
            return;
        }

        sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0) || b.id - a.id);

        list.innerHTML = sessions.map(s => {
            const dev = devMap[s.deviceId] || { name: 'Unbekanntes Gerät' };
            const hasIncreases = s.increases && Array.isArray(s.increases) && s.increases.length > 0;
            
            let progressionHtml = `<strong>Anfangsgewicht:</strong> ${s.weight} kg`;
            if (hasIncreases) {
                progressionHtml += ` <br><strong>Steigerungen:</strong> ` + s.increases.map(w => `<span class="tag-increase">${w} kg</span>`).join(' ');
                progressionHtml += ` <span style="color:var(--success); font-weight:600; font-size:0.85rem;">(Max: ${s.maxWeight || Math.max(s.weight, ...s.increases)} kg)</span>`;
            } else if (s.reps) {
                progressionHtml += ` | ${s.count || 1}x${s.reps} Wdh. (Altes Format)`;
            }

            return `
                <div class="entry-card">
                    <div class="entry-main-info">
                        <div class="entry-device-name">${dev.name} ${dev.number ? `<span style="color:var(--text-sub); font-size:0.85rem;">(#${dev.number})</span>` : ''}</div>
                        <div class="entry-weight-progression">${progressionHtml}</div>
                        ${s.notes ? `<div style="font-size:0.82rem; color:var(--primary); font-style:italic; margin-top:2px;">Notiz: ${s.notes}</div>` : ''}
                        ${s.intensityHint === 'increase' ? `<div style="font-size:0.8rem; color:#ffaa00; font-weight:500;">📈 Nächstes Mal steigern</div>` : ''}
                        ${s.intensityHint === 'decrease' ? `<div style="font-size:0.8rem; color:#00aaff; font-weight:500;">📉 Nächstes Mal verringern</div>` : ''}
                    </div>
                    <button class="delete-session" data-id="${s.id}" style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:1.2rem; padding:8px;" title="Löschen">🗑️</button>
                </div>
            `;
        }).join('');
    }

    async deleteSession(id) {
        if (confirm('Diesen Eintrag wirklich löschen?')) {
            await db.sessions.delete(parseInt(id));
            showToast('Eintrag gelöscht');
            if (this.activePage === 'training') {
                const currentDeviceId = document.getElementById('training-device-select')?.value;
                if (currentDeviceId) await this.handleTrainingDeviceChange(currentDeviceId);
                this.renderTodayEntries();
            }
            if (this.activePage === 'overview') this.handleOverviewChange(document.getElementById('overview-date').value);
            if (this.activePage === 'stats') {
                const statsDevId = document.getElementById('stats-device-select')?.value;
                if (statsDevId) this.handleStatsDeviceChange(statsDevId);
            }
        }
    }

    async handleOverviewChange(date) {
        if (!date) return;
        const sessions = await db.sessions.where('date').equals(date).toArray();
        const devices = await db.devices.toArray();
        const devMap = Object.fromEntries(devices.map(d => [d.id, d]));

        const list = document.getElementById('overview-list');
        if (!list) return;

        if (sessions.length === 0) {
            list.innerHTML = `<div class="card"><p style="color:var(--text-sub);">Keine Trainingsdaten für dieses Datum vorhanden.</p></div>`;
            return;
        }

        sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0) || b.id - a.id);

        list.innerHTML = `
            <div class="card">
                <h3 style="margin-bottom:12px; color:var(--primary); font-size:1.15rem;">${date}</h3>
                <div>
                    ${sessions.map(s => {
                        const dev = devMap[s.deviceId] || { name: 'Unbekanntes Gerät' };
                        const hasIncreases = s.increases && Array.isArray(s.increases) && s.increases.length > 0;
                        
                        let incDisplay = 'Keine';
                        if (hasIncreases) {
                            incDisplay = s.increases.map(w => `<span class="tag-increase">${w} kg</span>`).join(' ');
                        } else if (s.reps) {
                            incDisplay = `${s.count || 1}x${s.reps} Wdh.`;
                        }

                        return `
                            <div class="entry-card" style="padding:10px 0; border-radius:0; border-left:none; border-right:none; border-top:none; border-bottom:1px solid #2a2a2a; margin-bottom:4px;">
                                <div class="entry-main-info">
                                    <div style="font-weight:600; font-size:1rem; margin-bottom:3px;">
                                        ${dev.name} ${dev.number ? `<span style="color:var(--text-sub); font-size:0.85rem;">(#${dev.number})</span>` : ''}
                                    </div>
                                    <div style="font-size:0.9rem; color:var(--text-main); margin-bottom:2px;">
                                        <strong>Anfangsgewicht:</strong> ${s.weight} kg
                                    </div>
                                    <div style="font-size:0.88rem; color:var(--text-main); margin-bottom:2px;">
                                        <strong>Steigerungen:</strong> ${incDisplay}
                                    </div>
                                    <div style="font-size:0.88rem; color:var(--success); font-weight:600;">
                                        <strong>Höchstgewicht:</strong> ${s.maxWeight || s.weight} kg
                                    </div>
                                    ${s.notes ? `<div style="font-size:0.8rem; color:var(--primary); font-style:italic; margin-top:2px;">Notiz: ${s.notes}</div>` : ''}
                                </div>
                                <button class="delete-session" data-id="${s.id}" style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:1.2rem; padding:8px;" title="Löschen">🗑️</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // --- Stats Logic ---
    async handleStatsDeviceChange(deviceId) {
        if (!deviceId) {
            document.getElementById('stats-detail').style.display = 'none';
            return;
        }

        const deviceIdInt = parseInt(deviceId);
        const device = await db.devices.get(deviceIdInt);
        const history = await db.sessions.where('deviceId').equals(deviceIdInt).toArray();

        // Sort chronological
        history.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.timestamp || 0) - (b.timestamp || 0));

        // UI Header
        document.getElementById('stats-device-name').textContent = `${device.name} ${device.number ? `(#${device.number})` : ''}`;
        document.getElementById('stats-device-meta').textContent = device.notes ? `Notizen: ${device.notes}` : '';
        
        const statsImg = document.getElementById('stats-device-img');
        const statsPlaceholder = document.getElementById('stats-device-placeholder');
        if (device.photo) {
            statsImg.src = device.photo;
            statsImg.style.display = 'block';
            statsPlaceholder.style.display = 'none';
        } else {
            statsImg.style.display = 'none';
            statsPlaceholder.style.display = 'flex';
        }
        
        // History Table (Show newest first)
        const tableHistory = [...history].reverse();
        document.getElementById('stats-history-body').innerHTML = tableHistory.map(h => {
            const hasInc = h.increases && Array.isArray(h.increases) && h.increases.length > 0;
            let incText = '–';
            if (hasInc) {
                incText = h.increases.map(w => `${w} kg`).join(', ');
            } else if (h.reps) {
                incText = `${h.count || 1}x${h.reps}`;
            }

            const maxW = h.maxWeight || (hasInc ? Math.max(h.weight, ...h.increases) : h.weight);

            return `
                <tr style="border-bottom:1px solid #2a2a2a;">
                    <td style="padding:10px 6px; font-size:0.88rem;">${h.date}</td>
                    <td style="padding:10px 6px; font-weight:600; color:var(--primary); font-size:0.95rem;">${h.weight} kg</td>
                    <td style="padding:10px 6px; font-size:0.88rem; color:var(--text-sub);">${incText}</td>
                    <td style="padding:10px 6px; font-weight:600; color:var(--success); font-size:0.95rem;">${maxW} kg</td>
                    <td style="padding:10px 6px; font-size:0.8rem; color:var(--text-sub); font-style:italic;">${h.notes || '–'}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="5" style="padding:15px; text-align:center; color:var(--text-sub);">Noch keine Einträge für dieses Gerät vorhanden.</td></tr>';

        this.updateCharts(history);
        document.getElementById('stats-detail').style.display = 'block';
    }

    updateCharts(history) {
        if (!history || history.length === 0) return;

        const labels = history.map(h => {
            const parts = (h.date || '').split('-');
            return parts.length === 3 ? `${parts[2]}.${parts[1]}.` : h.date;
        });

        const startWeights = history.map(h => h.weight || 0);
        const maxWeights = history.map(h => h.maxWeight || (h.increases && h.increases.length > 0 ? Math.max(h.weight, ...h.increases) : h.weight));
        
        // Zuwachs in der Übung (Differenz)
        const increasesDelta = history.map(h => {
            const top = h.maxWeight || (h.increases && h.increases.length > 0 ? Math.max(h.weight, ...h.increases) : h.weight);
            return Math.max(0, Math.round((top - (h.weight || 0)) * 10) / 10);
        });

        if (this.charts.weight) this.charts.weight.destroy();
        if (this.charts.volume) this.charts.volume.destroy();

        const ctx1 = document.getElementById('stats-chart-weight');
        const ctx2 = document.getElementById('stats-chart-volume');
        if (!ctx1 || !ctx2) return;

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: false, 
                    grid: { color: '#2a2a2a' }, 
                    ticks: { color: '#a0a0a0', font: { size: 11 } } 
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#a0a0a0', font: { size: 11 } } 
                }
            },
            plugins: { 
                legend: { 
                    display: true, 
                    position: 'top',
                    labels: { color: '#e0e0e0', font: { size: 12 }, boxWidth: 14 } 
                } 
            }
        };

        // Chart 1: Anfangsgewicht & Maximalgewicht
        this.charts.weight = new Chart(ctx1, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { 
                        label: 'Anfangsgewicht (kg)', 
                        data: startWeights, 
                        borderColor: '#00aaff', 
                        backgroundColor: 'rgba(0,170,255,0.15)', 
                        fill: false, 
                        tension: 0.25,
                        pointRadius: 4,
                        pointBackgroundColor: '#00aaff'
                    },
                    { 
                        label: 'Maximalgewicht (kg)', 
                        data: maxWeights, 
                        borderColor: '#03dac6', 
                        backgroundColor: 'rgba(3,218,198,0.15)', 
                        fill: false, 
                        tension: 0.25,
                        pointRadius: 4,
                        pointBackgroundColor: '#03dac6'
                    }
                ]
            },
            options: chartOptions
        });

        // Chart 2: Steigerungszuwachs (kg)
        this.charts.volume = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels,
                datasets: [{ 
                    label: 'Steigerung / Zuwachs (kg)', 
                    data: increasesDelta, 
                    backgroundColor: 'rgba(255, 183, 77, 0.7)',
                    borderColor: '#ffb74d',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                ...chartOptions,
                scales: {
                    ...chartOptions.scales,
                    y: {
                        beginAtZero: true,
                        grid: { color: '#2a2a2a' },
                        ticks: { color: '#a0a0a0', stepSize: 2.5 }
                    }
                }
            }
        });
    }

    // --- Export Logic ---
    async exportMarkdown() {
        const sessions = await db.sessions.toArray();
        const devices = await db.devices.toArray();
        const devMap = Object.fromEntries(devices.map(d => [d.id, d.name]));

        let md = `# Trainingsexport vom ${new Date().toLocaleDateString('de-DE')}

`;
        sessions.sort((a,b) => (a.date || '').localeCompare(b.date || '')).forEach(s => {
            const hasInc = s.increases && Array.isArray(s.increases) && s.increases.length > 0;
            const incStr = hasInc ? s.increases.map(w => `${w} kg`).join(', ') : 'Keine';
            const maxW = s.maxWeight || (hasInc ? Math.max(s.weight, ...s.increases) : s.weight);

            md += `### ${s.date}
`;
            md += `- **Gerät**: ${devMap[s.deviceId] || 'Unbekannt'}
`;
            md += `- **Anfangsgewicht**: ${s.weight} kg
`;
            md += `- **Steigerungen**: ${incStr}
`;
            md += `- **Maximalgewicht**: ${maxW} kg
`;
            if (s.notes) md += `- **Notizen**: ${s.notes}
`;
            md += `
`;
        });

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training_export_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        showToast('Joplin Markdown-Datei exportiert! 📄');
    }

    async exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const sessions = await db.sessions.toArray();
        const devices = await db.devices.toArray();
        const devMap = Object.fromEntries(devices.map(d => [d.id, d.name]));

        doc.setFontSize(20);
        doc.text("Trainingsbericht", 20, 20);
        doc.setFontSize(10);
        doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')}`, 20, 28);
        doc.setFontSize(11);
        
        let y = 42;
        sessions.sort((a,b) => (b.date || '').localeCompare(a.date || '')).forEach(s => {
            if (y > 270) { doc.addPage(); y = 20; }
            const devName = devMap[s.deviceId] || 'Gerät';
            const hasInc = s.increases && Array.isArray(s.increases) && s.increases.length > 0;
            const incStr = hasInc ? ` | Steigerung: ${s.increases.map(w => w + 'kg').join(', ')}` : '';
            const maxW = s.maxWeight || (hasInc ? Math.max(s.weight, ...s.increases) : s.weight);

            doc.text(`${s.date}: ${devName} - Start: ${s.weight}kg${incStr} (Max: ${maxW}kg)`, 20, y);
            y += 9;
        });

        doc.save(`training_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('PDF-Bericht exportiert! 📑');
    }
}

// Global start
document.addEventListener('DOMContentLoaded', () => {
    window.fitnessApp = new FitnessApp();
});
