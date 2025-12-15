ALTER TABLE delivered_orders ADD COLUMN stripe_payment_intent_id VARCHAR(255);
ALTER TABLE cancelled_orders ADD COLUMN stripe_payment_intent_id VARCHAR(255);
