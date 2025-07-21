ALTER TABLE users ADD COLUMN bio text;
ALTER TABLE users ADD COLUMN location varchar(255);
ALTER TABLE users ADD COLUMN website varchar(255);
ALTER TABLE users ADD COLUMN social jsonb; 