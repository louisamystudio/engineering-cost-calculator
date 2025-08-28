/**
 * Import PR_Construction_Cost_Index_2025_filled.csv into building_cost_data_v6
 * Usage: DATABASE_URL=... pnpm tsx scripts/import_cost_index.ts PR_Construction_Cost_Index_2025_filled.csv
 */
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as schema from '../shared/schema';
import { and, eq } from 'drizzle-orm';

function die(msg: string): never { console.error(msg); process.exit(1); }

const csvPath = process.argv[2];
if (!csvPath) die('Provide CSV path: tsx scripts/import_cost_index.ts <file.csv>');
if (!process.env.DATABASE_URL) die('Set DATABASE_URL env var');

const raw = fs.readFileSync(path.resolve(csvPath), 'utf8');
const records: any[] = parse(raw, {
  columns: true,
  skip_empty_lines: true,
});

// Determine database type and use appropriate driver
const isNeonDb = process.env.DATABASE_URL!.includes('neon.tech');

let db: any;
let pool: any;

if (isNeonDb) {
  const { Pool: NeonPool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle: neonDrizzle } = await import('drizzle-orm/neon-serverless');
  const ws = await import('ws');
  
  neonConfig.webSocketConstructor = ws.default as any;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL! });
  db = neonDrizzle({ client: pool, schema });
} else {
  const pg = await import('pg');
  const { drizzle: pgDrizzle } = await import('drizzle-orm/node-postgres');
  
  const { Pool: PgPool } = pg.default;
  pool = new PgPool({ connectionString: process.env.DATABASE_URL! });
  db = pgDrizzle(pool, { schema });
}

function num(v: any): number {
  if (v === undefined || v === null || v === '') return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[^0-9.+-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function pick(row: any, keys: string[]): number {
  for (const k of keys) {
    const foundKey = Object.keys(row).find(h => h.trim().toLowerCase() === k.trim().toLowerCase());
    if (foundKey && row[foundKey] !== undefined) return num(row[foundKey]);
  }
  return 0;
}

function str(n: number): string { return n.toString(); }

(async () => {
  let imported = 0;
  for (const row of records) {
    const buildingUse = row['Building Use']?.toString() || row['Use']?.toString() || 'Unknown';
    const buildingType = row['Building Type']?.toString() || 'Unknown';
    const category = Math.round(num(row['Category']));
    const buildingTier = row['Building Tier']?.toString() || row['Tier']?.toString() || 'Mid';

    const rec = {
      buildingUse,
      buildingType,
      category,
      buildingTier,
      shellNewMin: str(pick(row, ['shell New Construction Min $/ftA� All-in','shell New Construction Min $/ft² All-in'])),
      shellRemodelMin: str(pick(row, ['shell Existing to Remodel Min $/ftA� All-in','shell Existing to Remodel Min $/ft² All-in'])),
      shellNewTarget: str(pick(row, ['shell New Construction Target $/ftA� All-in','shell New Construction Target $/ft² All-in'])),
      shellRemodelTarget: str(pick(row, ['shell Existing to Remodel Target $/ftA� All-in','shell Existing to Remodel Target $/ft² All-in'])),
      shellNewMax: str(pick(row, ['shell New Construction Max $/ftA� All-in','shell New Construction Max $/ft² All-in'])),
      shellRemodelMax: str(pick(row, ['shell Existing to Remodel Max $/ftA� All-in','shell Existing to Remodel Max $/ft² All-in'])),

      interiorNewMin: str(pick(row, ['Interior New Construction Min $/ftA� All-in','Interior New Construction Min $/ft² All-in'])),
      interiorRemodelMin: str(pick(row, ['Interior Existing to Remodel Min $/ftA� All-in','Interior Existing to Remodel Min $/ft² All-in'])),
      interiorNewTarget: str(pick(row, ['Interior New Construction Target $/ftA� All-in','Interior New Construction Target $/ft² All-in'])),
      interiorRemodelTarget: str(pick(row, ['Interior Existing to Remodel Target $/ftA� All-in','Interior Existing to Remodel Target $/ft² All-in'])),
      interiorNewMax: str(pick(row, ['Interior New Construction Max $/ftA� All-in','Interior New Construction Max $/ft² All-in'])),
      interiorRemodelMax: str(pick(row, ['Interior Existing to Remodel Max $/ftA� All-in','Interior Existing to Remodel Max $/ft² All-in'])),

      outdoorNewMin: str(pick(row, ['Outdoor & Landscape New Construction Min $/ftA� All-in','Outdoor & Landscape New Construction Min $/ft² All-in'])),
      outdoorRemodelMin: str(pick(row, ['Outdoor & Landscape Existing to Remodel Min $/ftA� All-in','Outdoor & Landscape Existing to Remodel Min $/ft² All-in'])),
      outdoorNewTarget: str(pick(row, ['Outdoor & Landscape New Construction Target $/ftA� All-in','Outdoor & Landscape New Construction Target $/ft² All-in'])),
      outdoorRemodelTarget: str(pick(row, ['Outdoor & Landscape Existing to Remodel Target $/ftA� All-in','Outdoor & Landscape Existing to Remodel Target $/ft² All-in'])),
      outdoorNewMax: str(pick(row, ['Outdoor & Landscape New Construction Max $/ftA� All-in','Outdoor & Landscape New Construction Max $/ft² All-in'])),
      outdoorRemodelMax: str(pick(row, ['Outdoor & Landscape Existing to Remodel Max $/ftA� All-in','Outdoor & Landscape Existing to Remodel Max $/ft² All-in'])),

      poolNewMin: str(pick(row, ['Swimming Pool New Construction Min $/ftA� All-in','Swimming Pool New Construction Min $/ft² All-in'])),
      poolRemodelMin: str(pick(row, ['Swimming Pool Existing to Remodel Min $/ftA� All-in','Swimming Pool Existing to Remodel Min $/ft² All-in'])),
      poolNewTarget: str(pick(row, ['Swimming Pool New Construction Target $/ftA� All-in','Swimming Pool New Construction Target $/ft² All-in'])),
      poolRemodelTarget: str(pick(row, ['Swimming Pool Existing to Remodel Target $/ftA� All-in','Swimming Pool Existing to Remodel Target $/ft² All-in'])),
      poolNewMax: str(pick(row, ['Swimming Pool New Construction Max $/ftA� All-in','Swimming Pool New Construction Max $/ft² All-in'])),
      poolRemodelMax: str(pick(row, ['Swimming Pool Existing to Remodel Max $/ftA� All-in','Swimming Pool Existing to Remodel Max $/ft² All-in'])),

      projectShellShare: str(pick(row, ['Project Shell Share','Project Shell Share (%)'])),
      projectInteriorShare: str(pick(row, ['Project Interior Share','Project Interior Share (%)'])),
      projectLandscapeShare: str(pick(row, ['Project Landscape Share','Project Landscape Share (%)'])),

      architecturalDesignShare: str(pick(row, ['Architectural Design Share','Architectural Design Share (%)'])),
      interiorDesignShare: str(pick(row, ['Interior Design Share','Interior Design Share (%)'])),
      landscapeDesignShare: str(pick(row, ['Landscape Design Share','Landscape Design Share (%)'])),
      structuralDesignShare: str(pick(row, ['Structural Design Share','Structural Design Share (%)'])),
      civilDesignShare: str(pick(row, ['Civil Design Share','Civil Design Share (%)'])),
      mechanicalDesignShare: str(pick(row, ['Mechanical Design Share','Mechanical Design Share (%)'])),
      electricalDesignShare: str(pick(row, ['Electrical Design Share','Electrical Design Share (%)'])),
      plumbingDesignShare: str(pick(row, ['Plumbing Design Share','Plumbing Design Share (%)'])),
      telecommunicationDesignShare: str(pick(row, ['Telecommunication Design','Telecomunication Design','Telecommunication Design (%)'])),
    } satisfies Omit<typeof schema.insertBuildingCostDataSchema._type, 'id'>;

    // Remove existing dupes and insert
    await db.delete(schema.buildingCostData).where(and(
      eq(schema.buildingCostData.buildingUse, rec.buildingUse),
      eq(schema.buildingCostData.buildingType, rec.buildingType),
      eq(schema.buildingCostData.category, rec.category),
      eq(schema.buildingCostData.buildingTier, rec.buildingTier)
    ));
    await db.insert(schema.buildingCostData).values(rec as any);
    imported++;
  }

  console.log(`Imported ${imported} rows from ${csvPath}`);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
