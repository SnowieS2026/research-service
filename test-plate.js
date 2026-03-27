function detectPlateType(plate) {
  const clean = plate.replace(/[\s\-]/g, '').toUpperCase();
  if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(clean)) return 'VIN';
  if (/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(clean)) return 'UK';
  if (/^[A-Z]{2}\d{2} [A-Z]{3}$/.test(clean)) return 'UK';
  if (/^[A-Z]\d{1,3}[A-Z]{3}$/.test(clean)) return 'UK';
  if (/^[A-Z]\d{1,2}[A-Z]{3}$/.test(clean)) return 'UK';
  if (/^[A-Z]{2}\d{1,2}[A-Z]{3}$/.test(clean)) return 'UK';
  if (/^[A-Z]{3}\d{1,3}[A-Z]{2}$/.test(clean)) return 'UK';
  if (/^[A-Z0-9]{3,8}$/i.test(clean)) return 'US';
  return 'UNKNOWN';
}

const plates = ['GMZ2745', 'AB12CDE', 'A123ABC', 'ABC123DE', 'XYZ999'];
for (const p of plates) {
  console.log(`${p}: ${detectPlateType(p)}`);
}
