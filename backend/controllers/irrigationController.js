// Simple rule-based irrigation calculator for Nashik context.
// This aligns with the frontend IrrigationResult type and can later
// be replaced/augmented with AI/ML.

// POST /api/irrigation/calculate
const calculateIrrigation = (req, res) => {
  try {
    const { crop, soilMoisture, rainfallForecast } = req.body;

    if (!crop || soilMoisture === undefined || rainfallForecast === undefined) {
      return res
        .status(400)
        .json({ success: false, message: 'crop, soilMoisture, and rainfallForecast are required' });
    }

    const normalizedCrop = String(crop).toLowerCase();
    const allowedCrops = ['grape', 'onion', 'tomato'];
    if (!allowedCrops.includes(normalizedCrop)) {
      return res.status(400).json({ success: false, message: 'Unsupported crop. Use grape, onion, or tomato.' });
    }

    const moisture = Number(soilMoisture); // 0–100 (%)
    const rainfallProb = Number(rainfallForecast); // 0–100 (%)

    if (Number.isNaN(moisture) || Number.isNaN(rainfallProb)) {
      return res.status(400).json({ success: false, message: 'soilMoisture and rainfallForecast must be numbers' });
    }

    // Base water need per acre (liters) for a typical irrigation cycle in Nashik
    let baseWaterPerAcre = 25000; // default
    if (normalizedCrop === 'grape') baseWaterPerAcre = 20000;
    if (normalizedCrop === 'onion') baseWaterPerAcre = 18000;
    if (normalizedCrop === 'tomato') baseWaterPerAcre = 22000;

    // Adjust based on soil moisture (higher moisture → less water)
    // If soil moisture >= 80%, almost no irrigation.
    // If soil moisture <= 30%, full irrigation.
    const moistureFactor = Math.min(1, Math.max(0, (80 - moisture) / 50)); // 0..1

    // Adjust based on rainfall forecast (higher rain chance → less water)
    const rainFactor = Math.min(1, Math.max(0, (70 - rainfallProb) / 70)); // 0..1

    // Combine factors, giving more weight to moisture
    const combinedFactor = 0.7 * moistureFactor + 0.3 * rainFactor;

    const waterNeeded = Math.round(baseWaterPerAcre * combinedFactor); // liters/acre

    // Simple schedule suggestion
    let schedule = 'No irrigation needed today.';
    if (waterNeeded > 0 && waterNeeded <= baseWaterPerAcre * 0.4) {
      schedule = 'Light irrigation in the early morning for 1–2 hours.';
    } else if (waterNeeded > baseWaterPerAcre * 0.4 && waterNeeded <= baseWaterPerAcre * 0.8) {
      schedule = 'Normal irrigation split between morning and evening.';
    } else if (waterNeeded > baseWaterPerAcre * 0.8) {
      schedule =
        'Heavy irrigation required. Prefer drip/furrow irrigation and monitor soil moisture closely.';
    }

    // Heuristic "efficiency" score to help farmers understand utilization
    const efficiency = Math.round(100 - rainfallProb * 0.3 - (100 - moisture) * 0.2);

    // For future: can incorporate area, soil type, ET, and AI forecasts.
    return res.json({
      success: true,
      crop: normalizedCrop,
      soilMoisture: moisture,
      rainfallForecast: rainfallProb,
      waterNeeded, // liters per acre
      schedule,
      nextIrrigation: 'Re-evaluate in 2-3 days or after next rain.',
      efficiency: Math.max(0, Math.min(100, efficiency)),
    });
  } catch (error) {
    console.error('Irrigation calculation error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to calculate irrigation' });
  }
};

module.exports = { calculateIrrigation };

