const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'weatherCacheData.json');

// Ensure cache file exists
if (!fs.existsSync(CACHE_FILE)) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({}));
}

let cache = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
} catch (err) {
  console.error('Error reading cache file:', err);
  cache = {};
}

const saveCache = () => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('Error saving cache file:', err);
  }
};

const setCache = (key, data, ttlMs) => {
  const ttl = Number(ttlMs);
  if (!key || typeof key !== 'string' || !data || isNaN(ttl) || ttl <= 0) {
    return;
  }
  cache[key] = {
    data,
    expiresAt: Date.now() + ttl,
  };
  saveCache();
};

const getCache = (key) => {
  const entry = cache[key];
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    delete cache[key];
    saveCache();
    return null;
  }

  return entry.data;
};

module.exports = { setCache, getCache };
