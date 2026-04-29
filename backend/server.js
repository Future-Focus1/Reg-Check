import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { lookupDVLA } from './services/dvla.js';
import { lookupMOT } from './services/dvsa.js';
import { aggregateVehicleData } from './services/aggregator.js';
import { generateMockData } from './services/mock.js';

config();

const app = express();
const PORT = process.env.PORT || 3001;
const HAS_DVLA = !!process.env.DVLA_API_KEY;
const HAS_DVSA = !!process.env.DVSA_API_KEY;

app.use(cors());
app.use(express.json());
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, '..', 'concept')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apis: {
      dvla: HAS_DVLA ? 'live' : 'unconfigured',
      dvsa: HAS_DVSA ? 'live' : 'unconfigured',
      mode: (HAS_DVLA || HAS_DVSA) ? 'hybrid' : 'mock',
    },
  });
});

// Vehicle lookup endpoint
app.post('/api/lookup', async (req, res) => {
  const { vrm } = req.body;
  
  if (!vrm || typeof vrm !== 'string') {
    return res.status(400).json({ error: 'VRM (registration number) is required' });
  }

  const cleanVrm = vrm.replace(/\s/g, '').toUpperCase();

  // If no real APIs configured, use mock data generator
  if (!HAS_DVLA && !HAS_DVSA) {
    console.log(`[MOCK] Looking up ${cleanVrm}`);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
    const data = generateMockData(cleanVrm);
    return res.json(data);
  }

  try {
    const promises = [];
    if (HAS_DVLA) promises.push(lookupDVLA(cleanVrm));
    if (HAS_DVSA) promises.push(lookupMOT(cleanVrm));

    const results = await Promise.allSettled(promises);
    let dvlaData = null, motData = null, idx = 0;
    if (HAS_DVLA) dvlaData = results[idx++];
    if (HAS_DVSA) motData = results[idx++];

    const result = aggregateVehicleData(
      cleanVrm,
      dvlaData?.status === 'fulfilled' ? dvlaData.value : null,
      motData?.status === 'fulfilled' ? motData.value : null
    );

    result._meta = {
      dvla: dvlaData ? (dvlaData.status === 'fulfilled' ? 'ok' : `failed: ${dvlaData.reason?.message}`) : 'disabled',
      dvsa: motData ? (motData.status === 'fulfilled' ? 'ok' : `failed: ${motData.reason?.message}`) : 'disabled',
    };

    result.risks.finance.text = 'Check requires commercial API';
    result.risks.stolen.text = 'Check requires commercial API';
    result.risks.writeoff.text = 'Check requires commercial API';

    res.json(result);
  } catch (err) {
    console.error('Lookup error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚗 RegCheck backend running on http://localhost:${PORT}`);
  console.log(`   DVLA API: ${HAS_DVLA ? 'configured' : 'NOT CONFIGURED — using mock data'}`);
  console.log(`   DVSA API: ${HAS_DVSA ? 'configured' : 'NOT CONFIGURED — using mock data'}`);
  if (!HAS_DVLA && !HAS_DVSA) {
    console.log(`\n   To enable real data:`);
    console.log(`   1. Register for DVSA MOT API: https://documentation.history.mot.api.gov.uk/`);
    console.log(`   2. Register for DVLA VES API: https://register-for-ves.driver-vehicle-licensing.api.gov.uk`);
    console.log(`   3. Copy .env.example to .env and add your keys`);
    console.log(`\n   Current mode: MOCK — any VRM returns generated data\n`);
  }
});
