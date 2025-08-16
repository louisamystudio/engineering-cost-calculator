import { storage } from "../storage";
import type { 
  FeeMatrixV2Input, 
  FeeMatrixV2Result, 
  SectionII, 
  SectionIII, 
  SectionIV, 
  SectionV, 
  SectionVI 
} from "@shared/schema";

// Phase months mapping from Excel workbook
const PHASE_MONTHS: Record<string, number | null> = {
  'Kick-Off': 0,
  'Discovery': 1,
  'Creative - Conceptual': 1,
  'Creative - Shematic': 3,
  'Creative - Preliminary': 1,
  'Technical - Shematic': 3,
  'Technical - Preliminary': 1,
  'Pre-Construction (Hourly Rate)': null,
  'Construction Observation (Hourly Rate)': null,
  'Total % Per Employees': null,
};

export async function computeFeeMatrixV2(inputs: FeeMatrixV2Input): Promise<FeeMatrixV2Result> {
  // Section II - Cost & Pricing Per Hour
  const sectionII = await computeSectionII();
  
  // Section III - Project Hours & Leverage  
  const sectionIII = await computeSectionIII(inputs);
  
  // Section IV - Project Hours Distribution
  const sectionIV = await computeSectionIV(sectionIII);
  
  // Section V - Project Budget
  const sectionV = await computeSectionV(sectionII, sectionIV);
  
  // Update weighted average rate in Section II
  sectionII.weightedAverageRate = computeWeightedAverageRate(sectionII, sectionIV);
  
  // Section VI - Scenarios
  const sectionVI = await computeSectionVI(inputs, sectionII, sectionIV, sectionV);

  return {
    inputs,
    sectionII,
    sectionIII,
    sectionIV,
    sectionV,
    sectionVI,
  };
}

async function computeSectionII(): Promise<SectionII> {
  const laborOverheadData = await storage.getAllLaborOverhead();
  const markup = await storage.getFeeConfigValue('markup') ?? 1.0;
  
  const roles: Record<string, any> = {};
  let totalPricePerHour = 0;
  let roleCount = 0;

  for (const item of laborOverheadData) {
    const laborPerHour = parseFloat(item.laborAnnual) / 2080;
    const overheadPerHour = parseFloat(item.overheadAnnual) / 2080;
    const costPerHour = laborPerHour + overheadPerHour;
    const pricePerHour = costPerHour * (1 + markup);

    roles[item.role] = {
      laborPerHour,
      overheadPerHour,
      costPerHour,
      pricePerHour,
    };

    totalPricePerHour += pricePerHour;
    roleCount++;
  }

  const simpleAverageRate = roleCount > 0 ? totalPricePerHour / roleCount : 0;

  return {
    roles,
    simpleAverageRate,
    weightedAverageRate: 0, // Will be computed after Section IV
  };
}

async function computeSectionIII(inputs: FeeMatrixV2Input): Promise<SectionIII> {
  const totalHoursPlanned = inputs.totalHours ?? Math.round(inputs.totalAreaFt2 * inputs.hoursFactor);
  
  const hoursLeverageData = await storage.getAllHoursLeverage();
  const phases: SectionIII['phases'] = [];
  let totalMonths = 0;
  let cumulativeHours = 0;

  // Filter out rows that shouldn't be in phase calculations
  const validPhases = hoursLeverageData.filter(phase => 
    phase.phase !== 'Total % Per Employees' && 
    phase.hoursPct !== null
  );

  for (let i = 0; i < validPhases.length; i++) {
    const phase = validPhases[i];
    const phaseName = phase.phase;
    const months = PHASE_MONTHS[phaseName] ?? null;
    const percent = parseFloat(phase.hoursPct || '0');
    
    let hours: number;
    if (i === validPhases.length - 1) {
      // Last phase gets remaining hours to ensure sum equals totalHoursPlanned
      hours = totalHoursPlanned - cumulativeHours;
    } else {
      hours = Math.round(totalHoursPlanned * percent);
      cumulativeHours += hours;
    }

    phases.push({
      name: phaseName,
      months,
      percent,
      hours,
    });

    if (months !== null) {
      totalMonths += months;
    }
  }

  return {
    totalAreaFt2: inputs.totalAreaFt2,
    hoursFactor: inputs.hoursFactor,
    totalHoursPlanned,
    phases,
    totalMonths,
  };
}

async function computeSectionIV(sectionIII: SectionIII): Promise<SectionIV> {
  const hoursLeverageData = await storage.getAllHoursLeverage();
  
  // Create lookup for phase weights
  const phaseWeights: Record<string, any> = {};
  for (const phase of hoursLeverageData) {
    phaseWeights[phase.phase] = {
      Admin: parseFloat(phase.adminPct || '0'),
      Designer: parseFloat(phase.designer1Pct || '0'),
      Designer2: parseFloat(phase.designer2Pct || '0'),
      Architect: parseFloat(phase.architectPct || '0'),
      Engineer: parseFloat(phase.engineerPct || '0'),
      Principal: parseFloat(phase.principalPct || '0'),
    };
  }

  const roles = ['Admin', 'Designer', 'Designer2', 'Architect', 'Engineer', 'Principal'];
  const matrix: Record<string, Record<string, number>> = {};
  const roleTotalsRounded: Record<string, number> = {};

  // Initialize role totals
  for (const role of roles) {
    roleTotalsRounded[role] = 0;
  }

  // Calculate hours for each phase and role
  for (const phase of sectionIII.phases) {
    matrix[phase.name] = {};
    const weights = phaseWeights[phase.name] || {};

    for (const role of roles) {
      const weight = weights[role] || 0;
      const raw = phase.hours * weight;
      
      let hoursRolePhase: number;
      if (role === 'Admin') {
        hoursRolePhase = Math.round(raw); // matching Excel rounding for Admin
      } else {
        hoursRolePhase = Math.ceil(raw); // round up for staff
      }

      matrix[phase.name][role] = hoursRolePhase;
      roleTotalsRounded[role] += hoursRolePhase;
    }
  }

  const roundedGrandTotal = Object.values(roleTotalsRounded).reduce((sum, hours) => sum + hours, 0);

  return {
    matrix,
    roleTotalsRounded,
    roundedGrandTotal,
    plannedGrandTotal: sectionIII.totalHoursPlanned,
  };
}

async function computeSectionV(sectionII: SectionII, sectionIV: SectionIV): Promise<SectionV> {
  const roles = Object.keys(sectionIV.roleTotalsRounded);
  const byRole: Record<string, any> = {};
  
  let totalHours = 0;
  let totalPricing = 0;
  let totalLabor = 0;
  let totalOverhead = 0;
  let totalCost = 0;
  let totalProfit = 0;

  for (const role of roles) {
    const hours = sectionIV.roleTotalsRounded[role];
    const roleData = sectionII.roles[role];
    
    if (!roleData) continue;

    const pricing = hours * roleData.pricePerHour;
    const labor = hours * roleData.laborPerHour;
    const overhead = hours * roleData.overheadPerHour;
    const cost = labor + overhead;
    const profit = pricing - cost;
    const margin = pricing > 0 ? profit / pricing : 0;

    byRole[role] = {
      hours,
      pricePerHour: roleData.pricePerHour,
      pricing,
      labor,
      overhead,
      totalCost: cost,
      profit,
      margin,
    };

    totalHours += hours;
    totalPricing += pricing;
    totalLabor += labor;
    totalOverhead += overhead;
    totalCost += cost;
    totalProfit += profit;
  }

  const totalMargin = totalPricing > 0 ? totalProfit / totalPricing : 0;

  return {
    byRole,
    totals: {
      hours: totalHours,
      pricing: totalPricing,
      labor: totalLabor,
      overhead: totalOverhead,
      totalCost,
      profit: totalProfit,
      margin: totalMargin,
    },
  };
}

async function computeSectionVI(
  inputs: FeeMatrixV2Input, 
  sectionII: SectionII, 
  sectionIV: SectionIV, 
  sectionV: SectionV
): Promise<SectionVI> {
  const hourlyRatesData = await storage.getAllHourlyRates();
  const roles = Object.keys(sectionIV.roleTotalsRounded);
  
  // Create rate lookup
  const louisAmyRates: Record<string, number> = {};
  const marketRates: Record<string, number> = {};
  
  for (const item of hourlyRatesData) {
    louisAmyRates[item.role] = parseFloat(item.louisAmyRate || '0') || sectionII.roles[item.role]?.pricePerHour || 0;
    marketRates[item.role] = parseFloat(item.marketRate || '0') || louisAmyRates[item.role] || 0;
  }

  // Fill in missing rates with Section II data
  for (const role of roles) {
    if (!louisAmyRates[role]) {
      louisAmyRates[role] = sectionII.roles[role]?.pricePerHour || 0;
    }
    if (!marketRates[role]) {
      marketRates[role] = louisAmyRates[role];
    }
  }

  const scenarios = [
    {
      name: 'LouisAmy Discounted',
      rates: Object.fromEntries(roles.map(role => [
        role, 
        louisAmyRates[role] * (1 - inputs.scenarioDiscountLouisAmy)
      ])),
    },
    {
      name: 'LouisAmy Full Rate',
      rates: louisAmyRates,
    },
    {
      name: 'Market Full Rate', 
      rates: marketRates,
    },
    {
      name: 'Market Rate Discounted',
      rates: Object.fromEntries(roles.map(role => [
        role,
        marketRates[role] * (1 - inputs.scenarioDiscountMarket)
      ])),
    },
  ];

  const projectBudget = sectionV.totals.pricing;

  return {
    scenarios: scenarios.map(scenario => {
      const byRole: Record<string, number> = {};
      let total = 0;

      for (const role of roles) {
        const fee = sectionIV.roleTotalsRounded[role] * scenario.rates[role];
        byRole[role] = fee;
        total += fee;
      }

      const pctOfProjectBudget = projectBudget > 0 ? total / projectBudget : 0;

      return {
        name: scenario.name,
        byRole,
        total,
        pctOfProjectBudget,
      };
    }),
  };
}

function computeWeightedAverageRate(sectionII: SectionII, sectionIV: SectionIV): number {
  let totalWeightedRate = 0;
  let totalHours = 0;

  for (const [role, hours] of Object.entries(sectionIV.roleTotalsRounded)) {
    const roleData = sectionII.roles[role];
    if (roleData && hours > 0) {
      totalWeightedRate += hours * roleData.pricePerHour;
      totalHours += hours;
    }
  }

  return totalHours > 0 ? totalWeightedRate / totalHours : 0;
}