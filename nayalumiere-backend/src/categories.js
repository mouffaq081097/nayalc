const express = require('express');
const db = require('./db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const UPLOADS_BASE_URL = 'http://217.165.41.108:5000/uploads/';

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        fs.mkdir(UPLOADS_DIR, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating upload directory:', err);
                return cb(err);
            }
            cb(null, UPLOADS_DIR);
        });
    },
    filename: function (req, file, cb) {
        const originalBaseName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname);
        cb(null, `${originalBaseName}-${Date.now()}${extension}`);
    }
});

const upload = multer({ storage: storage });

// Get all categories
router.get('/', (req, res) => {
    const sql = `SELECT c.id, c.name, c.image_url, COUNT(cp.product_id) as productsCount
                FROM categories c
                LEFT JOIN category_products cp ON c.id = cp.category_id
                GROUP BY c.id, c.name, c.image_url
                ORDER BY c.name ASC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ message: 'Error fetching categories from database', error: err.message });
        }
        res.json(results.map(category => {
            const imageUrl = category.image_url;
            const isFullUrl = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
            return {
                ...category,
                image_url: isFullUrl ? imageUrl : (imageUrl ? `${UPLOADS_BASE_URL}${imageUrl}` : null)
            };
        }));
    });
});

// Get a single category by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [categoryRows] = await db.promise().query(`SELECT id, name, image_url FROM categories WHERE id = ?`, [id]);
        if (categoryRows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        const category = categoryRows[0];

        const [productRows] = await db.promise().query(`
            SELECT p.id, p.name 
            FROM products p
            JOIN category_products cp ON p.id = cp.product_id
            WHERE cp.category_id = ?
        `, [id]);
        
        category.products = productRows;
        
        const imageUrl = category.image_url;
        const isFullUrl = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));

        res.json({
            ...category,
            image_url: isFullUrl ? imageUrl : (imageUrl ? `${UPLOADS_BASE_URL}${imageUrl}` : null)
        });

    } catch (err) {
        console.error(`Error fetching category ${id}:`, err);
        res.status(500).json({ message: 'Error fetching category from database', error: err.message });
    }
});

// Add a new category
router.post('/', upload.single('image'), async (req, res) => {
    const { name, description, product_ids } = req.body;
    const imageFile = req.file;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
    }

    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        let imageUrl = null;
        if (imageFile) {
            imageUrl = imageFile.filename;
        }

        const [result] = await connection.query(
            'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)',
            [name, description, imageUrl]
        );
        const newCategoryId = result.insertId;

        if (product_ids && product_ids.length > 0) {
            const productValues = product_ids.map(productId => [newCategoryId, productId]);
            await connection.query(
                'INSERT INTO category_products (category_id, product_id) VALUES ?',
                [productValues]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Category added successfully', categoryId: newCategoryId, imageUrl: imageUrl ? `${UPLOADS_BASE_URL}${imageUrl}` : null });

    } catch (err) {
        await connection.rollback();
        console.error('Error adding category:', err);
        if (imageFile) {
            fs.unlink(imageFile.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting failed category image upload:', unlinkErr);
            });
        }
        res.status(500).json({ message: 'Error adding category to database', error: err.message });
    } finally {
        connection.release();
    }
});

// Update an existing category
router.put('/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, product_ids } = req.body;
    const imageFile = req.file;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
    }

    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        let updateQuery = 'UPDATE categories SET name = ?, description = ?';
        const queryParams = [name, description];

        if (imageFile) {
            const imageUrl = imageFile.filename;
            updateQuery += ', image_url = ?';
            queryParams.push(imageUrl);
        } else if (req.body.image_url === '') {
            updateQuery += ', image_url = NULL';
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(id);

        await connection.query(updateQuery, queryParams);

        await connection.query('DELETE FROM category_products WHERE category_id = ?', [id]);
        if (product_ids && product_ids.length > 0) {
            const productValues = product_ids.map(productId => [id, productId]);
            await connection.query(
                'INSERT INTO category_products (category_id, product_id) VALUES ?',
                [productValues]
            );
        }

        await connection.commit();
        res.json({ message: 'Category updated successfully' });

    } catch (err) {
        await connection.rollback();
        console.error('Error updating category:', err);
        if (imageFile) {
            fs.unlink(imageFile.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting failed category image upload:', unlinkErr);
            });
        }
        res.status(500).json({ message: 'Error updating category in database', error: err.message });
    } finally {
        connection.release();
    }
});
    
// Delete a category
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM categories WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting category:', err);
            return res.status(500).json({ message: 'Error deleting category from database', error: err.message });
           }
           if (result.affectedRows === 0) {
               return res.status(404).json({ message: 'Category not found' });
           }
           res.json({ message: 'Category deleted successfully' });
       });
   });

// Upload category image
router.post('/:categoryId/image', upload.single('categoryImage'), async (req, res) => {
    const { categoryId } = req.params;
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided.' });
    }

    const imageUrl = req.file.filename; // Multer provides the filename

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Update the category's image_url
        await connection.query(
            'UPDATE categories SET image_url = ? WHERE id = ?',
            [imageUrl, categoryId]
        );

        await connection.commit();
        res.status(201).json({ message: 'Category image uploaded successfully.', imageUrl: `${UPLOADS_BASE_URL}${imageUrl}` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error uploading category image:', error);
        res.status(500).json({ message: 'Failed to upload category image.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;