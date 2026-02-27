// Rule engine for crop advisory.
// Designed to be easily replaceable/augmentable with AI/ML in the future.

const getFertilizerAdvice = (crop, stage) => {
  const s = (stage || '').toLowerCase();

  if (crop === 'grape') {
    if (s === 'vegetative') return 'Apply Nitrogen (Urea) and Phosphorus to support vigorous vine growth. Ensure micronutrients (Zn, B) are balanced.';
    if (s === 'flowering') return 'Reduce Nitrogen. Apply Boron and Zinc sprays to improve fruit set. Avoid heavy irrigation.';
    if (s === 'fruiting') return 'Apply Potassium (SOP) for berry development and sugar accumulation. Calcium sprays help prevent berry cracking.';
    if (s === 'harvest') return 'Stop all chemical sprays. Focus on residue-free produce. minimal irrigation.';
    return 'Maintain soil health with organic manure. Test soil for specific nutrient deficiencies.';
  }

  if (crop === 'onion') {
    if (s === 'vegetative') return 'Apply Nitrogen in split doses for leaf growth. Ensure Sulphur levels are adequate for pungency.';
    if (s === 'bulb formation') return 'Switch to Potassium-rich fertilizers. Stop Nitrogen to prevent bolting and thick necks.';
    if (s === 'harvest') return 'Stop irrigation and fertilizers 10-15 days before harvest for curing.';
    return 'Use balanced NPK (10:26:26) during sowing.';
  }

  if (crop === 'tomato') {
    if (s === 'vegetative') return 'Balanced NPK (19:19:19). Calcium Nitrate for strong stem development.';
    if (s === 'flowering') return 'Boron and Calcium sprays to prevent blossom end rot. Increase Phosphorus.';
    if (s === 'fruiting') return 'High Potassium (0:0:50) for fruit sizing and color. Magnesium Sulfate for photosynthesis.';
    return 'Apply organic compost during land preparation.';
  }

  return 'Consult local agricultural extension for specific fertilizer schedule.';
};

const baseIrrigationAdvice = (crop, weather, stage) => {
  const { rainfallProbability = 0, temperature = 0, heavyRainfallPredicted = false } = weather || {};
  const s = (stage || '').toLowerCase();

  const messages = [];

  if (heavyRainfallPredicted || rainfallProbability >= 70) {
    messages.push('Avoid irrigation today due to high rainfall probability.');
  } else if (rainfallProbability <= 20 && temperature >= 30) {
    if (s === 'flowering' || s === 'fruiting') {
      messages.push('Critical stage: Ensure consistent soil moisture to prevent flower drop/fruit stress.');
    } else {
      messages.push('Consider light irrigation in morning or evening to avoid heat stress.');
    }
  } else {
    messages.push('Maintain normal irrigation schedule as per soil moisture.');
  }

  if (crop === 'grape') {
    messages.push('Ensure proper drainage to prevent root rot in vineyards.');
  } else if (crop === 'onion') {
    if (s === 'bulb formation') messages.push('Consistent moisture is key for bulb swelling.');
    else messages.push('Avoid water stagnation; onions are sensitive to excess moisture.');
  } else if (crop === 'tomato') {
    messages.push('Use drip irrigation if available to reduce disease pressure.');
  }

  return messages.join(' ');
};

const baseHarvestAdvice = (crop, weather) => {
  const { rainfallProbability = 0, heavyRainfallPredicted = false } = weather || {};

  const messages = [];

  if (heavyRainfallPredicted || rainfallProbability >= 70) {
    messages.push('Postpone harvesting if possible to avoid crop damage and quality loss.');
  } else if (rainfallProbability <= 30) {
    messages.push('Suitable conditions for harvesting; plan labor accordingly.');
  } else {
    messages.push('Monitor local clouds and radar; be prepared to cover harvested produce.');
  }

  if (crop === 'grape') {
    messages.push('Harvest during dry hours to maintain berry quality.');
  } else if (crop === 'onion') {
    messages.push('Cure onions properly after harvest to improve shelf life.');
  } else if (crop === 'tomato') {
    messages.push('Avoid harvesting fully wet plants to reduce disease spread.');
  }

  return messages.join(' ');
};

const riskAlerts = (crop, weather, stage) => {
  const { temperature = 0, rainfallProbability = 0, heavyRainfallPredicted = false } = weather || {};
  const s = (stage || '').toLowerCase();

  const risks = [];

  if (heavyRainfallPredicted) {
    risks.push('High risk of waterlogging and fungal diseases due to heavy rainfall.');
  }

  if (temperature >= 35) {
    if (s === 'flowering') risks.push('Heat stress may cause flower drop. Protect crop.');
    else risks.push('Heat stress possible; ensure adequate soil moisture and mulching.');
  }

  if (crop === 'grape' && rainfallProbability >= 60) {
    risks.push('Risk of downy mildew and powdery mildew in grapes. Consider preventive spray as per local advisories.');
  }

  if (crop === 'tomato' && rainfallProbability >= 60) {
    risks.push('Risk of late blight and leaf spot in tomato. Monitor closely and follow IPM practices.');
  }

  if (crop === 'onion' && rainfallProbability >= 60) {
    risks.push('Risk of bulb rot and foliar diseases in onion. Ensure drainage and avoid overhead irrigation.');
  }

  return risks;
};

const generateAdvisory = (crop, weather, stage = 'vegetative') => {
  if (!crop || typeof crop !== 'string') {
    throw new Error('Invalid crop provided');
  }
  if (weather && typeof weather !== 'object') {
    throw new Error('Invalid weather data provided');
  }

  const normalizedCrop = crop.toLowerCase();

  const irrigationAdvice = baseIrrigationAdvice(normalizedCrop, weather, stage);
  const harvestAdvice = baseHarvestAdvice(normalizedCrop, weather);
  const fertilizerAdvice = getFertilizerAdvice(normalizedCrop, stage);
  const riskAlertsList = riskAlerts(normalizedCrop, weather, stage);

  return {
    crop: normalizedCrop,
    stage,
    irrigationAdvice,
    harvestAdvice,
    fertilizerAdvice,
    riskAlerts: riskAlertsList,
  };
};

module.exports = {
  generateAdvisory,
};
