
import fetch from 'node-fetch'; // Assuming node-fetch or native fetch. If native, remove import.
// Node 18+ has native fetch. I'll use native fetch.

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'test_integration@example.com';
const PASSWORD = 'password123';

async function run() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/api/user/login-traditional`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful. Token obtained.');

        // 2. Get Products
        console.log('Fetching products...');
        let productsRes = await fetch(`${BASE_URL}/api/products`);
        let productsData = await productsRes.json();

        let product;
        if (!productsData || productsData.length === 0) {
            console.log('No products found. Creating a test product...');
            const createProductRes = await fetch(`${BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: "Test Product",
                    price: 100,
                    description: "Test Description",
                    quantity: 100,
                    stock: 100
                })
            });

            if (!createProductRes.ok) {
                throw new Error(`Failed to create test product: ${await createProductRes.text()}`);
            }

            const createData = await createProductRes.json();
            product = createData.product;
            console.log('Test product created.');
        } else {
            product = productsData[0];
        }

        console.log(`Using product: ${product.name} (${product._id})`);

        // 3. Test Case A: Valid Order
        console.log('\n--- Test Case A: Valid Order ---');
        const validOrder = {
            items: [{
                productId: product._id,
                quantity: 1,
                price: product.price
            }],
            deliveryAddress: {
                province: 'Metro Manila',
                city: 'Quezon City',
                barangay: 'Commonwealth',
                postalCode: '1100',
                streetDetails: '123 Test St'
            },
            paymentMethod: 'CoD'
        };

        await createOrder(token, validOrder, 'Valid Order');

        // 4. Test Case B: Missing Address Fields (Simulating potential frontend issue)
        console.log('\n--- Test Case B: Missing Address Fields ---');
        const invalidAddressOrder = {
            ...validOrder,
            deliveryAddress: {
                province: 'Metro Manila',
                // city missing
                barangay: 'Commonwealth',
                postalCode: '1100',
                streetDetails: '123 Test St'
            }
        };
        await createOrder(token, invalidAddressOrder, 'Missing City');

        // 5. Test Case C: Empty Strings in Address
        console.log('\n--- Test Case C: Empty Strings in Address ---');
        const emptyStringAddressOrder = {
            ...validOrder,
            deliveryAddress: {
                province: 'Metro Manila',
                city: '',
                barangay: 'Commonwealth',
                postalCode: '1100',
                streetDetails: '123 Test St'
            }
        };
        await createOrder(token, emptyStringAddressOrder, 'Empty City String');

        // 6. Test Case D: Insufficient Stock
        console.log('\n--- Test Case D: Insufficient Stock ---');
        const hugeQuantityOrder = {
            ...validOrder,
            items: [{
                productId: product._id,
                quantity: 999999, // Way more than stock
                price: product.price
            }]
        };
        await createOrder(token, hugeQuantityOrder, 'Insufficient Stock');

    } catch (error) {
        console.error('Script failed:', error.message);
    }
}

async function createOrder(token, orderData, testName) {
    const res = await fetch(`${BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    });

    const status = res.status;
    const text = await res.text();

    console.log(`[${testName}] Status: ${status}`);
    if (status !== 201) {
        console.log(`[${testName}] Error Response: ${text}`);
    } else {
        console.log(`[${testName}] Success!`);
    }
}

run();
