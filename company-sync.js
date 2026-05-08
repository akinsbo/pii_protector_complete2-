// Ledebe Company Terms Sync — Encrypted Desktop App Module
// Fetches encrypted terms from the API, decrypts locally with the team key.
// No plaintext terms ever leave the device.

class CompanyTermsSync {
    constructor() {
        this.apiBase = 'https://m9ur273451.execute-api.us-east-2.amazonaws.com';
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
        this.companyId = localStorage.getItem('ledebe-company-id') || null;
        this.teamKey = null;
        this.lastSync = null;
        this.syncTimer = null;
        this.currentVersion = 0;

        if (this.companyId) {
            this.teamKey = localStorage.getItem(`ledebe-teamkey-${this.companyId}`);
            if (this.teamKey) {
                this.syncNow();
                this.startAutoSync();
            }
        }
    }

    // ── Crypto helpers (matching admin-portal/crypto.js) ──────────────────

    _base64ToBuf(b64) {
        const str = atob(b64);
        const buf = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
        return buf.buffer;
    }

    async _importKey(base64) {
        const raw = this._base64ToBuf(base64);
        return crypto.subtle.importKey(
            'raw', raw, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
        );
    }

    async _decryptTerms(encryptedTerms, termsIv) {
        const iv = this._base64ToBuf(termsIv);
        const key = await this._importKey(this.teamKey);
        const ciphertext = this._base64ToBuf(encryptedTerms);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        return JSON.parse(new TextDecoder().decode(decrypted));
    }

    // ── Join company (called from settings UI) ────────────────────────────

    async joinCompany(joinCode, email) {
        const deviceId = this._getDeviceId();

        const res = await fetch(`${this.apiBase}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ joinCode: joinCode.toUpperCase(), email, deviceId })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to join');

        // Decrypt team key with join code
        const teamKey = await this._decryptTeamKeyWithCode(
            data.encryptedTeamKey, data.teamKeySalt, data.teamKeyIv, joinCode.toUpperCase()
        );

        // Store locally
        this.companyId = data.companyId;
        this.teamKey = teamKey;
        localStorage.setItem('ledebe-company-id', data.companyId);
        localStorage.setItem('ledebe-company-name', data.companyName);
        localStorage.setItem('ledebe-employee-email', email);
        localStorage.setItem(`ledebe-teamkey-${data.companyId}`, teamKey);

        // Start syncing
        await this.syncNow();
        this.startAutoSync();

        return { companyId: data.companyId, companyName: data.companyName };
    }

    async _decryptTeamKeyWithCode(encryptedTeamKey, salt64, iv64, joinCode) {
        const salt = this._base64ToBuf(salt64);
        const iv = this._base64ToBuf(iv64);
        const ciphertext = this._base64ToBuf(encryptedTeamKey);

        const enc = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            'raw', enc.encode(joinCode), 'PBKDF2', false, ['deriveKey']
        );
        const codeKey = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            codeKey,
            ciphertext
        );

        // Convert raw bytes to base64
        const bytes = new Uint8Array(decrypted);
        let str = '';
        for (const b of bytes) str += String.fromCharCode(b);
        return btoa(str);
    }

    // ── Sync ──────────────────────────────────────────────────────────────

    async syncNow() {
        if (!this.companyId || !this.teamKey) return;

        try {
            const res = await fetch(`${this.apiBase}/terms/${this.companyId}`);
            if (!res.ok) {
                console.log('Sync: no company data found');
                return;
            }

            const data = await res.json();

            // Skip if same version
            if (data.termsVersion <= this.currentVersion && this.currentVersion > 0) {
                this.lastSync = new Date();
                return;
            }

            if (!data.encryptedTerms) {
                console.log('Sync: no terms published yet');
                this.lastSync = new Date();
                return;
            }

            // Decrypt terms locally
            const terms = await this._decryptTerms(data.encryptedTerms, data.termsIv);
            this.currentVersion = data.termsVersion;
            this.lastSync = new Date();

            // Store decrypted terms locally
            localStorage.setItem('ledebe-company-terms', JSON.stringify(terms));

            // Update UI
            this.updateTermsUI(terms);

            // Send heartbeat
            this._sendHeartbeat();

            console.log(`Synced ${terms.length} company terms (v${data.termsVersion})`);
            this.showSyncNotification(terms.length);

        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    // Send heartbeat to update lastSeen
    async _sendHeartbeat() {
        const email = localStorage.getItem('ledebe-employee-email');
        if (!email || !this.companyId) return;
        try {
            await fetch(`${this.apiBase}/members/${this.companyId}/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
        } catch {}
    }

    // Update UI to show company terms
    updateTermsUI(companyTerms) {
        const customTermsSection = document.getElementById('custom-terms-section');
        if (!customTermsSection) return;

        let companySection = document.getElementById('company-terms-display');
        if (!companySection) {
            companySection = document.createElement('div');
            companySection.id = 'company-terms-display';
            companySection.style.cssText = 'margin-bottom: 1rem; padding: 1rem; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #27ae60;';
            customTermsSection.insertBefore(companySection, customTermsSection.firstChild);
        }

        const companyName = localStorage.getItem('ledebe-company-name') || this.companyId;
        const termsList = companyTerms.map(t => t.text).join(', ');

        companySection.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: #27ae60;">Company Protected Terms</h4>
                <span style="font-size: 0.75rem; color: #7f8c8d; display: flex; align-items: center; gap: 0.35rem;">
                    <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    E2E encrypted · Last sync: ${this.lastSync ? this.lastSync.toLocaleTimeString() : 'Never'}
                </span>
            </div>
            <div style="color: #2c3e50; font-size: 0.9rem; line-height: 1.6;">
                ${companyTerms.length} terms from <strong>${companyName}</strong>: <strong>${termsList}</strong>
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.78rem; color: #7f8c8d;">
                Managed by your company admin. Decrypted locally on this device.
            </div>
        `;
    }

    showSyncNotification(count) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: #27ae60; color: white;
            padding: 0.875rem 1.5rem; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000; font-size: 0.875rem; font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = `Synced ${count} company terms`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Get all terms (company + personal)
    getAllTerms() {
        const companyTerms = JSON.parse(localStorage.getItem('ledebe-company-terms') || '[]');
        const personalTerms = (document.getElementById('custom-terms')?.value || '')
            .split('\n').map(s => s.trim()).filter(Boolean);

        const companyTermTexts = companyTerms.map(t => t.text);
        return [...companyTermTexts, ...personalTerms];
    }

    // ── Auto-sync ─────────────────────────────────────────────────────────

    startAutoSync() {
        if (this.syncTimer) clearInterval(this.syncTimer);
        this.syncTimer = setInterval(() => this.syncNow(), this.syncInterval);

        // Sync on window focus (if >1 min since last)
        window.addEventListener('focus', () => {
            const elapsed = this.lastSync ? Date.now() - this.lastSync.getTime() : Infinity;
            if (elapsed > 60000) this.syncNow();
        });
    }

    stopAutoSync() {
        if (this.syncTimer) { clearInterval(this.syncTimer); this.syncTimer = null; }
    }

    // Leave company
    leaveCompany() {
        this.stopAutoSync();
        if (this.companyId) {
            localStorage.removeItem(`ledebe-teamkey-${this.companyId}`);
        }
        localStorage.removeItem('ledebe-company-id');
        localStorage.removeItem('ledebe-company-name');
        localStorage.removeItem('ledebe-employee-email');
        localStorage.removeItem('ledebe-company-terms');
        this.companyId = null;
        this.teamKey = null;
        this.currentVersion = 0;

        const el = document.getElementById('company-terms-display');
        if (el) el.remove();
    }

    _getDeviceId() {
        let id = localStorage.getItem('ledebe-device-id');
        if (!id) {
            id = 'dev-' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
                .map(b => b.toString(16).padStart(2,'0')).join('');
            localStorage.setItem('ledebe-device-id', id);
        }
        return id;
    }
}

// Initialize
const companySync = new CompanyTermsSync();
window.companySync = companySync;

// CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
`;
document.head.appendChild(style);
