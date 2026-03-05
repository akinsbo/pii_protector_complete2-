// Company Terms Sync for Desktop App
// Add this to index.html

class CompanyTermsSync {
    constructor() {
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
        this.s3BaseUrl = 'https://ledebe.s3.us-east-2.amazonaws.com';
        this.companyId = localStorage.getItem('ledebe-company-id') || null;
        this.lastSync = null;
        
        if (this.companyId) {
            this.startAutoSync();
        }
    }

    // Set company ID (called after employee login)
    setCompany(companyId) {
        this.companyId = companyId;
        localStorage.setItem('ledebe-company-id', companyId);
        this.syncNow();
        this.startAutoSync();
    }

    // Fetch company terms from S3
    async fetchCompanyTerms() {
        if (!this.companyId) return [];

        try {
            const url = `${this.s3BaseUrl}/${this.companyId}/data.json`;
            const response = await fetch(url);
            
            if (!response.ok) {
                console.log('No company data found');
                return [];
            }

            const data = await response.json();
            this.lastSync = new Date();
            
            return data.terms || [];
        } catch (error) {
            console.error('Sync error:', error);
            return [];
        }
    }

    // Sync and merge with personal terms
    async syncNow() {
        const companyTerms = await this.fetchCompanyTerms();
        
        if (companyTerms.length > 0) {
            // Store company terms separately
            localStorage.setItem('ledebe-company-terms', JSON.stringify(companyTerms));
            
            // Update UI
            this.updateTermsUI(companyTerms);
            
            console.log(`✅ Synced ${companyTerms.length} company terms`);
            this.showSyncNotification(companyTerms.length);
        }
    }

    // Update UI to show company terms
    updateTermsUI(companyTerms) {
        const customTermsSection = document.getElementById('custom-terms-section');
        if (!customTermsSection) return;

        // Add company terms section if it doesn't exist
        let companySection = document.getElementById('company-terms-display');
        if (!companySection) {
            companySection = document.createElement('div');
            companySection.id = 'company-terms-display';
            companySection.style.cssText = 'margin-bottom: 1rem; padding: 1rem; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #27ae60;';
            customTermsSection.insertBefore(companySection, customTermsSection.firstChild);
        }

        const termsList = companyTerms.map(t => t.text).join(', ');
        companySection.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: #27ae60;">🔒 Company Protected Terms</h4>
                <span style="font-size: 0.85rem; color: #7f8c8d;">Last sync: ${this.lastSync ? this.lastSync.toLocaleTimeString() : 'Never'}</span>
            </div>
            <div style="color: #2c3e50; font-size: 0.9rem; line-height: 1.6;">
                ${companyTerms.length} terms: <strong>${termsList}</strong>
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #7f8c8d;">
                These terms are managed by your company admin and automatically protected.
            </div>
        `;
    }

    // Show sync notification
    showSyncNotification(count) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `✅ Synced ${count} company terms`;
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
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);

        // Company terms take priority
        const companyTermTexts = companyTerms.map(t => t.text);
        return [...companyTermTexts, ...personalTerms];
    }

    // Start auto-sync
    startAutoSync() {
        if (this.syncTimer) clearInterval(this.syncTimer);
        
        this.syncTimer = setInterval(() => {
            this.syncNow();
        }, this.syncInterval);

        // Sync on window focus
        window.addEventListener('focus', () => {
            const timeSinceLastSync = this.lastSync ? Date.now() - this.lastSync.getTime() : Infinity;
            if (timeSinceLastSync > 60000) { // 1 minute
                this.syncNow();
            }
        });
    }

    // Stop auto-sync
    stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }
}

// Initialize sync
const companySync = new CompanyTermsSync();

// Example: Set company after employee login
// companySync.setCompany('acme');

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
