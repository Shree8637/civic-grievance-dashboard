-- Civic Grievance Intelligence Dashboard — Database Schema
-- PostgreSQL

-- ============================================================
-- WARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS wards (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(10) NOT NULL UNIQUE,      -- e.g. 'A', 'F/N', 'K/E'
    full_name       VARCHAR(100),                     -- e.g. 'Fort / Colaba'
    center_lat      DECIMAL(9, 6) NOT NULL,
    center_lng      DECIMAL(9, 6) NOT NULL,
    radius_km       DECIMAL(5, 2) DEFAULT 2.0,        -- simplified boundary radius
    admin_contact   VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) DEFAULT 'admin',       -- single role for v1
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- COMPLAINTS
-- ============================================================
CREATE TYPE complaint_status AS ENUM ('submitted', 'in_progress', 'resolved');

CREATE TYPE complaint_category AS ENUM (
    'garbage',
    'water_supply',
    'drainage',
    'roads',
    'streetlights',
    'other'
);

CREATE TABLE IF NOT EXISTS complaints (
    id                  SERIAL PRIMARY KEY,
    description         TEXT NOT NULL,
    category            complaint_category,
    confidence_score    DECIMAL(5, 4),                 -- 0.0000 – 1.0000
    ward_id             INTEGER REFERENCES wards(id),
    latitude            DECIMAL(9, 6),
    longitude           DECIMAL(9, 6),
    status              complaint_status DEFAULT 'submitted',
    citizen_phone       VARCHAR(15),
    photo_url           VARCHAR(500),
    cluster_id          INTEGER,                        -- FK added after clusters table
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CLUSTERS / HOTSPOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clusters (
    id                  SERIAL PRIMARY KEY,
    category            complaint_category,
    ward_id             INTEGER REFERENCES wards(id),
    complaint_count     INTEGER DEFAULT 0,
    centroid_lat        DECIMAL(9, 6),
    centroid_lng        DECIMAL(9, 6),
    first_seen          TIMESTAMP,
    last_seen           TIMESTAMP
);

-- Now add the FK from complaints to clusters
ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_cluster
    FOREIGN KEY (cluster_id) REFERENCES clusters(id)
    ON DELETE SET NULL;

-- ============================================================
-- INDEXES for common query patterns
-- ============================================================
CREATE INDEX idx_complaints_ward       ON complaints(ward_id);
CREATE INDEX idx_complaints_category   ON complaints(category);
CREATE INDEX idx_complaints_status     ON complaints(status);
CREATE INDEX idx_complaints_created    ON complaints(created_at);
CREATE INDEX idx_complaints_phone      ON complaints(citizen_phone);
CREATE INDEX idx_complaints_cluster    ON complaints(cluster_id);
CREATE INDEX idx_clusters_ward         ON clusters(ward_id);
CREATE INDEX idx_clusters_category     ON clusters(category);
