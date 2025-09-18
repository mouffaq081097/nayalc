const express = require('express');
const db = require('./db');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const UPLOADS_BASE_URL = `${BACKEND_URL}/uploads/`;
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdir(UPLOADS_DIR, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating upload directory:', err);
                return cb(err);
            }
            cb(null, UPLOADS_DIR);
        });
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Get all products (with category and brand names and main image)
router.get('/', (req, res) => {
    const { random, limit, category } = req.query; // Added 'category'
    let sql = `
        SELECT 
            p.*, 
            b.name as brandName, 
            MAX(COALESCE(CONCAT(?, REPLACE(IF(pi.image_url LIKE 'http://localhost:5000/uploads/%', SUBSTRING_INDEX(pi.image_url, '/', -1), pi.image_url), ' ', '%20')), CONCAT(?, 'placeholder.jpg'))) as imageUrl,
            GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as categoryNames
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
        LEFT JOIN category_products cp ON p.id = cp.product_id
        LEFT JOIN categories c ON cp.category_id = c.id
    `;
    const params = [UPLOADS_BASE_URL, UPLOADS_BASE_URL];

    // Add JOINs and WHERE clause for category filtering
    if (category) {
        sql += `
            WHERE p.id IN (
                SELECT product_id FROM category_products
                JOIN categories ON category_products.category_id = categories.id
                WHERE categories.name = ?
            )
        `;
        params.push(category);
    }

    sql += ` GROUP BY p.id, b.name`;

    if (random === 'true') {
        sql += ` ORDER BY RAND()`;
    }

    if (limit) {
        sql += ` LIMIT ?`;
        params.push(parseInt(limit));
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ message: 'Error fetching products from database', error: err.message });
        }
        res.json(results);
    });
});

// Get a single product by ID (with category and brand names and main image)
router.get('/:id', async (req, res) => { // Made async
    const { id } = req.params;
    let connection;
    try {
        connection = await db.promise().getConnection();

        const productSql = `
            SELECT p.*, b.name as brandName, COALESCE(CONCAT(?, REPLACE(IF(pi.image_url LIKE 'http://localhost:5000/uploads/%', SUBSTRING_INDEX(pi.image_url, '/', -1), pi.image_url), ' ', '%20')), CONCAT(?, 'placeholder.jpg')) as imageUrl,
            p.long_description, p.benefits, p.how_to_use, p.specs, p.autoship_save
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
            WHERE p.id = ?
        `;
        const [productResult] = await connection.query(productSql, [UPLOADS_BASE_URL, UPLOADS_BASE_URL, id]);

        if (productResult.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = productResult[0];

        // Fetch associated category IDs
        const [categoryIdsResult] = await connection.query(
            'SELECT category_id FROM category_products WHERE product_id = ?',
            [id]
        );
        product.categoryIds = categoryIdsResult.map(row => row.category_id);

        res.json(product);

    } catch (err) {
        console.error('Error fetching product:', err);
        return res.status(500).json({ message: 'Error fetching product from database', error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Add a new product
router.post('/', async (req, res) => {
    const { name, description, price, stock_quantity, status, product_type, long_description, benefits, how_to_use, specs, autoship_save, gtin, product_dimensions, item_weight, item_model_number, unit_count, brand_id, categoryIds } = req.body; // Removed category_id, added categoryIds

    if (!name || !price || !stock_quantity || !categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ message: 'Missing required product fields (name, price, stock_quantity) or categoryIds.' });
    }

    let connection; // Declare connection for transaction
    try {
        connection = await db.promise().getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start transaction

        let vendorName = null;
        if (brand_id) {
            const [brandRows] = await connection.query('SELECT name FROM brands WHERE id = ?', [brand_id]); // Use connection for query
            if (brandRows.length > 0) {
                vendorName = brandRows[0].name;
            }
        }

        const productSql = `
            INSERT INTO products (name, description, price, stock_quantity, status, product_type, vendor, long_description, benefits, how_to_use, specs, autoship_save, gtin, product_dimensions, item_weight, item_model_number, unit_count, brand_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `; // Removed category_id column
        const productValues = [name, description, price, stock_quantity, status, product_type, vendorName, long_description, benefits, how_to_use, specs, autoship_save, gtin, product_dimensions, item_weight, item_model_number, unit_count, brand_id]; // Removed category_id value

        const [productResult] = await connection.query(productSql, productValues); // Use connection for query
        const productId = productResult.insertId;

        // Insert into category_products junction table
        if (categoryIds && categoryIds.length > 0) {
            const categoryProductValues = categoryIds.map(catId => [catId, productId]);
            const categoryProductSql = 'INSERT INTO category_products (category_id, product_id) VALUES ?';
            await connection.query(categoryProductSql, [categoryProductValues]); // Use connection for query
        }

        await connection.commit(); // Commit transaction
        res.status(201).json({ message: 'Product added successfully', productId: productId });

    } catch (err) {
        if (connection) await connection.rollback(); // Rollback on error
        console.error('Error adding product:', err);
        return res.status(500).json({ message: 'Error adding product to database', error: err.message });
    } finally {
        if (connection) connection.release(); // Release connection back to pool
    }
});

// Update an existing product
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock_quantity, status, product_type, long_description, benefits, how_to_use, specs, autoship_save, gtin, product_dimensions, item_weight, item_model_number, unit_count, brand_id, categoryIds } = req.body; // Removed category_id, added categoryIds

    let connection; // Declare connection for transaction
    try {
        connection = await db.promise().getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start transaction

        let vendorName = null;
        if (brand_id) {
            const [brandRows] = await connection.query('SELECT name FROM brands WHERE id = ?', [brand_id]); // Use connection for query
            if (brandRows.length > 0) {
                vendorName = brandRows[0].name;
            }
        }

        const productSql = `
            UPDATE products
            SET name = ?, description = ?, price = ?, stock_quantity = ?, status = ?, product_type = ?, vendor = ?, long_description = ?, benefits = ?, how_to_use = ?, specs = ?, autoship_save = ?, gtin = ?, product_dimensions = ?, item_weight = ?, item_model_number = ?, unit_count = ?, brand_id = ?
            WHERE id = ?
        `; // Removed category_id column
        const productValues = [name, description, price, stock_quantity, status, product_type, vendorName, long_description, benefits, how_to_use, specs, autoship_save, gtin, product_dimensions, item_weight, item_model_number, unit_count, brand_id, id]; // Removed category_id value

        const [productUpdateResult] = await connection.query(productSql, productValues); // Use connection for query

        if (productUpdateResult.affectedRows === 0) {
            await connection.rollback(); // Rollback if product not found
            return res.status(404).json({ message: 'Product not found or no changes made' });
        }

        // Delete existing category associations for this product
        await connection.query('DELETE FROM category_products WHERE product_id = ?', [id]);

        // Insert new category associations
        if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
            const categoryProductValues = categoryIds.map(catId => [catId, id]);
            const categoryProductSql = 'INSERT INTO category_products (category_id, product_id) VALUES ?';
            await connection.query(categoryProductSql, [categoryProductValues]);
        }

        await connection.commit(); // Commit transaction
        res.json({ message: 'Product updated successfully' });

    } catch (err) {
        if (connection) await connection.rollback(); // Rollback on error
        console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Error updating product in database', error: err.message });
    } finally {
        if (connection) connection.release(); // Release connection back to pool
    }
});

// Delete a product
router.delete('/:id', async (req, res) => { 
    const { id } = req.params;

    try {
        const [imageResults] = await db.promise().query('SELECT image_url FROM product_images WHERE product_id = ?', [id]);
        const imagesToDelete = imageResults.map(row => row.image_url);

        await db.promise().query('DELETE FROM product_images WHERE product_id = ?', [id]);

        const [productDeleteResult] = await db.promise().query('DELETE FROM products WHERE id = ?', [id]);

        if (productDeleteResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        for (const imageUrl of imagesToDelete) {
            const filePath = path.join(UPLOADS_DIR, imageUrl);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting product image file from disk:', unlinkErr, 'for image:', imageUrl);
                } else {
                    console.log('Product image deleted from disk:', filePath);
                }
            });
        }

        res.json({ message: 'Product deleted successfully' });

    } catch (err) {
       console.error('Error deleting product and associated images:', err);
        return res.status(500).json({ message: 'Error deleting product and associated images', error: err.message });
    }
});

// --- Customer Reviews Endpoints ---

// GET all reviews for a specific product
router.get('/:productId/reviews', (req, res) => {
    const { productId } = req.params;
    const sql = 'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC';
    db.query(sql, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching reviews:', err);
           return res.status(500).json({ message: 'Error fetching reviews' });
       }
       res.json(results);
   });
});

// POST a new review for a specific product
router.post('/:productId/reviews', (req, res) => {
   const { productId } = req.params;
   const { reviewer_name, rating, comment } = req.body;

   if (!reviewer_name || !rating) {
       return res.status(400).json({ message: 'Name and rating are required.' });
   }

   const sql = 'INSERT INTO reviews (product_id, reviewer_name, rating, comment) VALUES (?, ?, ?, ?)';
   db.query(sql, [productId, reviewer_name, rating, comment], (err, result) => {
       if (err) {
           console.error('Error submitting review:', err);
           return res.status(500).json({ message: 'Error submitting review' });
       }
       res.status(201).json({ message: 'Review submitted successfully', reviewId: result.insertId });
   });
});

// GET coupons for a specific product (placeholder)
router.get('/:productId/coupons', (req, res) => {
    const { productId } = req.params;
    const dummyCoupons = [
        { id: 1, code: 'SAVE10', discount_percentage: 10, product_id: parseInt(productId) },
        { id: 2, code: 'FREESHIP', discount_percentage: 0, product_id: parseInt(productId), type: 'shipping' }
    ];
    const productCoupons = dummyCoupons.filter(coupon => coupon.product_id === parseInt(productId));

    res.json(productCoupons);
});

module.exports = router;

// Upload product image
router.post('/:productId/image', upload.single('productImage'), async (req, res) => {
    const { productId } = req.params;
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided.' });
    }

    const imageUrl = req.file.filename; // Multer provides the filename

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // First, set all existing images for this product to not be main
        await connection.query(
            'UPDATE product_images SET is_main = FALSE WHERE product_id = ?',
            [productId]
        );

        // Then, insert the new image and set it as main
        const [result] = await connection.query(
            'INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, TRUE)',
            [productId, imageUrl]
        );

        await connection.commit();
        res.status(201).json({ message: 'Product image uploaded and set as main successfully.', imageUrl: `${UPLOADS_BASE_URL}${imageUrl}` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error uploading product image:', error);
        res.status(500).json({ message: 'Failed to upload product image.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});
