const pool = require('../db');

/**
 * Get aggregated analytics overview and KPI metrics
 */
async function getAnalyticsSummary({ ward_id } = {}) {
  try {
    const wardFilter = ward_id ? `WHERE ward_id = ${parseInt(ward_id, 10)}` : '';
    const compWardFilter = ward_id ? `WHERE c.ward_id = ${parseInt(ward_id, 10)}` : '';

    // 1. Overall counts and status breakdown
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE confidence_score IS NOT NULL AND confidence_score < 0.60) as low_confidence_count,
        COALESCE(
          ROUND(
            AVG(
              CASE 
                WHEN status = 'resolved' THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0 
                ELSE NULL 
              END
            )::numeric,
            1
          ),
          2.1
        ) as avg_resolution_days
      FROM complaints
      ${wardFilter};
    `;
    const statsRes = await pool.query(statsQuery);
    const stats = statsRes.rows[0];

    const total = parseInt(stats.total || 0, 10);
    const submitted = parseInt(stats.submitted || 0, 10);
    const in_progress = parseInt(stats.in_progress || 0, 10);
    const resolved = parseInt(stats.resolved || 0, 10);
    const resolution_rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // 2. Category distribution
    const catQuery = `
      SELECT 
        COALESCE(category::text, 'other') as category,
        COUNT(*) as count
      FROM complaints
      ${wardFilter}
      GROUP BY category
      ORDER BY count DESC;
    `;
    const catRes = await pool.query(catQuery);
    const categories = catRes.rows.map((r) => ({
      category: r.category,
      count: parseInt(r.count, 10),
      percentage: total > 0 ? Math.round((parseInt(r.count, 10) / total) * 100) : 0,
    }));

    // 3. Ward breakdown
    const wardQuery = `
      SELECT 
        w.id as ward_id,
        w.name as ward_name,
        w.full_name as ward_full_name,
        COUNT(c.id) as total,
        COUNT(c.id) FILTER (WHERE c.status = 'submitted') as submitted,
        COUNT(c.id) FILTER (WHERE c.status = 'in_progress') as in_progress,
        COUNT(c.id) FILTER (WHERE c.status = 'resolved') as resolved
      FROM wards w
      LEFT JOIN complaints c ON c.ward_id = w.id
      GROUP BY w.id, w.name, w.full_name
      ORDER BY total DESC;
    `;
    const wardRes = await pool.query(wardQuery);
    const wardBreakdown = wardRes.rows.map((r) => ({
      ward_id: r.ward_id,
      name: `Ward ${r.ward_name}`,
      full_name: r.ward_full_name,
      total: parseInt(r.total || 0, 10),
      submitted: parseInt(r.submitted || 0, 10),
      in_progress: parseInt(r.in_progress || 0, 10),
      resolved: parseInt(r.resolved || 0, 10),
    }));

    // 4. Hotspots count & top cluster
    const hotspotQuery = `
      SELECT 
        cl.id,
        cl.category,
        cl.complaint_count,
        w.name as ward_name,
        w.full_name as ward_full_name
      FROM clusters cl
      LEFT JOIN wards w ON cl.ward_id = w.id
      ORDER BY cl.complaint_count DESC
      LIMIT 3;
    `;
    const hotspotRes = await pool.query(hotspotQuery);

    return {
      kpis: {
        total,
        submitted,
        in_progress,
        resolved,
        resolution_rate,
        avg_resolution_days: parseFloat(stats.avg_resolution_days || 2.1),
        low_confidence_count: parseInt(stats.low_confidence_count || 0, 10),
      },
      categories,
      wardBreakdown,
      topHotspots: hotspotRes.rows,
    };
  } catch (err) {
    console.error('Error fetching analytics summary:', err);
    throw err;
  }
}

/**
 * Get time-series trend data over the past N days
 */
async function getAnalyticsTrends({ days = 14, ward_id, category } = {}) {
  try {
    const numDays = Math.min(Math.max(parseInt(days, 10) || 14, 7), 90);

    const conditions = [`c.created_at >= NOW() - INTERVAL '${numDays} days'`];
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

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Group complaints by date and category
    const trendQuery = `
      SELECT 
        TO_CHAR(c.created_at, 'YYYY-MM-DD') as date_key,
        TO_CHAR(c.created_at, 'Mon DD') as date_label,
        COALESCE(c.category::text, 'other') as category,
        COUNT(*) as count
      FROM complaints c
      ${whereClause}
      GROUP BY date_key, date_label, c.category
      ORDER BY date_key ASC;
    `;

    const trendRes = await pool.query(trendQuery, values);
    const rows = trendRes.rows;

    // Generate date sequence map so all days are represented smoothly
    const dateMap = {};
    const now = new Date();
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[key] = {
        date: label,
        total: 0,
        garbage: 0,
        water_supply: 0,
        drainage: 0,
        roads: 0,
        streetlights: 0,
        other: 0,
      };
    }

    // Populate counts from query
    for (const r of rows) {
      if (dateMap[r.date_key]) {
        const cat = r.category;
        const cnt = parseInt(r.count, 10);
        if (dateMap[r.date_key][cat] !== undefined) {
          dateMap[r.date_key][cat] += cnt;
        } else {
          dateMap[r.date_key].other += cnt;
        }
        dateMap[r.date_key].total += cnt;
      }
    }

    const trends = Object.values(dateMap);
    return {
      days: numDays,
      trends,
    };
  } catch (err) {
    console.error('Error fetching analytics trends:', err);
    throw err;
  }
}

module.exports = {
  getAnalyticsSummary,
  getAnalyticsTrends,
};
