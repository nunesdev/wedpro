-- Sub-itens na timeline: parent_id, item_type e metadata (Spotify URI, etc.)
ALTER TABLE blocks
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Valores permitidos para item_type
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_item_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_item_type_check
  CHECK (item_type IN ('event', 'music', 'task'));

-- Apenas um nível de aninhamento (filho não pode ser pai)
CREATE OR REPLACE FUNCTION check_block_parent_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM blocks parent
      WHERE parent.id = NEW.parent_id AND parent.parent_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Apenas um nível de aninhamento é permitido';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blocks_parent_depth_trigger ON blocks;
CREATE TRIGGER blocks_parent_depth_trigger
  BEFORE INSERT OR UPDATE OF parent_id ON blocks
  FOR EACH ROW EXECUTE FUNCTION check_block_parent_depth();
