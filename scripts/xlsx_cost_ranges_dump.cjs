const XLSX = require('xlsx');
const file = process.argv[2];
const wb = XLSX.readFile(file);
const sheetName = wb.SheetNames.find(n => /cost/i.test(n)) || wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
if (!ws) { console.error('No sheet found'); process.exit(1); }
const range = XLSX.utils.decode_range(ws['!ref']);
const startRow = range.s.r;
const cols = Math.min(range.s.c + 12, range.e.c);
const headers = [];
for (let c = range.s.c; c <= cols; ++c) {
  const addr = XLSX.utils.encode_cell({ r: startRow, c });
  headers.push(ws[addr]?.v ?? null);
}
console.log('Sheet:', sheetName);
console.log('Headers:', headers);
for (let r = startRow + 1; r <= Math.min(startRow + 8, range.e.r); ++r) {
  const row = [];
  for (let c = range.s.c; c <= cols; ++c) {
    const addr = XLSX.utils.encode_cell({ r, c });
    row.push(ws[addr]?.v ?? null);
  }
  console.log(row);
}

