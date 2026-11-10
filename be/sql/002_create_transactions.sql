CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id),
    type TEXT NOT NULL check (type IN ('debt', 'payment')),
    amount BIGINT NOT NULL check (amount > 0)
);