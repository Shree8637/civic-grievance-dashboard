const pool = require('../db');

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest ward from the database given a latitude and longitude.
 */
async function findNearestWard(lat, lng) {
  if (lat == null || lng == null) return null;
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (isNaN(numLat) || isNaN(numLng)) return null;

  try {
    const result = await pool.query('SELECT id, name, full_name, center_lat, center_lng, radius_km FROM wards');
    const wards = result.rows;
    if (!wards || wards.length === 0) return null;

    let closestWard = null;
    let minDistance = Infinity;

    for (const ward of wards) {
      const dist = haversineDistanceKm(
        numLat,
        numLng,
        parseFloat(ward.center_lat),
        parseFloat(ward.center_lng)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestWard = {
          ...ward,
          distance_km: Math.round(dist * 100) / 100,
        };
      }
    }

    return closestWard;
  } catch (err) {
    console.error('Error finding nearest ward:', err);
    return null;
  }
}

module.exports = {
  haversineDistanceKm,
  findNearestWard,
};
