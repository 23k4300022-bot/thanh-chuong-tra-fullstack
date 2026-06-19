ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS customer_email VARCHAR(180);
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS loyalty_source_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS discount_codes_loyalty_order_idx
  ON discount_codes(loyalty_source_order_id) WHERE loyalty_source_order_id IS NOT NULL;
