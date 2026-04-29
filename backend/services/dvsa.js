import fetch from 'node-fetch';

const MOT_URL = 'https://history.mot.api.gov.uk/v1/trade/vehicles';

export async function lookupMOT(vrm) {
  const apiKey = process.env.DVSA_API_KEY;

  if (!apiKey) {
    throw new Error('DVSA MOT API key not configured. Set DVSA_API_KEY in .env');
  }

  // First get the vehicle by registration to get the MOT tests
  const response = await fetch(`${MOT_URL}/registration/${encodeURIComponent(vrm)}`, {
    headers: {
      'x-api-key': apiKey,
      'Accept': 'application/json',
    },
  });

  if (response.status === 404) {
    return null; // No MOT history found — not necessarily an error
  }

  if (response.status === 429) {
    throw new Error('DVSA rate limit exceeded. Please retry shortly.');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DVSA API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return normalizeMOTData(data);
}

function normalizeMOTData(data) {
  const vehicle = data;

  const motTests = (vehicle.motTests || []).map(test => ({
    date: test.completedDate || test.testDate,
    result: test.testResult === 'PASSED' ? 'PASS' : 
            test.testResult === 'FAILED' ? 'FAIL' : test.testResult,
    mileage: test.odometerValue ? parseInt(test.odometerValue) : null,
    mileageUnit: test.odometerUnit || 'mi',
    expiryDate: test.expiryDate || null,
    advisories: (test.rfrAndComments || [])
      .filter(r => r.type === 'ADVISORY')
      .map(r => `${r.text}${r.dangerous ? ' [DANGEROUS]' : ''}`),
    defects: (test.rfrAndComments || [])
      .filter(r => r.type === 'FAIL')
      .map(r => `${r.text}${r.dangerous ? ' [DANGEROUS]' : ''}`),
  })).sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    registration: vehicle.registration || null,
    make: vehicle.make || null,
    model: vehicle.model || null,
    firstUsedDate: vehicle.firstUsedDate || null,
    fuelType: vehicle.fuelType || null,
    primaryColour: vehicle.primaryColour || null,
    manufactureYear: vehicle.manufactureYear || null,
    engineSize: vehicle.engineSizeCc || null,
    motTests,
    motTestCount: motTests.length,
    currentMOT: motTests.length > 0 ? motTests[0] : null,
    hasFailures: motTests.some(t => t.result === 'FAIL'),
  };
}
