-- Create user_blocks table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'user_blocks'
  ) THEN
    CREATE TABLE user_blocks (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      blocked_user_id VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX uniq_user_blocks ON user_blocks (user_id, blocked_user_id);
    CREATE INDEX idx_user_blocks_user ON user_blocks (user_id);
    CREATE INDEX idx_user_blocks_blocked ON user_blocks (blocked_user_id);
  END IF;
END$$;


