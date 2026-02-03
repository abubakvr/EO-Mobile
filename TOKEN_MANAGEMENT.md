# Token Management

This document describes how authentication tokens are managed in the app.

## Overview

- **Storage**: Tokens are stored securely using Expo SecureStore (better than localStorage for mobile apps)
- **Automatic Attachment**: Access tokens are automatically attached to all API requests
- **Exclusions**: Login and signup endpoints automatically skip authentication

## Token Storage

### Access Token
- Stored in SecureStore with key: `access_token`
- Automatically saved after successful login
- Automatically loaded on app initialization
- Automatically attached to all API requests (except login/signup)

### Refresh Token
- Stored in SecureStore with key: `refresh_token`
- Saved alongside access token after login
- Reserved for future token refresh implementation

## Automatic Token Attachment

The API client automatically:
1. ✅ Loads token from SecureStore on initialization
2. ✅ Attaches `Authorization: Bearer <token>` header to all requests
3. ✅ Skips authentication for:
   - `/api/auth/login`
   - `/api/auth/signup`
   - `/api/auth/register`
4. ✅ Clears tokens on 401 (Unauthorized) responses

## Usage

### Making Authenticated API Calls

```typescript
import { apiClient } from '@/services';

// Token is automatically attached - no need to do anything!
const response = await apiClient.get('/api/trees');
const trees = await apiClient.post('/api/trees', { name: 'Oak' });
```

### Making Unauthenticated API Calls

For endpoints that should skip auth (login/signup are handled automatically):

```typescript
import { apiClient } from '@/services';

// Explicitly skip auth if needed
const response = await apiClient.get('/api/public/data', {
  skipAuth: true
});
```

## Token Lifecycle

1. **Login**: Token saved to SecureStore and set in API client
2. **API Requests**: Token automatically attached from memory
3. **App Restart**: Token loaded from SecureStore on initialization
4. **Logout**: Token cleared from SecureStore and API client
5. **401 Response**: Token automatically cleared and logout callback triggered

## Security Notes

- ✅ Uses Expo SecureStore (encrypted storage)
- ✅ Tokens stored in memory for fast access
- ✅ Automatic cleanup on unauthorized access
- ✅ No tokens in logs or console (except in dev mode)

## Verification

To verify tokens are being attached, check the request logs in development mode:

```
[API Request] GET /api/trees
  Authorization: Bearer <token>
```

The token is automatically included in the `Authorization` header for all authenticated requests.
