ALTER TABLE orders ADD COLUMN IF NOT EXISTS aftercare_email_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback_token VARCHAR(96);
CREATE UNIQUE INDEX IF NOT EXISTS orders_feedback_token_idx
  ON orders(feedback_token) WHERE feedback_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS order_feedback (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_rating SMALLINT NOT NULL CHECK (product_rating BETWEEN 1 AND 5),
  service_rating SMALLINT NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
