// Add to admin portal - S3 Backend Integration
// This replaces localStorage with S3 storage

const S3_BUCKET = 'ledebe';
const S3_REGION = 'us-east-2';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

// Save data to S3
async function saveToS3(institutionId, data) {
    const dataUrl = `${S3_BASE_URL}/${institutionId}/data.json`;
    
    try {
        const response = await fetch(dataUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to save');
        console.log('✅ Data synced to S3');
        return true;
    } catch (error) {
        console.error('❌ Sync failed:', error);
        // Fallback to localStorage
        localStorage.setItem(`ledebe-admin-${institutionId}`, JSON.stringify(data));
        return false;
    }
}

// Load data from S3
async function loadFromS3(institutionId) {
    const dataUrl = `${S3_BASE_URL}/${institutionId}/data.json`;
    
    try {
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error('No data found');
        
        const data = await response.json();
        console.log('✅ Data loaded from S3');
        return data;
    } catch (error) {
        console.log('📦 Loading from localStorage');
        // Fallback to localStorage
        const localData = localStorage.getItem(`ledebe-admin-${institutionId}`);
        return localData ? JSON.parse(localData) : { terms: [], employees: [] };
    }
}

// Updated save function
async function saveData(data) {
    // Save to both S3 and localStorage
    localStorage.setItem(storageKey, JSON.stringify(data));
    await saveToS3(institutionId, data);
}

// Updated load function
async function loadData() {
    return await loadFromS3(institutionId);
}
