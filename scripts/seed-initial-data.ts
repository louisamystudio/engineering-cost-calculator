/**
 * Seed initial data for the engineering cost calculator
 */
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';

async function seedData() {
  console.log('Seeding initial data...');
  
  // Insert category multipliers
  const categoryMultipliers = [
    { category: 1, multiplier: '0.90', description: 'Simple/Standard' },
    { category: 2, multiplier: '1.00', description: 'Moderate Complexity' },
    { category: 3, multiplier: '1.10', description: 'Complex' },
    { category: 4, multiplier: '1.20', description: 'Very Complex' },
    { category: 5, multiplier: '1.30', description: 'Extremely Complex' }
  ];
  
  for (const mult of categoryMultipliers) {
    await db.insert(schema.categoryMultipliers)
      .values(mult as any)
      .onConflictDoNothing();
  }
  
  // Insert hours leverage data
  const hoursLeverage = [
    { phase: 'Discovery', hoursPct: '0.08', adminPct: '0.37', designer1Pct: '0.37', designer2Pct: '0', architectPct: '0.10', engineerPct: '0.02', principalPct: '0.14' },
    { phase: 'Creative - Conceptual', hoursPct: '0.08', adminPct: '0', designer1Pct: '0', designer2Pct: '0', architectPct: '0.95', engineerPct: '0', principalPct: '0.05' },
    { phase: 'Creative - Schematic', hoursPct: '0.34', adminPct: '0.02', designer1Pct: '0.32', designer2Pct: '0.32', architectPct: '0.32', engineerPct: '0.02', principalPct: '0.02' },
    { phase: 'Creative - Preliminary', hoursPct: '0.08', adminPct: '0.02', designer1Pct: '0.32', designer2Pct: '0.32', architectPct: '0.32', engineerPct: '0.02', principalPct: '0.02' },
    { phase: 'Technical - Schematic', hoursPct: '0.34', adminPct: '0.06', designer1Pct: '0.26', designer2Pct: '0.26', architectPct: '0.10', engineerPct: '0.32', principalPct: '0.06' },
    { phase: 'Technical - Preliminary', hoursPct: '0.08', adminPct: '0.06', designer1Pct: '0.26', designer2Pct: '0.26', architectPct: '0.10', engineerPct: '0.32', principalPct: '0.06' }
  ];
  
  for (const phase of hoursLeverage) {
    await db.insert(schema.hoursLeverage)
      .values(phase as any);
  }
  
  // Insert labor overhead data
  const laborOverhead = [
    { role: 'Admin', laborAnnual: '41600', overheadAnnual: '33280' },
    { role: 'Designer', laborAnnual: '52000', overheadAnnual: '41600' },
    { role: 'Designer2', laborAnnual: '62400', overheadAnnual: '49920' },
    { role: 'Architect', laborAnnual: '83200', overheadAnnual: '66560' },
    { role: 'Engineer', laborAnnual: '93600', overheadAnnual: '74880' },
    { role: 'Principal', laborAnnual: '156000', overheadAnnual: '124800' }
  ];
  
  for (const data of laborOverhead) {
    await db.insert(schema.laborOverhead)
      .values(data as any)
      .onConflictDoNothing();
  }
  
  // Insert hourly rates
  const hourlyRates = [
    { role: 'Admin', louisAmyRate: '60', marketRate: '75' },
    { role: 'Designer', louisAmyRate: '80', marketRate: '100' },
    { role: 'Designer2', louisAmyRate: '95', marketRate: '120' },
    { role: 'Architect', louisAmyRate: '125', marketRate: '160' },
    { role: 'Engineer', louisAmyRate: '140', marketRate: '180' },
    { role: 'Principal', louisAmyRate: '225', marketRate: '300' }
  ];
  
  for (const rate of hourlyRates) {
    await db.insert(schema.hourlyRates)
      .values(rate as any)
      .onConflictDoNothing();
  }
  
  // Insert fee config
  const feeConfig = [
    { settingKey: 'markup', settingValue: '1.0' },
    { settingKey: 'discount_louis_amy', settingValue: '0.35' },
    { settingKey: 'discount_market', settingValue: '0.35' }
  ];
  
  for (const config of feeConfig) {
    await db.insert(schema.feeConfig)
      .values(config as any)
      .onConflictDoNothing();
  }
  
  console.log('Initial data seeded successfully!');
  process.exit(0);
}

seedData().catch((error) => {
  console.error('Error seeding data:', error);
  process.exit(1);
});
