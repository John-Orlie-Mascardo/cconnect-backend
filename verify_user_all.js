import fetch from 'node-fetch';

async function verifyUserAll() {
    try {
        // Check health first
        const healthRes = await fetch('http://127.0.0.1:3000/api/health');
        console.log('Health check status:', healthRes.status);

        const response = await fetch('http://127.0.0.1:3000/api/user/all');

        if (response.status === 401 || response.status === 403) {
            console.log('✅ Endpoint exists and is protected (401/403 returned)');
        } else if (response.status === 200) {
            const data = await response.json();
            console.log(`✅ Endpoint returned 200 with ${data.length} users`);
            if (data.length > 0) {
                console.log('Sample user:', data[0]);
            }
        } else {
            console.log('❌ Unexpected status:', response.status);
        }
    } catch (error) {
        console.error('❌ Error verifying endpoint:', error.message);
    }
}

verifyUserAll();
