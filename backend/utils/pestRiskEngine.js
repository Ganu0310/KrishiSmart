const mongoose = require('mongoose');

/**
 * Pest & Disease Risk Engine
 * Rule-based engine using real weather data to compute risk levels.
 * Returns risk assessments specific to the crop and detected conditions.
 */

// ─────────────────────────────────────────────
// Rule table: { crop → [ { pest, trigger, level, advice } ] }
// Trigger = function(weather) → boolean
// ─────────────────────────────────────────────
const PEST_RULES = {
  grape: [
    {
      pest: 'Downy Mildew',
      type: 'disease',
      trigger: (w) => w.humidity > 75 && w.temperature >= 15 && w.temperature <= 30,
      level: 'high',
      advice: 'Apply Mancozeb or Metalaxyl fungicide immediately. Ensure good canopy ventilation.',
    },
    {
      pest: 'Powdery Mildew',
      type: 'disease',
      trigger: (w) => w.humidity >= 50 && w.humidity < 75 && w.temperature >= 20 && w.temperature <= 28,
      level: 'medium',
      advice: 'Spray Sulphur-based fungicide (0.2%) as a preventive measure.',
    },
    {
      pest: 'Thrips',
      type: 'pest',
      trigger: (w) => w.temperature > 30 && w.humidity < 50,
      level: 'medium',
      advice: 'Use Spinosad or Imidacloprid at recommended dosage. Monitor flower buds closely.',
    },
    {
      pest: 'Mealy Bug',
      type: 'pest',
      trigger: (w) => w.temperature >= 22 && w.temperature <= 35,
      level: 'low',
      advice: 'Inspect vine bark and bunches. Apply Buprofezin if population is high.',
    },
  ],
  onion: [
    {
      pest: 'Purple Blotch',
      type: 'disease',
      trigger: (w) => w.humidity > 70 && w.temperature >= 25 && w.temperature <= 32,
      level: 'high',
      advice: 'Spray Iprodione or Mancozeb (0.25%). Remove infected leaves promptly.',
    },
    {
      pest: 'Thrips',
      type: 'pest',
      trigger: (w) => w.temperature > 27 && w.windSpeed < 5,
      level: 'high',
      advice: 'Apply Spinosad or Fipronil. Low wind conditions accelerate spread — act fast.',
    },
    {
      pest: 'Basal Rot',
      type: 'disease',
      trigger: (w) => w.humidity > 80 && w.rainfall > 10,
      level: 'medium',
      advice: 'Avoid waterlogging. Drench with Carbendazim (0.1%) near bulb zone.',
    },
    {
      pest: 'Downy Mildew',
      type: 'disease',
      trigger: (w) => w.humidity > 72 && w.temperature >= 10 && w.temperature <= 25,
      level: 'medium',
      advice: 'Apply Cymoxanil + Mancozeb at 7-day intervals.',
    },
  ],
  tomato: [
    {
      pest: 'Late Blight',
      type: 'disease',
      trigger: (w) => w.humidity > 80 && w.temperature >= 10 && w.temperature <= 24,
      level: 'critical',
      advice: '⚠️ CRITICAL: Apply Cymoxanil or Dimethomorph immediately. This spreads rapidly.',
    },
    {
      pest: 'Early Blight',
      type: 'disease',
      trigger: (w) => w.humidity > 60 && w.temperature >= 24 && w.temperature <= 35,
      level: 'high',
      advice: 'Spray Chlorothalonil or Mancozeb. Remove lower infected leaves.',
    },
    {
      pest: 'Whitefly (TYLCV vector)',
      type: 'pest',
      trigger: (w) => w.temperature > 28 && w.humidity < 65,
      level: 'high',
      advice: 'Use yellow sticky traps and apply Imidacloprid or Acetamiprid. Whiteflies carry Tomato Yellow Leaf Curl Virus.',
    },
    {
      pest: 'Fruit Borer',
      type: 'pest',
      trigger: (w) => w.temperature >= 25 && w.temperature <= 35 && w.humidity >= 40,
      level: 'medium',
      advice: 'Spray Emamectin Benzoate (0.5g/L). Install pheromone traps for monitoring.',
    },
  ],
};

/**
 * Main function: assess pest/disease risk for a crop using weather data.
 * @param {string} crop - e.g. 'grape', 'tomato', 'onion'
 * @param {object} weather - { temperature, humidity, rainfall, windSpeed }
 * @returns {object} risk assessment result
 */
const assessPestRisk = (crop, weather) => {
  const rules = PEST_RULES[crop.toLowerCase()] || [];

  const triggered = rules.filter((rule) => rule.trigger(weather));

  // Aggregate overall risk level
  let overallLevel = 'low';
  if (triggered.some((r) => r.level === 'critical')) overallLevel = 'critical';
  else if (triggered.some((r) => r.level === 'high')) overallLevel = 'high';
  else if (triggered.some((r) => r.level === 'medium')) overallLevel = 'medium';

  const levelScore = { low: 1, medium: 2, high: 3, critical: 4 };

  const risks = triggered
    .sort((a, b) => levelScore[b.level] - levelScore[a.level])
    .map(({ pest, type, level, advice }) => ({ pest, type, level, advice }));

  const riskSummary = risks.length === 0
    ? '✅ No significant pest or disease risk detected under current weather conditions.'
    : `⚠️ ${risks.length} risk(s) detected. Immediate attention required for: ${risks.filter(r => r.level === 'critical' || r.level === 'high').map(r => r.pest).join(', ') || 'see list below'}.`;

  return {
    crop,
    overallRiskLevel: overallLevel,
    riskSummary,
    risks,
    weatherSnapshot: {
      temperature: weather.temperature,
      humidity: weather.humidity,
      rainfall: weather.rainfall,
      windSpeed: weather.windSpeed,
    },
    assessedAt: new Date(),
  };
};

module.exports = { assessPestRisk };
