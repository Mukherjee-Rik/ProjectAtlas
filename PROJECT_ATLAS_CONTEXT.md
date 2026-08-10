# Project Atlas — Context & Handover Summary

> **Current Status**: Sprints 3.1 through 3.10 are **100% COMPLETE** and fully passing build checks (`pnpm --filter web build` & `pnpm --filter api build`).

---

## 1. Project Overview & Mission

**Project Atlas** is an enterprise-grade, multi-tenant AI Operating System built to power modern restaurant chains, POS systems, Kitchen Display Systems (KDS), inventory management, and automated delivery aggregation.

---

## 2. Technology Stack & Architecture

- **Monorepo Manager**: `pnpm` workspaces (`apps/web`, `apps/api`)
- **Frontend (`apps/web`)**:
  - Next.js 16 (App Router)
  - React 19 & TypeScript
  - Styling: Tailwind CSS v4 + Vanilla CSS Design Tokens
  - Authentication: React Context (`useAuth`) + `localStorage` JWT token storage + Global 401 Interceptor
- **Backend (`apps/api`)**:
  - NestJS REST API (`/api/v1`)
  - Prisma ORM + PostgreSQL (Supabase)
  - Passport JWT Auth Guards & Role Guards (`JwtAuthGuard`, `AdminGuard`)
  - Swagger Documentation (`/api/docs`)

---

## 3. Design System & Palette (Atlas Dark Mint Theme)

| Token Name | Hex | Usage |
| :--- | :--- | :--- |
| **Atlas Primary (Mint)** | `#2AFEB7` (Hover: `#22E5A4`) | CTAs, active nav links, focus rings, brand accents |
| **Background** | `#0B0F14` | Deep blue-black main body background |
| **Surface** | `#111820` | Dark slate containers, cards, tables, modal dialogs |
| **Elevated Surface** | `#18212B` | Form inputs, table headers, elevated cards |
| **Border** | `#26313C` | Subtle dark UI borders |
| **Primary Text** | `#F5F7FA` | Off-white headings and primary text |
| **Secondary Text** | `#9AA6B2` | Muted labels, descriptions, and placeholders |
| **Status Colors** | `#22C55E` (Success), `#F59E0B` (Warning), `#EF4444` (Error), `#3B82F6` (Info) | Functional status indicators |

---

## 4. Completed Sprint History (Sprint 3.1 – 3.10)

### ✅ Sprint 3.1 — API Client Connection
- Initial connection between Next.js frontend and NestJS API.

### ✅ Sprint 3.2 — API Client & Frontend Environment Architecture
- `apps/web/src/lib/config.ts` enforcing `NEXT_PUBLIC_API_URL`.
- Structured `ApiResponse<T>`, `ApiErrorResponse`, and `ApiError` class in `apps/web/src/services/api-error.ts`.
- `apiClient` with HTTP helpers (`get`, `post`, `patch`, `delete`) and safe body text/JSON parsing.
- Created `health.service.ts` and updated `/test-api`.

### ✅ Sprint 3.3 — Authentication UI
- Auth types (`LoginRequest`, `AuthUser`, `LoginResponse`) in `types/auth.ts`.
- `auth.service.ts` exposing `login()`.
- Interactive login form at `/login` with state management & client-side validation.

### ✅ Sprint 3.4 — Authentication State & JWT Token Management
- `auth-storage.ts` for managing `atlas_access_token` and `atlas_auth_user` in `localStorage`.
- `apiClient` automatically injecting `Authorization: Bearer <token>` into HTTP headers.
- `use-auth.tsx` providing `AuthProvider` and `useAuth()` hook.
- Wrapped root layout in `<AuthProvider>`.

### ✅ Sprint 3.5 — Authentication Hardening & Session Handling
- `auth-constants.ts` and `auth-events.ts` (`atlas:auth:unauthorized` custom event).
- `apiClient` automatically triggering `emitUnauthorizedEvent()` on HTTP 401.
- `AuthProvider` listening to 401 events to auto-clear session state.
- Created `AuthStatus` component and `/dashboard` page.

### ✅ Sprint 3.6 — Protected Routes & Route Guards
- `ProtectedRoute` component redirecting unauthenticated users to `/login`.
- Route group `apps/web/src/app/(protected)` with a shared `layout.tsx` enforcing `ProtectedRoute`.
- `PublicOnlyRoute` component preventing logged-in users from seeing the `/login` form.

### ✅ Sprint 3.7 — Atlas App Shell & Navigation
- `AppShell` component with top navbar (user info, status indicator, logout button) and desktop sidebar.
- `navigation.ts` config and `Sidebar` component with active route highlighting (`#2AFEB7`).
- Placeholder protected pages created for `/dashboard`, `/users`, `/profile`, and `/settings`.
- Cleaned up temporary test routes (`/auth-test`, `/me-test`, `/test-api`).

### ✅ Sprint 3.8 — Users Module: Real Frontend Integration
- `types/user.ts` matching Prisma model (`id`, `name`, `email`, `phone`, `role`, `status`, `createdAt`).
- `users.service.ts` fetching `GET /users` and `GET /users/:id`.
- Reusable `PageLoading` and `PageError` components.
- `UserStatusBadge` and `UserRoleBadge` components.
- Backend RBAC verification: `GET /users` requires `ADMIN` role (`AdminGuard`).

### ✅ Sprint 3.9 — User Management CRUD
- Protected `POST /users` in NestJS `UsersController` with `JwtAuthGuard` and `AdminGuard`.
- Added `createUser()`, `updateUser()`, and `deleteUser()` in `users.service.ts`.
- Reusable `UserForm` component supporting create & edit modes.
- `Create User` page at `/users/create`.
- `User Details` page at `/users/[id]` with self-delete protection (`isCurrentUser` guard).
- `Edit User` page at `/users/[id]/edit`.
- Table rows on `/users` made clickable to view user details.

### ✅ Sprint 3.10 — Users UX & Data Management
- Reusable `ConfirmDialog` modal component replacing native `window.confirm()`.
- Client-side live search filtering by `name`, `email`, and `phone`.
- Dropdown filters for `Role` (`ALL`, `USER`, `ADMIN`) and `Status` (`ALL`, `ACTIVE`, `INACTIVE`, `SUSPENDED`).
- Combined filter logic with a "Clear filters" button.
- Client-side pagination (`pageSize = 10`, page counter, Previous/Next controls).
- `UsersTableSkeleton` animated pulse loading state.
- Mobile responsive table wrapper (`overflow-x-auto min-w-[700px]`).
- Detailed empty states ("No users found." vs "No users match your filters.").

---

## 5. Directory Structure Overview

```
apps/web/src/
├── app/
│   ├── page.tsx (Public Home / Landing)
│   ├── login/page.tsx (PublicOnlyRoute guarded)
│   └── (protected)/ (ProtectedLayout + AppShell)
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── profile/page.tsx
│       ├── settings/page.tsx
│       └── users/
│           ├── page.tsx (Users List with Search, Filters, Pagination)
│           ├── create/page.tsx
│           └── [id]/
│               ├── page.tsx (User Details & Delete Modal)
│               └── edit/page.tsx (Edit User Form)
├── components/
│   ├── auth/ (ProtectedRoute, PublicOnlyRoute, AuthStatus)
│   ├── layout/ (AppShell, Sidebar, navigation.ts)
│   ├── ui/ (ConfirmDialog, PageLoading, PageError)
│   └── users/ (UserForm, UsersTableSkeleton, UserRoleBadge, UserStatusBadge)
├── hooks/ (use-auth.tsx)
├── lib/ (auth-constants.ts, auth-events.ts, auth-storage.ts, config.ts)
├── services/ (api-client.ts, api-error.ts, auth.service.ts, health.service.ts, users.service.ts)
└── types/ (api.ts, auth.ts, user.ts)
```

---

## 6. How to Run Locally

From the repository root:

```bash
# Run NestJS API backend (Port 3000)
pnpm --filter api start:dev

# Run Next.js Web frontend (Port 3001)
pnpm --filter web dev -- --port 3001

# Production build check
pnpm --filter web build
pnpm --filter api build
```

---

## 7. Next Steps / Roadmap Beyond Sprint 3.10

1. **Sprint 4.x Candidates**:
   - Advanced User Management features (Bulk actions, Export to CSV/JSON).
   - Roles & Fine-grained Permissions (RBAC/ABAC UI).
   - Profile & Account Settings management pages.
   - Restaurant POS / KDS / Inventory modules.
   - Production auth hardening (HttpOnly cookies).

## 8. Development Rules & Working Style

When continuing Project Atlas:

1. Always inspect the existing project before proposing architectural changes.
2. Do not rewrite working code unnecessarily.
3. Preserve the existing monorepo architecture.
4. Follow the existing Atlas Dark Mint design system.
5. Prefer reusable components over duplicated UI/code.
6. Keep frontend API calls inside `services/`.
7. Keep authentication logic inside the existing auth architecture.
8. Keep backend business logic inside NestJS services.
9. Do not bypass existing guards, interceptors, filters, or validation.
10. Give copy-paste-ready code when making implementation changes.
11. When changing a file, clearly specify the exact file path.
12. After implementation, provide the commands required to verify the change.
13. Do not jump to the next sprint until the current sprint is verified.
14. If the existing implementation differs from this document, treat the actual source code as the source of truth and update the context accordingly.

### Current Development Position

Current completed milestone:

**Sprint 3.10**

Next milestone:

**Sprint 3.11**

Before starting 3.11:
- Inspect the current repository.
- Verify the actual implementation against this document.
- Identify anything incomplete or inconsistent.
- Do not assume the context document is more authoritative than the source code.
