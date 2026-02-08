# 🗺️ Anplexa Platform Sitemap

> **Complete navigation guide to all applications, pages, and API endpoints in the Anplexa ecosystem**

---

## 🌐 Platform Overview

The Anplexa platform consists of four main applications:

| App | Technology | Port | Status |
|-----|-----------|------|--------|
| 🎯 **Companions** | Next.js 15 | 3000 | ✅ Production Ready |
| 🚀 **Funnel** | Next.js 15 | 3001 | ✅ Production Ready |
| ⚙️ **API** | Express.js | 3002 | ✅ Production Ready |
| 📚 **Docs** | Docusaurus | 3003 | ✅ Production Ready |

---

## 🎯 Companions App (Next.js 15)

**Base URL:** `http://localhost:3000`
**Description:** AI companion platform with astrological matching and personalized experiences

### 🏠 Public Pages

<table>
<tr>
<td width="25%"><strong>Route</strong></td>
<td width="50%"><strong>Page</strong></td>
<td width="25%"><strong>Features</strong></td>
</tr>

<tr>
<td>

```
/
```

</td>
<td>

**🏠 Home Page**

Landing page with navigation to Cosmic Companion and Business Solutions

**UI Elements:**
- Hero section with gradient title
- Two-column card grid
- Hover animations
- Call-to-action buttons

</td>
<td>

✨ Styled
🎨 Gradient UI
📱 Responsive

</td>
</tr>

<tr>
<td>

```
/companion
```

</td>
<td>

**🔮 Cosmic Companion**

AI girlfriend platform with birth chart compatibility

**UI Elements:**
- Purple gradient hero
- Feature showcase cards
- 3-column grid layout
- CTA button with shadow effects

**Features:**
- 🌟 Full birth chart compatibility
- 💫 Explicit intimate content
- 🌙 Deep personality evolution

</td>
<td>

✨ Full UI
🎨 Purple Theme
📱 Responsive
🌌 Astrological

</td>
</tr>

<tr>
<td>

```
/business
```

</td>
<td>

**💼 Business Solutions**

Enterprise AI tools and consulting services

**UI Elements:**
- Blue gradient hero
- 4-column services grid
- Shadow card effects
- Consultation CTA

**Services:**
- 🤖 Custom AI Chatbots
- 📊 AI Analytics
- 🎯 Personalization Engine
- 🔧 AI Consulting

</td>
<td>

✨ Full UI
🎨 Blue Theme
📱 Responsive
💼 Enterprise

</td>
</tr>

<tr>
<td>

```
/test
```

</td>
<td>

**🧪 Test Page**

Development and testing page for features

</td>
<td>

🔧 Dev Only

</td>
</tr>

</table>

---

## 🚀 Funnel App (Next.js 15)

**Base URL:** `http://localhost:3001`
**Description:** Conversion funnel with personality quiz and Stripe checkout

### 📊 Conversion Flow

<table>
<tr>
<td width="25%"><strong>Route</strong></td>
<td width="50%"><strong>Page</strong></td>
<td width="25%"><strong>Features</strong></td>
</tr>

<tr>
<td>

```
/
```

</td>
<td>

**🏠 Quiz Home**

Default quiz entry point (Persona: A)

**UI Elements:**
- Progress bar
- Question cards with emoji options
- Navigation buttons (Back/Reset)
- Purple gradient theme

**Flow:**
1. Answer 3 personality questions
2. Email capture screen
3. Free trial or Subscribe options
4. Success/Already registered screens

</td>
<td>

✨ Interactive
📊 Progress Bar
💳 Stripe Ready
📧 Email Capture

</td>
</tr>

<tr>
<td>

```
/[persona]
```

</td>
<td>

**🎭 Dynamic Persona Quiz**

Personalized quiz based on persona type

**Personas:**
- `/A` - Persona A journey
- `/B` - Persona B journey
- `/C` - Persona C journey

**Same UI/Flow as home, but persona-specific:**
- Tracked separately in analytics
- Different funnel metrics
- Personalized messaging

</td>
<td>

🎯 Persona-based
📊 Analytics
💳 Checkout
🔄 Dynamic Route

</td>
</tr>

</table>

### 🎨 Quiz Features

**Question Steps:**
1. What brings you here? (Connection/Exploration/Safety)
2. Communication style? (Gentle/Direct/Structured)
3. Ideal pace? (Slow/Flexible/Fast)

**Conversion Options:**
- **Free Trial** - Email capture → Success
- **Subscribe Now** - Email → Stripe Checkout → Success

---

## ⚙️ API Backend (Express.js)

**Base URL:** `http://localhost:3002`
**Description:** RESTful API with Clean Architecture, JWT auth, and Stripe integration

### 🔐 Authentication Endpoints

<table>
<tr>
<td width="30%"><strong>Endpoint</strong></td>
<td width="50%"><strong>Description</strong></td>
<td width="20%"><strong>Method</strong></td>
</tr>

<tr>
<td>

```
/api/auth/register
```

</td>
<td>

**User Registration**

Create new user account with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe"
}
```

**Response:**
- JWT access token
- Refresh token
- User profile

</td>
<td>

`POST`

🔒 Public
✅ Validated

</td>
</tr>

<tr>
<td>

```
/api/auth/login
```

</td>
<td>

**User Login**

Authenticate with email/password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
- JWT tokens
- Session created

</td>
<td>

`POST`

🔒 Public
✅ Password Verified

</td>
</tr>

<tr>
<td>

```
/api/auth/refresh
```

</td>
<td>

**Refresh Access Token**

Get new access token using refresh token

**Headers:**
```
Authorization: Bearer {refreshToken}
```

**Response:**
- New access token
- Rotated refresh token (security)

</td>
<td>

`POST`

🔐 Auth Required
🔄 Token Rotation

</td>
</tr>

<tr>
<td>

```
/api/auth/profile
```

</td>
<td>

**Get User Profile**

Retrieve authenticated user's profile

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "subscriptionStatus": "active"
}
```

</td>
<td>

`GET`

🔐 Auth Required
👤 User Profile

</td>
</tr>

<tr>
<td>

```
/api/auth/forgot-password
```

</td>
<td>

**Request Password Reset**

Send password reset email with token

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Action:**
- Generates reset token
- Sends email with reset link
- Token expires in 1 hour

</td>
<td>

`POST`

🔒 Public
📧 Email Sent

</td>
</tr>

<tr>
<td>

```
/api/auth/reset-password
```

</td>
<td>

**Reset Password**

Update password using reset token

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "NewSecurePass123!"
}
```

**Action:**
- Validates token
- Updates password
- Invalidates all sessions

</td>
<td>

`POST`

🔒 Public
✅ Token Validated

</td>
</tr>

</table>

### 💳 Subscription & Payment

<table>
<tr>
<td width="30%"><strong>Endpoint</strong></td>
<td width="50%"><strong>Description</strong></td>
<td width="20%"><strong>Method</strong></td>
</tr>

<tr>
<td>

```
/api/subscription/checkout
```

</td>
<td>

**Create Stripe Checkout**

Generate Stripe checkout session URL

**Request Body:**
```json
{
  "priceId": "price_xxx",
  "successUrl": "/success",
  "cancelUrl": "/cancel"
}
```

**Response:**
- Checkout session ID
- Redirect URL to Stripe

</td>
<td>

`POST`

🔐 Auth Required
💳 Stripe Integration

</td>
</tr>

<tr>
<td>

```
/api/subscription/webhook
```

</td>
<td>

**Stripe Webhook Handler**

Process Stripe events (subscriptions, payments)

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

</td>
<td>

`POST`

🔒 Stripe Signature
⚡ Event-driven

</td>
</tr>

</table>

### 💬 Chat & Conversations

<table>
<tr>
<td width="30%"><strong>Endpoint</strong></td>
<td width="50%"><strong>Description</strong></td>
<td width="20%"><strong>Method</strong></td>
</tr>

<tr>
<td>

```
/api/chat/conversations
```

</td>
<td>

**List Conversations**

Get all conversations for authenticated user

**Response:**
```json
[
  {
    "id": "conv-123",
    "title": "Chat about AI",
    "createdAt": "2026-02-04T..."
  }
]
```

</td>
<td>

`GET`

🔐 Auth Required
💬 Chat History

</td>
</tr>

<tr>
<td>

```
/api/chat/conversations/{id}/messages
```

</td>
<td>

**Get Conversation Messages**

Retrieve all messages for a conversation

**Response:**
```json
[
  {
    "id": "msg-1",
    "role": "user",
    "content": "Hello!",
    "createdAt": "2026-02-04T..."
  }
]
```

</td>
<td>

`GET`

🔐 Auth Required
💬 Message List

</td>
</tr>

<tr>
<td>

```
/api/chat/messages
```

</td>
<td>

**Send Message**

Create a new message in a conversation

**Request Body:**
```json
{
  "conversationId": "conv-123",
  "content": "Hello AI!",
  "role": "user"
}
```

</td>
<td>

`POST`

🔐 Auth Required
💬 Real-time

</td>
</tr>

</table>

### 🛠️ Admin Panel

<table>
<tr>
<td width="30%"><strong>Endpoint</strong></td>
<td width="50%"><strong>Description</strong></td>
<td width="20%"><strong>Method</strong></td>
</tr>

<tr>
<td>

```
/admin
```

</td>
<td>

**Admin Dashboard**

Main admin panel with stats and navigation

**Features:**
- Total users count
- Active subscriptions
- Revenue metrics
- Quick links to management

</td>
<td>

`GET`

👑 Admin Only
📊 Dashboard

</td>
</tr>

<tr>
<td>

```
/admin/users
```

</td>
<td>

**User Management**

List and manage all users

**Features:**
- User table with search/sort
- View user details
- Delete users
- View subscriptions

</td>
<td>

`GET`

👑 Admin Only
👥 User CRUD

</td>
</tr>

<tr>
<td>

```
/admin/users/:id
```

</td>
<td>

**User Details**

Detailed view of specific user

**Actions:**
- View profile
- View conversations
- View subscription history
- Delete user (cascade)

</td>
<td>

`GET`
`POST`

👑 Admin Only
👤 User Details

</td>
</tr>

<tr>
<td>

```
/admin/settings
```

</td>
<td>

**System Settings**

Manage API keys and configuration

**Features:**
- Admin API keys (CRUD)
- Funnel API keys (CRUD)
- Toggle key activation
- View usage stats

</td>
<td>

`GET`
`POST`

👑 Admin Only
⚙️ Config

</td>
</tr>

<tr>
<td>

```
/admin/analytics
```

</td>
<td>

**Analytics Dashboard**

View platform analytics and metrics

**Metrics:**
- User growth
- Subscription conversions
- Revenue trends
- API usage stats

</td>
<td>

`GET`

👑 Admin Only
📈 Analytics

</td>
</tr>

</table>

### 📊 CRM Endpoints

<table>
<tr>
<td width="30%"><strong>Endpoint</strong></td>
<td width="50%"><strong>Description</strong></td>
<td width="20%"><strong>Method</strong></td>
</tr>

<tr>
<td>

```
/api/crm/contacts
```

</td>
<td>

**Contact Management**

CRUD operations for CRM contacts

**Features:**
- List all contacts
- Create new contact
- Update contact info
- Delete contact
- Search and filter

</td>
<td>

`GET`
`POST`
`PUT`
`DELETE`

🔐 Auth Required
📇 CRM

</td>
</tr>

<tr>
<td>

```
/api/crm/leads
```

</td>
<td>

**Lead Tracking**

Manage sales leads and pipeline

**Features:**
- Lead status tracking
- Conversion funnel
- Lead scoring
- Assignment

</td>
<td>

`GET`
`POST`
`PUT`

🔐 Auth Required
🎯 Sales Pipeline

</td>
</tr>

<tr>
<td>

```
/api/crm/campaigns
```

</td>
<td>

**Marketing Campaigns**

Create and manage email campaigns

**Features:**
- Campaign templates
- Email scheduling
- Analytics tracking
- A/B testing

</td>
<td>

`GET`
`POST`
`PUT`

🔐 Auth Required
📧 Marketing

</td>
</tr>

</table>

### 📚 Documentation Endpoints

<table>
<tr>
<td width="30%"><strong>Endpoint</strong></td>
<td width="50%"><strong>Description</strong></td>
<td width="20%"><strong>Method</strong></td>
</tr>

<tr>
<td>

```
/api/docs
```

</td>
<td>

**API Documentation**

Interactive API docs (OpenAPI/Swagger)

**Features:**
- Endpoint explorer
- Request/response schemas
- Try it out functionality
- Authentication guide

</td>
<td>

`GET`

🔒 Public
📖 Docs

</td>
</tr>

<tr>
<td>

```
/api/docs/changelog
```

</td>
<td>

**API Changelog**

Version history and breaking changes

**Content:**
- Release notes by version
- Migration guides
- Deprecation notices

</td>
<td>

`GET`

🔒 Public
📝 Changelog

</td>
</tr>

<tr>
<td>

```
/api/docs/release-notes
```

</td>
<td>

**Release Notes**

Detailed release notes for each version

**Format:**
- New features
- Bug fixes
- Performance improvements
- Breaking changes

</td>
<td>

`GET`

🔒 Public
🚀 Releases

</td>
</tr>

</table>

---

## 📚 Documentation Site (Docusaurus)

**Base URL:** `http://localhost:3003`
**Description:** Technical documentation, guides, and API reference

### 📖 Documentation Structure

<table>
<tr>
<td width="25%"><strong>Section</strong></td>
<td width="50%"><strong>Content</strong></td>
<td width="25%"><strong>Audience</strong></td>
</tr>

<tr>
<td>

**🚀 Getting Started**

```
/docs/intro
/docs/installation
/docs/quick-start
```

</td>
<td>

**Introduction & Setup**

- Platform overview
- Prerequisites (Node.js 20+, pnpm)
- Installation steps
- First app deployment
- Environment configuration

</td>
<td>

👨‍💻 Developers
🆕 New Users

</td>
</tr>

<tr>
<td>

**🏗️ Architecture**

```
/docs/architecture
/docs/architecture/clean
/docs/architecture/layers
```

</td>
<td>

**System Design**

- Clean Architecture overview
- Domain layer (entities, errors)
- Use case layer (business logic)
- Repository pattern
- Dependency injection

</td>
<td>

🏗️ Architects
👨‍💻 Developers

</td>
</tr>

<tr>
<td>

**📘 API Reference**

```
/docs/api
/docs/api/auth
/docs/api/chat
/docs/api/subscription
```

</td>
<td>

**Complete API Docs**

- Authentication flows
- Endpoint specifications
- Request/response schemas
- Error codes
- Rate limiting

</td>
<td>

👨‍💻 API Users
🔌 Integrators

</td>
</tr>

<tr>
<td>

**🎯 Guides**

```
/docs/guides
/docs/guides/authentication
/docs/guides/subscriptions
/docs/guides/deployment
```

</td>
<td>

**How-To Guides**

- User authentication setup
- Stripe integration
- Deployment to Railway
- Environment variables
- Database migrations

</td>
<td>

👨‍💻 Developers
🚀 DevOps

</td>
</tr>

<tr>
<td>

**📦 Packages**

```
/docs/packages/core
/docs/packages/database
/docs/packages/services
```

</td>
<td>

**Package Documentation**

- @anplexa/core - Domain & use cases
- @anplexa/database - Schema & migrations
- @anplexa/services - External integrations
- @anplexa/ui - Shared components

</td>
<td>

👨‍💻 Developers
📚 Contributors

</td>
</tr>

</table>

---

## 🔗 Quick Navigation Links

### 🌐 Live Applications

| App | Local URL | Production URL |
|-----|-----------|---------------|
| Companions | http://localhost:3000 | https://companions.anplexa.com |
| Funnel | http://localhost:3001 | https://funnel.anplexa.com |
| API | http://localhost:3002 | https://api.anplexa.com |
| Docs | http://localhost:3003 | https://docs.anplexa.com |

### 🛠️ Development Commands

```bash
# Start all apps
pnpm dev

# Start specific app
pnpm --filter=@anplexa/companions dev
pnpm --filter=@anplexa/funnel dev
pnpm --filter=@anplexa/api dev
pnpm --filter=@anplexa/docs dev

# Build all apps
pnpm build

# Run tests
pnpm test
```

### 📊 Key Features by App

**Companions:**
- ✅ Next.js 15 App Router
- ✅ Styled landing pages with gradients
- ✅ Responsive card grids
- ✅ Hover animations
- ✅ React 19 compatible

**Funnel:**
- ✅ Interactive quiz flow
- ✅ Progress tracking
- ✅ Email capture
- ✅ Stripe checkout integration
- ✅ Dynamic persona routes

**API:**
- ✅ Clean Architecture
- ✅ Zero direct DB queries
- ✅ JWT authentication
- ✅ Stripe webhooks
- ✅ Repository pattern
- ✅ Use case layer

**Docs:**
- ✅ Docusaurus v3
- ✅ API reference
- ✅ Architecture guides
- ✅ Code examples
- ✅ Search functionality

---

## 🎨 UI/UX Features

### Color Schemes

| App | Primary | Secondary | Accent |
|-----|---------|-----------|--------|
| Companions | Purple `#667eea` | Violet `#764ba2` | White |
| Business | Blue `#2563eb` | Dark Blue `#1e40af` | White |
| Funnel | Purple `#667eea` | Pink | White |

### Component Library

- **Gradients**: Linear gradients on hero sections
- **Cards**: Shadow effects with hover transforms
- **Buttons**: Gradient backgrounds with shadow
- **Grids**: Responsive auto-fit layouts
- **Typography**: Clean, modern font hierarchy

---

## 📱 Responsive Design

All pages are fully responsive with breakpoints:

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column |
| Tablet | 640px - 1024px | 2-column grid |
| Desktop | > 1024px | Multi-column grid |

---

## 🔐 Authentication Flow

```mermaid
graph LR
    A[User] --> B[/api/auth/register]
    B --> C{Valid?}
    C -->|Yes| D[Create User]
    D --> E[Generate JWT]
    E --> F[Return Tokens]
    C -->|No| G[Validation Error]

    A --> H[/api/auth/login]
    H --> I{Credentials Valid?}
    I -->|Yes| E
    I -->|No| J[Authentication Error]

    F --> K[Access Token]
    F --> L[Refresh Token]

    K --> M[API Requests]
    L --> N[/api/auth/refresh]
    N --> K
```

---

## 📈 Future Enhancements

- [ ] Real-time chat with WebSockets
- [ ] Image upload for companions
- [ ] Video chat integration
- [ ] Mobile apps (React Native)
- [ ] Advanced analytics dashboard
- [ ] A/B testing framework
- [ ] Multi-language support
- [ ] Dark mode toggle

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0
**Maintained by:** Anplexa Development Team
