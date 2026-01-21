# GastroMap API Documentation

## Overview

GastroMap uses a custom Supabase adapter that provides a unified interface for all backend operations. The adapter abstracts Supabase-specific implementation details and provides a clean, consistent API.

## Table of Contents

- [Authentication](#authentication)
- [Entities](#entities)
- [Storage](#storage)
- [Functions](#functions)
- [Integrations](#integrations)
- [Error Handling](#error-handling)

---

## Authentication

### `adapter.auth.me()`

Get the currently authenticated user with profile data.

**Returns**: `Promise<User>` - User object with profile data

**Example**:
```javascript
const user = await adapter.auth.me();
console.log(user.email, user.role);
```

**Response**:
```javascript
{
  id: "uuid",
  email: "user@example.com",
  name: "John Doe",
  role: "admin",
  custom_role: "admin",
  full_name: "John Doe",
  avatar_url: "https://...",
  points: 100
}
```

---

### `adapter.auth.logout(redirectUrl?)`

Sign out the current user.

**Parameters**:
- `redirectUrl` (string, optional) - URL to redirect after logout

**Example**:
```javascript
await adapter.auth.logout('/');
```

---

### `adapter.auth.updateMe(data)`

Update current user's profile.

**Parameters**:
- `data` (object) - Profile data to update

**Example**:
```javascript
await adapter.auth.updateMe({
  full_name: "Jane Doe",
  bio: "Food enthusiast",
  custom_role: "creator"
});
```

---

### `adapter.auth.getLoginUrl(redirectUrl)`

Get login URL with redirect parameter.

**Parameters**:
- `redirectUrl` (string) - URL to redirect after login

**Returns**: `string` - Login URL

**Example**:
```javascript
const loginUrl = adapter.auth.getLoginUrl('/dashboard');
// Returns: "/Login?redirect=%2Fdashboard"
```

---

## Entities

All entities follow the same CRUD pattern using the `SupabaseEntity` class.

### Available Entities

- `adapter.entities.Location`
- `adapter.entities.SavedLocation`
- `adapter.entities.RegionStatus`
- `adapter.entities.Subscription`
- `adapter.entities.Feedback`
- `adapter.entities.ModerationRound`
- `adapter.entities.CreatorAnswer`
- `adapter.entities.User` (profiles table)
- `adapter.entities.Review`
- `adapter.entities.LocationBranch`
- `adapter.entities.LocationView`
- `adapter.entities.ChatMessage`
- `adapter.entities.AIAgent`
- `adapter.entities.SystemLog`

---

### `entity.list(options)`

List all records from the entity table.

**Parameters**:
- `options` (string | object, optional)
  - If string: Sort field (e.g., `'-created_at'` for descending)
  - If object:
    - `sort` (string) - Sort field
    - `select` (string) - Fields to select (default: `'*'`)
    - `range` (array) - Pagination range `[from, to]`

**Returns**: `Promise<Array>` - Array of records

**Examples**:
```javascript
// Simple list
const locations = await adapter.entities.Location.list();

// With sorting
const recent = await adapter.entities.Location.list('-created_at');

// With options
const paginated = await adapter.entities.Location.list({
  sort: '-updated_at',
  select: 'id,name,city',
  range: [0, 19] // First 20 items
});
```

---

### `entity.filter(criteria, options)`

Filter records by criteria.

**Parameters**:
- `criteria` (object) - Filter criteria (exact match)
- `options` (object, optional)
  - `select` (string) - Fields to select

**Returns**: `Promise<Array>` - Filtered records

**Example**:
```javascript
const krakowCafes = await adapter.entities.Location.filter({
  city: 'Krakow',
  type: 'cafe',
  status: 'published'
});
```

---

### `entity.create(data)`

Create a new record.

**Parameters**:
- `data` (object) - Record data

**Returns**: `Promise<Object>` - Created record

**Example**:
```javascript
const newLocation = await adapter.entities.Location.create({
  name: "Cafe Camelot",
  type: "cafe",
  city: "Krakow",
  country: "Poland",
  address: "ul. Św. Tomasza 17",
  status: "pending"
});
```

---

### `entity.update(id, data)`

Update an existing record.

**Parameters**:
- `id` (string) - Record ID
- `data` (object) - Data to update

**Returns**: `Promise<Object>` - Updated record

**Example**:
```javascript
const updated = await adapter.entities.Location.update(locationId, {
  status: 'published',
  description: 'Updated description'
});
```

---

### `entity.delete(id)`

Delete a record.

**Parameters**:
- `id` (string) - Record ID

**Returns**: `Promise<Object>` - `{ success: true }`

**Example**:
```javascript
await adapter.entities.Location.delete(locationId);
```

---

### `entity.get(id)`

Get a single record by ID.

**Parameters**:
- `id` (string) - Record ID

**Returns**: `Promise<Object>` - Record

**Example**:
```javascript
const location = await adapter.entities.Location.get(locationId);
```

---

### `Location.checkDuplicate(name, address, city, excludeId?)`

Check for duplicate locations (Location entity only).

**Parameters**:
- `name` (string) - Location name
- `address` (string) - Location address
- `city` (string) - City name
- `excludeId` (string, optional) - ID to exclude (for updates)

**Returns**: `Promise<Object|null>` - Duplicate location or null

**Example**:
```javascript
const duplicate = await adapter.entities.Location.checkDuplicate(
  "Cafe Camelot",
  "ul. Św. Tomasza 17",
  "Krakow"
);

if (duplicate) {
  console.log('Duplicate found:', duplicate.id);
}
```

---

## Storage

### `adapter.storage.upload(path, file, bucket?)`

Upload a file to Supabase Storage.

**Parameters**:
- `path` (string) - File path in bucket
- `file` (File) - File object to upload
- `bucket` (string, optional) - Bucket name (default: `'uploads'`)

**Returns**: `Promise<Object>` - Upload result

**Example**:
```javascript
const file = document.querySelector('input[type="file"]').files[0];
const result = await adapter.storage.upload(
  `avatars/${userId}.jpg`,
  file
);
```

---

### `adapter.storage.getPublicUrl(path, bucket?)`

Get public URL for a file.

**Parameters**:
- `path` (string) - File path in bucket
- `bucket` (string, optional) - Bucket name (default: `'uploads'`)

**Returns**: `string` - Public URL

**Example**:
```javascript
const url = adapter.storage.getPublicUrl('avatars/user123.jpg');
// Returns: "https://...supabase.co/storage/v1/object/public/uploads/avatars/user123.jpg"
```

---

### `adapter.storage.list(bucket?, path?, options?)`

List files in a bucket.

**Parameters**:
- `bucket` (string, optional) - Bucket name (default: `'uploads'`)
- `path` (string, optional) - Path prefix (default: `''`)
- `options` (object, optional) - List options

**Returns**: `Promise<Array>` - Array of files

**Example**:
```javascript
const files = await adapter.storage.list('uploads', 'avatars/');
```

---

### `adapter.storage.remove(paths, bucket?)`

Remove files from storage.

**Parameters**:
- `paths` (string | string[]) - File path(s) to remove
- `bucket` (string, optional) - Bucket name (default: `'uploads'`)

**Returns**: `Promise<Object>` - Removal result

**Example**:
```javascript
await adapter.storage.remove(['avatars/old1.jpg', 'avatars/old2.jpg']);
```

---

## Functions

### `adapter.functions.invoke(functionName, params)`

Invoke a Supabase Edge Function.

**Parameters**:
- `functionName` (string) - Function name
- `params` (object) - Function parameters

**Returns**: `Promise<Object>` - `{ data: ... }`

**Example**:
```javascript
const result = await adapter.functions.invoke('importLocations', {
  locations: [
    { name: 'Cafe 1', city: 'Krakow' },
    { name: 'Cafe 2', city: 'Warsaw' }
  ]
});

console.log(result.data.created, result.data.updated);
```

---

## Integrations

### `adapter.integrations.Core.UploadFile({ file })`

Upload a file and get public URL.

**Parameters**:
- `file` (File) - File to upload

**Returns**: `Promise<Object>` - `{ success: true, url: string, file_url: string }`

**Example**:
```javascript
const result = await adapter.integrations.Core.UploadFile({
  file: imageFile
});

console.log(result.url); // Public URL
```

---

### `adapter.integrations.Core.InvokeLLM(params)`

Invoke AI/LLM service.

**Parameters**:
- `prompt` (string) - AI prompt
- `response_json_schema` (object, optional) - Expected JSON schema
- `system_instruction` (string, optional) - System instruction

**Returns**: `Promise<Object>` - AI response

**Example**:
```javascript
const response = await adapter.integrations.Core.InvokeLLM({
  prompt: "Generate a description for Cafe Camelot in Krakow",
  system_instruction: "You are a food critic"
});
```

**Error Types**:
- `api_key_error` - API key not configured
- `quota_error` - Quota exceeded
- `llm_error` - General LLM error

---

## Error Handling

All API methods use centralized error handling via `errorHandler.js`.

### Error Types

- `NETWORK` - Network/connection errors
- `AUTH` - Authentication errors
- `VALIDATION` - Validation errors
- `DATABASE` - Database errors
- `PERMISSION` - Permission/RLS errors
- `NOT_FOUND` - Resource not found
- `UNKNOWN` - Unknown errors

### Error Logging

All errors are automatically logged with:
- Timestamp
- Context (operation name)
- Error type
- Error message
- Stack trace

**Example Log**:
```javascript
[ErrorHandler] {
  timestamp: '2026-01-21T13:36:49.457Z',
  context: 'Database operation',
  errorType: 'DATABASE',
  message: 'Invalid API key',
  code: 'PGRST301'
}
```

### Handling Errors

```javascript
try {
  const location = await adapter.entities.Location.create(data);
} catch (error) {
  // Error is already logged by errorHandler
  // Handle UI updates here
  console.error('Failed to create location:', error.message);
}
```

---

## React Query Integration

The adapter is designed to work seamlessly with React Query.

### Example: List Query

```javascript
const { data: locations, isLoading, error } = useQuery({
  queryKey: ['locations'],
  queryFn: () => adapter.entities.Location.list('-created_at')
});
```

### Example: Create Mutation

```javascript
const createMutation = useMutation({
  mutationFn: (data) => adapter.entities.Location.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['locations']);
    toast.success('Location created!');
  }
});

// Usage
createMutation.mutate({ name: 'New Cafe', city: 'Krakow' });
```

### Example: Update Mutation

```javascript
const updateMutation = useMutation({
  mutationFn: ({ id, data }) => adapter.entities.Location.update(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries(['locations']);
  }
});

// Usage
updateMutation.mutate({
  id: locationId,
  data: { status: 'published' }
});
```

---

## Best Practices

### 1. Always Use Error Handling

```javascript
// ✅ Good
try {
  const result = await adapter.entities.Location.create(data);
  toast.success('Created!');
} catch (error) {
  // Error is logged automatically
  toast.error('Failed to create location');
}

// ❌ Bad - no error handling
const result = await adapter.entities.Location.create(data);
```

### 2. Invalidate Queries After Mutations

```javascript
// ✅ Good
onSuccess: () => {
  queryClient.invalidateQueries(['locations']);
  queryClient.invalidateQueries(['analytics']);
}

// ❌ Bad - stale data
onSuccess: () => {
  toast.success('Updated!');
}
```

### 3. Use Specific Selects for Performance

```javascript
// ✅ Good - only fetch needed fields
const locations = await adapter.entities.Location.list({
  select: 'id,name,city',
  sort: '-created_at'
});

// ❌ Bad - fetches all fields
const locations = await adapter.entities.Location.list();
```

### 4. Check for Duplicates Before Creating

```javascript
// ✅ Good
const duplicate = await adapter.entities.Location.checkDuplicate(
  name, address, city
);

if (duplicate) {
  toast.error('Location already exists!');
  return;
}

await adapter.entities.Location.create(data);
```

---

## Common Patterns

### Pagination

```javascript
const PAGE_SIZE = 20;
const page = 1;

const locations = await adapter.entities.Location.list({
  range: [(page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1]
});
```

### Filtering with Multiple Criteria

```javascript
const activeKrakowCafes = await adapter.entities.Location.filter({
  city: 'Krakow',
  type: 'cafe',
  status: 'published'
});
```

### Batch Operations

```javascript
// Create multiple records
const promises = locations.map(loc =>
  adapter.entities.Location.create(loc)
);

const results = await Promise.allSettled(promises);

const succeeded = results.filter(r => r.status === 'fulfilled').length;
const failed = results.filter(r => r.status === 'rejected').length;

toast.success(`Created ${succeeded}, Failed ${failed}`);
```

---

## Migration from Old SDK

If migrating from Base44 SDK:

### Entity Operations

```javascript
// Old
await api.entities.Location.Query.list();

// New
await adapter.entities.Location.list();
```

### File Upload

```javascript
// Old
await api.integrations.Core.UploadFile({ file });

// New
await adapter.integrations.Core.UploadFile({ file });
// or
await adapter.storage.upload(path, file);
```

### Authentication

```javascript
// Old
const user = await api.auth.me();

// New
const user = await adapter.auth.me();
```

---

## Troubleshooting

### "Invalid API key" Error

Check your `.env` file:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### RLS Policy Errors

Ensure user has proper permissions. Check Supabase dashboard → Authentication → Policies.

### "Session missing" Error

User is not authenticated. Redirect to login:
```javascript
if (!user) {
  navigate(adapter.auth.getLoginUrl(window.location.pathname));
}
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [TESTING.md](./TESTING.md) - Testing guide
- [DATABASE.md](./DATABASE.md) - Database schema
