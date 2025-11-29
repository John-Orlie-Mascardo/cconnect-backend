// Test the cart update endpoint directly
// This simulates what the frontend SHOULD be sending

const productIdInCart = '69295e921899ab97f1f8bb7a';

console.log('Testing cart update with correct product ID...');
console.log(`Product ID: ${productIdInCart}`);
console.log('Quantity: 5');
console.log('\nRun this command to test:');
console.log(`Invoke-WebRequest -Uri "http://localhost:3000/api/cart/update" -Method PUT -Headers @{"Authorization"="Bearer YOUR_TOKEN"; "Content-Type"="application/json"} -Body '{"productId":"${productIdInCart}","quantity":5}'`);
