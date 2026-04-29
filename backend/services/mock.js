/**
 * Mock data service — used as fallback when real APIs aren't configured.
 * Generates realistic-looking vehicle data from VRM patterns.
 */
const makes = [
  { make: 'BMW', models: ['320d M Sport', '118i SE', '520d', 'X3 xDrive20d', '330e'] },
  { make: 'Ford', models: ['Fiesta Zetec', 'Focus Titanium', 'Kuga ST-Line', 'Puma', 'Mondeo'] },
  { make: 'Vauxhall', models: ['Corsa SXi', 'Astra SRi', 'Mokka', 'Insignia', 'Crossland'] },
  { make: 'Volkswagen', models: ['Golf GTI', 'Polo SE', 'Tiguan', 'Passat', 'T-Roc'] },
  { make: 'Audi', models: ['A3 Sportback', 'A4 S Line', 'Q5', 'A1', 'Q3'] },
  { make: 'Mercedes', models: ['A180', 'C220d', 'GLA', 'E300', 'CLA'] },
  { make: 'Toyota', models: ['Yaris', 'Corolla', 'RAV4', 'C-HR', 'Aygo'] },
  { make: 'Nissan', models: ['Qashqai', 'Juke', 'Micra', 'Leaf', 'X-Trail'] },
  { make: 'Honda', models: ['Civic', 'Jazz', 'CR-V', 'HR-V'] },
  { make: 'Peugeot', models: ['208', '308', '3008', '2008', '5008'] },
];

const colours = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Grey', 'Green'];
const fuelTypes = ['PETROL', 'DIESEL', 'PETROL', 'PETROL', 'DIESEL', 'ELECTRICITY'];

function hashVrm(vrm) {
  let hash = 0;
  for (let i = 0; i < vrm.length; i++) {
    hash = ((hash << 5) - hash) + vrm.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

import { checkULEZ, calculateDepreciation, estimateInsuranceGroup, evaluateDeal } from './differentiators.js';

export function generateMockData(vrm) {
  const seed = hashVrm(vrm);
  const makeIdx = seed % makes.length;
  const { make, models } = makes[makeIdx];
  const model = models[seed % models.length];
  const year = 2005 + (seed % 21); // 2005-2026
  const month = 1 + (seed % 12);
  const mileage = 10000 + (seed % 180000);
  const motCount = 1 + (seed % 8);
  const hasFailures = seed % 5 === 0;
  const colour = colours[seed % colours.length];
  const fuel = fuelTypes[(seed + makeIdx) % fuelTypes.length];
  const co2 = fuel === 'ELECTRICITY' ? 0 : (90 + (seed % 180));
  const keepers = 1 + (seed % 7);

  // Generate MOT history
  const motTests = [];
  let currentMileage = mileage;
  for (let i = 0; i < motCount; i++) {
    const testYear = 2026 - i;
    const testMonth = (month + i * 3) % 12 + 1;
    const isFail = hasFailures && i === motCount - 1;
    const mileAtTest = Math.round(currentMileage - (i * 8500) + (seed % 3000));
    
    motTests.push({
      date: `${testYear}-${String(testMonth).padStart(2, '0')}-15`,
      result: isFail ? 'FAIL' : 'PASS',
      mileage: mileAtTest > 0 ? mileAtTest : 5000,
      mileageUnit: 'mi',
      expiryDate: `${testYear + 1}-${String(testMonth).padStart(2, '0')}-14`,
      advisories: i === 0 && seed % 3 === 0 
        ? ['Nearside front tyre worn close to legal limit'] 
        : [],
      defects: isFail 
        ? ['Exhaust emissions exceed manufacturer specified limits'] 
        : [],
    });
  }

  const overview = {
    reg: vrm,
    make,
    model,
    year,
    colour,
    fuel,
    engine: fuel === 'ELECTRICITY' ? 'Electric' : `${1400 + (seed % 2000)}cc`,
    transmission: seed % 3 === 0 ? 'Manual' : 'Automatic',
    body: seed % 2 === 0 ? 'Hatchback' : 'Saloon',
    co2,
    tax: fuel === 'ELECTRICITY' ? '£0/year' : (co2 <= 100 ? '£0/year' : (co2 <= 120 ? '£35/year' : '£165/year')),
    taxStatus: seed % 12 !== 0 ? 'Taxed' : 'Untaxed',
    taxDue: `2027-${String(1 + (seed % 12)).padStart(2, '0')}-01`,
    motStatus: 'Valid',
    motExpiry: motTests[0]?.expiryDate || null,
    v5cIssued: `202${2 + (seed % 4)}-${String(1 + (seed % 12)).padStart(2, '0')}-15`,
    previousKeepers: keepers,
    euroStatus: year >= 2015 ? 'Euro 6' : (year >= 2009 ? 'Euro 5' : 'Euro 4'),
  };

  const risks = {
    finance: { status: 'unknown', text: 'Check requires commercial API' },
    stolen: { status: 'unknown', text: 'Check requires commercial API' },
    writeoff: { status: 'unknown', text: 'Check requires commercial API' },
    scrapped: { status: 'clear', text: 'Not marked as exported or scrapped' },
    imported: { status: 'unknown', text: 'Check requires commercial API' },
    mileage: motTests.length >= 2 
      ? { status: 'clear', text: 'Mileage consistent across MOT history' }
      : { status: 'unknown', text: 'Insufficient MOT data to verify' },
  };

  // Build differentiators
  const mockDvla = { fuelType: fuel, euroStatus: overview.euroStatus, yearOfManufacture: year, co2Emissions: co2 };
  const mockMot = { fuelType: fuel, manufactureYear: year };
  const ulez = checkULEZ(mockDvla, mockMot);
  const depreciation = calculateDepreciation(year, fuel, mileage);
  const insurance = estimateInsuranceGroup(overview.engine, overview.fuel, overview.body);

  // Generate mock valuation for deal verdict
  const baseVal = depreciation?.currentValue || 5000;
  const valuation = {
    tradeIn: { min: Math.round(baseVal * 0.6), max: Math.round(baseVal * 0.75) },
    privateSale: { min: Math.round(baseVal * 0.8), max: Math.round(baseVal * 1.0) },
    dealerForecourt: { min: Math.round(baseVal * 0.95), max: Math.round(baseVal * 1.2) },
  };
  const marketDays = 10 + (seed % 50);
  const dealVerdict = evaluateDeal(valuation, motTests, risks, overview, marketDays);

  return {
    overview,
    motHistory: motTests,
    risks,
    score: dealVerdict.score || (40 + (seed % 40)),
    scoreText: dealVerdict.verdict === 'recommend' ? 'Solid buy based on available records' : 'Review flagged items carefully',
    valuation,
    marketDays,
    runningCosts: null,
    ulez,
    depreciation,
    insurance,
    dealVerdict,
    _meta: { dvla: 'mock', dvsa: 'mock' },
    _mock: true,
  };
}
