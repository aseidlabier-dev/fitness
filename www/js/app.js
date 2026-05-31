// --- Database Layer (Dexie.js) ---
const db = new Dexie('FitnessDB');
db.version(3).stores({
    devices: '++id, name, number, *weightRange, photo, notes',
    sessions: '++id, date, deviceId, weight, count, reps, timestamp, notes'
});

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

    showPage(pageId) {
        Object.values(this.pages).forEach(p => p.classList.remove('active'));
        if (this.pages[pageId]) {
            this.pages[pageId].classList.add('active');
            this.renderPage(pageId);
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
                            ${d.photo ? `<img src="${d.photo}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">` : '<div style="width:60px; height:60px; background:#333; border-radius:8px;"></div>'}
                            <div style="flex-grow:1;">
                                <h3>${d.name} ${d.number ? `<span style="color:var(--text-sub); font-size:0.9rem;">(#${d.number})</span>` : ''}</h3>
                                <p style="font-size:0.85rem; color:var(--text-sub); margin-bottom:5px;">
                                    Gewicht: ${d.weightMin}-${d.weightMax}kg | 
                                    Standard: ${d.defaultSets}x${d.defaultReps}
                                </p>
                                ${d.notes ? `<p style="font-size:0.8rem; border-top:1px solid #333; padding-top:5px; margin-top:5px; color:var(--text-sub); font-style:italic;">${d.notes}</p>` : ''}
                            </div>
                            <button class="btn btn-secondary btn-sm edit-device" data-id="${d.id}">✏️</button>
                            <button class="btn btn-secondary btn-sm delete-device text-danger" data-id="${d.id}" style="color:var(--danger)">🗑️</button>
                        </div>
                    </div>
                `).join('')}
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
                    ${devices.map(d => `<option value="${d.id}">${d.name} (${d.number || '-'})</option>`).join('')}
                </select>
            </div>
            
            <div id="last-session-info" class="card" style="display:none; background:rgba(0,170,255,0.05); border-color:var(--primary);">
                <p style="color:var(--primary); font-weight:600; font-size:0.9rem; margin-bottom:5px;">Letztes Training:</p>
                <p id="last-session-data">-</p>
            </div>

            <div id="training-entry-form" class="card" style="display:none;">
                <div style="display:grid; grid-template-columns:1fr; gap:10px;">
                    <div>
                        <label>Gewicht (kg)</label>
                        <input type="number" id="train-weight" step="0.5" value="0">
                        <input type="range" id="train-weight-slider">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                        <div>
                            <label>Anzahl (Sätze)</label>
                            <input type="number" id="train-sets" value="3">
                        </div>
                        <div>
                            <label>mit ... Wiederholungen</label>
                            <input type="number" id="train-reps" value="12">
                        </div>
                    </div>
                    <div>
                        <label>Notizen zum Satz (Optional)</label>
                        <input type="text" id="train-notes" placeholder="z.B. Partnerhilfe, Schmerzen...">
                    </div>
                    <div>
                        <label>Vorsatz fürs nächste Mal</label>
                        <select id="train-intensity-hint">
                            <option value="">Beibehalten (Keine Änderung)</option>
                            <option value="increase">📈 Gewicht / Wdh. steigern</option>
                            <option value="decrease">📉 Gewicht / Wdh. verringern</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary" id="save-session-btn" style="width:100%; margin-top:15px;">Eintrag speichern</button>
            </div>

            <div id="today-entries" class="card">
                <h3>Heutige Einträge</h3>
                <div id="today-entries-list"></div>
            </div>
        `;
    },

    async renderOverview() {
        this.pages.overview.innerHTML = `
            <div class="title-row">
                <h2>Trainingsübersicht</h2>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-secondary" id="export-md-btn">Joplin (.md)</button>
                    <button class="btn btn-secondary" id="export-pdf-btn">PDF</button>
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
                    ${devices.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                </select>
            </div>
            
            <div id="stats-detail" style="display:none;">
                <div class="card device-info-header" style="display:flex; gap:20px; align-items:center;">
                    <img id="stats-device-img" src="" style="width:100px; height:100px; border-radius:12px; object-fit:cover;">
                    <div>
                        <h3 id="stats-device-name">Gerät</h3>
                        <p id="stats-device-meta" style="color:var(--text-sub);"></p>
                    </div>
                </div>

                <div class="card">
                    <h3>Grafische Übersicht</h3>
                    <canvas id="stats-chart-weight" style="margin-bottom:30px;"></canvas>
                    <canvas id="stats-chart-volume"></canvas>
                </div>

                <div class="card">
                    <h3>Verlauf</h3>
                    <div id="stats-table-container" style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; min-width:300px;">
                            <thead>
                                <tr style="border-bottom:1px solid var(--accent-grey); text-align:left;">
                                    <th style="padding:10px 5px;">Datum</th>
                                    <th style="padding:10px 5px;">Gewicht</th>
                                    <th style="padding:10px 5px;">Sätze x Reps</th>
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

        // Install banner logic for iOS devices (Safari does not support beforeinstallprompt)
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

        // Navigation (Click logic uses Event Delegation to handle dynamic hero buttons better if needed, but here we attach directly)
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
                if (pageId) this.navigateTo(pageId);
                return; // Navigation handled
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
            
            // Training Actions
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

        // Input sync for weight slider
        document.addEventListener('input', (e) => {
            if (e.target.id === 'train-weight-slider') {
                document.getElementById('train-weight').value = e.target.value;
            }
            if (e.target.id === 'train-weight') {
                const slider = document.getElementById('train-weight-slider');
                if (slider) slider.value = e.target.value;
            }
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

    navigateTo(pageId) {
        this.activePage = pageId;
        
        // Update Nav UI
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageId);
        });

        // Page title rename
        const titles = {
            home: 'Fitness App',
            training: 'Heutiges Training',
            overview: 'Trainingsübersicht',
            stats: 'Entwicklung Training',
            admin: 'Geräte-Verwaltung'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = titles[pageId] || 'Fitness';

        ui.showPage(pageId);

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
    }

    // --- Admin Logic ---
    async showDeviceModal(id = null) {
        let device = { name: '', number: '', weightMin: 5, weightMax: 100, defaultSets: 3, defaultReps: 12, photo: null, notes: '' };
        if (id) {
            device = await db.devices.get(parseInt(id));
        }

        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = id ? 'Gerät bearbeiten' : 'Neues Gerät';
        modalBody.innerHTML = `
            <form id="device-form" style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
                <input type="hidden" id="device-id" value="${id || ''}">
                <label>Name des Gerätes</label>
                <input type="text" id="dev-name" value="${device.name}" required>
                
                <label>Nummer (Optional)</label>
                <input type="text" id="dev-number" value="${device.number}">
                
                <label>Anmerkungen / Notizen</label>
                <textarea id="dev-notes" style="height:80px; resize:none;" placeholder="Übungsausführung, Griffart...">${device.notes || ''}</textarea>

                <label>Gewichtsbereich (kg)</label>
                <div style="display:flex; gap:10px;">
                    <input type="number" id="dev-weight-min" value="${device.weightMin}" placeholder="Von">
                    <input type="number" id="dev-weight-max" value="${device.weightMax}" placeholder="Bis">
                </div>
                
                <label>Standard Sätze x Reps</label>
                <div style="display:flex; gap:10px;">
                    <input type="number" id="dev-sets" value="${device.defaultSets}">
                    <input type="number" id="dev-reps" value="${device.defaultReps}">
                </div>

                <label>Foto hinzufügen</label>
                <input type="file" id="dev-photo-input" accept="image/*">
                ${device.photo ? `<img id="dev-photo-preview" src="${device.photo}" style="width:100%; height:150px; object-fit:contain; background:#111; margin-bottom:10px; border-radius:8px;">` : '<img id="dev-photo-preview" style="display:none; width:100%; height:150px; object-fit:contain; background:#111; margin-bottom:10px; border-radius:8px;">'}
                
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
                weightMin: parseFloat(document.getElementById('dev-weight-min').value),
                weightMax: parseFloat(document.getElementById('dev-weight-max').value),
                defaultSets: parseInt(document.getElementById('dev-sets').value),
                defaultReps: parseInt(document.getElementById('dev-reps').value),
                photo: photoPreview.src || null
            };

            if (devId) {
                await db.devices.update(parseInt(devId), data);
            } else {
                await db.devices.add(data);
            }
            
            document.getElementById('modal-container').classList.add('hidden');
            ui.renderAdmin();
        };
    }

    async deleteDevice(id) {
        if (confirm('Dieses Gerät wirklich löschen? Alle zugehörigen Trainingsdaten bleiben in der Historie (optional).')) {
            await db.devices.delete(parseInt(id));
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
        if (!deviceId) {
            document.getElementById('training-entry-form').style.display = 'none';
            document.getElementById('last-session-info').style.display = 'none';
            return;
        }

        const device = await db.devices.get(parseInt(deviceId));
        const lastSession = await db.sessions.where('deviceId').equals(parseInt(deviceId)).reverse().first();

        // Update UI with device limits
        const weightInput = document.getElementById('train-weight');
        const weightSlider = document.getElementById('train-weight-slider');
        weightInput.min = device.weightMin;
        weightInput.max = device.weightMax;
        weightSlider.min = device.weightMin;
        weightSlider.max = device.weightMax;
        weightSlider.step = 0.5;

        // Use last session values or defaults
        if (lastSession) {
            weightInput.value = lastSession.weight;
            weightSlider.value = lastSession.weight;
            document.getElementById('train-sets').value = lastSession.count;
            document.getElementById('train-reps').value = lastSession.reps;
            
            let hintHtml = '';
            if (lastSession.intensityHint === 'increase') {
                hintHtml = `<div style="margin-top:5px; color: #ffaa00; font-weight: bold;">📈 Hinweis: Intensität beim nächsten Mal steigern!</div>`;
            } else if (lastSession.intensityHint === 'decrease') {
                hintHtml = `<div style="margin-top:5px; color: #00aaff; font-weight: bold;">📉 Hinweis: Intensität beim nächsten Mal verringern!</div>`;
            }

            let notesHtml = '';
            if (lastSession.notes) {
                notesHtml = `<div style="margin-top:5px; font-size: 0.85rem; font-style: italic; color: var(--text-sub);">Notiz: ${lastSession.notes}</div>`;
            }

            document.getElementById('last-session-data').innerHTML = `${lastSession.date}: <strong>${lastSession.weight}kg | ${lastSession.count}x${lastSession.reps}</strong>${hintHtml}${notesHtml}`;
            document.getElementById('last-session-info').style.display = 'block';
        } else {
            weightInput.value = device.weightMin;
            weightSlider.value = device.weightMin;
            document.getElementById('train-sets').value = device.defaultSets;
            document.getElementById('train-reps').value = device.defaultReps;
            document.getElementById('last-session-info').style.display = 'none';
        }

        document.getElementById('training-entry-form').style.display = 'block';
    }

    async saveTrainingSession() {
        const deviceSelect = document.getElementById('training-device-select');
        const entry = {
            date: document.getElementById('training-date').value,
            deviceId: parseInt(deviceSelect.value),
            weight: parseFloat(document.getElementById('train-weight').value),
            count: parseInt(document.getElementById('train-sets').value),
            reps: parseInt(document.getElementById('train-reps').value),
            notes: document.getElementById('train-notes').value.trim(),
            intensityHint: document.getElementById('train-intensity-hint') ? document.getElementById('train-intensity-hint').value : '',
            timestamp: Date.now()
        };

        if (!entry.deviceId) return alert('Bitte Gerät wählen');
        
        await db.sessions.add(entry);
        alert('Gespeichert!');
        document.getElementById('train-notes').value = ''; // Input leeren
        if (document.getElementById('train-intensity-hint')) {
            document.getElementById('train-intensity-hint').value = '';
        }
        this.renderTodayEntries();
    }

    async renderTodayEntries() {
        const dateInput = document.getElementById('training-date');
        if (!dateInput) return;
        const date = dateInput.value;
        const sessions = await db.sessions.where('date').equals(date).toArray();
        const devices = await db.devices.toArray();
        const devMap = Object.fromEntries(devices.map(d => [d.id, d.name]));

        const list = document.getElementById('today-entries-list');
        if (!list) return;

        list.innerHTML = sessions.map(s => `
            <div style="padding:10px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${devMap[s.deviceId]}</strong>: ${s.weight}kg | ${s.count}x${s.reps}
                    ${s.notes ? `<div style="font-size:0.8rem; color:var(--primary); font-style:italic;">${s.notes}</div>` : ''}
                </div>
                <button class="delete-session" data-id="${s.id}" style="background:transparent; border:none; color:var(--danger); cursor:pointer; padding:5px;">🗑️</button>
            </div>
        `).join('') || '<p style="color:var(--text-sub);">Noch keine Einträge heute.</p>';
    }

    async deleteSession(id) {
        if (confirm('Diesen Trainingssatz wirklich löschen?')) {
            await db.sessions.delete(parseInt(id));
            if (this.activePage === 'training') this.renderTodayEntries();
            if (this.activePage === 'overview') this.handleOverviewChange(document.getElementById('overview-date').value);
        }
    }

    async handleOverviewChange(date) {
        if (!date) return;
        const sessions = await db.sessions.where('date').equals(date).toArray();
        const devices = await db.devices.toArray();
        const devMap = Object.fromEntries(devices.map(d => [d.id, d.name]));

        const list = document.getElementById('overview-list');
        if (!list) return;
        list.innerHTML = `
            <div class="card">
                <h3>${date}</h3>
                <div style="margin-top:10px;">
                    ${sessions.map(s => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #222;">
                            <div style="flex:1;">
                                <strong>${devMap[s.deviceId]}</strong><br>
                                <span style="font-size:0.9rem; color:var(--text-sub);">${s.weight}kg | ${s.count}x${s.reps}</span>
                                ${s.notes ? `<div style="font-size:0.8rem; color:var(--primary); font-style:italic;">Note: ${s.notes}</div>` : ''}
                            </div>
                            <button class="delete-session" data-id="${s.id}" style="background:transparent; border:none; color:var(--danger); cursor:pointer; padding:5px;">🗑️</button>
                        </div>
                    `).join('') || '<p>Keine Trainingsdaten für diesen Tag.</p>'}
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
        const history = await db.sessions.where('deviceId').equals(deviceIdInt).sortBy('date');

        // UI Detail
        document.getElementById('stats-device-name').textContent = device.name;
        document.getElementById('stats-device-meta').textContent = `ID: ${device.number || '-'} | Range: ${device.weightMin}-${device.weightMax}kg`;
        const statsImg = document.getElementById('stats-device-img');
        statsImg.src = device.photo || '';
        statsImg.style.display = device.photo ? 'block' : 'none';
        
        // History Table
        document.getElementById('stats-history-body').innerHTML = history.reverse().map(h => `
            <tr style="border-bottom:1px solid #222;">
                <td style="padding:10px 5px;">${h.date}</td>
                <td style="padding:10px 5px; font-weight:600; color:var(--primary);">${h.weight} kg</td>
                <td style="padding:10px 5px;">${h.count} x ${h.reps}</td>
            </tr>
        `).join('');

        this.updateCharts(history.reverse()); // Reverse back for chronological chart
        document.getElementById('stats-detail').style.display = 'block';
    }

    updateCharts(history) {
        const labels = history.map(h => h.date);
        const weights = history.map(h => h.weight);
        const volumes = history.map(h => h.weight * h.count * h.reps);

        if (this.charts.weight) this.charts.weight.destroy();
        if (this.charts.volume) this.charts.volume.destroy();

        const ctx1 = document.getElementById('stats-chart-weight');
        const ctx2 = document.getElementById('stats-chart-volume');
        if (!ctx1 || !ctx2) return;

        const chartOptions = {
            responsive: true,
            scales: {
                y: { beginAtZero: false, grid: { color: '#333' }, ticks: { color: '#aaa' } },
                x: { grid: { display: false }, ticks: { color: '#aaa' } }
            },
            plugins: { legend: { display: true, labels: { color: '#fff' } } }
        };

        this.charts.weight = new Chart(ctx1, {
            type: 'line',
            data: {
                labels,
                datasets: [{ label: 'Gewicht (kg)', data: weights, borderColor: '#00aaff', backgroundColor: 'rgba(0,170,255,0.2)', fill: true, tension: 0.3 }]
            },
            options: chartOptions
        });

        this.charts.volume = new Chart(ctx2, {
            type: 'line',
            data: {
                labels,
                datasets: [{ label: 'Gesamtgewicht (kg)', data: volumes, borderColor: '#03dac6', backgroundColor: 'rgba(3,218,198,0.2)', fill: true, tension: 0.3 }]
            },
            options: chartOptions
        });
    }

    // --- Export Logic ---
    async exportMarkdown() {
        const sessions = await db.sessions.toArray();
        const devices = await db.devices.toArray();
        const devMap = Object.fromEntries(devices.map(d => [d.id, d.name]));

        let md = `# Trainingsexport vom ${new Date().toLocaleDateString()}\n\n`;
        sessions.sort((a,b) => a.date.localeCompare(b.date)).forEach(s => {
            md += `### ${s.date}\n- **Gerät**: ${devMap[s.deviceId] || 'Unbekannt'}\n- **Gewicht**: ${s.weight} kg\n- **Sätze**: ${s.count} x ${s.reps}\n\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training_export_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
    }

    async exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const sessions = await db.sessions.toArray();
        const devices = await db.devices.toArray();
        const devMap = Object.fromEntries(devices.map(d => [d.id, d.name]));

        doc.setFontSize(22);
        doc.text("Trainingsbericht", 20, 20);
        doc.setFontSize(12);
        
        let y = 40;
        sessions.sort((a,b) => b.date.localeCompare(a.date)).forEach(s => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`${s.date}: ${devMap[s.deviceId]} - ${s.weight}kg (${s.count}x${s.reps})`, 20, y);
            y += 10;
        });

        doc.save(`training_${new Date().toISOString().split('T')[0]}.pdf`);
    }
}

// Global start
document.addEventListener('DOMContentLoaded', () => {
    window.fitnessApp = new FitnessApp();
});
