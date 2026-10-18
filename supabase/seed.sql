-- =============================================================================
-- Prayatna Companion — Realistic Seed Data (supabase/seed.sql)
-- Features: 3 Teams, 10 Schedule Events across 2 Days (with midnight crossing),
--           4 Problem Statements (2 past, 2 future), 3 Announcements (1 urgent),
--           2 Bus Routes (Indore & Bhopal with 5 stops + path coordinates),
--           and Published Leaderboard Entries across 2 Rounds with an exact tie.
-- =============================================================================

-- =============================================================================
-- 1. TEAMS
-- =============================================================================
insert into public.teams (id, name, team_code, created_at)
values
  ('d1111111-1111-4111-a111-111111111111', 'Algorhythms', 'ALGO-2026', now() - interval '2 days'),
  ('d2222222-2222-4222-a222-222222222222', 'ByteCoders', 'BYTE-4040', now() - interval '2 days'),
  ('d3333333-3333-4333-a333-333333333333', 'NeuralKnights', 'NEUR-8080', now() - interval '2 days')
on conflict (id) do update set
  name = excluded.name,
  team_code = excluded.team_code;

-- =============================================================================
-- 2. SCHEDULE EVENTS (10 Events across 2 Days, including midnight crossing)
-- =============================================================================
insert into public.schedule_events (id, title, description, location, event_type, starts_at, ends_at, created_at)
values
  -- Day 1
  (
    'e1111111-0001-4000-a000-000000000001',
    'Registration & Hacker Kit Collection',
    'Check-in at the front registration desk, receive your RFID identity badge and official Prayatna swag pack.',
    'Main Entrance Foyer, Block A',
    'session',
    '2026-10-24 08:30:00+05:30',
    '2026-10-24 10:00:00+05:30',
    now()
  ),
  (
    'e1111111-0002-4000-a000-000000000002',
    'Opening Ceremony & Keynote Address',
    'Inauguration by academic leaders, introduction of mentors and judges, and overview of hackathon tracks.',
    'Auditorium 1 (Dr. APJ Abdul Kalam Hall)',
    'ceremony',
    '2026-10-24 10:00:00+05:30',
    '2026-10-24 11:30:00+05:30',
    now()
  ),
  (
    'e1111111-0003-4000-a000-000000000003',
    'Track Architecture & API Masterclass',
    'Technical deep-dive on available APIs, cloud sandboxes, and edge computing dev-boards.',
    'Seminar Hall 2, Innovation Wing',
    'workshop',
    '2026-10-24 11:30:00+05:30',
    '2026-10-24 13:00:00+05:30',
    now()
  ),
  (
    'e1111111-0004-4000-a000-000000000004',
    'Networking Lunch & Team Strategy Sync',
    'Buffet lunch served in the cafeteria. Teams align on milestone planning and consult assigned mentors.',
    'Central Campus Dining Hall',
    'meal',
    '2026-10-24 13:00:00+05:30',
    '2026-10-24 14:30:00+05:30',
    now()
  ),
  (
    'e1111111-0005-4000-a000-000000000005',
    'Hacking Phase 1: Core Systems & Scaffolding',
    'Sprint 1 hacking starts. Build base repositories, database schemas, and data pipelines.',
    'Main Hacking Arena (Ground & 1st Floor)',
    'jamming',
    '2026-10-24 14:30:00+05:30',
    '2026-10-24 20:00:00+05:30',
    now()
  ),
  (
    'e1111111-0006-4000-a000-000000000006',
    'Round 1 Evaluation: Architecture Review',
    'Jury walkthrough at team booths to evaluate problem understanding, feasibility, and architecture.',
    'Team Pods, Main Arena',
    'judging',
    '2026-10-24 20:00:00+05:30',
    '2026-10-24 22:00:00+05:30',
    now()
  ),
  -- Midnight Crossing Event (Starts Oct 24 22:30 IST, ends Oct 25 02:00 IST)
  (
    'e1111111-0007-4000-a000-000000000007',
    'Midnight Jam, RedBull Boost & Lightning Demos',
    'Midnight sprint fuel, music, redbull station, and optional 60-second lightning progress demos.',
    'Open Courtyard & Arena Stage',
    'jamming',
    '2026-10-24 22:30:00+05:30',
    '2026-10-25 02:00:00+05:30',
    now()
  ),
  -- Day 2
  (
    'e1111111-0008-4000-a000-000000000008',
    'Sunrise Breakfast & Morning Caffeine Fuel',
    'Fresh breakfast, poha-jalebi, and hot tea/coffee to recharge before final push.',
    'Central Campus Dining Hall',
    'meal',
    '2026-10-25 07:30:00+05:30',
    '2026-10-25 09:00:00+05:30',
    now()
  ),
  (
    'e1111111-0009-4000-a000-000000000009',
    'Final Code Freeze & Round 2 Pitching',
    'All repositories freeze. Teams deliver a 4-minute live demonstration followed by 2 minutes Q&A.',
    'Auditorium 1 & Screening Rooms A-D',
    'judging',
    '2026-10-25 11:00:00+05:30',
    '2026-10-25 15:00:00+05:30',
    now()
  ),
  (
    'e1111111-0010-4000-a000-000000000010',
    'Grand Valedictory & Prize Distribution',
    'Celebration ceremony, sponsor felicitations, track winners announcement, and cash prize awards.',
    'Auditorium 1 (Dr. APJ Abdul Kalam Hall)',
    'ceremony',
    '2026-10-25 16:00:00+05:30',
    '2026-10-25 18:00:00+05:30',
    now()
  )
on conflict (id) do update set
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at;

-- =============================================================================
-- 3. PROBLEM STATEMENTS (4 Statements: 2 released in past, 2 in future)
-- =============================================================================
insert into public.problem_statements (id, code, title, description, domain, difficulty, release_at, created_at)
values
  -- Released in the past (accessible to participants)
  (
    'p1111111-0001-4000-a000-000000000001',
    'PRB-AI-01',
    'Autonomous Multi-Modal Emergency Dispatch Routing',
    'Design a real-time dispatch coordinator that prioritizes emergency calls based on acoustic analysis and computes dynamic traffic routes across city corridors using live sensor telemetry.',
    'Artificial Intelligence',
    'Hard',
    now() - interval '12 hours',
    now() - interval '1 day'
  ),
  (
    'p1111111-0002-4000-a000-000000000002',
    'PRB-FIN-02',
    'Decentralized Micro-Credit Verification for Rural Artisans',
    'Build a verifiable credential protocol enabling informal artisans to tokenize verified inventory and receive micro-loans without traditional collateral or credit history.',
    'FinTech & Web3',
    'Medium',
    now() - interval '4 hours',
    now() - interval '1 day'
  ),
  -- In the future (locked for participants, visible via next_problem_release countdown)
  (
    'p1111111-0003-4000-a000-000000000003',
    'PRB-HLT-03',
    'Edge-AI Predictive Diagnostics for Portable Ultrasound Devices',
    'Develop an ultra-low-latency on-device computer vision model to detect organ anomalies from portable point-of-care ultrasound devices in remote village healthcare clinics.',
    'HealthTech & Edge Computing',
    'Hard',
    now() + interval '8 hours',
    now()
  ),
  (
    'p1111111-0004-4000-a000-000000000004',
    'PRB-IOT-04',
    'Smart Campus Grid Anomaly Detection via LoRaWAN Telemetry',
    'Implement a predictive maintenance mesh network that monitors commercial campus transformer loads and water distribution valves to anticipate equipment failures.',
    'IoT & Smart Infrastructure',
    'Medium',
    now() + interval '24 hours',
    now()
  )
on conflict (code) do update set
  title = excluded.title,
  release_at = excluded.release_at;

-- =============================================================================
-- 4. ANNOUNCEMENTS (3 Announcements: normal, important, urgent)
-- =============================================================================
insert into public.announcements (id, title, body, priority, created_at)
values
  (
    'a1111111-0001-4000-a000-000000000001',
    'Campus Wi-Fi Credentials & Subnet Information',
    'Connect your dev laptops to "Prayatna-5G" using the passphrase "H@ckIndore2026!". Internal API mock servers and test databases are hosted on subnet 10.20.0.0/16.',
    'normal',
    now() - interval '6 hours'
  ),
  (
    'a1111111-0002-4000-a000-000000000002',
    'Round 1 GitHub Repository Verification Deadline',
    'All teams must register their public GitHub repository link in the Prayatna Companion app before 07:30 PM. Commit logs will be sampled automatically.',
    'important',
    now() - interval '2 hours'
  ),
  (
    'a1111111-0003-4000-a000-000000000003',
    'CRITICAL: Campus Gateway Router Maintenance Window',
    'The campus network gateway will undergo a scheduled firmware reboot between 01:15 AM and 01:30 AM IST. Commit changes locally during this brief 15-minute window!',
    'urgent',
    now() - interval '30 minutes'
  )
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  priority = excluded.priority;

-- =============================================================================
-- 5. BUS TRANSIT ROUTES & STOPS (Indore City Transit + Bhopal Intercity Shuttle)
-- =============================================================================

-- Route 1: Indore City Transit Express
insert into public.bus_routes (id, name, description, color, origin_city, departs_at, sort_order, created_at)
values
  (
    'b1111111-0001-4000-a000-000000000001',
    'Indore City Transit Express',
    'High-frequency circuit connecting central Indore railway terminal, Rajwada, and Palasia to the Prayatna campus.',
    '#00F0FF',
    'Indore',
    '2026-10-24 07:30:00+05:30',
    1,
    now()
  ),
  -- Route 2: Bhopal Intercity Hacker Shuttle
  (
    'b2222222-0002-4000-a000-000000000002',
    'Bhopal Intercity Hacker Shuttle',
    'Dedicated long-distance intercity transit for participants arriving from Bhopal, Sehore, and Dewas.',
    '#10B981',
    'Bhopal',
    '2026-10-24 05:00:00+05:30',
    2,
    now()
  )
on conflict (id) do update set
  name = excluded.name,
  origin_city = excluded.origin_city;

-- Route 1 Stops (Indore - 5 Stops)
insert into public.bus_stops (id, route_id, name, latitude, longitude, stop_order, scheduled_time, notes, created_at)
values
  (
    'c1111111-0001-4000-a000-000000000001',
    'b1111111-0001-4000-a000-000000000001',
    'Rajwada Historical Gate',
    22.7186,
    75.8550,
    1,
    '2026-10-24 07:30:00+05:30',
    'Pickup point opposite the main Rajwada Palace arch.',
    now()
  ),
  (
    'c1111111-0002-4000-a000-000000000002',
    'b1111111-0001-4000-a000-000000000001',
    'Indore Junction Platform 1 Circle',
    22.7195,
    75.8670,
    2,
    '2026-10-24 07:45:00+05:30',
    'Main railway station portico, city bus terminal bay 3.',
    now()
  ),
  (
    'c1111111-0003-4000-a000-000000000003',
    'b1111111-0001-4000-a000-000000000001',
    'Old Palasia Square Bus Shelter',
    22.7230,
    75.8840,
    3,
    '2026-10-24 08:00:00+05:30',
    'BRTS corridor stop on AB Road.',
    now()
  ),
  (
    'c1111111-0004-4000-a000-000000000004',
    'b1111111-0001-4000-a000-000000000001',
    'Vijay Nagar C21 Mall Junction',
    22.7533,
    75.8937,
    4,
    '2026-10-24 08:20:00+05:30',
    'Commercial hub stop near metro pillar 104.',
    now()
  ),
  (
    'c1111111-0005-4000-a000-000000000005',
    'b1111111-0001-4000-a000-000000000001',
    'Prayatna Hackathon Campus Terminal',
    22.7244,
    75.8713,
    5,
    '2026-10-24 08:45:00+05:30',
    'Main campus gate security entrance.',
    now()
  )
on conflict (route_id, stop_order) do update set
  name = excluded.name,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

-- Route 2 Stops (Bhopal - 5 Stops)
insert into public.bus_stops (id, route_id, name, latitude, longitude, stop_order, scheduled_time, notes, created_at)
values
  (
    'c2222222-0001-4000-a000-000000000001',
    'b2222222-0002-4000-a000-000000000002',
    'ISBT Terminal (Habibganj), Bhopal',
    23.2185,
    77.4350,
    1,
    '2026-10-24 05:00:00+05:30',
    'Platform 4, Inter-State Bus Terminal Bhopal.',
    now()
  ),
  (
    'c2222222-0002-4000-a000-000000000002',
    'b2222222-0002-4000-a000-000000000002',
    'Lalghati Chauraha, Bhopal',
    23.2842,
    77.3620,
    2,
    '2026-10-24 05:30:00+05:30',
    'Airport bypass junction, western Bhopal exit.',
    now()
  ),
  (
    'c2222222-0003-4000-a000-000000000003',
    'b2222222-0002-4000-a000-000000000002',
    'Sehore Crescent Highway Junction',
    23.2030,
    77.0850,
    3,
    '2026-10-24 06:15:00+05:30',
    'Bhopal-Indore State Highway 18 food hub stop.',
    now()
  ),
  (
    'c2222222-0004-4000-a000-000000000004',
    'b2222222-0002-4000-a000-000000000002',
    'Dewas Bypass Toll Square',
    22.9650,
    76.0540,
    4,
    '2026-10-24 07:30:00+05:30',
    'Flyover terminal on eastern entrance to Indore metropolitan area.',
    now()
  ),
  (
    'c2222222-0005-4000-a000-000000000005',
    'b2222222-0002-4000-a000-000000000002',
    'Prayatna Hackathon Campus Terminal',
    22.7244,
    75.8713,
    5,
    '2026-10-24 08:30:00+05:30',
    'Campus main portico arrival for Bhopal delegates.',
    now()
  )
on conflict (route_id, stop_order) do update set
  name = excluded.name,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

-- Route Paths (JSON coordinate polylines)
insert into public.bus_route_paths (id, route_id, points, created_at)
values
  (
    'd1111111-0001-4000-a000-000000000001',
    'b1111111-0001-4000-a000-000000000001',
    '[
      {"lat": 22.7186, "lng": 75.8550},
      {"lat": 22.7195, "lng": 75.8670},
      {"lat": 22.7230, "lng": 75.8840},
      {"lat": 22.7410, "lng": 75.8890},
      {"lat": 22.7533, "lng": 75.8937},
      {"lat": 22.7350, "lng": 75.8800},
      {"lat": 22.7244, "lng": 75.8713}
    ]'::jsonb,
    now()
  ),
  (
    'd2222222-0002-4000-a000-000000000002',
    'b2222222-0002-4000-a000-000000000002',
    '[
      {"lat": 23.2185, "lng": 77.4350},
      {"lat": 23.2450, "lng": 77.3980},
      {"lat": 23.2842, "lng": 77.3620},
      {"lat": 23.2030, "lng": 77.0850},
      {"lat": 23.0500, "lng": 76.5000},
      {"lat": 22.9650, "lng": 76.0540},
      {"lat": 22.8200, "lng": 75.9500},
      {"lat": 22.7244, "lng": 75.8713}
    ]'::jsonb,
    now()
  )
on conflict (id) do update set
  points = excluded.points;

-- =============================================================================
-- 6. LEADERBOARD ENTRIES (Published entries across 2 rounds with an exact tie)
-- Round 1: Algorhythms (85.0), ByteCoders (90.0), NeuralKnights (85.0)
-- Round 2: Algorhythms (90.0), ByteCoders (85.0), NeuralKnights (82.0)
-- Totals:
--   - Algorhythms:  85.0 + 90.0 = 175.0 (TIE for Rank 1)
--   - ByteCoders:   90.0 + 85.0 = 175.0 (TIE for Rank 1)
--   - NeuralKnights: 85.0 + 82.0 = 167.0 (Rank 2)
-- =============================================================================
insert into public.leaderboard_entries (id, team_id, round_name, score, published, updated_at)
values
  -- Round 1: Architecture & Feasibility
  (
    'l1111111-0001-4000-a000-000000000001',
    'd1111111-1111-4111-a111-111111111111',
    'Round 1: Architecture Review',
    85.0,
    true,
    now() - interval '6 hours'
  ),
  (
    'l1111111-0002-4000-a000-000000000002',
    'd2222222-2222-4222-a222-222222222222',
    'Round 1: Architecture Review',
    90.0,
    true,
    now() - interval '6 hours'
  ),
  (
    'l1111111-0003-4000-a000-000000000003',
    'd3333333-3333-4333-a333-333333333333',
    'Round 1: Architecture Review',
    85.0,
    true,
    now() - interval '6 hours'
  ),
  -- Round 2: Prototype & Pitch Demonstration
  (
    'l1111111-0004-4000-a000-000000000004',
    'd1111111-1111-4111-a111-111111111111',
    'Round 2: Prototype Implementation',
    90.0,
    true,
    now() - interval '1 hour'
  ),
  (
    'l1111111-0005-4000-a000-000000000005',
    'd2222222-2222-4222-a222-222222222222',
    'Round 2: Prototype Implementation',
    85.0,
    true,
    now() - interval '1 hour'
  ),
  (
    'l1111111-0006-4000-a000-000000000006',
    'd3333333-3333-4333-a333-333333333333',
    'Round 2: Prototype Implementation',
    82.0,
    true,
    now() - interval '1 hour'
  )
on conflict (team_id, round_name) do update set
  score = excluded.score,
  published = excluded.published,
  updated_at = now();
