# Engineering Cost Calculator - Calculation Discrepancies Report

## Summary
This report compares the Louis Amy Quote Excel formulas with the current application implementation.

## 1. Category Multiplier Discrepancies ❌

### Excel Values:
- Category 1 = 0.9
- Category 2 = 1.0
- Category 3 = 1.1
- Category 4 = 1.2
- Category 5 = 1.3

### App Implementation:
```typescript
// Default fallback: 0.8 + 0.1 * category
// This gives: Cat 1=0.9, Cat 2=1.0, Cat 3=1.1, Cat 4=1.2, Cat 5=1.3
```
**Status**: ✅ Actually CORRECT when using fallback formula

## 2. Construction Cost Lookup ⚠️

### Excel:
- Uses Key = BuildingUse & "|" & BuildingType
- VLOOKUP on Cost_Ranges with columns 6 (min) and 7 (max)

### App:
- Maps buildingType and tier (Low/Mid/High based on designLevel)
- Uses building_cost_data_v6 table with separate columns

**Issue**: Potential mismatch in how data is looked up

## 3. Architecture Percentage Calculation ❌

### Excel Formula:
```
=(1-(Engineering Sum))*ShellShare
```

### App Implementation:
```typescript
const architecturePercentage = Math.max(0.1, 1 - totalEngineeringPercentage);
// Missing multiplication by shellShare!
```
**Critical Issue**: App doesn't multiply by shellShare

## 4. Engineering Budget Calculations ❌

### Excel:
- New Construction: Based on shell budget * engineering percentage
- Existing/Remodel: Applies remodel multiplier differently

### App:
- Correctly calculates based on shell budget portions
- But architecture percentage calculation is wrong (see #3)

## 5. Hours Calculation Discrepancy ⚠️

### Excel:
- New Construction Total Hours = Factor * Area
- Existing Total Hours = Factor * Area * 1.15

### App:
```typescript
const existingHours = existingHoursFactor * project.existingBuildingArea;
// Missing the 1.15 multiplier!
```

## 6. Fee Calculation - Scan to BIM ❌

### Excel Formulas:
- Building: `(0.6+0.006*((1000+ExistingArea)/1000000)^(-0.7495))*CategoryMultiplier`
- Site: `(1+0.00091*(SiteArea/1000000)^(-0.005))*CategoryMultiplier/(3.28^2)+0.08`

### App:
- Not implemented or uses simplified rates

## 7. Bottom-Up Fee Analysis ❌

### Excel:
- Complex formula with different adjustments for new (0.95) and remodel (1.05)
- Formula: `((baseFee*CategoryMultiplier*NewShare*0.95)+(baseFee*CategoryMultiplier*RemodelShare*1.05))/TotalBudget*(1+(1-RemodelMultiplier))`

### App:
- Simplified version without the 0.95/1.05 adjustments

## 8. Coordination Fee & Markup ❌

### Excel:
- Coordination Fee: 15% (0.15)
- Markup: 100% (1.0)

### App:
- Not clearly implemented in the same way

## Critical Fixes Needed:

1. **Architecture Percentage**: Must multiply by shellShare
2. **Existing Hours**: Add the 1.15 multiplier
3. **Scan to BIM**: Implement proper formulas
4. **Fee Calculations**: Add 0.95/1.05 adjustments for new/remodel
5. **Engineering Lookups**: Verify key format matches Excel
6. **Coordination & Markup**: Implement 15% coordination fee

## Next Steps:
1. Fix architecture percentage calculation
2. Update hours calculations
3. Implement Scan to BIM formulas
4. Refactor fee calculations to match Excel exactly
5. Add coordination fee logic
