# 🔐 Authorization System - Clarity CRM

## Overview

Clarity CRM implements a comprehensive role-based authorization system with two main roles:
- **Sales Lead**: Full access to team management, AI insights, and all features
- **Sales Agent**: Limited access to personal data and standard CRM features

---

## 🎯 Role Permissions

### Sales Lead Permissions

✅ **Full Access:**
- View all team members (`/users`)
- View any team member's profile (`/users/[id]`)
- Access AI Insights (`/insights`)
- View team performance KPIs on Dashboard
- Create, update, and delete users
- Reassign tasks and customers
- View all tasks, activities, and call notes

### Sales Agent Permissions

✅ **Allowed:**
- View own profile (`/users/[own-id]`)
- View and manage own tasks
- View and manage own activities
- View and manage own call notes
- View and manage customers and companies
- View personal stats on Dashboard

❌ **Restricted:**
- Cannot view team members list
- Cannot view other users' profiles
- Cannot access AI Insights
- Cannot view team performance KPIs
- Cannot create or delete users
- Cannot reassign work from other users

---

## 📁 Implementation Files

### 1. Authorization Helper (`src/lib/authorization.ts`)

Core authorization functions:
- `isSalesLead(session)` - Check if user is Sales Lead
- `isSalesAgent(session)` - Check if user is Sales Agent
- `canViewUserDetails(session, userId)` - Check user detail access
- `canViewUserList(session)` - Check user list access
- `canViewAIInsights(session)` - Check AI insights access
- `canViewTeamPerformance(session)` - Check team KPI access

### 2. Protected API Routes

#### `/api/users` (GET, POST)
- **GET**: Only Sales Lead can view all users (403 for Sales Agent)
- **POST**: Only Sales Lead can create users (403 for Sales Agent)

#### `/api/users/[id]` (GET, PATCH, DELETE)
- **GET**: Sales Lead can view any user, Sales Agent only their own profile
- **PATCH**: Sales Lead can update any user, Sales Agent only their own profile
- **DELETE**: Only Sales Lead can delete users

#### `/api/ai/insights` (GET)
- **GET**: Only Sales Lead can access (403 for Sales Agent)

### 3. Protected Frontend Pages

#### `/users` (Team List)
- Sales Lead: Shows all team members
- Sales Agent: Redirects to own profile (`/users/[own-id]`)

#### `/users/[id]` (User Profile)
- Sales Lead: Can view any user profile
- Sales Agent: Can only view own profile, redirects otherwise

#### `/insights` (AI Insights)
- Sales Lead: Full access to AI insights
- Sales Agent: Shows "Access Denied" message

#### `/` (Dashboard)
- Sales Lead: Shows team performance KPIs and team overview
- Sales Agent: Shows personal stats only

### 4. Navigation (Sidebar)

**Sales Lead Menu:**
- Dashboard
- AI Insights 🤖
- Team 👥
- Companies
- Customers
- Tasks
- Activities
- Call Notes

**Sales Agent Menu:**
- Dashboard
- Companies
- Customers
- Tasks
- Activities
- Call Notes
- My Profile 👤

---

## 🧪 Testing the Authorization System

### Test Credentials

**Sales Lead:**
```
Email: lead@clarity.com
Password: lead123
```

**Sales Agent:**
```
Email: john@clarity.com
Password: agent123
```

### Test Scenarios

#### 1. Sales Lead Tests

✅ **Should Work:**
```bash
# Login as Sales Lead
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"lead@clarity.com","password":"lead123"}'

# View all users
curl http://localhost:3000/api/users

# Access AI Insights
curl http://localhost:3000/api/ai/insights

# View any user profile
curl http://localhost:3000/api/users/[any-user-id]
```

#### 2. Sales Agent Tests

✅ **Should Work:**
```bash
# Login as Sales Agent
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"john@clarity.com","password":"agent123"}'

# View own profile
curl http://localhost:3000/api/users/[own-id]

# View customers
curl http://localhost:3000/api/customers
```

❌ **Should Fail (403 Forbidden):**
```bash
# Try to view all users
curl http://localhost:3000/api/users
# Expected: {"error":"Forbidden: Only Sales Leads can view all users"}

# Try to access AI Insights
curl http://localhost:3000/api/ai/insights
# Expected: {"error":"Forbidden: Only Sales Leads can access AI insights"}

# Try to view another user's profile
curl http://localhost:3000/api/users/[other-user-id]
# Expected: {"error":"Forbidden: You can only view your own profile"}
```

---

## 🔒 Security Best Practices

### 1. Server-Side Protection
✅ All authorization checks happen on the server
✅ API routes validate session and permissions
✅ Frontend redirects are backed by server-side checks

### 2. Defense in Depth
✅ Authorization at API level (primary)
✅ Authorization at page level (secondary)
✅ UI elements hidden based on role (UX)

### 3. Session Management
✅ NextAuth.js handles secure sessions
✅ JWT tokens with role information
✅ Automatic session refresh

---

## 📊 Authorization Flow

```
User Request
    ↓
Middleware (Authentication)
    ↓
API Route / Page Component
    ↓
getServerSession() → Get user session
    ↓
Authorization Helper (e.g., canViewUserList)
    ↓
Check user role and permissions
    ↓
    ├─ Authorized → Proceed
    └─ Not Authorized → 403 Forbidden / Redirect
```

---

## 🚀 Adding New Protected Features

### Step 1: Add Authorization Helper

```typescript
// src/lib/authorization.ts
export function canManageCustomers(session: Session | null): boolean {
  return isSalesLead(session) || isSalesAgent(session);
}
```

### Step 2: Protect API Route

```typescript
// src/app/api/customers/route.ts
import { canManageCustomers } from "@/lib/authorization";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!canManageCustomers(session)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
  
  // ... rest of the logic
}
```

### Step 3: Protect Frontend Page

```typescript
// src/app/customers/new/page.tsx
import { canManageCustomers } from "@/lib/authorization";

export default async function NewCustomerPage() {
  const session = await getServerSession(authOptions);
  
  if (!canManageCustomers(session)) {
    redirect("/");
  }
  
  // ... rest of the component
}
```

---

## 📝 Summary

The Clarity CRM authorization system provides:
- ✅ **Role-based access control** for Sales Lead and Sales Agent
- ✅ **Server-side protection** for all sensitive operations
- ✅ **Clear permission boundaries** between roles
- ✅ **Secure API routes** with 401/403 error handling
- ✅ **User-friendly redirects** for unauthorized access
- ✅ **Consistent UX** with role-based navigation

**Security Level:** Production-ready with defense in depth
**Maintainability:** Easy to extend with new roles and permissions
**User Experience:** Clear feedback for unauthorized access attempts

