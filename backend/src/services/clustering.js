const pool = require('../db');

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Recomputes clusters across all complaints with coordinates using DBSCAN from NLP microservice.
 * Updates PostgreSQL `clusters` table and sets `complaints.cluster_id`.
 */
async function recomputeClusters(epsKm = 0.8, minSamples = 2) {
  try {
    // 1. Fetch complaints with coordinates
    const complaintsRes = await pool.query(`
      SELECT 
        c.id, 
        c.description, 
        c.category, 
        c.ward_id, 
        c.latitude, 
        c.longitude, 
        c.created_at
      FROM complaints c
      WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
      ORDER BY c.created_at ASC
    `);

    const complaints = complaintsRes.rows.map((r) => ({
      id: r.id,
      description: r.description,
      category: r.category,
      ward_id: r.ward_id,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      created_at: r.created_at ? r.created_at.toISOString() : null,
    }));

    if (complaints.length === 0) {
      return { clusters: [], total: 0 };
    }

    // 2. Call NLP Python service for DBSCAN and text similarity
    const response = await fetch(`${NLP_SERVICE_URL}/clusters/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaints,
        eps_km: epsKm,
        min_samples: minSamples,
      }),
    });

    if (!response.ok) {
      throw new Error(`NLP clustering service returned HTTP ${response.status}`);
    }

    const clusterData = await response.json();
    const rawClusters = clusterData.clusters || [];

    // 3. Reset existing cluster associations in PostgreSQL
    await pool.query('UPDATE complaints SET cluster_id = NULL');
    await pool.query('DELETE FROM clusters');

    const createdClusters = [];

    // 4. Save new clusters and assign cluster_id to complaints
    for (const cl of rawClusters) {
      const insertQuery = `
        INSERT INTO clusters (
          category,
          ward_id,
          complaint_count,
          centroid_lat,
          centroid_lng,
          first_seen,
          last_seen
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;

      const values = [
        cl.category,
        cl.ward_id,
        cl.complaint_count,
        cl.centroid_lat,
        cl.centroid_lng,
        cl.first_seen ? new Date(cl.first_seen) : null,
        cl.last_seen ? new Date(cl.last_seen) : null,
      ];

      const res = await pool.query(insertQuery, values);
      const newCluster = res.rows[0];

      // Update complaints belonging to this cluster
      if (cl.complaint_ids && cl.complaint_ids.length > 0) {
        await pool.query(
          `UPDATE complaints SET cluster_id = $1 WHERE id = ANY($2::int[])`,
          [newCluster.id, cl.complaint_ids]
        );
      }

      createdClusters.push({
        ...newCluster,
        radius_meters: cl.radius_meters || 200,
        cohesion_score: cl.cohesion_score || 0,
        is_same_incident: !!cl.is_same_incident,
        top_keywords: cl.top_keywords || [],
        complaint_ids: cl.complaint_ids || [],
      });
    }

    return {
      success: true,
      total_clusters: createdClusters.length,
      clusters: createdClusters,
    };
  } catch (err) {
    console.error('Error recomputing clusters:', err);
    throw err;
  }
}

/**
 * Fetch all clusters with joined ward and complaint details
 */
async function getHotspots({ ward_id, category } = {}) {
  try {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (ward_id) {
      conditions.push(`cl.ward_id = $${paramIndex++}`);
      values.push(parseInt(ward_id, 10));
    }

    if (category) {
      conditions.push(`cl.category = $${paramIndex++}`);
      values.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const clustersQuery = `
      SELECT 
        cl.*,
        w.name as ward_name,
        w.full_name as ward_full_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'complaint_id', 'GD-' || (10000 + c.id),
              'description', c.description,
              'status', c.status,
              'category', c.category,
              'confidence_score', c.confidence_score,
              'latitude', c.latitude,
              'longitude', c.longitude,
              'created_at', c.created_at
            ) ORDER BY c.created_at DESC
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as complaints
      FROM clusters cl
      LEFT JOIN wards w ON cl.ward_id = w.id
      LEFT JOIN complaints c ON c.cluster_id = cl.id
      ${whereClause}
      GROUP BY cl.id, w.name, w.full_name
      ORDER BY cl.complaint_count DESC, cl.id ASC;
    `;

    const clustersResult = await pool.query(clustersQuery, values);

    // Also get all individual complaints with coordinates for point overlay
    const pointsQuery = `
      SELECT 
        c.id,
        ('GD-' || (10000 + c.id)) as complaint_id,
        c.description,
        c.category,
        c.status,
        c.confidence_score,
        c.latitude,
        c.longitude,
        c.ward_id,
        c.cluster_id,
        w.name as ward_name,
        c.created_at
      FROM complaints c
      LEFT JOIN wards w ON c.ward_id = w.id
      WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
      ${ward_id ? `AND c.ward_id = ${parseInt(ward_id, 10)}` : ''}
      ${category ? `AND c.category = '${category}'` : ''}
      ORDER BY c.created_at DESC;
    `;
    const pointsResult = await pool.query(pointsQuery);

    return {
      clusters: clustersResult.rows,
      raw_complaints: pointsResult.rows,
      summary: {
        total_hotspots: clustersResult.rows.length,
        total_clustered_complaints: clustersResult.rows.reduce((acc, curr) => acc + parseInt(curr.complaint_count || 0, 10), 0),
        total_geotagged_complaints: pointsResult.rows.length,
      },
    };
  } catch (err) {
    console.error('Error fetching hotspots:', err);
    throw err;
  }
}

module.exports = {
  recomputeClusters,
  getHotspots,
};
