-- Ensure a user can vote only once per bill
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'uniq_votes_user_bill'
  ) THEN
    ALTER TABLE votes
    ADD CONSTRAINT uniq_votes_user_bill UNIQUE (user_id, bill_id);
  END IF;
END$$;


