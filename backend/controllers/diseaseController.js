const axios = require('axios');

// ── Python ML Service config ───────────────────────────────
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/disease/identify
 * Connects directly to the Python ML Microservice.
 */
const identifyDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image.' });
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only JPG, PNG, and WEBP images are supported.' });
    }

    // ── Call Python ML Service ─────────────────────────────
    try {
      const result = await callPythonML(req.file);
      console.log('[Disease] Python ML model prediction successful');
      return res.json(result);
    } catch (mlError) {
      console.error('[Disease] Python ML service unavailable:', mlError.message);
      return res.status(503).json({
        success: false,
        message: 'Disease identifier requires the Python ML service to be running. Please start it with "python backend/ml/server.py".',
      });
    }
  } catch (error) {
    console.error('[Disease] Fatal error:', error.message);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

// ── Python ML Service call ─────────────────────────────────
async function callPythonML(file) {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('image', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const response = await axios.post(`${ML_SERVICE_URL}/predict`, form, {
    headers: form.getHeaders(),
    timeout: 15000, // 15s timeout
  });

  return response.data;
}

module.exports = { identifyDisease };
