-- Al Habeeb Construction & Engineering - database schema + starter data.
-- Safe to run more than once (IF NOT EXISTS / ON CONFLICT DO NOTHING).

CREATE TABLE IF NOT EXISTS services (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'building',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id         SERIAL PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  location   TEXT NOT NULL,
  category   TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('Design Concept', 'Under Construction', 'Completed')),
  summary    TEXT NOT NULL,
  image_url  TEXT,            -- path of a picture in frontend/public/images, or a full URL
  floors     INTEGER CHECK (floors IS NULL OR floors > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  service    TEXT,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for the lookups the site/admin actually does
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services (sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_status      ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_category    ON projects (category);
CREATE INDEX IF NOT EXISTS idx_inquiries_status      ON inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at  ON inquiries (created_at DESC);

-- Keep updated_at current on edits (needed once an admin panel can edit rows)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO services (title, description, icon, sort_order) VALUES
  ('Residential Construction',    'Villas, apartment buildings and housing developments built to a high standard of finish.', 'home',      1),
  ('Commercial Construction',     'Offices, retail and mixed-use towers delivered on programme and on budget.',                'building',  2),
  ('Civil Engineering Solutions', 'Structural design, foundations, infrastructure and site engineering.',                      'gear',      3),
  ('Renovation & Remodeling',     'Upgrades, extensions and refurbishment of existing buildings with minimal disruption.',     'crane',     4),
  ('Project Planning & Design',   'Feasibility, drawings, 3D coordination and cost planning from concept to tender.',          'blueprint', 5),
  ('Quality, Safety & Compliance','Site safety, inspections and full compliance with authority requirements.',                 'shield',    6)
ON CONFLICT (title) DO NOTHING;

-- Remove the services from the first version of the site (does nothing if they are not there).
DELETE FROM services WHERE title IN
  ('General Contracting', 'Structural Engineering', 'Façade Systems', 'MEP Works', 'Project Management', 'Interior Fit-out');

INSERT INTO projects (slug, title, location, category, status, summary, image_url, floors) VALUES
  ('al-habeeb-tower',
   'Al Habeeb Tower - Structural & Façade Systems', 'Dubai', 'Commercial', 'Design Concept',
   'A 30-storey smart tower concept with a glass curtain wall and a LEED Platinum target.',
   '/images/concept-board.jpg', 30),
  ('commercial-tower-site',
   'Commercial Tower', 'Dubai', 'Commercial', 'Under Construction',
   'Reinforced concrete frame with glazed façade currently rising on site.',
   '/images/site-progress.jpg', 18),
  ('glass-tower-facade',
   'Glass Tower - Façade Installation', 'Dubai', 'Commercial', 'Under Construction',
   'Steel frame topped out with unitised glass curtain wall panels being installed floor by floor.',
   '/images/tower-facade-view.jpg', 40)
ON CONFLICT (slug) DO NOTHING;

-- Remove the old placeholder project from the first version (does nothing if it is not there).
DELETE FROM projects WHERE slug = 'coming-soon-residential';