const express = require('express');
const router = express.Router();
const pool = require('../db');
const upload = require('../middleware/upload');
const { findNearestWard } = require('../utils/geo');
const { classifyDescription } = require('../services/nlp');

// Helper to format human-readable complaint ID
const formatComplaintId = (id) => `GD-${10000 + parseInt(id, 10)}`;

/**
 * POST /api/complaints
 * Submit a new grievance/complaint with optional photo and live NLP classification
 */
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { description, latitude, longitude, citizen_phone } = req.body;
    let ward_id = req.body.ward_id ? parseInt(req.body.ward_id, 10) : null;
    let category = req.body.category || null;
    let confidence_score = null;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Live NLP classification if not explicitly overridden
    if (!category || category === 'other') {
      const nlpResult = await classifyDescription(description);
      category = nlpResult.category;
      confidence_score = nlpResult.confidence_score;
    }

    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;

    // If ward_id is not explicitly chosen but lat/lng are provided, find nearest ward
    if (!ward_id && lat != null && lng != null) {
      const nearest = await findNearestWard(lat, lng);
      if (nearest) {
        ward_id = nearest.id;
      }
    }

    // Photo URL path if an image was uploaded
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `
      INSERT INTO complaints (
        description,
        category,
        confidence_score,
        ward_id,
        latitude,
        longitude,
        status,
        citizen_phone,
        photo_url,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'submitted', $7, $8, NOW(), NOW())
      RETURNING *;
    `;

    const values = [
      description.trim(),
      category,
      confidence_score,
      ward_id,
      lat,
      lng,
      citizen_phone ? citizen_phone.trim() : null,
      photo_url,
    ];

    const result = await pool.query(query, values);
    const complaint = result.rows[0];

    // Fetch joined ward name for response
    let wardInfo = null;
    if (complaint.ward_id) {
      const wardRes = await pool.query(
        'SELECT name, full_name, center_lat, center_lng FROM wards WHERE id = $1',
        [complaint.ward_id]
      );
      if (wardRes.rows.length > 0) {
        wardInfo = wardRes.rows[0];
      }
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: {
        ...complaint,
        complaint_id: formatComplaintId(complaint.id),
        ward_name: wardInfo?.name || null,
        ward_full_name: wardInfo?.full_name || null,
      },
    });
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ error: 'Internal server error while creating complaint' });
  }
});

/**
 * GET /api/complaints/track
 * Track complaints by Complaint ID (e.g. "GD-10001" or numeric "1") or Citizen Phone Number
 */
router.get('/track', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query (Complaint ID or Phone Number) is required' });
    }

    const cleanQuery = query.trim();

    // Check if query is a complaint ID (starts with GD- or is an integer)
    let parsedId = null;
    const gdMatch = cleanQuery.match(/^(?:#?GD-?)(\d+)$/i);
    if (gdMatch) {
      const rawNum = parseInt(gdMatch[1], 10);
      parsedId = rawNum > 10000 ? rawNum - 10000 : rawNum;
    } else if (/^\d{1,6}$/.test(cleanQuery)) {
      const rawNum = parseInt(cleanQuery, 10);
      parsedId = rawNum > 10000 ? rawNum - 10000 : rawNum;
    }

    if (parsedId !== null) {
      const result = await pool.query(
        `SELECT c.*, w.name as ward_name, w.full_name as ward_full_name
         FROM complaints c
         LEFT JOIN wards w ON c.ward_id = w.id
         WHERE c.id = $1`,
        [parsedId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `No complaint found with ID "${cleanQuery}"` });
      }

      const complaint = result.rows[0];
      return res.json({
        type: 'id',
        complaints: [
          {
            ...complaint,
            complaint_id: formatComplaintId(complaint.id),
          },
        ],
      });
    }

    // Otherwise, treat as phone number search
    const cleanPhone = cleanQuery.replace(/\D/g, '');
    const phonePattern = cleanPhone.length >= 7 ? `%${cleanPhone.slice(-10)}%` : `%${cleanQuery}%`;

    const result = await pool.query(
      `SELECT c.*, w.name as ward_name, w.full_name as ward_full_name
       FROM complaints c
       LEFT JOIN wards w ON c.ward_id = w.id
       WHERE c.citizen_phone LIKE $1 OR c.citizen_phone = $2
       ORDER BY c.created_at DESC`,
      [phonePattern, cleanQuery]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No complaints found for phone number "${cleanQuery}"` });
    }

    res.json({
      type: 'phone',
      complaints: result.rows.map((c) => ({
        ...c,
        complaint_id: formatComplaintId(c.id),
      })),
    });
  } catch (err) {
    console.error('Error tracking complaint:', err);
    res.status(500).json({ error: 'Internal server error while tracking complaint' });
  }
});

/**
 * GET /api/complaints/:id
 * Retrieve single complaint details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    let id = parseInt(rawId, 10);

    const gdMatch = rawId.match(/^(?:#?GD-?)(\d+)$/i);
    if (gdMatch) {
      const num = parseInt(gdMatch[1], 10);
      id = num > 10000 ? num - 10000 : num;
    } else if (id > 10000) {
      id = id - 10000;
    }

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid complaint ID' });
    }

    const result = await pool.query(
      `SELECT c.*, w.name as ward_name, w.full_name as ward_full_name
       FROM complaints c
       LEFT JOIN wards w ON c.ward_id = w.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = result.rows[0];
    res.json({
      ...complaint,
      complaint_id: formatComplaintId(complaint.id),
    });
  } catch (err) {
    console.error('Error fetching complaint by id:', err);
    res.status(500).json({ error: 'Internal server error while fetching complaint' });
  }
});

module.exports = router;
