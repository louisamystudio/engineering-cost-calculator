// Utility to inspect an Excel workbook and print sheet names and first formulas (CommonJS)
const XLSX = require('xlsx');
const fs = require('fs');

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/xlsx_dump.cjs <path-to-xlsx>');
  process.exit(1);
}

const wb = XLSX.readFile(file, { cellFormula: true, cellNF: false, cellText: false });

const result = { sheets: [], namedRanges: 0 };
if (wb.Workbook && Array.isArray(wb.Workbook.Names)) {
  result.namedRanges = wb.Workbook.Names.length;
}

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rangeRef = ws['!ref'] || 'A1:Z200';
  const range = XLSX.utils.decode_range(rangeRef);
  const formulas = [];
  for (let R = range.s.r; R <= Math.min(range.e.r, 400); ++R) {
    for (let C = range.s.c; C <= Math.min(range.e.c, 50); ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;
      if (cell.f) {
        formulas.push({ addr, f: cell.f });
        if (formulas.length > 100) break;
      }
    }
    if (formulas.length > 100) break;
  }
  result.sheets.push({ name, firstFormulas: formulas });
}

console.log(JSON.stringify(result, null, 2));

