# Environment Configuration Guide

This document explains how to configure environment variables for the Smart Conference Display System backend. Both in production and development

## Frontend .env setup (conf_frontend/fe)
This .env use to setup access_token for light control in light_container.jsx
1. cd conf_frontend/fe
2. ***make .env directory***
   ```bash
   touch .env
   ```
3. ***Create Var. in .env***  
   ```bash
   VITE_ROOM_1501_TOKEN=
   VITE_ROOM_1502_TOKEN=
   VITE_ROOM_1505_TOKEN=
   VITE_ROOM_1506_TOKEN=
   VITE_ROOM_1514_TOKEN=
   VITE_ROOM_1515_TOKEN=
   ```
4. ***Contact dev. to get this token***

## Backend .env Quick Setup (conf_backend/be)
1. **Copy the example file:**
   ```bash
   cp config/.env.example config/.env
   ```

2. **Fill in your actual values** in the `.env` file
3. **Never commit the `.env` file** - it's already in `.gitignore`

## Environment Variables Reference

### 🔧 Application Settings
# <span style="color:red">Important! Development vs Production mode</span>
```bash
DEBUG_MODE='true'  # 'true' for development, 'false' for production
PORT=4000          # Server port (default: 4000)
```

**⚠️ IMPORTANT:** When `DEBUG_MODE='false'`: 
- Room deletion is enabled
- Warning emails are sent automatically when user not access pin 5 times
- PIN mails are activated

### 🔐 Authentication & JWT

```bash
# JWT Configuration
JWT_SECRET='your-super-secret-jwt-key-here'
JWT_EXPIRES_IN='100d'         # Token expiration 100 days for leave it open
JWT_REFRESH_EXPIRES_IN='100d' # Refresh token expiration

# Password Encryption
BCRYPT_SALT_ROUNDS=         # Salt rounds for bcrypt (10-15 recommended)
ENCRYPTION_KEY='32-char-encryption-key-for-tokens'
```

### 📧 Email Configuration

```bash
# Centralized email for notifications
CENTERLIZED_MAIL="meetingroom@tcc-technology.com"
```

### 🌐 Frontend URLs

```bash
# Frontend Application URLs
FRONTEND_ADMIN='http://localhost:5170/'  # Admin panel URL
FRONTEND_USERS='http://localhost:5173/'  # User display URL
```

### 🔑 Microsoft Azure Configuration

```bash
# Azure AD Application Registration
CLIENT_ID='your-azure-app-client-id'
TENANT_ID='your-azure-tenant-id'
CLIENT_SECRET='your-azure-app-client-secret'
# OAuth Redirect URI
REDIRECT_URI="http://localhost:5170/admin/admin/api"

# Microsoft Graph API Scopes (Contact dev to get scope)
SCOPE1=
SCOPE2= 
SCOPE3=
SCOPE4=
SCOPE5=
```

### 🗄️ Database Configuration
# Pattern: DB_URI="mongodb://username:password@host1:port1,host2:port2/database?option1=value1&option2=value2"
```bash
# MongoDB Connection
DB_URI="mongodb://MONGO_INITDB_ROOT_USERNAME:MONGO_INITDB_ROOT_PASSWORD@HOST:PORT/MONGO_INITDB_DATABASE?authSource=admin"
# OR for MongoDB Atlas:
# DB_URI='mongodb+srv://username:password@cluster.mongodb.net/smartconf'
```

### 📡 MQTT Configuration (Optional)

```bash
# MQTT Broker for IoT devices
OPEN_MQTT='false'  # Set to 'true' to enable MQTT connect broker
MQTT_BROKER_URL='mqtt://localhost:1883' # set follow your broker deployed
MQTT_TOPIC_CMD='smartconf/door/cmd' # topic for EMQX Broker 
```

### 🏢 Room Configuration
# Currently, none of the EXECPT_ROOMS have Display to use the feature regarding pin access, that's why we need to exclude these rooms.
# ✅️ In the future, it can be changed.
```bash 
# Rooms to exclude from operations (comma-separated)
EXECPT_ROOMS=1503,1504,1519,1520
```

### 🔮 Future Features
# Now, we not care about this, not required
```bash
# Reserved for future use
API_TIME_KEY='reserved-for-future-api-integration'
```

## Security Best Practices

### 🔒 For Production:
- Use strong, unique passwords and secrets
- Enable HTTPS for all frontend URLs
- Use MongoDB Atlas or secured MongoDB instance
- Set `DEBUG_MODE='false'` and `OPEN_MQTT='true`
- Use environment-specific email addresses

### 🛡️ For Development:
- Keep `DEBUG_MODE='true'` to prevent accidental operations
- Use local MongoDB instance
- Set `OPEN_MQTT='false'` unless testing IoT features
- Use localhost URLs for frontend applications

## Microsoft Azure Setup

1. **Register application in Azure Portal:**
   - Go to Azure Active Directory > App registrations
   - Select App registration and find app that using
   - Set redirect URI to your `REDIRECT_URI`

2. **Configure API permissions:**
   - Microsoft Graph > Delegated permissions
   - Add scopes: ...

3. **Get credentials:**
   - Copy `Application (client) ID` → `CLIENT_ID`
   - Copy `Directory (tenant) ID` → `TENANT_ID`
   - Create client secret → `CLIENT_SECRET`

## Troubleshooting

### Common Issues:

**MongoDB Connection Failed:**
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"

# Or verify Atlas connection string format
DB_URI='mongodb+srv://username:password@cluster.mongodb.net/database'
```

**Microsoft Auth Failed:**
- Verify `CLIENT_ID`, `TENANT_ID`, `CLIENT_SECRET`
- Check redirect URI matches Azure configuration
- Ensure required scopes are granted

**JWT Token Issues:**
- `JWT_SECRET` must be at least 32 characters
- Check token expiration settings

## File Structure

```
config/
├── .env.example    # Template file (committed to git)
└── .env           # Your actual config (DO NOT commit)
```

## Environment Validation

The application will validate required environment variables on startup. Missing critical variables will prevent the server from starting with appropriate error messages.

---

**⚠️ Security Warning:** Never commit the `.env` file or share it publicly. It contains sensitive credentials and secrets.