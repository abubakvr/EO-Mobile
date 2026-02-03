# Authentication Implementation

This document describes the authentication implementation using React Query, hooks, and secure storage.

## Overview

The authentication system uses:
- **React Query (@tanstack/react-query)** for data fetching and state management
- **Expo SecureStore** for secure token storage
- **Custom hooks** for easy authentication management
- **TypeScript** for type safety

## Architecture

### Files Structure

```
├── types/
│   └── auth.ts              # Authentication types
├── services/
│   ├── apiClient.ts         # HTTP client with auth support
│   ├── authService.ts       # Auth API calls
│   └── tokenStorage.ts      # Secure token storage
├── hooks/
│   └── useAuth.ts           # Authentication hooks
└── screens/
    └── SignInScreen.tsx      # Login screen implementation
```

## Usage

### Login

The `SignInScreen` uses the `useAuth` hook to handle login:

```typescript
import { useAuth } from '@/hooks/useAuth';

const { login, isLoggingIn, loginError } = useAuth();

// Login
login({ email: 'user@example.com', password: 'password123' });
```

### Logout

```typescript
import { useAuth } from '@/hooks/useAuth';

const { logout } = useAuth();

// Logout
logout();
```

### Check Authentication Status

```typescript
import { useAuth } from '@/hooks/useAuth';

const { isAuthenticated, isLoading } = useAuth();
```

## API Endpoint

The login endpoint is configured as:
- **URL**: `/api/auth/login`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response** (201):
  ```json
  {
    "access_token": "string",
    "refresh_token": "string",
    "message": "string",
    "user": {
      "id": 0,
      "email": "string",
      "full_name": "string",
      "phone": "string",
      "role": "CUSTODIAN",
      "region_id": 0,
      "ward_ids": "string",
      "document_url": "string",
      "created_at": "2026-02-02T22:57:45.999Z",
      "updated_at": "2026-02-02T22:57:45.999Z"
    }
  }
  ```

## Configuration

### API Base URL

Set the `EXPO_PUBLIC_API_BASE_URL` environment variable or update the default in `services/apiClient.ts`:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://your-api.com';
```

### Unauthorized Handling

The API client automatically handles 401 responses. To customize the behavior, set an unauthorized callback:

```typescript
import { apiClient } from '@/services';

apiClient.setUnauthorizedCallback(() => {
  // Custom logout logic
  // Navigate to login, clear data, etc.
});
```

## Features

- ✅ Secure token storage using Expo SecureStore
- ✅ Automatic token injection in API requests
- ✅ Automatic token clearing on 401 responses
- ✅ React Query for efficient state management
- ✅ TypeScript support
- ✅ Loading states
- ✅ Error handling
- ✅ Form validation

## Token Storage

Tokens are stored securely using Expo SecureStore:
- Access token: Used for API authentication
- Refresh token: Stored for future token refresh implementation

Tokens are automatically:
- Saved after successful login
- Loaded on app initialization
- Cleared on logout or 401 response

## React Query Integration

The authentication uses React Query for:
- Caching authentication status
- Managing login/logout mutations
- Automatic state synchronization

The QueryClient is configured in `app/_layout.tsx` and wraps the entire app.

## Next Steps

1. **Token Refresh**: Implement refresh token logic for automatic token renewal
2. **Protected Routes**: Add route protection based on authentication status
3. **User Profile**: Fetch and cache user profile data
4. **Remember Me**: Implement "Remember Me" functionality
5. **Biometric Auth**: Add biometric authentication support
