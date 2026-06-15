# MunchMap Operations Dashboard

Admin operations dashboard for managing refunds and platform operations.

## Features

- ✅ **Admin Authentication**: OTP-based email authentication
- ✅ **Refund Management**: View, process, and cancel pending refunds
- ✅ **Auto-refresh**: 1-minute polling for new refund requests
- ✅ **Mutation Side Effects**: Automatic data refresh after process/cancel actions
- ✅ **Protected Routes**: Admin-only access with JWT authentication
- ✅ **Audit Trail**: Full tracking of admin actions
- ⏳ **Real-time WebSocket Updates**: Live notifications (pending)

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- React Router v6 (routing)
- TanStack Query (data fetching)
- Tailwind CSS (styling)
- Lucide React (icons)
- Socket.io Client (real-time updates)

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running at `http://localhost:3000`
- Admin user created in `admin_users` table

### Installation

\`\`\`bash
npm install
\`\`\`

### Environment Variables

Create a `.env` file:

\`\`\`
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

App will be available at `http://localhost:5173`

### Build

\`\`\`bash
npm run build
\`\`\`

## Admin User Setup

To create an admin user, insert into the `admin_users` table:

\`\`\`sql
INSERT INTO admin_users (email, name, role, is_active)
VALUES ('admin@munchmap.de', 'Admin User', 'super_admin', true);
\`\`\`

## API Endpoints Used

### Authentication
- `POST /api/v1/admin/auth/login` - Send OTP
- `POST /api/v1/admin/auth/verify-otp` - Verify OTP and get token

### Refunds
- `GET /api/v1/admin/refunds` - List refunds (with filters)
- `GET /api/v1/admin/refunds/:id` - Get refund details
- `POST /api/v1/admin/refunds/:id/process` - Process refund
- `POST /api/v1/admin/refunds/:id/cancel` - Cancel refund
