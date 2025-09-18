const express = require('express');
const db = require('./db');
const router = express.Router({ mergeParams: true });

// ADD a new address for a user
router.post('/', async (req, res) => {
    
    const { userId } = req.params;
    const { address_line1, address_line2, city, state, zip_code, country, is_default, address_label = 'Other', customer_name = '', customer_email = '', customer_phone = '' } = req.body;

    if (!address_line1 || !city || !country) {
        return res.status(400).json({ message: 'Address Line 1, City, and Country are required.' });
    }

    try {
        // If new address is set as default, update existing default address for this user
        if (is_default) {
            await db.promise().query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        }

        const sql = 'INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, zip_code, country, is_default, address_label, customer_name, customer_email, customer_phone, shipping_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await db.promise().query(sql, [userId, address_line1, address_line2, city, state, zip_code, country, is_default, address_label, customer_name, customer_email, customer_phone, address_line1]);
        res.status(201).json({ message: 'Address added successfully', addressId: result.insertId });
    } catch (err) {
        console.error('Error adding address:', err);
        res.status(500).json({ message: 'Error adding address.' });
    }
});

// GET all addresses for a user
router.get('/', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.promise().query('SELECT id, user_id, address_line1, address_line2, city, state, zip_code, country, is_default, address_label, customer_name, customer_email, customer_phone, created_at, updated_at FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching addresses:', err);
        res.status(500).json({ message: 'Error fetching addresses.' });
    }
});

// UPDATE an existing address
router.put('/:addressId', async (req, res) => {
    const { userId, addressId } = req.params;
    const { address_line1, address_line2, city, state, zip_code, country, is_default, address_label, customer_name, customer_email, customer_phone } = req.body;

    if (!address_line1 || !city || !country) {
        return res.status(400).json({ message: 'Address Line 1, City, and Country are required.' });
    }

    try {
        // If this address is set as default, update existing default address for this user
        if (is_default) {
            await db.promise().query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?', [userId, addressId]);
        }

        const sql = 'UPDATE user_addresses SET address_line1 = ?, address_line2 = ?, city = ?, state = ?, zip_code = ?, country = ?, is_default = ?, address_label = ?, customer_name = ?, customer_email = ?, customer_phone = ? WHERE id = ? AND user_id = ?';
        const [result] = await db.promise().query(sql, [address_line1, address_line2, city, state, zip_code, country, is_default, address_label, customer_name, customer_email, customer_phone, addressId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Address not found or not authorized.' });
        }
        res.json({ message: 'Address updated successfully' });
    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).json({ message: 'Error updating address.' });
    }
});

// DELETE an address
router.delete('/:addressId', async (req, res) => {
    const { userId, addressId } = req.params;
    try {
        const [result] = await db.promise().query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Address not found or not authorized.' });
        }
        res.json({ message: 'Address deleted successfully' });
    } catch (err) {
        console.error('Error deleting address:', err);
        res.status(500).json({ message: 'Error deleting address.' });
    }
});

module.exports = router;
