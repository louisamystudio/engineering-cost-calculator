# Overview

This is a comprehensive engineering cost calculator web application that provides sophisticated budget analysis and fee calculations for construction projects. The application features a multi-step project creation wizard, interactive dashboards with real-time calculation updates, and full database integration for project storage and reporting. It's built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## Recent Updates (August 2025)
- Completed comprehensive database migration to "Custom_Residential_CostS_DB_CLEAN_v3" structure
- Updated from simple tier-based system to detailed building type classification system
- Calculator now supports: Custom Houses, Public Social Housing, Private Housing Development, Multifamily Apartments
- Successfully audited and validated calculations match spreadsheet formulas exactly
- Implemented new comprehensive cost data structure with separate new construction vs. remodel costs

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing with multi-page support
- **State Management**: React Query (@tanstack/react-query) for server state management and local React state for UI interactions
- **Form Handling**: React Hook Form with Zod validation schemas for multi-step wizards

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Data Storage**: Full PostgreSQL database integration for project persistence and reporting
- **API Design**: RESTful API structure with /api prefix for all endpoints
- **Calculation Service**: Comprehensive ProjectCalculatorService handling budget calculations, fee matrices, and hours distribution

## Component Structure
- **Project Management**: Project listing, creation wizard, and dashboard components
- **Calculator Components**: Multiple specialized calculators (Minimum Budget, Fee Matrix, Hourly Factor)
- **UI Components**: Comprehensive set of reusable UI components from Shadcn/ui including collapsible sections, tabs, and data tables
- **Page Structure**: Multi-page routing supporting projects, calculators, and dashboards

## Data Flow
- **Calculation Logic**: Server-side calculation engine in `projectCalculator.ts` implementing complex engineering cost formulas
- **Real-time Updates**: Live recalculation and auto-save functionality for projects
- **Data Persistence**: Full CRUD operations for projects with related calculations, fees, and hours

## Database Schema
- **Projects Table**: Main project data including building specifications and cost parameters
- **Project Calculations**: Calculated budgets and cost breakdowns per project
- **Project Fees**: Detailed fee matrix for in-house and outsourced services
- **Project Hours**: Phase-based hours distribution across team roles
- **Supporting Tables**: Building types, engineering costs, category multipliers, and configuration data
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