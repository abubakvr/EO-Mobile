# API Client

A centralized HTTP client for making API calls throughout the app using Axios.

## Setup

1. Configure your API base URL by setting the `EXPO_PUBLIC_API_BASE_URL` environment variable, or modify the default in `apiClient.ts`.

## Usage

### Basic Usage

```typescript
import { apiClient } from '@/services';

// GET request
const response = await apiClient.get('/trees');
console.log(response.data);

// POST request
const newTree = await apiClient.post('/trees', {
  name: 'Oak Tree',
  location: { lat: 9.0765, lng: 7.3986 },
});

// PUT request
const updated = await apiClient.put('/trees/123', {
  name: 'Updated Tree Name',
});

// DELETE request
await apiClient.delete('/trees/123');
```

### With TypeScript Types

```typescript
import { apiClient, ApiResponse } from '@/services';

interface Tree {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

// Typed GET request
const response: ApiResponse<Tree[]> = await apiClient.get<Tree[]>('/trees');
const trees = response.data; // TypeScript knows this is Tree[]

// Typed POST request
const newTree: ApiResponse<Tree> = await apiClient.post<Tree>('/trees', {
  name: 'Mango Tree',
  location: { lat: 9.0765, lng: 7.3986 },
});
```

### Error Handling

```typescript
import { apiClient, ApiError } from '@/services';

try {
  const response = await apiClient.get('/trees');
  console.log(response.data);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Error Data:', error.data);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### File Upload

```typescript
import { apiClient } from '@/services';

const file = {
  uri: 'file:///path/to/image.jpg',
  type: 'image/jpeg',
  name: 'tree-photo.jpg',
};

const response = await apiClient.upload(
  '/trees/123/photo',
  file,
  { description: 'Tree photo' },
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);
```

### Skip Authentication

```typescript
import { apiClient } from '@/services';

// For public endpoints that don't require auth
const publicData = await apiClient.get('/public/data', {
  skipAuth: true,
});
```

### Custom Configuration

```typescript
import { apiClient } from '@/services';

// Custom headers
const response = await apiClient.get('/endpoint', {
  headers: {
    'Custom-Header': 'value',
  },
});

// Custom timeout
const response = await apiClient.post('/endpoint', data, {
  timeout: 10000, // 10 seconds
});
```

### Setting Authentication Token

```typescript
import { apiClient } from '@/services';

// Set token after login
apiClient.setAuthToken('your-auth-token-here');

// Clear token on logout
apiClient.setAuthToken(null);
```

### Changing Base URL

```typescript
import { apiClient } from '@/services';

// Change base URL dynamically
apiClient.setBaseURL('https://api.staging.example.com');
```

## Features

- ✅ Automatic authentication token injection
- ✅ Request/response interceptors
- ✅ Error handling with custom ApiError class
- ✅ TypeScript support
- ✅ File upload with progress tracking
- ✅ Development logging
- ✅ Configurable timeout
- ✅ Skip auth option for public endpoints

## Configuration

Edit `services/apiClient.ts` to customize:

- Base URL (default: `process.env.EXPO_PUBLIC_API_BASE_URL`)
- Timeout (default: 30000ms)
- Default headers
- Token storage logic (implement `getAuthToken()`)
- Unauthorized handling (implement `handleUnauthorized()`)
