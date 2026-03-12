/**
 * Smart Sowing Calendar
 * Recommends optimal sowing windows using 7-day forecast data + agronomic rules.
 * Uses Open-Meteo real-time forecast (free API).
 */

const { fetchForecast } = require('../adapters/forecastAdapter');
const { query, validationResult } = require('express-validator');

// Agronomic sowing conditions per crop (based on ICAR guidelines)
const SOWING_REQUIREMENTS = {
  grape: {
    displayName: 'Grape',
    optimalTempMin: 15,
    optimalTempMax: 30,
    maxRainfall: 10,      // mm - heavy rain during planting harmful
    maxRainProbability: 40, // %
    minUvIndex: 3,
    seasonalHint: 'Best planted Oct–Dec (Rabi) or Feb–Mar (Spring) in Maharashtra. Avoid monsoon planting.',
    growthDuration: '3-4 years for first harvest; annual thereafter.',
  },
  onion: {
    displayName: 'Onion',
    optimalTempMin: 13,
    optimalTempMax: 27,
    maxRainfall: 8,
    maxRainProbability: 35,
    minUvIndex: 4,
    seasonalHint: 'Kharif (June–July), Late Kharif (Aug–Sep), or Rabi (Oct–Nov) sowing seasons.',
    growthDuration: '90-120 days to harvest.',
  },
  tomato: {
    displayName: 'Tomato',
    optimalTempMin: 20,
    optimalTempMax: 30,
    maxRainfall: 12,
    maxRainProbability: 45,
    minUvIndex: 5,
    seasonalHint: 'Best for June–July (Kharif) or September–October (Rabi) in Nashik region.',
    growthDuration: '60-80 days to first harvest.',
  },
  wheat: {
    displayName: 'Wheat',
    optimalTempMin: 10,
    optimalTempMax: 25,
    maxRainfall: 5,
    maxRainProbability: 30,
    minUvIndex: 3,
    seasonalHint: 'Rabi crop — November is the ideal sowing month across India.',
    growthDuration: '110-140 days to harvest.',
  },
  rice: {
    displayName: 'Rice',
    optimalTempMin: 22,
    optimalTempMax: 35,
    maxRainfall: 30,  // Paddy tolerates more rain
    maxRainProbability: 70,
    minUvIndex: 5,
    seasonalHint: 'Kharif crop — Sow June–July with onset of monsoon.',
    growthDuration: '90-150 days depending on variety.',
  },
};

/**
 * Score each forecast day for sowing suitability (0–100).
 */
const scoreDayForSowing = (day, requirements) => {
  let score = 100;
  const avgTemp = (day.tempMax + day.tempMin) / 2;

  // Temperature penalty
  if (avgTemp < requirements.optimalTempMin || avgTemp > requirements.optimalTempMax) {
    const deviation = Math.min(
      Math.abs(avgTemp - requirements.optimalTempMin),
      Math.abs(avgTemp - requirements.optimalTempMax)
    );
    score -= Math.min(50, deviation * 5);
  }

  // Rainfall penalty
  if (day.rainfall > requirements.maxRainfall) {
    score -= Math.min(40, (day.rainfall - requirements.maxRainfall) * 3);
  }

  // Rain probability penalty
  if (day.rainProbability > requirements.maxRainProbability) {
    score -= Math.min(30, (day.rainProbability - requirements.maxRainProbability) * 0.5);
  }

  // UV too low (poor solar activity)
  if (day.uvIndex < requirements.minUvIndex) {
    score -= 10;
  }

  return Math.max(0, Math.round(score));
};

/**
 * GET /api/advisory/sowing-calendar?crop=onion&location=Nashik
 */
const getSowingCalendar = [
  query('crop')
    .trim()
    .toLowerCase()
    .isIn(Object.keys(SOWING_REQUIREMENTS))
    .withMessage(`Supported crops: ${Object.keys(SOWING_REQUIREMENTS).join(', ')}`),
  query('location')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Location must be 2-50 characters'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const crop = req.query.crop.toLowerCase();
    const location = req.query.location || process.env.DEFAULT_LOCATION || 'Nashik';
    const requirements = SOWING_REQUIREMENTS[crop];

    try {
      const forecast = await fetchForecast(location);

      if (!forecast) {
        return res.status(503).json({
          success: false,
          message: 'Forecast data unavailable. Cannot compute sowing calendar.',
        });
      }

      const scoredDays = forecast.days.map((day) => ({
        ...day,
        avgTemp: parseFloat(((day.tempMax + day.tempMin) / 2).toFixed(1)),
        sowingScore: scoreDayForSowing(day, requirements),
      }));

      // Find the best sowing window: consecutive days with score >= 60
      let bestWindow = null;
      let bestWindowScore = -1;
      let windowStart = null;
      let windowScores = [];

      for (let i = 0; i < scoredDays.length; i++) {
        const day = scoredDays[i];
        if (day.sowingScore >= 60) {
          if (!windowStart) {
            windowStart = i;
            windowScores = [];
          }
          windowScores.push(day.sowingScore);
        } else {
          if (windowStart !== null && windowScores.length > 0) {
            const avgScore = windowScores.reduce((a, b) => a + b, 0) / windowScores.length;
            if (avgScore > bestWindowScore) {
              bestWindowScore = avgScore;
              bestWindow = {
                startDate: scoredDays[windowStart].date,
                endDate: scoredDays[windowStart + windowScores.length - 1].date,
                durationDays: windowScores.length,
                avgScore: Math.round(avgScore),
              };
            }
          }
          windowStart = null;
          windowScores = [];
        }
      }
      // Check last window
      if (windowStart !== null && windowScores.length > 0) {
        const avgScore = windowScores.reduce((a, b) => a + b, 0) / windowScores.length;
        if (avgScore > bestWindowScore) {
          bestWindow = {
            startDate: scoredDays[windowStart].date,
            endDate: scoredDays[windowStart + windowScores.length - 1].date,
            durationDays: windowScores.length,
            avgScore: Math.round(avgScore),
          };
        }
      }

      const topDay = scoredDays.reduce((best, d) => (d.sowingScore > best.sowingScore ? d : best), scoredDays[0]);

      let recommendation = '';
      if (bestWindow) {
        recommendation = `✅ Best sowing window: ${bestWindow.startDate} to ${bestWindow.endDate} (${bestWindow.durationDays} day(s), score: ${bestWindow.avgScore}/100).`;
      } else if (topDay.sowingScore >= 40) {
        recommendation = `⚠️ No ideal window found this week. Best available day: ${topDay.date} (score: ${topDay.sowingScore}/100). Conditions are sub-optimal; sow only if urgency demands.`;
      } else {
        recommendation = `❌ No suitable sowing conditions in the next 7 days. Poor weather (excess rain, extreme temperatures). Wait for conditions to improve.`;
      }

      return res.json({
        success: true,
        crop: requirements.displayName,
        location,
        recommendation,
        bestWindow,
        bestSingleDay: topDay,
        forecastDays: scoredDays,
        cropInfo: {
          seasonalHint: requirements.seasonalHint,
          growthDuration: requirements.growthDuration,
          optimalTempRange: `${requirements.optimalTempMin}°C – ${requirements.optimalTempMax}°C`,
          maxTolerableRainfall: `${requirements.maxRainfall}mm/day`,
        },
      });
    } catch (error) {
      console.error('Sowing calendar error:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to compute sowing calendar' });
    }
  },
];

module.exports = { getSowingCalendar };
