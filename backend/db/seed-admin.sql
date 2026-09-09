-- Seed data: default admin user
-- Password: admin123 (bcrypt hash generated at setup time)
-- This is a demo/academic project — hardcoded credentials are acceptable

INSERT INTO admin_users (name, email, password_hash, role) VALUES
    ('Admin User', 'admin@grievance.local', '$2a$10$placeholder_hash_replace_at_setup', 'admin');
