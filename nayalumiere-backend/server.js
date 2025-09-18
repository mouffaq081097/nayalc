require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // For generating OTPs

const db = require('./src/db');
const usersRoutes = require('./src/users');
const addressesRoutes = require('./src/addresses');
const productsRoutes = require('./src/products');
const brandsRoutes = require('./src/brands');
const categoriesRoutes = require('./src/categories');
const ordersRoutes = require('./src/orders');
const cartRoutes = require('./src/cart'); // New: Import cart routes

const app = express();
const port = 5000;

// --- Constants ---
const UPLOADS_DIR = path.join(__dirname, 'public/uploads'); // Define uploads directory

// --- Middleware Setup ---
app.use(cors()); // Enable CORS for cross-origin requests from your Next.js frontend
app.use(bodyParser.json()); // To parse JSON bodies from incoming requests
app.use(bodyParser.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use('/uploads', express.static(UPLOADS_DIR)); // Serve static files from UPLOADS_DIR (for product images)

// --- Nodemailer Transporter (for sending emails) ---
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your email service (e.g., 'Outlook365', 'SendGrid')
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS  // Your email password or app-specific password
    }
});

// --- OTP Storage (In-Memory - NOT FOR PRODUCTION) ---
const otpStore = {}; // { email: { otp: '...', expiry: Date } }

// --- API Endpoints for OTP ---

// Endpoint to send OTP
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

    // Store OTP (in a real app, this would be in a database)
    otpStore[email] = { otp, expiry };
    

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for ihealthcare.ae',
        text: `Your One-Time Password (OTP) is: ${otp}. It is valid for 5 minutes.`,
        html: `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
});

// Endpoint to verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const storedOtpData = otpStore[email];

    if (!storedOtpData) {
        return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
    }

    if (storedOtpData.expiry < new Date()) {
        delete otpStore[email]; // Clear expired OTP
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (storedOtpData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // OTP is valid. In a real app, you'd now proceed with login/password reset/registration.
    // For this example, we'll just confirm verification.
    delete otpStore[email]; // OTP used, remove it
    res.status(200).json({ message: 'OTP verified successfully!' });
});

// --- Database Schema Setup ---
    const setupDatabase = () => {
        const addColumnIfNotExists = (tableName, columnName, columnDefinition) => {
            const checkColumnSql = `
                SELECT * 
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                AND table_name = ? 
                AND column_name = ?;
            `;
            const addColumnSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`;

            db.query(checkColumnSql, [tableName, columnName], (err, results) => {
                if (err) {
                    console.error(`Error checking for column ${columnName} in ${tableName}:`, err);
                    process.exit(1);
                }
                if (results.length === 0) {
                    db.query(addColumnSql, (err, addResult) => {
                        if (err) {
                            console.error(`Error adding column ${columnName} to ${tableName}:`, err);
                            process.exit(1);
                        }
                        
                    });
                } else {
                    
                }
            });
        };

        const createCategoryProductsTable = `
            CREATE TABLE IF NOT EXISTS category_products (
                category_id INT NOT NULL,
                product_id INT NOT NULL,
                PRIMARY KEY (category_id, product_id),
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        `;

        db.query(createCategoryProductsTable, (err, results) => {
            if (err) {
                console.error("Error creating 'category_products' table:", err);
                process.exit(1);
            }
            

            // Add columns to categories table safely
            addColumnIfNotExists('categories', 'description', 'TEXT');
            addColumnIfNotExists('categories', 'image_url', 'VARCHAR(255) NULL');
        });

        const createProductClicksTable = `
            CREATE TABLE IF NOT EXISTS product_clicks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                user_id INT,
                clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `;
        db.query(createProductClicksTable, (err, results) => {
            if (err) {
                console.error("Error creating 'product_clicks' table:", err);
                process.exit(1);
            }
            
        });

        const createWishlistsTable = `
            CREATE TABLE IF NOT EXISTS wishlists (
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        `;
        db.query(createWishlistsTable, (err, results) => {
            if (err) {
                console.error("Error creating 'wishlists' table:", err);
                process.exit(1);
            }
            
        });

        // --- START: Order Items Table Setup ---
        const createOrderItemsTable = `
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        `;
        db.query(createOrderItemsTable, (err, results) => {
            if (err) {
                console.error("Error creating 'order_items' table:", err);
                process.exit(1);
            }
            
        });
        // --- END: Order Items Table Setup ---

        // Add user_id to orders table safely
        addColumnIfNotExists('orders', 'user_id', 'INT NULL'); // Assuming user_id can be null for guest orders

        const createAddressesTable = `
            CREATE TABLE IF NOT EXISTS user_addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                address_line1 VARCHAR(255) NOT NULL,
                address_line2 VARCHAR(255),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100),
                zip_code VARCHAR(20),
                country VARCHAR(100) NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        db.query(createAddressesTable, (err, results) => {
            if (err) {
                console.error("Error creating 'user_addresses' table:", err);
                process.exit(1);
            }
            
            addColumnIfNotExists('user_addresses', 'address_line1', 'VARCHAR(255) NOT NULL');
            addColumnIfNotExists('user_addresses', 'address_line2', 'VARCHAR(255)');
            addColumnIfNotExists('user_addresses', 'city', 'VARCHAR(100) NOT NULL');
            addColumnIfNotExists('user_addresses', 'state', 'VARCHAR(100)');
            addColumnIfNotExists('user_addresses', 'zip_code', 'VARCHAR(20)');
            addColumnIfNotExists('user_addresses', 'country', 'VARCHAR(100) NOT NULL');
            addColumnIfNotExists('user_addresses', 'is_default', 'BOOLEAN DEFAULT FALSE');
            addColumnIfNotExists('user_addresses', 'address_label', 'VARCHAR(255) NULL');
            addColumnIfNotExists('user_addresses', 'customer_name', 'VARCHAR(255) NULL');
            addColumnIfNotExists('user_addresses', 'customer_email', 'VARCHAR(255) NULL');
            addColumnIfNotExists('user_addresses', 'customer_phone', 'VARCHAR(20) NULL');
            addColumnIfNotExists('user_addresses', 'shipping_address', 'VARCHAR(255) NULL');
        });

        // Add new columns to products table safely
        
        addColumnIfNotExists('products', 'long_description', 'TEXT');
        addColumnIfNotExists('products', 'benefits', 'TEXT');
        addColumnIfNotExists('products', 'how_to_use', 'TEXT');
        addColumnIfNotExists('products', 'specs', 'TEXT');
        addColumnIfNotExists('products', 'autoship_save', 'BOOLEAN DEFAULT FALSE');
        addColumnIfNotExists('products', 'gtin', 'VARCHAR(255)');
        addColumnIfNotExists('products', 'product_dimensions', 'TEXT');
        addColumnIfNotExists('products', 'item_weight', 'VARCHAR(255)');
        addColumnIfNotExists('products', 'item_model_number', 'VARCHAR(255)');
        addColumnIfNotExists('products', 'unit_count', 'INT');

        // Add new columns to brands table safely
        addColumnIfNotExists('brands', 'imageUrl', 'VARCHAR(255)');

        const createProductImagesTable = `
            CREATE TABLE IF NOT EXISTS product_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                is_main BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        `;
        db.query(createProductImagesTable, (err, results) => {
            if (err) {
                console.error("Error creating 'product_images' table:", err);
                process.exit(1);
            }
            
        });

        // --- START: Cart Table Setup ---
        const createUserCartsTable = `
            CREATE TABLE IF NOT EXISTS user_carts (
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                PRIMARY KEY (user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
        `;
        db.query(createUserCartsTable, (err, results) => {
            if (err) {
                console.error("Error creating 'user_carts' table:", err);
                process.exit(1);
            }
            
        });
        // --- END: Cart Table Setup ---
    };
    
setupDatabase();

// --- API Routes ---
app.use('/api/users', usersRoutes);
app.use('/api/users/:userId/addresses', addressesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', cartRoutes); // New: Use cart routes


// --- Multer and General Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error("Backend Global Error Handler: ", err);
    res.setHeader('Content-Type', 'application/json');

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `File upload error: ${err.message}`, errorType: 'MulterError' });
    } else if (err) {
        const errorMessage = err.message.includes('An image with the name') ? err.message : `An unexpected server error occurred: ${err.message}`;
        return res.status(500).json({ message: errorMessage, errorType: 'GenericError' });
    }
    next();
});

// Start the server
// app.listen(port, () => {
//     console.log(`Backend server running on port ${port}`);
//     console.log(`NEXT_PUBLIC_BACKEND_URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}`);
// });

module.exports = app;
