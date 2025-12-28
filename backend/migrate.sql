-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_consultant_id varchar NULL;
CREATE INDEX IF NOT EXISTS ix_users_default_consultant_id ON users(default_consultant_id);

-- orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamp NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS consultant_id varchar NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ref_source varchar NULL;
CREATE INDEX IF NOT EXISTS ix_orders_consultant_id ON orders(consultant_id);
CREATE INDEX IF NOT EXISTS ix_orders_paid_at ON orders(paid_at);

-- commission_records
ALTER TABLE commission_records ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'pending';
ALTER TABLE commission_records ADD COLUMN IF NOT EXISTS rate numeric(6,4) NULL;
ALTER TABLE commission_records ADD COLUMN IF NOT EXISTS eligible_at timestamp NULL;
ALTER TABLE commission_records ADD COLUMN IF NOT EXISTS payout_id varchar NULL;

CREATE INDEX IF NOT EXISTS ix_commission_beneficiary_status ON commission_records(beneficiary_id, status);
CREATE INDEX IF NOT EXISTS ix_commission_order_id ON commission_records(order_id);
CREATE INDEX IF NOT EXISTS ix_commission_payout_id ON commission_records(payout_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_commission_beneficiary_order_type'
  ) THEN
    ALTER TABLE commission_records
      ADD CONSTRAINT uq_commission_beneficiary_order_type
      UNIQUE (beneficiary_id, order_id, type);
  END IF;
END $$;

-- payouts
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS paid_at timestamp NULL;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS method varchar NULL;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS reference varchar NULL;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS state varchar NOT NULL DEFAULT 'generated';
CREATE INDEX IF NOT EXISTS ix_payout_user_period ON payouts(user_id, period_start, period_end);