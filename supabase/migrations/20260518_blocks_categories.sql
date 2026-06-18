-- Categorias da timeline (se ainda não existirem)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE blocks
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- Seeds sugeridos (ajuste os UUIDs se necessário)
INSERT INTO categories (name, position, is_active) VALUES
  ('Pré-casamento', 1, true),
  ('Casamento', 2, true),
  ('Pós-casamento', 3, true)
ON CONFLICT DO NOTHING;
