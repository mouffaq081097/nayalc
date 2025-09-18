const express = require('express');
const router = express.Router();
const db = require('./db'); // Assuming db.js is in the same directory

// Middleware to check if userId is valid (optional, but good practice)
// In a real app, you'd have proper authentication/authorization middleware here
const validateUserId = (req, res, next) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid User ID.' });
    }
    req.userId = userId; // Attach userId to request object
    next();
};

// GET /api/users/:userId/cart - Get user's cart
router.get('/:userId/cart', validateUserId, (req, res) => {
    const userId = req.userId;

    const sql = `
        SELECT 
            uc.product_id AS _id,
            uc.quantity,
            p.name,
            p.price,
            COALESCE(CONCAT('http://localhost:5000/uploads/', REPLACE(pi.image_url, ' ', '%20')), 'http://localhost:5000/uploads/placeholder.jpg') as imageUrl
        FROM user_carts uc
        JOIN products p ON uc.product_id = p.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
        WHERE uc.user_id = ?;
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user cart:', err);
            return res.status(500).json({ message: 'Failed to fetch user cart.' });
        }
        // Frontend expects an array of items, each with product details and quantity
        const cart = results.map(item => ({
            product: {
                _id: item._id,
                name: item.name,
                price: item.price,
                imageUrl: item.imageUrl,
            },
            quantity: item.quantity,
        }));
        res.status(200).json({ cart });
    });
});

// PUT /api/users/:userId/cart - Update (replace) user's cart
router.put('/:userId/cart', validateUserId, async (req, res) => { // Make it async
    const userId = req.userId;
    const { cart } = req.body; // Expects { cart: [{ productId, quantity }] }

    if (!Array.isArray(cart)) {
        return res.status(400).json({ message: 'Cart data must be an array.' });
    }

    let connection; // Declare connection outside try-catch for finally block
    try {
        connection = await db.promise().getConnection(); // Get a connection
        await connection.beginTransaction(); // Start transaction

        // 1. Delete existing cart items for the user
        const deleteSql = 'DELETE FROM user_carts WHERE user_id = ?;';
        await connection.query(deleteSql, [userId]);

        // 2. Insert new cart items if the cart is not empty
        if (cart.length > 0) {
            const insertSql = 'INSERT INTO user_carts (user_id, product_id, quantity) VALUES ?;';
            const values = cart.map(item => [userId, item.product._id, item.quantity]);
            await connection.query(insertSql, [values]);
        }

        await connection.commit(); // Commit transaction
        res.status(200).json({ message: 'Cart updated successfully.' });

    } catch (err) {
        if (connection) await connection.rollback(); // Rollback on error
        console.error('Error updating cart:', err);
        res.status(500).json({ message: 'Failed to update cart.' });
    } finally {
        if (connection) connection.release(); // Release connection
    }
});

module.exports = router;