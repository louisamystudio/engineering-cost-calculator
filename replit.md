# Overview

This is a React-based calculator application for computing hourly factors based on square footage input. The application features both single-value calculations and range-based data generation with interactive visualizations. It's built as a full-stack TypeScript application with a React frontend and Express backend, designed to calculate hourly factors using the formula: HF = 0.21767 + 11.21274 × (sq-feet)^-0.53816.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management and local React state for UI interactions
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Data Storage**: In-memory storage implementation (MemStorage) as the current storage layer with interface design for easy database integration
- **API Design**: RESTful API structure with /api prefix for all endpoints
- **Session Management**: Configured for connect-pg-simple sessions (currently unused but ready for authentication features)

## Component Structure
- **Calculator Components**: Modular components for equation display, control panels, interactive graphs, and data tables
- **UI Components**: Comprehensive set of reusable UI components from Shadcn/ui including forms, buttons, dialogs, and data display components
- **Page Structure**: Simple page-based routing with calculator as the main page and 404 handling

## Data Flow
- **Calculation Logic**: Centralized in `/lib/calculations.ts` with functions for single calculations, range generation, and chart data creation
- **Real-time Updates**: React state drives immediate UI updates for calculations and graph interactions
- **Data Export**: CSV export functionality for generated data tables

## Database Schema
- **Users Table**: Basic user schema with id, username, and password fields using Drizzle ORM
- **Type Safety**: Full TypeScript integration with Drizzle for compile-time type checking

# External Dependencies

## Database
- **PostgreSQL**: Primary database (configured via DATABASE_URL environment variable)
- **Neon Database**: Serverless PostgreSQL driver (@neondatabase/serverless)

## UI and Visualization
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **Chart.js**: Dynamic loading for interactive graph visualizations
- **Embla Carousel**: Carousel functionality for potential future features

## Development Tools
- **Vite**: Fast build tool with HMR and development server
- **ESBuild**: Production bundling for server-side code
- **Drizzle Kit**: Database migration and schema management
- **TSX**: TypeScript execution for development server

## Authentication Ready
- **Connect PG Simple**: PostgreSQL session store (configured but not actively used)
- **React Hook Form**: Form validation and submission handling
- **Zod**: Runtime type validation for forms and API data

## Styling and Theming
- **Tailwind CSS**: Utility-first CSS framework
- **Class Variance Authority**: Component variant management
- **Custom CSS Variables**: Theming system with light/dark mode support