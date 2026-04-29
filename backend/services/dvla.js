import fetch from 'node-fetch';

const DVLA_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';
const DVLA_TEST_URL = 'https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

export async function lookupDVLA(vrm) {
  const apiKey = process.env.DVLA_API_KEY;

  if (!apiKey) {
    throw new Error('DVLA API key not configured. Set DVLA_API_KEY in .env');
  }

  const response = await fetch(DVLA_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ registrationNumber: vrm }),
  });

  if (response.status === 404) {
    throw new Error(`Vehicle not found: ${vrm}`);
  }

  if (response.status === 429) {
    throw new Error('DVLA rate limit exceeded. Please retry shortly.');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DVLA API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return normalizeDVLAData(data);
}

function normalizeDVLAData(data) {
  return {
    make: data.make || null,
    model: null, // DVLA doesn't return model separately
    colour: data.colour || null,
    fuelType: data.fuelType || null,
    engineCapacity: data.engineCapacity || null,
    co2Emissions: data.co2Emissions || null,
    yearOfManufacture: data.yearOfManufacture || null,
    monthOfFirstRegistration: data.monthOfFirstRegistration || null,
    taxStatus: data.taxStatus || null,
    taxDueDate: data.taxDueDate || null,
    motStatus: data.motStatus || null,
    wheelplan: data.wheelplan || null,
    typeApproval: data.typeApproval || null,
    euroStatus: data.euroStatus || null,
    realDrivingEmissions: data.realDrivingEmissions || null,
    dateOfLastV5CIssued: data.dateOfLastV5CIssued || null,
    markedForExport: data.markedForExport || null,
    revenueWeight: data.revenueWeight || null,
  };
}
