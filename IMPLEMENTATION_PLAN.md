# Engineering Cost Calculator - Implementation Plan

## Overview
This plan addresses the current shortcomings of the calculator and aligns it with the Excel spreadsheet logic, making it more interactive, context-aware, and user-friendly.

## Phase 1: Fix Critical Errors & Stabilize
**Priority: IMMEDIATE**
**Estimated Time: 15 minutes**

### 1.1 Fix ReferenceError Issues
- [ ] Debug and fix any undefined variable errors in modern-project-dashboard.tsx
- [ ] Ensure all state variables are properly initialized
- [ ] Test that the dashboard loads without console errors

### 1.2 Verify Core Functionality
- [ ] Confirm calculation engine works correctly
- [ ] Ensure all API endpoints respond properly
- [ ] Validate data flow from database to UI

## Phase 2: Restructure Dashboard to Match Excel Flow
**Priority: HIGH**
**Estimated Time: 2 hours**

### 2.1 Reorder Dashboard Sections
Create a new layout that mirrors the Excel spreadsheet's logical flow:

1. **Project Inputs & Cost Ranges**
   - Project information (building use, type, tier, category, design level)
   - Area parameters (new, existing, site)
   - Interactive cost range sliders with min/target/max markers
   - Remodel factor and historic multiplier controls

2. **Budget Allocation**
   - New and Remodel budgets display
   - Shell/Interior/Landscape budgets with breakdowns
   - Interactive share percentage sliders
   - Working Minimum Budget indicator

3. **Discipline Budgets**
   - Architecture, Structural, Civil/Site, Mechanical, Electrical, Plumbing, Telecom
   - Show new vs remodel splits for each discipline
   - Interactive percentage overrides

4. **Fee Analysis (Two Tabs)**
   - **Top-Down Analysis Tab:**
     - Percentage of project cost
     - Rate per ft²
     - Market fee, Louis Amy fee, Consultant fee, Coordination fee
     - Interactive category multiplier, discount rate, remodel factor
   
   - **Bottom-Up Analysis Tab:**
     - Team roles with labor costs
     - Overhead, margin, and markup controls
     - Hours contribution by role
     - Service selection checkboxes

5. **Hours Distribution**
   - Hours by phase and role matrix
   - Hours-per-ft² factor with override capability
   - Correlation between hours and fees

6. **Summary & Sanity Check**
   - Key metrics overview
   - Variance analysis
   - Export/Save capabilities

## Phase 3: Make Cost Ranges Interactive
**Priority: HIGH**
**Estimated Time: 1.5 hours**

### 3.1 Interactive Cost Range Bars
- [ ] Replace static cost range displays with interactive sliders
- [ ] Add draggable target markers between min and max values
- [ ] Separate controls for new construction and remodel costs
- [ ] Visual feedback showing current selection vs database defaults
- [ ] Real-time budget recalculation on adjustment

### 3.2 Dynamic Share Adjustments
- [ ] Add numeric input fields next to all share percentages
- [ ] Implement slider controls for Shell/Interior/Landscape shares
- [ ] Add sliders for discipline percentage allocations
- [ ] Ensure totals always sum to 100% with proportional adjustment
- [ ] Visual indicators when overrides are active

## Phase 4: Add Context and Explanations
**Priority: MEDIUM**
**Estimated Time: 1 hour**

### 4.1 Enhance Key Metrics Cards
- [ ] Add info icons with expandable details
- [ ] Show calculation formulas on hover/click
- [ ] Display data sources and inputs used
- [ ] Include Working Minimum Budget line with tooltip
- [ ] Add trend indicators comparing to baseline

### 4.2 Data Source Attribution
- [ ] Create tooltips showing database tables used
- [ ] Display calculation formulas for each value
- [ ] Link to relevant Excel sections for reference
- [ ] Show when overrides are applied vs defaults

## Phase 5: Improve Fee Analysis Section
**Priority: MEDIUM**
**Estimated Time: 1.5 hours**

### 5.1 Top-Down Analysis Enhancement
- [ ] Create detailed breakdown table showing:
  - Each scope's percentage of project cost
  - Rate per square foot calculations
  - Market fee, Louis Amy fee breakdowns
  - Consultant and coordination fees
- [ ] Add interactive controls for:
  - Category multiplier slider
  - Discount rate adjustment
  - Remodel factor override

### 5.2 Bottom-Up Analysis Implementation
- [ ] Create team composition interface:
  - Designer 1, Designer 2, Architect, Engineer, Principal roles
  - Labor cost per hour inputs
  - Overhead per hour controls
  - Margin and markup adjustments
- [ ] Show calculated hours per role
- [ ] Compare top-down vs bottom-up totals

### 5.3 Service Selection
- [ ] Add checkboxes to include/exclude:
  - Louis Amy services
  - Individual consultant disciplines
- [ ] Dynamic fee/hours recalculation on selection change
- [ ] Visual indication of included vs excluded services

## Phase 6: UI/UX Improvements
**Priority: LOW**
**Estimated Time: 1 hour**

### 6.1 Visual Design Enhancement
- [ ] Reduce color palette to 3-4 primary colors
- [ ] Increase whitespace between sections
- [ ] Implement collapsible cards to reduce scroll
- [ ] Clear typography hierarchy (headings, labels, values)
- [ ] Consistent button and control styling

### 6.2 Interaction Improvements
- [ ] Add loading states for all async operations
- [ ] Implement undo/redo for parameter changes
- [ ] Add reset to defaults buttons per section
- [ ] Keyboard shortcuts for common actions
- [ ] Export functionality for reports

## Phase 7: Advanced Features
**Priority: LOW**
**Estimated Time: 1 hour**

### 7.1 Comparison Tools
- [ ] Side-by-side scenario comparison
- [ ] Save and load different configurations
- [ ] Historical project comparisons
- [ ] Benchmark against similar projects

### 7.2 Reporting
- [ ] Generate PDF reports
- [ ] Excel export matching original format
- [ ] Custom report templates
- [ ] Email integration for sharing

## Implementation Order

1. **Immediate (Today):**
   - Phase 1: Fix critical errors
   - Phase 2.1: Begin dashboard restructuring

2. **Short Term (This Week):**
   - Phase 2: Complete dashboard restructuring
   - Phase 3: Make cost ranges interactive
   - Phase 4: Add context and explanations

3. **Medium Term (Next Week):**
   - Phase 5: Improve fee analysis
   - Phase 6: UI/UX improvements

4. **Long Term (Future):**
   - Phase 7: Advanced features

## Success Metrics

- No console errors in production
- All calculations match Excel model outputs
- Users can adjust all key parameters from dashboard
- Clear visibility into calculation methodology
- Reduced clicks to accomplish common tasks
- Improved visual hierarchy and readability

## Technical Considerations

### State Management
- Consolidate related state variables into objects
- Implement proper state persistence
- Add optimistic updates for better UX

### Performance
- Debounce slider inputs to reduce recalculations
- Memoize expensive calculations
- Lazy load advanced sections

### Data Flow
- Ensure single source of truth for all values
- Clear separation between defaults and overrides
- Proper validation at each level

## Testing Requirements

- Unit tests for calculation functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Visual regression tests for UI changes
- Performance benchmarks for large datasets

## Documentation Needs

- User guide for new interactive features
- API documentation updates
- Calculation methodology documentation
- Migration guide from Excel to web app