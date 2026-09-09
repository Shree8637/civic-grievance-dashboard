const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { classifyDescription } = require('../services/nlp');

// Helper to format human-readable complaint ID
const formatComplaintId = (id) => `GD-${10000 + parseInt(id, 10)}`;

/**
 * GET /api/admin/complaints
 * List complaints with filtering, search, and pagination
 */
router.get('/complaints', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      ward_id,
      category,
      status,
      search,
      low_confidence,
      sort_by = 'created_at',
      order = 'DESC',
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const validSorts = ['created_at', 'updated_at', 'id', 'status', 'category', 'confidence_score'];
    const sortField = validSorts.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (ward_id) {
      conditions.push(`c.ward_id = $${paramIndex++}`);
      values.push(parseInt(ward_id, 10));
    }

    if (category) {
      conditions.push(`c.category = $${paramIndex++}`);
      values.push(category);
    }

    if (status) {
      conditions.push(`c.status = $${paramIndex++}`);
      values.push(status);
    }

    if (low_confidence === 'true' || low_confidence === true) {
      conditions.push(`(c.confidence_score IS NULL OR c.confidence_score < 0.60)`);
    }

    if (search) {
      const searchPattern = `%${search.trim()}%`;
      // Check if search is numeric id or formatted GD-id
      const gdMatch = search.trim().match(/^(?:#?GD-?)(\d+)$/i);
      if (gdMatch) {
        const parsedId = parseInt(gdMatch[1], 10) > 10000 ? parseInt(gdMatch[1], 10) - 10000 : parseInt(gdMatch[1], 10);
        conditions.push(`(c.id = $${paramIndex++} OR c.description ILIKE $${paramIndex++} OR c.citizen_phone ILIKE $${paramIndex++})`);
        values.push(parsedId, searchPattern, searchPattern);
      } else {
        conditions.push(`(c.description ILIKE $${paramIndex++} OR c.citizen_phone ILIKE $${paramIndex++})`);
        values.push(searchPattern, searchPattern);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching complaints
    const countQuery = `
      SELECT COUNT(*) 
      FROM complaints c 
      ${whereClause};
    `;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Fetch complaints
    const dataQuery = `
      SELECT 
        c.*,
        w.name as ward_name,
        w.full_name as ward_full_name
      FROM complaints c
      LEFT JOIN wards w ON c.ward_id = w.id
      ${whereClause}
      ORDER BY c.${sortField} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;
    const dataValues = [...values, parseInt(limit, 10), offset];
    const dataResult = await pool.query(dataQuery, dataValues);

    const complaints = dataResult.rows.map((row) => ({
      ...row,
      complaint_id: formatComplaintId(row.id),
    }));

    res.json({
      complaints,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalCount / parseInt(limit, 10)) || 1,
      },
    });
  } catch (err) {
    console.error('Error fetching admin complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints list' });
  }
});

/**
 * PATCH /api/admin/complaints/:id
 * Update complaint status and/or category override
 */
router.patch('/complaints/:id', authMiddleware, async (req, res) => {
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

    const { status, category, ward_id } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const allowedStatuses = ['submitted', 'in_progress', 'resolved'];
    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    const allowedCategories = ['garbage', 'water_supply', 'drainage', 'roads', 'streetlights', 'other'];
    if (category) {
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({ error: `Invalid category. Must be one of: ${allowedCategories.join(', ')}` });
      }
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    if (ward_id !== undefined) {
      updates.push(`ward_id = $${paramIndex++}`);
      values.push(ward_id ? parseInt(ward_id, 10) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE complaints
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const updatedComplaint = result.rows[0];

    // Join ward details
    let wardInfo = null;
    if (updatedComplaint.ward_id) {
      const wardRes = await pool.query('SELECT name, full_name FROM wards WHERE id = $1', [updatedComplaint.ward_id]);
      if (wardRes.rows.length > 0) wardInfo = wardRes.rows[0];
    }

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      complaint: {
        ...updatedComplaint,
        complaint_id: formatComplaintId(updatedComplaint.id),
        ward_name: wardInfo?.name || null,
        ward_full_name: wardInfo?.full_name || null,
      },
    });
  } catch (err) {
    console.error('Error updating complaint:', err);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

/**
 * POST /api/admin/complaints/classify-all
 * Batch classify all unclassified or pending complaints using NLP service
 */
router.post('/complaints/classify-all', authMiddleware, async (req, res) => {
  try {
    const unclassified = await pool.query(
      `SELECT id, description FROM complaints WHERE confidence_score IS NULL OR category = 'other' ORDER BY id`
    );

    let updatedCount = 0;
    for (const row of unclassified.rows) {
      const nlp = await classifyDescription(row.description);
      if (nlp.confidence_score !== null) {
        await pool.query(
          `UPDATE complaints SET category = $1, confidence_score = $2, updated_at = NOW() WHERE id = $3`,
          [nlp.category, nlp.confidence_score, row.id]
        );
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: `Batch classified ${updatedCount} complaints using NLP model`,
      updated_count: updatedCount,
    });
  } catch (err) {
    console.error('Error in batch classify:', err);
    res.status(500).json({ error: 'Failed to batch classify complaints' });
  }
});

// ── Hotspots & Clusters (Phase 3) ──────────────────────────
const { getHotspots, recomputeClusters } = require('../services/clustering');

/**
 * GET /api/admin/hotspots
 * Fetch detected geospatial hotspots and geotagged complaints
 */
router.get('/hotspots', authMiddleware, async (req, res) => {
  try {
    const { ward_id, category } = req.query;
    const data = await getHotspots({ ward_id, category });
    res.json({
      success: true,
      ...data,
    });
  } catch (err) {
    console.error('Error fetching hotspots:', err);
    res.status(500).json({ error: 'Failed to fetch hotspots' });
  }
});

/**
 * POST /api/admin/hotspots/recompute
 * Trigger DBSCAN clustering job across all complaints
 */
router.post('/hotspots/recompute', authMiddleware, async (req, res) => {
  try {
    const { eps_km = 0.8, min_samples = 2 } = req.body;
    const result = await recomputeClusters(parseFloat(eps_km), parseInt(min_samples, 10));
    res.json({
      success: true,
      message: `Successfully recomputed clusters: ${result.total_clusters} hotspots detected`,
      ...result,
    });
  } catch (err) {
    console.error('Error recomputing hotspots:', err);
    res.status(500).json({ error: 'Failed to recompute hotspots' });
  }
});

// ── Analytics (Phase 4) ───────────────────────────────────
const { getAnalyticsSummary, getAnalyticsTrends } = require('../services/analytics');

/**
 * GET /api/admin/analytics/summary
 * KPI summary, status counts, category percentages, and ward breakdown
 */
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const { ward_id } = req.query;
    const data = await getAnalyticsSummary({ ward_id });
    res.json({
      success: true,
      ...data,
    });
  } catch (err) {
    console.error('Error fetching analytics summary:', err);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

/**
 * GET /api/admin/analytics/trends
 * Time-series trend data over the past N days
 */
router.get('/analytics/trends', authMiddleware, async (req, res) => {
  try {
    const { days = 14, ward_id, category } = req.query;
    const data = await getAnalyticsTrends({ days, ward_id, category });
    res.json({
      success: true,
      ...data,
    });
  } catch (err) {
    console.error('Error fetching analytics trends:', err);
    res.status(500).json({ error: 'Failed to fetch analytics trends' });
  }
});

module.exports = router;
