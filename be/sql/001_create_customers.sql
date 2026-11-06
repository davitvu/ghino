CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL  CHECK(btrim(name) <> ''),
    phone TEXT
);