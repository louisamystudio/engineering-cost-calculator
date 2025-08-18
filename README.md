# Engineering Cost Calculator

A comprehensive web-based engineering cost calculator that provides sophisticated budget analysis and fee calculations for construction projects.

## Features

- **Multi-Step Project Creation Wizard**: Intuitive step-by-step process for creating new projects
- **Interactive Dashboard**: Real-time calculation updates with expandable sections for detailed analysis
- **Comprehensive Calculations**: 
  - Minimum budget calculations
  - Fee matrix for in-house and outsourced services
  - Hours distribution across project phases
  - Historic property multipliers
  - Remodel factors
- **Database Integration**: Full PostgreSQL support for project persistence and reporting
- **Real-time Updates**: Auto-save functionality with live recalculation

## Technology Stack

### Frontend
- React with TypeScript
- Vite build tool
- Shadcn/ui components (built on Radix UI)
- Tailwind CSS
- React Query for state management
- React Hook Form with Zod validation

### Backend
- Express.js with TypeScript
- Drizzle ORM
- PostgreSQL database
- RESTful API architecture

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/engineering-cost-calculator.git
cd engineering-cost-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utility functions and API client
│   │   └── hooks/       # Custom React hooks
├── server/               # Express backend server
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database storage interface
│   └── services/        # Business logic services
├── shared/               # Shared types and schemas
│   └── schema.ts        # Drizzle ORM schemas
└── attached_assets/      # Static assets and data files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio for database management

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/calculate` - Create new project with calculations
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Reference Data
- `GET /api/building-uses` - List building use categories
- `GET /api/building-uses/:use/types` - Get building types for a use
- `GET /api/building-types/:type/available-tiers` - Get available tiers
- `GET /api/category-multipliers` - Get category multipliers

## Database Schema

The application uses the following main tables:
- `projects` - Project details and parameters
- `project_calculations` - Calculated budgets and costs
- `project_fees` - Fee matrix calculations
- `project_hours` - Hours distribution by phase and role
- `building_types` - Reference data for building classifications
- `engineering_costs` - Cost parameters by building type

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Support

For questions or support, please contact the development team.