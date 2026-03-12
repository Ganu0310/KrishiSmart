const mongoose = require('mongoose');

// Cache advisory AI responses to avoid redundant Gemini API calls
// TTL is set per-document. We use a mongoose TTL index on expiresAt.
const advisoryCacheSchema = new mongoose.Schema(
  {
    // Composed key: crop + stage + location + weather fingerprint
    cacheKey: { type: String, required: true, unique: true, index: true },

    // The full AI-generated advisory JSON
    advisory: { type: mongoose.Schema.Types.Mixed, required: true },

    // Weather snapshot used to generate this advisory
    weatherSnapshot: { type: mongoose.Schema.Types.Mixed },

    // TTL: MongoDB auto-deletes documents once expiresAt is past
    expiresAt: { type: Date, required: true, index: { expires: 0 } },

    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'advisory_cache' }
);

module.exports = mongoose.model('AdvisoryCache', advisoryCacheSchema);
