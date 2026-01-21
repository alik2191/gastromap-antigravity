# GastroMap Architecture Documentation

## Overview

GastroMap is a modern web application for discovering and managing gastronomic locations. Built with React, Vite, and Supabase, it provides a comprehensive platform for users to explore restaurants, cafes, bars, and other food establishments.

## Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 6.1.0
- **Routing**: React Router DOM 6.26.0
- **State Management**: 
  - React Query (TanStack Query) 5.84.1 for server state
  - React Context for global state
- **UI Components**: 
  - Radix UI primitives
  - Custom components with Tailwind CSS
  - Shadcn/ui component library
- **Styling**: Tailwind CSS 3.4.17
- **Maps**: Leaflet with react-leaflet 4.2.1
- **Forms**: React Hook Form 7.54.2 with Zod validation
- **Testing**: Vitest 1.0.4, Testing Library, Playwright

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Functions
- **Real-time**: Supabase Realtime subscriptions

### Additional Tools
- **AI Integration**: Base44 SDK for AI features
- **Maps**: OpenStreetMap with Leaflet
- **File Processing**: XLSX for Excel import/export
- **Notifications**: Sonner for toast notifications

## Project Structure

```
gastromap-antigravity/
├── src/
│   ├── api/                    # API layer and adapters
│   │   ├── supabaseAdapter.js  # Main Supabase adapter (42 functions)
│   │   ├── client.js           # API client configuration
│   │   └── __tests__/          # API tests
│   ├── components/             # React components
│   │   ├── admin/              # Admin panel components (28 files)
│   │   ├── dashboard/          # Dashboard components (16 files)
│   │   ├── landing/            # Landing page components
│   │   ├── ui/                 # Reusable UI components (49 files)
│   │   └── __tests__/          # Component tests
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAdminData.js     # Admin data fetching
│   │   ├── useAdminMutations.js# Admin mutations
│   │   ├── useImportExport.js  # Import/export logic
│   │   └── useErrorHandler.js  # Error handling
│   ├── lib/                    # Utility libraries
│   │   ├── supabase.js         # Supabase client
│   │   ├── errorHandler.js     # Error handling system
│   │   ├── AuthContext.jsx     # Authentication context
│   │   └── query-client.js     # React Query configuration
│   ├── pages/                  # Page components (15 files)
│   │   ├── Admin.jsx           # Admin panel (1896 lines)
│   │   ├── Dashboard.jsx       # User dashboard
│   │   ├── Home.jsx            # Landing page
│   │   └── ...
│   ├── test/                   # Test utilities and mocks
│   │   ├── setup.js            # Test environment setup
│   │   ├── mocks/              # Mock data and services
│   │   └── utils/              # Test helpers
│   └── utils/                  # General utilities
├── supabase/                   # Supabase configuration
│   ├── migrations/             # Database migrations
│   │   └── modular/            # Modular migrations (10 files)
│   └── functions/              # Edge functions
├── public/                     # Static assets
├── docs/                       # Documentation
└── e2e/                        # End-to-end tests

```

## Core Architecture Patterns

### 1. Component Architecture

**Pattern**: Feature-based organization with shared UI components

- **Pages**: Top-level route components
- **Components**: Organized by feature (admin, dashboard, landing)
- **UI Components**: Reusable, atomic components
- **Layouts**: Shared layout components

### 2. State Management

**Server State** (React Query):
- All API data fetching and caching
- Automatic background refetching
- Optimistic updates
- Query invalidation

**Client State** (React Context):
- Authentication state
- Theme preferences
- Language settings
- User preferences

### 3. Data Flow

```
User Action → Component → Custom Hook → API Adapter → Supabase → Database
                ↓                                          ↓
           UI Update ← React Query Cache ← Response ← RLS Check
```

### 4. Error Handling

Centralized error handling system:
- Error classification (Network, Auth, Validation, Database, Permission, Not Found, Unknown)
- User-friendly error messages
- Automatic logging
- Toast notifications
- Error boundaries for React components

## Key Components

### Admin Panel (`src/pages/Admin.jsx`)

**Purpose**: Comprehensive admin interface for managing all aspects of the application

**Features**:
- Location management (CRUD operations)
- User management
- Subscription management
- Content moderation (reviews, feedback)
- Analytics dashboard
- AI agent management
- System logs
- Import/Export functionality

**Size**: 1896 lines, 53 functions (needs refactoring)

**Refactoring Plan**:
- Extract data fetching to `useAdminData` hook
- Extract mutations to `useAdminMutations` hook
- Extract import/export to `useImportExport` hook
- Split into smaller, focused components

### Supabase Adapter (`src/api/supabaseAdapter.js`)

**Purpose**: Abstraction layer over Supabase client

**Features**:
- Generic entity CRUD operations
- Authentication methods
- Storage operations
- Edge function invocation
- Duplicate checking
- Error handling

**Structure**:
- `SupabaseEntity` class for generic operations
- `adapter` object with specialized methods
- 42 functions total

### Custom Hooks

**Data Hooks**:
- `useAdminData`: Centralized data fetching for admin panel
- `useAuth`: Authentication state and methods

**Mutation Hooks**:
- `useAdminMutations`: All admin mutations
- `useImportExport`: Import/export operations

**Utility Hooks**:
- `useErrorHandler`: Error handling with toast notifications

## Database Schema

### Core Tables

1. **users** - User profiles and authentication
2. **locations** - Main locations table (78 fields)
3. **location_branches** - Multiple locations for one venue
4. **saved_locations** - User's saved locations (wishlist, visited)
5. **reviews** - User reviews for locations
6. **subscriptions** - User subscriptions
7. **feedback** - User feedback
8. **region_statuses** - Regional coverage status
9. **ai_agents** - AI agent configurations
10. **system_logs** - System activity logs
11. **chat_messages** - AI chat messages

### Security

**Row Level Security (RLS)**:
- All tables have RLS enabled
- Public read access for approved content
- Admin full access via `is_admin()` function
- User-specific access for personal data

## API Layer

### Supabase Adapter Pattern

```javascript
// Generic entity operations
adapter.entities.Location.list()
adapter.entities.Location.create(data)
adapter.entities.Location.update(id, data)
adapter.entities.Location.delete(id)
adapter.entities.Location.get(id)
adapter.entities.Location.filter(criteria)
adapter.entities.Location.checkDuplicate(name, address, city)

// Authentication
adapter.auth.me()
adapter.auth.logout()
adapter.auth.updateMe(data)

// Storage
adapter.storage.upload(path, file)
adapter.storage.getPublicUrl(path)
adapter.storage.remove(paths)

// Functions
adapter.functions.invoke(functionName, params)
```

## Testing Strategy

### Unit Tests
- API adapter functions
- Utility functions
- Custom hooks
- Error handling

### Integration Tests
- Component interactions
- Form submissions
- Data flow
- API calls

### E2E Tests
- Critical user flows
- Admin workflows
- Import/export
- Authentication

**Coverage Goal**: >80% for critical code

## Performance Optimizations

1. **Code Splitting**: Route-based code splitting with React.lazy
2. **Memoization**: useMemo and useCallback for expensive operations
3. **Query Optimization**: React Query caching and background refetching
4. **Image Optimization**: Lazy loading and responsive images
5. **Bundle Optimization**: Vite's automatic code splitting

## Security Considerations

1. **Authentication**: Supabase Auth with JWT tokens
2. **Authorization**: RLS policies at database level
3. **Input Validation**: Zod schemas for form validation
4. **XSS Protection**: React's built-in XSS protection
5. **CSRF Protection**: Supabase handles CSRF tokens
6. **API Keys**: Environment variables for sensitive data

## Deployment

**Platform**: Vercel (configured via `vercel.json`)

**Build Process**:
```bash
npm run build  # Vite build
npm run preview # Preview production build
```

**Environment Variables**:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

## Future Improvements

1. **Refactor Admin.jsx**: Split into smaller components
2. **Add TypeScript**: Gradual migration to TypeScript
3. **Improve Test Coverage**: Reach 80%+ coverage
4. **Performance Monitoring**: Add analytics and monitoring
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Internationalization**: Multi-language support
7. **PWA Features**: Offline support, push notifications

## Development Workflow

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Lint code
npm run lint
npm run lint:fix

# Type check
npm run typecheck

# Build for production
npm run build
```

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Use the error handling system
4. Follow React best practices
5. Keep components small and focused
6. Document complex logic
7. Use TypeScript types (JSDoc for now)

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query)
- [Tailwind CSS Documentation](https://tailwindcss.com)
