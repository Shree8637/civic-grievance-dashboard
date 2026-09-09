/**
 * Phase 5 — Seed a realistic demo dataset
 * 
 * Inserts ~80 diverse complaints across all 8 Mumbai wards, all 6 categories,
 * all 3 statuses, with staggered dates over the past 30 days so that
 * trend charts, hotspots, and category distributions look meaningful.
 *
 * Usage: node db/seed-demo.js
 */
const pool = require('../src/db');

// ── Realistic Mumbai complaint descriptions ────────────────────
const COMPLAINTS = [
  // GARBAGE (16 entries)
  { desc: 'Huge pile of garbage dumped near Sassoon Dock gate. Stench unbearable since 3 days.', cat: 'garbage' },
  { desc: 'Garbage collection missed for a week in Bandra Reclamation area, overflowing bins everywhere.', cat: 'garbage' },
  { desc: 'Rotting waste accumulated near Sion station footbridge, attracting stray animals.', cat: 'garbage' },
  { desc: 'Municipal bin outside Dadar flower market not emptied in 5 days, flies and smell issues.', cat: 'garbage' },
  { desc: 'Construction debris mixed with household waste dumped on Andheri-Kurla Road divider.', cat: 'garbage' },
  { desc: 'Large pile of garbage bags on the footpath near Khar Danda causing pedestrians to walk on road.', cat: 'garbage' },
  { desc: 'Open dumping near Goregaon railway tracks, residents complaining of health issues.', cat: 'garbage' },
  { desc: 'Plastic waste clogging nullahs near Worli Koliwada, needs urgent cleaning.', cat: 'garbage' },
  { desc: 'Garbage truck has not visited our society in Matunga for 4 days straight.', cat: 'garbage' },
  { desc: 'Dumped medical waste found near Colaba post office, extremely hazardous.', cat: 'garbage' },
  { desc: 'Overflowing community dustbin at Byculla Zoo junction since Saturday morning.', cat: 'garbage' },
  { desc: 'Stray cattle feeding on roadside garbage near Sakinaka metro station.', cat: 'garbage' },
  { desc: 'Wet waste composting pit in Prabhadevi lane collapsed, debris scattered.', cat: 'garbage' },
  { desc: 'Burning of garbage at night near Goregaon Filmcity back gate causing air pollution.', cat: 'garbage' },
  { desc: 'Broken garbage compactor machine at Kurla bus depot overflowing with trash.', cat: 'garbage' },
  { desc: 'Illegal dumping of meat shop waste in open plot near Mazgaon dock.', cat: 'garbage' },

  // WATER SUPPLY (14 entries)
  { desc: 'No water supply since morning in entire Colaba Causeway area, taps completely dry.', cat: 'water_supply' },
  { desc: 'Brown muddy water flowing from taps in Bandra West 14th road since 2 days.', cat: 'water_supply' },
  { desc: 'Water pressure extremely low in Sion Koliwada, upper floors getting no water at all.', cat: 'water_supply' },
  { desc: 'Major pipeline burst near Dadar TT circle flooding the road and wasting water.', cat: 'water_supply' },
  { desc: 'Irregular water supply timing in Goregaon East, receiving only 30 min per day.', cat: 'water_supply' },
  { desc: 'Water tanker not supplied to Andheri East chawl area despite repeated complaints.', cat: 'water_supply' },
  { desc: 'Sewage mixing with drinking water supply in Kurla West, residents falling ill.', cat: 'water_supply' },
  { desc: 'Underground water tank leaking at Worli Sea Face promenade, continuous water loss.', cat: 'water_supply' },
  { desc: 'Byculla area facing intermittent water cuts during afternoons, no prior notice.', cat: 'water_supply' },
  { desc: 'Water meter at Khar station compound showing wrong readings, overcharging residents.', cat: 'water_supply' },
  { desc: 'BMC water valve broken at Prabhadevi junction causing water wastage for days.', cat: 'water_supply' },
  { desc: 'Water pipeline exposed and cracked on Matunga main road, tripping hazard for pedestrians.', cat: 'water_supply' },
  { desc: 'No water supply to slum rehabilitation building in Goregaon for past 3 days.', cat: 'water_supply' },
  { desc: 'Contaminated water supply reported in Fort area near Horniman Circle after heavy rain.', cat: 'water_supply' },

  // DRAINAGE (12 entries)
  { desc: 'Drainage completely blocked in Colaba market lane, water stagnating during every rain.', cat: 'drainage' },
  { desc: 'Open manhole cover missing near Bandra station west exit, extremely dangerous at night.', cat: 'drainage' },
  { desc: 'Sewage water overflowing on Sion-Trombay Road, impossible to pass without boots.', cat: 'drainage' },
  { desc: 'Blocked storm drain near Andheri subway causing waterlogging every monsoon shower.', cat: 'drainage' },
  { desc: 'Nullah near Goregaon bus depot choked with debris, flooding nearby shops.', cat: 'drainage' },
  { desc: 'Sewage leaking from underground drain pipe into basement of Worli building.', cat: 'drainage' },
  { desc: 'Manhole sinking near Kurla station platform 1, posing accident risk.', cat: 'drainage' },
  { desc: 'Clogged drainage in Byculla causing mosquito breeding, dengue cases reported.', cat: 'drainage' },
  { desc: 'Heavy waterlogging at Matunga circle underpass even after light rain.', cat: 'drainage' },
  { desc: 'Drain cover broken at Khar West SV Road junction, two-wheeler fell in last week.', cat: 'drainage' },
  { desc: 'Overflowing drainage gutter near Prabhadevi temple during high tide.', cat: 'drainage' },
  { desc: 'Nullah cleaning incomplete near Sakinaka junction, trash still blocking flow.', cat: 'drainage' },

  // ROADS (14 entries)
  { desc: 'Massive pothole near Colaba bus stop, two vehicles damaged tires this week.', cat: 'roads' },
  { desc: 'Road completely dug up for BMC pipeline work in Bandra Linking Road, no barricading.', cat: 'roads' },
  { desc: 'Street surface crumbling on Sion Hospital Road, patches falling off within days of repair.', cat: 'roads' },
  { desc: 'Deep crater-like pothole on Andheri Sahar Road near airport, causing traffic jams.', cat: 'roads' },
  { desc: 'Road divider broken at Goregaon Aarey junction, causing wrong-side driving.', cat: 'roads' },
  { desc: 'Footpath tiles completely broken in Worli village, senior citizens cannot walk safely.', cat: 'roads' },
  { desc: 'Speed breaker too high near Kurla court, vehicles scraping underbody.', cat: 'roads' },
  { desc: 'Road paved unevenly near Byculla bridge, water pooling creating splash hazard.', cat: 'roads' },
  { desc: 'Construction equipment abandoned on Khar road for months, blocking half the lane.', cat: 'roads' },
  { desc: 'Missing road markings at Matunga five-road junction causing accidents.', cat: 'roads' },
  { desc: 'Potholes on Prabhadevi flyover approach ramp, extremely dangerous for two-wheelers.', cat: 'roads' },
  { desc: 'Road subsidence near Sakinaka metro exit, visible cracks forming on surface.', cat: 'roads' },
  { desc: 'No proper footpath on the bridge connecting Colaba Causeway to Navy Nagar.', cat: 'roads' },
  { desc: 'Unfinished road widening project at Goregaon Mulund Link Road blocking traffic for weeks.', cat: 'roads' },

  // STREETLIGHTS (10 entries)
  { desc: 'All streetlights on Marine Drive promenade from Wilson College to NCPA turned off since 4 nights.', cat: 'streetlights' },
  { desc: 'Streetlight pole leaning dangerously near Bandra Bandstand, may fall on parked vehicles.', cat: 'streetlights' },
  { desc: 'Entire lane dark in Sion East slum area, women safety concern after 7 PM.', cat: 'streetlights' },
  { desc: 'Flickering streetlight at Andheri flyover creating visibility issues for drivers.', cat: 'streetlights' },
  { desc: 'Broken streetlight bulb at Goregaon station east exit, glass pieces on footpath.', cat: 'streetlights' },
  { desc: 'Streetlights not working on Worli Sea Link service road, pitch dark at night.', cat: 'streetlights' },
  { desc: 'Dangling electric wires from broken streetlight pole at Kurla LBS Marg, electrocution risk.', cat: 'streetlights' },
  { desc: 'LED streetlights installed in Byculla but none connected to power since 2 months.', cat: 'streetlights' },
  { desc: 'Streetlight timer malfunctioning at Matunga circle, lights on during day wasting electricity.', cat: 'streetlights' },
  { desc: 'No streetlights installed in newly developed lane behind Khar Gymkhana.', cat: 'streetlights' },

  // OTHER (6 entries)
  { desc: 'Unauthorized hawkers encroaching entire footpath near Colaba market, no space for pedestrians.', cat: 'other' },
  { desc: 'Stray dog menace in Bandra Hill Road area, pack of 10+ aggressive dogs at night.', cat: 'other' },
  { desc: 'Illegal construction on government land near Sion fort area, no BMC action taken.', cat: 'other' },
  { desc: 'Tree fallen on power lines at Andheri Lokhandwala, sparking visible at night.', cat: 'other' },
  { desc: 'Noise pollution from late-night construction work at Goregaon Link Road building site.', cat: 'other' },
  { desc: 'Public toilet near Kurla station in extremely unhygienic condition, no water or cleaning.', cat: 'other' },
];

// Ward mapping: id -> { name, lat/lng center, radius for random spread }
const WARDS = [
  { id: 1, name: 'A',   lat: 18.9220, lng: 72.8347, r: 0.012 },
  { id: 2, name: 'C',   lat: 18.9780, lng: 72.8340, r: 0.010 },
  { id: 3, name: 'F/N', lat: 19.0430, lng: 72.8650, r: 0.014 },
  { id: 4, name: 'G/S', lat: 19.0170, lng: 72.8150, r: 0.012 },
  { id: 5, name: 'H/W', lat: 19.0600, lng: 72.8350, r: 0.015 },
  { id: 6, name: 'K/E', lat: 19.1190, lng: 72.8680, r: 0.018 },
  { id: 7, name: 'L',   lat: 19.0730, lng: 72.8790, r: 0.015 },
  { id: 8, name: 'P/S', lat: 19.1550, lng: 72.8490, r: 0.018 },
];

// Status distribution: ~45% submitted, ~25% in_progress, ~30% resolved
const STATUSES = ['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted',
                  'in_progress','in_progress','in_progress','in_progress','in_progress',
                  'resolved','resolved','resolved','resolved','resolved','resolved'];

// Phone numbers for realism
const PHONES = [
  '9820123456', '9876543210', '9988776655', '9112233445',
  '8800112233', '9321456789', '9654321098', '8899001122',
  '7788996655', '9001234567', '8765432109', '9246801357',
];

// Deterministic pseudo-random using simple seed
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 7) % 2147483647;
    return s / 2147483647;
  };
}

async function seed() {
  const client = await pool.connect();
  const rand = seededRand(42);

  try {
    console.log('Phase 5: Seeding realistic demo dataset...\n');

    // Check existing count
    const existing = await client.query('SELECT COUNT(*) as cnt FROM complaints');
    const existingCount = parseInt(existing.rows[0].cnt, 10);
    console.log(`Existing complaints: ${existingCount}`);

    let inserted = 0;
    const now = new Date();

    for (let i = 0; i < COMPLAINTS.length; i++) {
      const c = COMPLAINTS[i];

      // Pick a ward that matches the description area references (round-robin with some clustering)
      const wardIdx = i % WARDS.length;
      const ward = WARDS[wardIdx];

      // Random position near ward center (with clustering effect for hotspot demo)
      const clusterOffset = rand() > 0.6 ? 0.002 : 0; // cluster some complaints close together
      const lat = ward.lat + (rand() - 0.5) * ward.r + clusterOffset;
      const lng = ward.lng + (rand() - 0.5) * ward.r + clusterOffset;

      // Random date in last 30 days, weighted toward recent
      const daysAgo = Math.floor(rand() * 30);
      const hoursAgo = Math.floor(rand() * 24);
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);

      // Status with proper updated_at for resolved
      const statusIdx = Math.floor(rand() * STATUSES.length);
      const status = STATUSES[statusIdx];

      const updatedAt = new Date(createdAt);
      if (status === 'resolved') {
        updatedAt.setDate(updatedAt.getDate() + Math.floor(rand() * 5) + 1);
        if (updatedAt > now) updatedAt.setTime(now.getTime());
      } else if (status === 'in_progress') {
        updatedAt.setDate(updatedAt.getDate() + Math.floor(rand() * 2));
        if (updatedAt > now) updatedAt.setTime(now.getTime());
      }

      // Confidence score (mostly high, some low for demo)
      const conf = rand() > 0.2
        ? 0.75 + rand() * 0.24   // 0.75-0.99
        : 0.30 + rand() * 0.25;  // 0.30-0.55 (low confidence)

      const phone = PHONES[Math.floor(rand() * PHONES.length)];

      await client.query(
        `INSERT INTO complaints (
          description, category, confidence_score, ward_id,
          latitude, longitude, status, citizen_phone,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          c.desc,
          c.cat,
          parseFloat(conf.toFixed(4)),
          ward.id,
          parseFloat(lat.toFixed(6)),
          parseFloat(lng.toFixed(6)),
          status,
          phone,
          createdAt.toISOString(),
          updatedAt.toISOString(),
        ]
      );
      inserted++;
    }

    console.log(`Inserted ${inserted} demo complaints.`);

    // Final counts
    const final = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(DISTINCT ward_id) as wards,
        COUNT(DISTINCT category) as categories
      FROM complaints
    `);
    const stats = final.rows[0];
    console.log('\n=== Final Database Stats ===');
    console.log(`Total:       ${stats.total}`);
    console.log(`Submitted:   ${stats.submitted}`);
    console.log(`In Progress: ${stats.in_progress}`);
    console.log(`Resolved:    ${stats.resolved}`);
    console.log(`Wards:       ${stats.wards}`);
    console.log(`Categories:  ${stats.categories}`);
    console.log('\nDemo dataset seeded successfully!');
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seed();
