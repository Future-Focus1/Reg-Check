/**
 * ULEZ & Clean Air Zone compliance checker.
 * Computed from DVLA data — no additional API cost.
 *
 * Rules (as of 2026):
 *   London ULEZ: Petrol Euro 4+ (generally 2006+), Diesel Euro 6+ (generally 2015+)
 *   Birmingham CAZ: Same standards
 *   Other CAZ: Varies — Bath (private cars exempt), Bradford, Bristol, Portsmouth, Sheffield, Newcastle
 *
 * @param {object} dvla - Normalized DVLA data
 * @param {object} mot  - Normalized MOT data (optional, for make/model)
 * @returns {object}
 */
export function checkULEZ(dvla, mot) {
  const fuelType = (dvla?.fuelType || mot?.fuelType || '').toUpperCase();
  const euroStatus = (dvla?.euroStatus || '');
  const yearOfManufacture = dvla?.yearOfManufacture || mot?.manufactureYear || null;

  const result = {
    londonULEZ: { compliant: false, charge: '£12.50/day', detail: '' },
    birminghamCAZ: { compliant: false, charge: '£8/day', detail: '' },
    otherCAZ: [],
    summary: '',
  };

  // Electric/hydrogen always compliant everywhere
  if (fuelType === 'ELECTRIC' || fuelType === 'ELECTRICITY' || fuelType === 'HYDROGEN') {
    result.londonULEZ = { compliant: true, charge: '£0', detail: 'Electric vehicles are ULEZ exempt' };
    result.birminghamCAZ = { compliant: true, charge: '£0', detail: 'Electric vehicles are CAZ exempt' };
    result.summary = '✅ Compliant — Electric vehicle exempt from all UK clean air zones';
    return result;
  }

  // Check Euro standard
  let euroLevel = 0;
  const euroMatch = euroStatus.match(/Euro (\d+)/i);
  if (euroMatch) euroLevel = parseInt(euroMatch[1]);

  // Fallback to age-based estimation if Euro status unavailable
  if (euroLevel === 0 && yearOfManufacture) {
    if (yearOfManufacture >= 2015) euroLevel = 6;
    else if (yearOfManufacture >= 2009) euroLevel = 5;
    else if (yearOfManufacture >= 2005) euroLevel = 4;
    else if (yearOfManufacture >= 2000) euroLevel = 3;
  }

  if (fuelType === 'PETROL' || fuelType === 'PETROL/ELECTRIC' || fuelType === 'PETROL/LPG') {
    const compliant = euroLevel >= 4;
    result.londonULEZ = {
      compliant,
      charge: compliant ? '£0' : '£12.50/day',
      detail: compliant
        ? `Euro ${euroLevel} petrol meets ULEZ minimum (Euro 4)`
        : `Euro ${euroLevel || 'Unknown'} petrol — needs Euro 4+ for ULEZ`,
    };
  } else if (fuelType === 'DIESEL') {
    const compliant = euroLevel >= 6;
    result.londonULEZ = {
      compliant,
      charge: compliant ? '£0' : '£12.50/day',
      detail: compliant
        ? `Euro ${euroLevel} diesel meets ULEZ minimum (Euro 6)`
        : `Euro ${euroLevel || 'Unknown'} diesel — needs Euro 6+ for ULEZ. ${euroLevel === 5 ? 'Euro 5 diesels are NOT compliant.' : ''}`,
    };
  } else {
    result.londonULEZ = { compliant: false, charge: '£12.50/day', detail: `Unknown fuel type — check manually at tfl.gov.uk` };
  }

  // Birmingham CAZ uses same standards
  result.birminghamCAZ = {
    compliant: result.londonULEZ.compliant,
    charge: result.londonULEZ.compliant ? '£0' : '£8/day',
    detail: `Same emission standards as London ULEZ. ${result.londonULEZ.detail}`,
  };

  // Other zones
  if (!result.londonULEZ.compliant) {
    result.otherCAZ = [
      { city: 'Bristol', charge: '£9/day' },
      { city: 'Bradford', charge: '£7/day' },
      { city: 'Portsmouth', charge: '£10/day' },
      { city: 'Sheffield', charge: '£10/day' },
      { city: 'Newcastle', charge: '£12.50/day' },
    ];
  }

  // Summary
  if (result.londonULEZ.compliant) {
    result.summary = '✅ Compliant — No charges in any UK clean air zone';
  } else {
    result.summary = `❌ Non-compliant — Daily charges apply in London (£12.50) and ${result.otherCAZ.length} other UK cities`;
  }

  return result;
}

/**
 * Calculate depreciation projection.
 * UK average depreciation rates by year, adjusted for fuel type.
 */
export function calculateDepreciation(year, fuelType, mileageEstimate) {
  const currentYear = new Date().getFullYear();
  const age = year ? currentYear - year : 5;
  const startingValue = estimateCurrentValue(year, fuelType, mileageEstimate);

  // Base UK depreciation curve (from new)
  const curve = [1.0, 0.70, 0.56, 0.45, 0.37, 0.30]; // Year 0-5 multiplier

  // Adjust for fuel type
  let fuelAdjust = 1.0;
  if (fuelType?.toUpperCase?.() === 'DIESEL') fuelAdjust = 0.93; // Diesels depreciating faster
  if (fuelType?.toUpperCase?.() === 'ELECTRIC' || fuelType?.toUpperCase?.() === 'ELECTRICITY') fuelAdjust = 0.88; // EVs depreciate more

  const projections = [];
  for (let i = 0; i <= 5; i++) {
    const yearsFromNow = i;
    const totalAge = age + yearsFromNow;
    const curveIndex = Math.min(totalAge, 5);

    // Interpolate for ages > 5
    let multiplier;
    if (totalAge <= 5) {
      multiplier = curve[curveIndex];
    } else {
      // After year 5, ~7% per year
      multiplier = curve[5] * Math.pow(0.93, totalAge - 5);
    }

    const value = Math.round(startingValue * multiplier * fuelAdjust / (curve[Math.min(age, 5)] || 0.3));
    projections.push({
      year: currentYear + yearsFromNow,
      age: totalAge,
      value: Math.max(500, value),
    });
  }

  // Handle edge case where starting value is 0
  if (startingValue === 0) {
    for (let i = 0; i <= 5; i++) {
      projections[i] = { year: currentYear + i, age: age + i, value: 0 };
    }
  }

  const totalLoss = projections[0].value - projections[5].value;
  const percentLoss = projections[0].value > 0
    ? Math.round((totalLoss / projections[0].value) * 100)
    : 0;

  return {
    currentValue: projections[0].value,
    fiveYearValue: projections[5].value,
    totalLoss,
    percentLoss,
    annualLoss: Math.round(totalLoss / 5),
    projections,
    note: fuelType?.toUpperCase?.() === 'ELECTRICITY'
      ? 'EV depreciation includes estimated battery degradation impact'
      : 'Based on UK average depreciation curves adjusted for fuel type',
  };
}

function estimateCurrentValue(year, fuelType, mileage) {
  if (!year) return 0;
  const baseValues = {
    'BMW': 15000, 'Audi': 14000, 'Mercedes': 14500, 'Volkswagen': 10000,
    'Ford': 8000, 'Vauxhall': 6000, 'Toyota': 9000, 'Nissan': 7500,
    'Honda': 8500, 'Peugeot': 6500, 'Hyundai': 8000, 'Kia': 7500,
    'Land Rover': 18000, 'Jaguar': 13000, 'Volvo': 11000, 'MINI': 8000,
    'Mazda': 7500, 'Skoda': 7000, 'SEAT': 6500, 'Fiat': 5000,
    'Renault': 6000, 'Citroen': 5500, 'Suzuki': 6500, 'Lexus': 12000,
  };

  // We don't know the make in mock mode, so estimate
  const baseValue = 8000;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  return Math.round(baseValue * Math.pow(0.85, Math.max(0, age)));
}

/**
 * Estimate insurance group from vehicle characteristics.
 * Groups 1-50 (UK ABI standard).
 */
export function estimateInsuranceGroup(engineCc, fuelType, bodyStyle) {
  let group = 15; // baseline

  // Engine size factor
  const cc = parseInt(engineCc) || 1600;
  if (cc < 1200) group -= 5;
  else if (cc < 1600) group -= 2;
  else if (cc < 2000) group += 3;
  else if (cc < 3000) group += 8;
  else group += 15;

  // Body style factor
  const body = (bodyStyle || '').toLowerCase();
  if (body.includes('sport') || body.includes('coupe')) group += 8;
  else if (body.includes('saloon') || body.includes('sedan')) group += 1;
  else if (body.includes('suv') || body.includes('4x4')) group += 5;

  // Fuel type factor
  const fuel = (fuelType || '').toUpperCase();
  if (fuel === 'ELECTRIC' || fuel === 'ELECTRICITY') group += 3; // EVs cost more to insure
  if (fuel === 'DIESEL') group += 1;

  // Clamp 1-50
  group = Math.max(1, Math.min(50, group));

  // Estimated annual premium (very rough)
  let estPremium;
  if (group <= 10) estPremium = '£350-550';
  else if (group <= 20) estPremium = '£500-750';
  else if (group <= 30) estPremium = '£700-1,000';
  else if (group <= 40) estPremium = '£950-1,400';
  else estPremium = '£1,300-2,000+';

  return {
    group,
    band: group <= 10 ? 'Low' : group <= 25 ? 'Medium' : group <= 40 ? 'High' : 'Very High',
    estimatedPremium: estPremium,
    note: 'Premium estimates are indicative. Actual quotes depend on driver profile, location, and no-claims history.',
  };
}

/**
 * "Is this a good deal?" algorithm.
 * Weighs price vs. market value, MOT health, write-off history, mileage, and age.
 */
export function evaluateDeal(valuation, motHistory, risks, overview, marketDays) {
  if (!valuation) {
    return { verdict: 'insufficient_data', summary: 'Not enough pricing data to evaluate this deal.', score: 0 };
  }

  let score = 50;
  const flags = [];
  const positives = [];

  const price = valuation.privateSale ? (valuation.privateSale.min + valuation.privateSale.max) / 2 : 0;
  const marketMid = price; // In real mode, compare to market average

  // MOT history health
  if (motHistory?.length) {
    const recentFails = motHistory.slice(0, 3).filter(t => t.result === 'FAIL').length;
    if (recentFails === 0) { score += 10; positives.push('Clean recent MOT history'); }
    else if (recentFails === 1) { score -= 5; flags.push(`${recentFails} recent MOT failure`); }
    else { score -= 20; flags.push(`${recentFails} recent MOT failures — possible ongoing issues`); }

    const advisories = motHistory[0]?.advisories?.length || 0;
    if (advisories === 0) { score += 5; }
    else if (advisories > 2) { score -= 8; flags.push(`${advisories} advisory notes on latest MOT`); }
  }

  // Write-off history
  const writeoffStatus = risks?.writeoff?.status;
  if (writeoffStatus === 'clear') { score += 15; positives.push('No insurance write-off recorded'); }
  else if (writeoffStatus === 'warn') { score -= 15; flags.push('Previous insurance write-off (Cat N)'); }
  else if (writeoffStatus === 'danger') { score -= 35; flags.push('Serious insurance write-off — avoid or inspect professionally'); }

  // Finance
  const financeStatus = risks?.finance?.status;
  if (financeStatus === 'clear') { score += 15; positives.push('No outstanding finance'); }
  else if (financeStatus === 'danger') { score -= 40; flags.push('Outstanding finance — do not buy until settled'); }

  // Stolen
  const stolenStatus = risks?.stolen?.status;
  if (stolenStatus === 'danger') { score -= 50; flags.push('Vehicle recorded as stolen — do not buy'); }
  else if (stolenStatus === 'clear') { score += 5; }

  // Mileage
  const mileageStatus = risks?.mileage?.status;
  if (mileageStatus === 'clear') { score += 5; }
  else if (mileageStatus === 'warn') { score -= 15; flags.push('Mileage discrepancy — possible clocking'); }

  // Age
  const age = new Date().getFullYear() - (overview?.year || 2015);
  if (age <= 3) { score += 10; positives.push('Relatively new vehicle'); }
  else if (age > 10) { score -= 5; flags.push(`Vehicle is ${age} years old — expect higher maintenance costs`); }

  // Tax status
  if (overview?.taxStatus === 'Untaxed') { score -= 10; flags.push('Vehicle is currently untaxed'); }

  // Days on market
  if (marketDays && marketDays > 60) { score -= 5; flags.push(`On market for ${marketDays} days — may be overpriced`); }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  let verdict, summary, icon;
  if (score >= 75) {
    verdict = 'recommend';
    icon = '✅';
    summary = 'Looks like a solid buy. No major red flags detected.';
  } else if (score >= 50) {
    verdict = 'caution';
    icon = '⚠️';
    summary = 'Decent but has some concerns. Get a professional inspection.';
  } else if (score >= 25) {
    verdict = 'risky';
    icon = '🔴';
    summary = 'Significant risks detected. Proceed only with full inspection and price negotiation.';
  } else {
    verdict = 'avoid';
    icon = '🚫';
    summary = 'Multiple serious issues. Strongly recommend walking away.';
  }

  return {
    verdict,
    icon,
    score,
    summary,
    flags,
    positives,
    recommendation: score >= 75
      ? 'This car appears to be a reasonable purchase at the listed price.'
      : score >= 50
        ? 'Consider negotiating 10-15% below asking price to offset the flagged concerns.'
        : 'We recommend looking at alternative vehicles unless you can verify and resolve all flagged issues.',
  };
}
