# Engineering Cost Calculator - Comprehensive Calculator

A modern, interactive web-based engineering cost calculator that provides sophisticated budget analysis and fee calculations for construction projects. Built from scratch to align exactly with the Excel "New Project Cost Calculator" model.

## ✨ Features

### 🏗️ **Project Configuration**
- **Dynamic Building Selection**: Building Use → Type → Tier with real-time data loading
- **Interactive Cost Targets**: Adjustable min/target/max cost sliders for shell, interior, and landscape
- **Smart Multipliers**: Category-based multipliers (0.9x to 1.3x) and historic property adjustments (1.2x)
- **Area Management**: New construction and remodel areas with validation

### 💰 **Budget Management**
- **Real-time Budget Allocation**: Interactive share controls for Shell, Interior, and Landscape
- **Component Breakdown**: Detailed new vs. remodel budget splits
- **Share Override Controls**: Percentage sliders with 100% validation
- **Visual Budget Distribution**: Color-coded budget cards with percentages

### ⚙️ **Discipline Configuration**
- **9 Engineering Disciplines**: Architecture, Structural, Civil, Mechanical, Electrical, Plumbing, Telecom, Interior, Landscape
- **In-House vs Outsourced**: Toggle switches for each discipline
- **Percentage Overrides**: Customizable discipline percentages with validation
- **Budget Tracking**: Individual new/remodel splits for each discipline

### 📊 **Professional Fees Analysis**
- **Dual Calculation Methods**:
  - **Top-Down**: Market fee calculation using Excel's fee curve formula
  - **Bottom-Up**: Hours-based calculation with configurable labor rates
- **Detailed Fee Breakdown**: Complete table showing all scopes, rates, and fees
- **Scan-to-BIM Integration**: Automatic fees for existing areas and site scanning
- **Coordination Fees**: 15% coordination fee for outsourced services
- **Variance Analysis**: Real-time comparison between calculation methods

### ⏰ **Hours Distribution**
- **Phase-Based Allocation**: Discovery, Creative (Conceptual, Schematic, Preliminary), Technical phases
- **Role Distribution**: Designer 1, Designer 2, Architect, Engineer, Principal
- **Visual Breakdown**: Interactive tables and progress indicators
- **Configurable Parameters**: Adjustable hours per ft² factors

### 🔍 **Sanity Check & Validation**
- **Variance Monitoring**: Warnings when top-down vs bottom-up difference exceeds ±15%
- **Contract Pricing**: Discount calculations and final contract pricing
- **Real-time Validation**: Input validation with clear error messages
- **Recommended Actions**: Context-aware suggestions for parameter adjustments

## 🎨 **Design System**

Built following **Uber's Base Design System** principles:
- **Modular Typography**: Display, Heading, Label, and Paragraph semantic roles
- **4pt Grid System**: Consistent spacing and layout
- **Accessible Components**: Full keyboard navigation and screen reader support
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Color-coded Sections**: Intuitive visual hierarchy

## 🛠️ **Technology Stack**

### **Frontend**
- **React 18** with **TypeScript** for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom design tokens
- **Radix UI** components for accessibility
- **Real-time Updates** with 300ms debouncing

### **Data Management**
- **CSV-based Cost Database** matching Excel structure
- **Type-safe Parsing** with validation
- **Caching Layer** for performance
- **Fallback Mechanisms** for missing configurations

### **Architecture**
- **Modular Design**: Separate calculation engine, data service, and UI components
- **Pure Functions**: Isolated calculation logic for testing
- **Component Library**: Reusable UI components with consistent styling
- **Error Boundaries**: Graceful error handling throughout the app

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn

### **Installation**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/louisamystudio/engineering-cost-calculator.git
   cd engineering-cost-calculator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173`

### **Build for Production**
```bash
npm run build
```

## 📁 **Project Structure**

```
src/
├── components/          # UI Components
│   ├── ProjectInputs.tsx      # Project configuration form
│   ├── BudgetAllocation.tsx   # Budget distribution controls
│   ├── DisciplineBudgets.tsx  # Engineering discipline management
│   ├── FeeAnalysis.tsx        # Professional fees analysis
│   ├── HoursAnalysis.tsx      # Hours distribution breakdown
│   └── SanityCheck.tsx        # Validation and contract pricing
├── lib/                 # Core Logic
│   ├── calculations.ts        # All calculation formulas
│   └── data-service.ts        # CSV data loading and caching
├── utils/               # Utilities
│   └── csv-parser.ts          # CSV parsing utilities
├── types/               # TypeScript Definitions
│   └── index.ts               # All interface definitions
├── data/                # Static Data
│   └── costs.csv              # Cost database (Excel format)
└── App.tsx             # Main application component
```

## 🔧 **Key Formulas Implemented**

### **Category Multiplier**
```typescript
categoryMultiplier = 0.8 + 0.1 * category  // Categories 1-5 → 0.9x-1.3x
```

### **Fee Curve (Excel Formula)**
```typescript
basePct = 0.07498 + 0.007824 * (budget / 1_000_000)^(-0.7495)
finalPct = basePct * categoryMultiplier * newRemodelRatio
```

### **Non-Linear Hours**
```typescript
baseFactor = (0.21767 + 11.21274 * area^(-0.53816) - 0.08) * categoryMultiplier
totalHours = (baseFactor * 0.9 * newArea) + (baseFactor * 0.8 * remodelArea * 1.15)
```

### **Bottom-Up Costs**
```typescript
labourCost = totalHours * labourRate
withOverhead = labourCost + (totalHours * overheadRate)
withMarkup = withOverhead * markupFactor
finalFee = withMarkup * (1 - discount)
```

## 📊 **Data Integration**

The application loads cost data from CSV files matching the Excel structure:
- **Building Classifications**: Use → Type → Tier hierarchy
- **Cost Ranges**: Min/Target/Max costs for Shell, Interior, Landscape
- **Engineering Shares**: Percentage allocations for each discipline
- **Fallback Logic**: Graceful handling of missing configurations

## 🎯 **Key Features vs Excel Model**

| Feature | Excel | Web App | Status |
|---------|--------|---------|--------|
| Cost Calculation | ✅ | ✅ | **Exact Match** |
| Fee Curve Formula | ✅ | ✅ | **Exact Match** |
| Hours Distribution | ✅ | ✅ | **Exact Match** |
| Interactive Controls | ❌ | ✅ | **Enhanced** |
| Real-time Updates | ❌ | ✅ | **Enhanced** |
| Validation | Limited | ✅ | **Enhanced** |
| Mobile Support | ❌ | ✅ | **Enhanced** |
| Accessibility | ❌ | ✅ | **Enhanced** |

## 🔄 **Development Status**

- ✅ **Phase 1**: Core calculation engine with exact Excel formula matching
- ✅ **Phase 2**: Interactive UI with real-time updates and validation
- ✅ **Phase 3**: Professional fees analysis and hours distribution
- 🔄 **Phase 4**: Charts, export/import, and advanced visualizations *(In Progress)*

## 🤝 **Contributing**

This project follows the implementation plan outlined in the attached documentation. Key principles:

1. **Formula Accuracy**: All calculations must match the Excel model exactly
2. **Type Safety**: Full TypeScript coverage with strict validation
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Performance**: Sub-300ms calculation updates
5. **Testing**: Comprehensive unit tests for all calculation functions

## 📄 **License**

This project is proprietary and confidential to Louis Amy Studio.

## 📞 **Support**

For questions or support regarding the Engineering Cost Calculator, please contact the development team.

---

Built with ❤️ using React, TypeScript, and modern web technologies to provide architects and engineers with powerful, accurate cost estimation tools.