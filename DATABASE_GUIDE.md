# MongoDB Database Integration Guide

## Overview
This application now uses MongoDB to store user data, activities, and transactions for the wallet access platform.

## Database Configuration

### Database Name
- **web_wallet_access**

### Connection
- **Default URI**: `mongodb://localhost:27017/`
- **Configurable via**: `MONGODB_URI` environment variable in `.env`

## Collections Structure

### 1. users Collection
Stores user information and access details.

**Schema:**
```json
{
  "_id": ObjectId,
  "wallet_address": "string (lowercase)",
  "created_at": ISODate,
  "last_login": ISODate,
  "login_count": "number",
  "is_active": "boolean",
  "access_level": "string",
  "platform_access": {
    "has_access": "boolean",
    "access_granted_at": ISODate,
    "access_method": "string",
    "last_access": ISODate,
    "updated_by": "string",
    "revoked_at": ISODate",
    "revocation_reason": "string"
  },
  "user_agent": "string",
  "ip_address": "string"
}
```

### 2. user_activities Collection
Logs all user activities for audit trail.

**Schema:**
```json
{
  "_id": ObjectId,
  "wallet_address": "string (lowercase)",
  "activity_type": "string",
  "timestamp": ISODate,
  "details": {
    "user_agent": "string",
    "ip_address": "string",
    "access_type": "string",
    "additional_data": "object"
  }
}
```

**Activity Types:**
- `login` - User login/registration
- `platform_access` - Platform access attempts
- `access_level_updated` - Admin changed access level
- `access_revoked` - User access was revoked
- `test_activity` - Test activities

### 3. transactions Collection
Stores transaction details and history.

**Schema:**
```json
{
  "_id": ObjectId,
  "wallet_address": "string (lowercase)",
  "transaction_hash": "string",
  "transaction_type": "string",
  "amount": "string",
  "token": "string",
  "from_address": "string",
  "to_address": "string",
  "block_number": "number",
  "timestamp": ISODate,
  "status": "string",
  "details": "object"
}
```

**Transaction Types:**
- `transfer` - Token transfers
- `approval` - Contract approvals
- `test_transaction` - Test transactions

## API Endpoints

### User Management
- `POST /api/user/login` - Register or login user
- `POST /api/user/access-platform` - Record platform access
- `POST /api/user/profile` - Get user profile with activities and transactions

### Admin Endpoints
- `GET /api/admin/users` - Get all users (with pagination)
- `GET /api/admin/stats` - Get platform statistics
- `POST /api/admin/update-access` - Update user access level

### Transaction Management
- `POST /api/transaction/log` - Log a transaction

### System Health
- `GET /api/db/health` - Check database connection health

## DBManager Class Methods

### User Operations
```python
# Create or update user
db_manager.create_user(wallet_address, additional_data)

# Get user information
db_manager.get_user(wallet_address)

# Get all users with pagination
db_manager.get_all_users(limit=100, skip=0)

# Update user login information
db_manager.update_user_login(wallet_address)
```

### Activity Operations
```python
# Log user activity
db_manager.log_user_activity(wallet_address, activity_type, details)

# Get user activities
db_manager.get_user_activities(wallet_address, limit=50)
```

### Transaction Operations
```python
# Log transaction
db_manager.log_transaction(wallet_address, transaction_data)

# Get user transactions
db_manager.get_user_transactions(wallet_address, limit=50)
```

### Access Control
```python
# Update access level
db_manager.update_access_level(wallet_address, access_level, updated_by)

# Revoke access
db_manager.revoke_access(wallet_address, reason)
```

### Analytics
```python
# Get platform statistics
db_manager.get_platform_stats()
```

## Environment Variables

Add these to your `.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
```

## Installation

1. Install MongoDB dependencies:
```bash
pip install pymongo dnspython
```

2. Make sure MongoDB is running on your system
3. Update the `MONGODB_URI` in your `.env` file if needed

## Testing

Run the database test script:
```bash
python test_db.py
```

Or use the built-in health check:
```bash
curl http://localhost:3000/api/db/health
```

## Security Notes

- All wallet addresses are stored in lowercase for consistency
- User agent and IP address are logged for security audit purposes
- Access control changes are logged with timestamps and user information
- Database operations include proper error handling and validation

## Usage Examples

### User Login Flow
```javascript
// Frontend
const response = await fetch('/api/user/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: userWalletAddress,
    timestamp: new Date().toISOString()
  })
});

const data = await response.json();
// User is now registered/logged in and data is stored in MongoDB
```

### Recording Platform Access
```javascript
// When user connects wallet or accesses platform
await fetch('/api/user/access-platform', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: userWalletAddress,
    access_type: 'wallet_connect',
    additional_data: {
      browser: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`
    }
  })
});
```

### Admin - Get Platform Statistics
```javascript
const response = await fetch('/api/admin/stats');
const stats = await response.json();
// Returns user counts, transaction counts, recent activity metrics
```

## Data Retention

Consider implementing data retention policies for:
- Old user activities (keep last 6-12 months)
- Completed transactions (keep for regulatory compliance)
- Inactive users (archival or deletion policies)