CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price NUMERIC(10, 2),
    category TEXT,
    image TEXT NOT NULL,
    amount_in_stock INTEGER,
    amount_sold INTEGER DEFAULT 0
);
