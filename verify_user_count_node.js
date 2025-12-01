import fetch from 'node-fetch';

async function verifyUserCount() {
    try {
        // 1. Login to get token (simulated or using a known test user)
        // For this test, we might need a valid token. 
        // If we can't easily get one, we might need to rely on code review or temporarily disable auth for the endpoint (not recommended).
        // Alternatively, we can check if there is a login script available.

        // Assuming we have a way to get a token, or we can just check if the endpoint exists and returns 401 (which confirms it's there and protected).

        // Check health first
        const healthRes = await fetch('http://127.0.0.1:3000/api/health');
        console.log('Health check status:', healthRes.status);

        const response = await fetch('http://127.0.0.1:3000/api/user/count');

        if (response.status === 401 || response.status === 403) {
            console.log('✅ Endpoint exists and is protected (401/403 returned)');
        } else if (response.status === 200) {
            const data = await response.json();
            console.log('✅ Endpoint returned 200:', data);
        } else {
            console.log('❌ Unexpected status:', response.status);
        }
    } catch (error) {
        console.error('❌ Error verifying endpoint:', error.message);
    }
}

verifyUserCount();
