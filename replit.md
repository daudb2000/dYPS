# Overview

This is a full-stack web application built with React, Express.js, and PostgreSQL that provides a membership application system. The application features a modern frontend using React with shadcn/ui components and a RESTful backend API for handling membership applications. The system is designed to collect and manage membership applications with form validation, data persistence, and user feedback.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development and bundling
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod schema validation for type-safe form processing
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with React plugin and custom path aliases for clean imports

## Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **API Design**: RESTful endpoints with proper HTTP status codes and JSON responses
- **Validation**: Zod schemas shared between frontend and backend for consistent validation
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Development**: Hot reload with custom logging middleware for API request monitoring

## Data Storage
- **Database**: PostgreSQL with Neon serverless hosting for production scalability
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Data Models**: 
  - Users table with authentication fields
  - Membership applications table with required fields (name, company, role, email, consent)
- **Fallback Storage**: In-memory storage implementation for development and testing

## Form and Validation System
- **Schema Definition**: Shared Zod schemas between client and server ensure data consistency
- **Frontend Validation**: Real-time form validation with React Hook Form resolver
- **Backend Validation**: Server-side validation using the same schemas before data persistence
- **User Experience**: Toast notifications for success/error feedback and form reset on successful submission

## Development and Build Process
- **Monorepo Structure**: Organized with separate client, server, and shared directories
- **TypeScript Configuration**: Unified TypeScript setup with path mapping for clean imports
- **Development Server**: Vite dev server with Express API proxy for seamless development
- **Production Build**: Separate build processes for client (Vite) and server (esbuild)
- **Code Organization**: Shared types and schemas in dedicated shared directory

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database URL**: Environment variable-based connection configuration

## UI and Design System
- **Radix UI**: Headless component primitives for accessible UI components
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **shadcn/ui**: Pre-built component library following modern design patterns

## Development Tools
- **Drizzle Kit**: Database schema management and migration tool
- **TanStack Query**: Server state management and data fetching library
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **Wouter**: Lightweight routing library for React

## Build and Development
- **Vite**: Frontend build tool and development server
- **esbuild**: Server-side TypeScript compilation for production
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **TypeScript**: Static type checking across the entire application

## Runtime Dependencies
- **Express.js**: Web server framework for the REST API
- **cors**: Cross-origin resource sharing middleware
- **nanoid**: Unique ID generation for resources