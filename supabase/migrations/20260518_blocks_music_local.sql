-- Permite item_type 'music_local' para upload de MP3
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_item_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_item_type_check
  CHECK (item_type IN ('event', 'music', 'music_local', 'task'));
