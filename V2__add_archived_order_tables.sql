-- V2: Add tables for delivered and cancelled orders to archive them from the main orders table.

-- Create delivered_orders table
CREATE TABLE delivered_orders (
    id INTEGER PRIMARY KEY,
    user_address_id INTEGER,
    payment_method VARCHAR(255),
    total_amount NUMERIC(10, 2),
    tax_amount NUMERIC(10, 2),
    discount_amount NUMERIC(10, 2),
    order_status VARCHAR(255),
    shipping_scheduled_date TIMESTAMP WITH TIME ZONE,
    payment_confirmed BOOLEAN,
    user_id INTEGER,
    applied_coupon_id INTEGER,
    tracking_number VARCHAR(255),
    courier_name VARCHAR(255),
    courier_website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create delivered_order_items table
CREATE TABLE delivered_order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER REFERENCES delivered_orders(id),
    product_id INTEGER,
    quantity INTEGER,
    price NUMERIC(10, 2)
);

-- Create cancelled_orders table
CREATE TABLE cancelled_orders (
    id INTEGER PRIMARY KEY,
    user_address_id INTEGER,
    payment_method VARCHAR(255),
    total_amount NUMERIC(10, 2),
    tax_amount NUMERIC(10, 2),
    discount_amount NUMERIC(10, 2),
    order_status VARCHAR(255),
    shipping_scheduled_date TIMESTAMP WITH TIME ZONE,
    payment_confirmed BOOLEAN,
    user_id INTEGER,
    applied_coupon_id INTEGER,
    tracking_number VARCHAR(255),
    courier_name VARCHAR(255),
    courier_website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Create cancelled_order_items table
CREATE TABLE cancelled_order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER REFERENCES cancelled_orders(id),
    product_id INTEGER,
    quantity INTEGER,
    price NUMERIC(10, 2)
);
