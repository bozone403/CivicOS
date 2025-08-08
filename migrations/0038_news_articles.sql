CREATE TABLE IF NOT EXISTS news_articles (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  content text,
  url varchar UNIQUE,
  source varchar,
  author varchar,
  category varchar,
  published_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  summary text,
  bias varchar,
  credibility_score numeric(3,2)
);

CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON news_articles(source);
-- Optional extension-based index; ensure pg_trgm exists before creating in production


