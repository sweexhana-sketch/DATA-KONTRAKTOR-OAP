/**
 * Utility to sync data to Google Sheets via Apps Script Webhook
 */
export async function syncToGoogleSheets(data) {
    const url = process.env.GOOGLE_SCRIPT_URL;

    if (!url || url.includes('XXXXXXXXX')) {
        console.warn('GOOGLE_SCRIPT_URL is not configured. Skipping sync.');
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            throw new Error(`Google Sheets sync failed: ${response.statusText}`);
        }

        console.log('Successfully synced to Google Sheets');
        return await response.json();
    } catch (error) {
        console.error('Error syncing to Google Sheets:', error);
    }
}
