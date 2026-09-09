/**
 * Phase 5 — Comprehensive End-to-End Test Suite
 * 
 * Verifies:
 * 1. Health checks for all microservices (Express :5000, FastAPI :8000)
 * 2. Admin login & JWT generation
 * 3. Citizen complaint submission with live NLP auto-classification & nearest ward assignment
 * 4. Citizen complaint tracking by Reference ID
 * 5. Admin complaint status lifecycle (Submitted -> In Progress -> Resolved)
 * 6. Geospatial hotspot recomputation (DBSCAN + TF-IDF cohesion)
 * 7. Hotspots query & verification
 * 8. Analytics summary & trend metrics
 * 
 * Usage: node tests/e2e-test.js
 */

const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runE2E() {
  console.log('====================================================');
  console.log('  CIVIC GRIEVANCE DASHBOARD — END-TO-END TEST SUITE ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ── 1. Health Checks ──────────────────────────────────────────
    console.log('[1/7] Checking Service Health...');
    const backendHealth = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
    });
    assert(backendHealth.status === 200 && backendHealth.data.status === 'ok', 'Express backend is healthy');

    const nlpHealth = await request({
      hostname: 'localhost',
      port: 8000,
      path: '/health',
      method: 'GET',
    });
    assert(nlpHealth.status === 200 && nlpHealth.data.status === 'ok', 'FastAPI NLP service is healthy');

    // ── 2. Admin Authentication ──────────────────────────────────
    console.log('\n[2/7] Authenticating Admin User...');
    const loginRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: 'admin@grievance.local',
      password: 'admin123',
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Admin login succeeded and returned JWT');
    const token = loginRes.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // ── 3. Citizen Complaint Submission with NLP ─────────────────
    console.log('\n[3/7] Submitting Citizen Complaint (Testing Live NLP Classification)...');
    const newComplaint = {
      description: 'Severe deep potholes near Bandra KFC on Linking Road causing massive vehicular damage and traffic jams',
      latitude: 19.0605,
      longitude: 72.8340,
      phone: '9876543210',
    };

    const submitRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/complaints',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, newComplaint);

    assert(submitRes.status === 201, `Complaint submitted with status 201 (got ${submitRes.status})`);
    const cData = submitRes.data.complaint;
    assert(cData.category === 'roads', `NLP auto-classified category as 'roads' (got '${cData.category}')`);
    assert(cData.ward_name === 'H/W', `Ward auto-assigned as 'H/W' (got '${cData.ward_name}')`);
    assert(parseFloat(cData.confidence_score) >= 0.5, `Prediction confidence is high (${(parseFloat(cData.confidence_score) * 100).toFixed(1)}%)`);
    const complaintRefId = cData.complaint_id;
    console.log(`      Created Reference ID: ${complaintRefId}`);

    // ── 4. Complaint Tracking ────────────────────────────────────
    console.log('\n[4/7] Tracking Complaint by Reference ID...');
    const trackRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/complaints/${complaintRefId}`,
      method: 'GET',
    });
    assert(trackRes.status === 200, `Track endpoint returned 200 for ${complaintRefId}`);
    assert(trackRes.data.status === 'submitted', 'Complaint starts with status "submitted"');

    // ── 5. Admin Lifecycle Transition ────────────────────────────
    console.log('\n[5/7] Admin Complaint Status Updates...');
    const inProgRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/complaints/${complaintRefId}`,
      method: 'PATCH',
      headers: authHeaders,
    }, { status: 'in_progress' });
    assert(inProgRes.status === 200 && inProgRes.data.complaint.status === 'in_progress', 'Moved status to "in_progress"');

    const resolvedRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/complaints/${complaintRefId}`,
      method: 'PATCH',
      headers: authHeaders,
    }, { status: 'resolved' });
    assert(resolvedRes.status === 200 && resolvedRes.data.complaint.status === 'resolved', 'Moved status to "resolved"');

    // ── 6. Geospatial Hotspot Recomputation ───────────────────────
    console.log('\n[6/7] Triggering DBSCAN Hotspot Recomputation on 100+ complaints...');
    const recomputeRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/hotspots/recompute',
      method: 'POST',
      headers: authHeaders,
    }, { eps_km: 0.8, min_samples: 2 });
    assert(recomputeRes.status === 200, `Recompute API returned 200 (clusters detected: ${recomputeRes.data.total_clusters})`);

    const hotspotsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/hotspots',
      method: 'GET',
      headers: authHeaders,
    });
    assert(hotspotsRes.status === 200 && Array.isArray(hotspotsRes.data.clusters), 'Hotspots query returned cluster array');
    assert(hotspotsRes.data.raw_complaints?.length > 0, `Hotspots query returned ${hotspotsRes.data.raw_complaints?.length} geotagged complaint points`);
    console.log(`      Found ${hotspotsRes.data.clusters.length} hotspots across ${hotspotsRes.data.raw_complaints?.length || 0} mapped complaints.`);

    // ── 7. Admin Analytics ────────────────────────────────────────
    console.log('\n[7/7] Testing Analytics Endpoints...');
    const summaryRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/analytics/summary',
      method: 'GET',
      headers: authHeaders,
    });
    assert(summaryRes.status === 200, 'Analytics summary returned 200');
    assert(summaryRes.data.kpis?.total >= 100, `Analytics total complaints >= 100 (got ${summaryRes.data.kpis?.total})`);
    assert(summaryRes.data.categories?.length === 6, `Category breakdown contains all 6 categories (got ${summaryRes.data.categories?.length})`);

    const trendsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/analytics/trends?days=14',
      method: 'GET',
      headers: authHeaders,
    });
    assert(trendsRes.status === 200, 'Analytics trends returned 200');
    assert(trendsRes.data.trends?.length === 14, `14-day trend series returned exactly 14 days (got ${trendsRes.data.trends?.length})`);

    // ── Results Summary ──────────────────────────────────────────
    console.log('\n====================================================');
    console.log(`  E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n✗ Test crashed with unhandled exception:', err);
    process.exit(1);
  }
}

runE2E();
