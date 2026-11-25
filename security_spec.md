# ISB Group Firestore Security Specification

## 1. Data Invariants
1. **Default Deny**: Every unmatched path in `/databases/{database}/documents` is denied for read and write.
2. **Public Content Readability**: `siteSettings` (id `main`) is publicly readable; `projects`, `insights`, and `teamMembers` are publicly readable ONLY when `resource.data.status == 'published'` (draft documents are accessible solely to verified admins).
3. **Media Asset Isolation & Raster Enforcement**: `mediaAssets/{mediaId}` allows individual `get` by valid ID for public rendering, explicitly forbids `list` queries (anti-scraping), forbids `update` (immutable assets), and restricts `create`/`delete` strictly to verified admins (`isAdmin()`). Payloads must match safe base64 raster prefixes (`image/webp`, `image/jpeg`, `image/png`) capped at 480,000 bytes (blocking `svg+xml` and scriptable data URLs).
4. **Strict PII Isolation**: `inquiries` and `assessmentRequests` contain visitor contact details (`email`, `phone`, `fullName`). Public visitors may ONLY `create` valid submissions with `internalStatus == 'new'`, `createdAt == request.time`, and NO staff-only fields (`adminReply`, `adminNotes`, `repliedAt`). Reading (`get`, `list`), replying/updating (`internalStatus`, `adminReply`, `adminNotes`, `repliedAt`), or deleting submissions is strictly restricted to verified admins (`isAdmin()`).
5. **Verified Admin Identity**: `isAdmin()` requires `request.auth != null && request.auth.token.email_verified == true` and either matches the bootstrapped studio owner email (`isbgroup58@gmail.com`) or exists in `/admins/$(request.auth.uid)`.
6. **Path Variable Hardening & Bounded Payloads**: Every single-document operation validates `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars), enforces strict `hasAll` / `hasOnly` key allowlists, bounds all strings and arrays, and enforces server timestamps (`request.time`).
7. **Immutable Creation Fields**: `createdAt` on `inquiries` and `assessmentRequests` cannot be mutated on update (`incoming().createdAt == existing().createdAt`).

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **PII List Scrape**: Unauthenticated `list` on `/inquiries` -> DENIED.
2. **PII Single-Doc Get**: Authenticated non-admin `get` on `/assessmentRequests/{id}` -> DENIED.
3. **Shadow Field Injection on Inquiry**: Public `create` on `/inquiries/{id}` adding ghost key `isVerified: true` or staff field `adminReply: "ok"` -> DENIED (`hasOnly` + staff-field guard).
4. **Status Shortcutting on Inquiry Create**: Public `create` on `/inquiries/{id}` setting `internalStatus: "contacted"` instead of `"new"` -> DENIED.
5. **Backdated Timestamp Spoofing**: Public `create` on `/assessmentRequests/{id}` with client timestamp instead of `request.time` -> DENIED.
6. **Oversized String Resource Poisoning**: Public `create` on `/inquiries/{id}` with a 5,000-char `message` (> 3000) -> DENIED.
7. **ID Poisoning Attack**: Public `create` on `/inquiries/bad$id..with..slashes` -> DENIED (`isValidId`).
8. **Unbounded Array Attack**: Admin `create` on `/projects/{id}` with 20 gallery items (> 8) or public `create` on `/assessmentRequests/{id}` with 20 `assessmentGoals` (> 6) -> DENIED.
9. **SVG / Script Media Upload Attack**: Admin or public `create` on `/mediaAssets/{id}` with `data:image/svg+xml;base64,...` -> DENIED (`contentType` + regex guard).
10. **Media Collection Scraping**: Unauthenticated `list` on `/mediaAssets` -> DENIED (`allow list: if false`).
11. **Unverified Email Admin Spoofing**: Authenticated user with `email: "isbgroup58@gmail.com"` and `email_verified: false` reading `/inquiries` or writing `/projects` -> DENIED.
12. **Immutable Field Tampering**: Admin `update` on `/inquiries/{id}` attempting to modify `createdAt` or `email` outside `affectedKeys().hasOnly(['internalStatus', 'adminReply', 'adminNotes', 'repliedAt'])` -> DENIED.
