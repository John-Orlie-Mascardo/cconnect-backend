# Address Schema Migration to Philippine Format

## Overview

Migrated the backend address schema from generic international format to Philippine-specific format to match the frontend implementation.

## Schema Changes

### Old Schema (International Format)
```javascript
{
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  isDefault: Boolean
}
```

### New Schema (Philippine Format)
```javascript
{
  province: String,      // e.g., "Metro Manila"
  city: String,          // e.g., "Quezon City"
  barangay: String,      // e.g., "Barangay Commonwealth"
  postalCode: String,    // e.g., "1100"
  streetDetails: String, // e.g., "123 Test Street, Building A, Unit 5"
  isDefault: Boolean
}
```

## Files Modified

### 1. User Model
**File**: [`models/user.js`](file:///c:/Users/kengb/cconnect-backend/models/user.js)

Updated the addresses subdocument schema to use Philippine format fields.

### 2. Order Model
**File**: [`models/order.js`](file:///c:/Users/kengb/cconnect-backend/models/order.js)

Updated `deliveryAddressSchema` to match the new Philippine format.

### 3. Address Routes
**File**: [`routes/address.js`](file:///c:/Users/kengb/cconnect-backend/routes/address.js)

- **POST /api/user/addresses**: Updated validation and field extraction
- **PUT /api/user/addresses/:addressId**: Updated field updates

### 4. Order Routes
**File**: [`routes/orders.js`](file:///c:/Users/kengb/cconnect-backend/routes/orders.js)

Updated delivery address validation in order creation endpoint.

### 5. Test Script
**File**: [`test-integration.ps1`](file:///c:/Users/kengb/cconnect-backend/test-integration.ps1)

Updated Test 7 to use Philippine address format.

## API Changes

### Create Address
**Endpoint**: `POST /api/user/addresses`

**Old Request Body**:
```json
{
  "street": "123 Main St",
  "city": "Quezon City",
  "state": "Metro Manila",
  "zipCode": "1100",
  "country": "Philippines",
  "isDefault": true
}
```

**New Request Body**:
```json
{
  "province": "Metro Manila",
  "city": "Quezon City",
  "barangay": "Barangay Commonwealth",
  "postalCode": "1100",
  "streetDetails": "123 Test Street, Building A, Unit 5",
  "isDefault": true
}
```

### Update Address
**Endpoint**: `PUT /api/user/addresses/:addressId`

Same field changes as create address.

### Create Order
**Endpoint**: `POST /api/orders/create`

**Old deliveryAddress**:
```json
{
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Quezon City",
    "state": "Metro Manila",
    "zipCode": "1100",
    "country": "Philippines"
  }
}
```

**New deliveryAddress**:
```json
{
  "deliveryAddress": {
    "province": "Metro Manila",
    "city": "Quezon City",
    "barangay": "Barangay Commonwealth",
    "postalCode": "1100",
    "streetDetails": "123 Test Street, Building A, Unit 5"
  }
}
```

## Migration Impact

### Breaking Changes
✅ **Frontend Already Compatible**: The frontend was already using the Philippine format, so no frontend changes needed.

⚠️ **Existing Data**: Any existing addresses in the database with the old schema will need to be migrated or will be incompatible.

### Data Migration (If Needed)

If there are existing addresses in the database, run this migration script:

```javascript
// migration-script.js
import mongoose from 'mongoose';
import { UserModel } from './models/user.js';

async function migrateAddresses() {
  const users = await UserModel.find({ 'addresses.0': { $exists: true } });
  
  for (const user of users) {
    let modified = false;
    
    user.addresses.forEach(addr => {
      // Check if old format
      if (addr.street && !addr.province) {
        // Map old fields to new fields
        addr.province = addr.state || 'Metro Manila';
        addr.barangay = 'N/A'; // Default value, needs manual update
        addr.postalCode = addr.zipCode || '';
        addr.streetDetails = addr.street || '';
        
        // Remove old fields
        delete addr.street;
        delete addr.state;
        delete addr.zipCode;
        delete addr.country;
        
        modified = true;
      }
    });
    
    if (modified) {
      await user.save();
      console.log(`Migrated addresses for user: ${user.email}`);
    }
  }
  
  console.log('Migration complete!');
}
```

## Testing

All integration tests pass with the new schema:

```
[7/10] Testing Create Address (Philippine Format)...
[PASS] Address Created: 4 total addresses
       Format: province, city, barangay, postalCode, streetDetails
```

## Frontend Compatibility

✅ **No Frontend Changes Required**

The frontend Address model already uses:
- `province`
- `city`
- `barangay`
- `postalCode`
- `streetDetails`

This migration ensures backend-frontend schema consistency.
