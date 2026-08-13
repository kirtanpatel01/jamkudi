# Manual Testing Guide - Auth & Profile Endpoints

This guide outlines how to test the authentication middleware and profile endpoints locally using `cURL` or PowerShell.

---

## 1. Start the Backend Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

---

## 2. Test Unauthenticated Requests (Expecting 401)

### A. Missing `Authorization` Header
```bash
curl -X GET http://localhost:3000/auth/me
```
**Expected Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Missing or malformed Authorization header"
}
```

### B. Invalid or Expired Token
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer invalid_token_xyz"
```
**Expected Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired access token"
}
```

---

## 3. Test Authenticated Requests (Expecting 200)

*(Obtain a valid Supabase access token for a test user via your Supabase Client App / Auth API)*

### A. `GET /auth/me`
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```
**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "11111111-2222-3333-4444-555555555555",
    "email": "user@example.com"
  },
  "profile": {
    "id": "11111111-2222-3333-4444-555555555555",
    "username": "user",
    "display_name": "user",
    "avatar_url": null,
    "bio": null
  }
}
```

### B. `GET /profile`
```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```
**Expected Response (200 OK):**
```json
{
  "profile": {
    "id": "11111111-2222-3333-4444-555555555555",
    "username": "user",
    "display_name": "user",
    "avatar_url": null,
    "bio": null
  }
}
```

---

## 4. Test Profile Updates & Validation

### A. Valid Update (`PATCH /profile`)
```bash
curl -X PATCH http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Jamkudi Fan",
    "bio": "Listening to music all day!"
  }'
```
**Expected Response (200 OK):**
```json
{
  "profile": {
    "id": "11111111-2222-3333-4444-555555555555",
    "username": "user",
    "display_name": "Jamkudi Fan",
    "avatar_url": null,
    "bio": "Listening to music all day!"
  }
}
```

### B. Invalid Body / Unpermitted Fields (Expecting 400)
Attempting to modify read-only system fields (e.g. `id`, `created_at`):
```bash
curl -X PATCH http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "hacked-id",
    "username": "new_name"
  }'
```
**Expected Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "id": ["Unrecognized key(s) in object: 'id'"]
  }
}
```

### C. Duplicate Username Conflict (Expecting 409)
Updating username to one that belongs to another user:
```bash
curl -X PATCH http://localhost:3000/profile \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "existing_taken_username"
  }'
```
**Expected Response (409 Conflict):**
```json
{
  "error": "Conflict",
  "message": "Username is already taken"
}
```

---

## 5. Security & Isolation

- **Profile Isolation**: `PATCH /profile` operates exclusively on the `userId` attached to the verified JWT token (`user.id`). No user can specify another user's ID in the request.
- **Row Level Security (RLS)**: Database operations are routed via `getSupabaseUserClient(token)` with the user's Bearer token attached, enforcing RLS at the database layer.
