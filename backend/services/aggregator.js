import { checkULEZ, calculateDepreciation, estimateInsuranceGroup, evaluateDeal } from './differentiators.js';

/**
 * Aggregates data from all API sources into the unified frontend format.
 * Falls back gracefully when individual services are unavailable.
 */
export function aggregateVehicleData(vrm, dvlaData, motData) {
  const overview = buildOverview(vrm, dvlaData, motData);
  const motHistory = motData?.motTests || [];
  const risks = buildRiskAssessment(dvlaData, motData);

  // Differentiators
  const ulez = checkULEZ(dvlaData, motData);
  const depreciation = overview.year && overview.year !== 'Unknown'
    ? calculateDepreciation(overview.year, overview.fuel, null)
    : null;
  const insurance = (dvlaData || motData)
    ? estimateInsuranceGroup(overview.engine, overview.fuel, overview.body)
    : null;
  const dealVerdict = evaluateDeal(
    null, // valuation (null = skip price comparison, still evaluate history)
    motHistory,
    risks,
    overview,
    null
  );

  const score = buildInitialScore(dvlaData, motData);

  const result = {
    overview,
    motHistory,
    risks,
    score,
    scoreText: '',
    valuation: null,
    marketDays: null,
    runningCosts: null,
    ulez,
    depreciation,
    insurance,
    dealVerdict,
    _warnings: [],
  };

  // Set score text
  if (result.score >= 70) {
    result.scoreText = 'Good — based on available records';
  } else if (result.score >= 40) {
    result.scoreText = 'Fair — check details carefully';
  } else if (result.score > 0) {
    result.scoreText = 'Review needed — see flagged items';
  } else {
    result.scoreText = 'Insufficient data for scoring';
  }

  return result;
}

function buildOverview(vrm, dvla, mot) {
  const year = dvla?.yearOfManufacture || mot?.manufactureYear || null;
  const monthReg = dvla?.monthOfFirstRegistration || mot?.firstUsedDate || null;

  return {
    reg: vrm,
    make: dvla?.make || mot?.make || 'Unknown',
    model: mot?.model || '—',
    year: year || 'Unknown',
    colour: dvla?.colour || mot?.primaryColour || 'Unknown',
    fuel: dvla?.fuelType || mot?.fuelType || 'Unknown',
    engine: dvla?.engineCapacity ? `${dvla.engineCapacity}cc` : (mot?.engineSize ? `${mot.engineSize}cc` : 'Unknown'),
    transmission: '—', // Not available from free APIs
    body: '—', // Not available from free APIs
    co2: dvla?.co2Emissions || null,
    tax: dvla?.taxStatus ? formatTaxStatus(dvla.taxStatus, dvla?.co2Emissions, dvla?.fuelType) : 'Unknown',
    taxStatus: dvla?.taxStatus || 'Unknown',
    taxDue: dvla?.taxDueDate || null,
    motStatus: mot?.currentMOT ? 'Valid' : (dvla?.motStatus === 'No details held by DVLA' ? 'Unknown' : 'Unknown'),
    motExpiry: mot?.currentMOT?.expiryDate || null,
    v5cIssued: dvla?.dateOfLastV5CIssued || null,
    previousKeepers: '—', // Not available from free APIs
    euroStatus: dvla?.euroStatus || 'Unknown',
  };
}

function buildRiskAssessment(dvla, mot) {
  return {
    finance: { status: 'unknown', text: 'Check not available (requires commercial API)' },
    stolen: { status: 'unknown', text: 'Check not available (requires commercial API)' },
    writeoff: { status: 'unknown', text: 'Check not available (requires commercial API)' },
    scrapped: dvla?.markedForExport === true
      ? { status: 'warn', text: 'Vehicle marked for export' }
      : { status: 'clear', text: 'No export/scrap marker' },
    imported: { status: 'unknown', text: 'Check not available (requires commercial API)' },
    mileage: mot?.motTests && mot.motTests.length >= 2 
      ? checkMileageConsistency(mot.motTests)
      : { status: 'unknown', text: 'Insufficient MOT data to verify' },
  };
}

function buildInitialScore(dvla, mot) {
  let score = 50; // Base neutral score

  if (dvla?.taxStatus === 'Untaxed') score -= 15;
  if (dvla?.markedForExport) score -= 10;

  if (mot) {
    if (mot.hasFailures) score -= 10;
    if (mot.motTests?.length > 0) score += 10; // Has history
    if (mot.motTests?.[0]?.result === 'PASS') score += 10;
  }

  if (dvla) score += 10; // DVLA data available
  if (dvla?.dateOfLastV5CIssued) score += 5; // Recent V5C

  return Math.max(0, Math.min(100, score));
}

function checkMileageConsistency(tests) {
  if (!tests || tests.length < 2) return { status: 'unknown', text: 'Insufficient data' };

  const sorted = [...tests]
    .filter(t => t.mileage)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].mileage < sorted[i - 1].mileage) {
      return { status: 'warn', text: 'Possible mileage discrepancy detected' };
    }
  }

  return { status: 'clear', text: 'Mileage consistent across MOT history' };
}

function formatTaxStatus(status, co2, fuel) {
  if (status !== 'Taxed') return status;
  if (!co2 || !fuel) return 'Taxed (rate unknown)';
  
  // Rough UK VED estimates
  if (fuel === 'ELECTRIC' || fuel === 'ELECTRICITY') return '£0/year (electric)';
  if (co2 === 0) return '£0/year';
  if (co2 <= 100) return '£0/year';
  if (co2 <= 110) return '£20/year';
  if (co2 <= 120) return '£35/year';
  if (co2 <= 130) return '£145/year';
  if (co2 <= 140) return '£165/year';
  if (co2 <= 150) return '£185/year';
  if (co2 <= 165) return '£210/year';
  if (co2 <= 175) return '£245/year';
  if (co2 <= 185) return '£275/year';
  
  // Pre-2017 or high CO2
  if (fuel === 'PETROL' && co2 > 185) return '£325-735/year';
  if (fuel === 'DIESEL' && co2 > 185) return '£325-735/year';
  
  return 'Check manually';
}
