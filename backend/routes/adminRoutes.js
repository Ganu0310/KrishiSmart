const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware: protect, adminOnly: admin } = require('../middleware/authMiddleware');

// Dashboard Stats
router.get('/stats', protect, admin, adminController.getStats);

// User Management
router.post('/users', protect, admin, adminController.createUser);
router.get('/users', protect, admin, adminController.getUsers);
router.put('/users/:id', protect, admin, adminController.updateUser);
router.delete('/users/:id', protect, admin, adminController.deleteUser);
router.patch('/users/:id/status', protect, admin, adminController.updateUserStatus);

// Broadcast
router.post('/broadcast', protect, admin, adminController.broadcast);

// Market Prices CMS
const marketPriceController = require('../controllers/marketPriceController');
router.get('/market-prices', protect, admin, marketPriceController.getMarketPricesAdmin);
router.post('/market-prices', protect, admin, marketPriceController.createMarketPrice);
router.put('/market-prices/:id', protect, admin, marketPriceController.updateMarketPrice);
router.delete('/market-prices/:id', protect, admin, marketPriceController.deleteMarketPrice);

// Advisory CMS
router.post('/advisory', protect, admin, adminController.addAdvisory);
router.delete('/advisory/:id', protect, admin, adminController.deleteAdvisory);

// Government Data Management
const govDataAdminController = require('../controllers/govDataAdminController');
router.get('/gov-data/jobs', protect, admin, govDataAdminController.getJobStatus);
router.get('/gov-data/cache-stats', protect, admin, govDataAdminController.getCacheStats);
router.post('/gov-data/refresh/:source', protect, admin, govDataAdminController.manualRefresh);
router.get('/gov-data/api-usage', protect, admin, govDataAdminController.getApiUsage);
router.delete('/gov-data/cache/:source', protect, admin, govDataAdminController.clearCacheBySource);
router.get('/gov-data/data-quality', protect, admin, govDataAdminController.getDataQualityMetrics);

module.exports = router;
