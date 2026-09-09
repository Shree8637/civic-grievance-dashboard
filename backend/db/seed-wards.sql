-- Seed data: 8 Mumbai wards (subset) with approximate center coordinates
-- Coordinates sourced from approximate geographic centers of each ward area

INSERT INTO wards (name, full_name, center_lat, center_lng, radius_km) VALUES
    ('A',    'Colaba / Fort',          18.9220, 72.8347, 1.8),
    ('C',    'Byculla / Mazgaon',      18.9780, 72.8340, 1.5),
    ('F/N',  'Matunga / Sion',         19.0430, 72.8650, 2.0),
    ('G/S',  'Worli / Prabhadevi',     19.0170, 72.8150, 1.8),
    ('H/W',  'Bandra West / Khar',     19.0600, 72.8350, 2.0),
    ('K/E',  'Andheri East / Sakinaka',19.1190, 72.8680, 2.5),
    ('L',    'Kurla',                  19.0730, 72.8790, 2.2),
    ('P/S',  'Goregaon',              19.1550, 72.8490, 2.5);
