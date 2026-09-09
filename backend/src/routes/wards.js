const express = require('express');
const router = express.Router();
const pool = require('../db');
const { findNearestWard } = require('../utils/geo');

// GET /api/wards/nearest — find closest ward for given lat/lng
router.get('/nearest', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng query parameters are required' });
    }
    const nearest = await findNearestWard(lat, lng);
    if (!nearest) {
      return res.status(404).json({ error: 'No ward found nearby' });
    }
    res.json(nearest);
  } catch (err) {
    console.error('Error finding nearest ward:', err);
    res.status(500).json({ error: 'Failed to calculate nearest ward' });
  }
});

// GET /api/wards — list all wards
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, full_name, center_lat, center_lng, radius_km FROM wards ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching wards:', err);
    res.status(500).json({ error: 'Failed to fetch wards' });
  }
});

module.exports = router;
