const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const router = express.Router();

// --- User Signup Endpoint ---
router.post('/signup', async (req, res) => {
    console.log('Backend: POST /api/users/signup received!');
    const { username, email, password } = req.body;

    // Server-side validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    try {
        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

        // Insert user data into the 'users' table
        const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error during user signup:', err);
                // Handle duplicate entry errors specifically
                if (err.code === 'ER_DUP_ENTRY') {
                    if (err.message.includes('username')) {
                        return res.status(409).json({ message: 'Username already exists. Please choose a different one.' });
                    }
                    if (err.message.includes('email')) {
                        return res.status(409).json({ message: 'Email address is already registered. Please sign in or use a different email.' });
                    }
                }
                return res.status(500).json({ message: 'Internal server error during signup.', error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully!', user: { id: result.insertId, username, email } });
        });
    } catch (error) {
        console.error('Password hashing error:', error);
        res.status(500).json({ message: 'Internal server error during password processing.' });
    }
});

// --- User Login Endpoint ---
router.post('/login', async (req, res) => {
    console.log('Backend: POST /api/users/login received!');
    const { email, password } = req.body;

    // Server-side validation for login
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find user by email
        const sql = 'SELECT id, username, email, password_hash FROM users WHERE email = ?';
        db.query(sql, [email], async (err, results) => {
            if (err) {
                console.error('Error during user login query:', err);
                return res.status(500).json({ message: 'Internal server error during login.' });
            }

            // Check if user exists
            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials.' }); // Use generic message for security
            }

            const user = results[0];

            // Compare provided password with hashed password from database
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (isMatch) {
                // Password matches! User is authenticated.
                // In a real application, you'd generate a JWT here and send it to the client.
                return res.status(200).json({ message: 'Login successful!', user: { id: user.id, username: user.username, email: user.email } });
            } else {
                // Password does not match
                return res.status(401).json({ message: 'Invalid credentials.' }); // Use generic message for security
            }
        });
    } catch (error) {
        console.error('Login processing error:', error);
        res.status(500).json({ message: 'Internal server error during login process.' });
    }
});

// GET user's past purchased items for "Buy It Again"
router.get('/:userId/buy-again', async (req, res) => {
    const { userId } = req.params;
    try {
        // Fetch all orders for the user
        const [orders] = await db.promise().query('SELECT items FROM orders WHERE user_id = ?', [userId]);

        const productIds = new Set();
        orders.forEach(order => {
            try {
                const items = JSON.parse(order.items);
                items.forEach(item => productIds.add(item.id));
            } catch (parseError) {
                console.error('Error parsing order items JSON:', parseError);
            }
        });

        if (productIds.size === 0) {
            return res.json([]); // No past purchases
        }

        // Fetch details for unique products
        const productDetailsSql = `
            SELECT p.id, p.name, p.price, CONCAT(?, pi.image_url) as imageUrl, p.stock_quantity
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
            WHERE p.id IN (?)
        `;
        const [buyAgainProducts] = await db.promise().query(productDetailsSql, [IMAGE_BASE_PATH, [...productIds]]);
        res.json(buyAgainProducts);

    } catch (err) {
        console.error('Error fetching buy again items:', err);
        res.status(500).json({ message: 'Error fetching past purchases.' });
    }
});

// Update user contact information (in the first address)
router.put('/:userId/contact-info', async (req, res) => {
    const { userId } = req.params;
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ message: 'Name and phone are required.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Find the first address for this user
        const [addresses] = await connection.query('SELECT id FROM user_addresses WHERE user_id = ? LIMIT 1', [userId]);

        if (addresses.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'No address found for this user to update contact info.' });
        }

        const addressId = addresses[0].id;

        // Update customer_name and customer_phone in that address
        const updateAddressSql = 'UPDATE user_addresses SET customer_name = ?, customer_phone = ? WHERE id = ? AND user_id = ?';
        const [updateResult] = await connection.query(updateAddressSql, [name, phone, addressId, userId]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Address not found or no changes made.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Contact information updated successfully in address.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error updating contact information in address:', error);
        res.status(500).json({ message: 'Failed to update contact information in address.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
