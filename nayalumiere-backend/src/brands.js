const express = require('express');
const db = require('./db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'; // Fallback for development

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

// Get all brands
router.get('/', (req, res) => {
    const sql = `SELECT id, name, imageUrl FROM brands`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching brands:', err);
            return res.status(500).json({ message: 'Error fetching brands from database', error: err.message });
        }
        res.json(results.map(brand => ({
            ...brand,
            imageUrl: brand.imageUrl
        })));
    });
});

// Get a single brand by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT id, name, imageUrl FROM brands WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching brand:', err);
            return res.status(500).json({ message: 'Error fetching brand from database' });
        }
       if (result.length === 0) {
           return res.status(404).json({ message: 'Brand not found' });
       }
       const brand = result[0];
       res.json({
           ...brand,
           imageUrl: brand.imageUrl
       });
   });
});


// Add a new brand
router.post('/', upload.single('image'), (req, res) => {
    const { name, status } = req.body; 
    const imageUrl = req.file ? req.file.filename : null;
    
    
    

    if (!name) {
        return res.status(400).json({ message: 'Brand name is required.' });
    }

    const sql = 'INSERT INTO brands (name, status, imageUrl) VALUES (?, ?, ?)'; 
    const values = [name, status, imageUrl];
    
    
   db.query(sql, values, (err, result) => { 
       if (err) {
           console.error('Error adding brand:', err);
           return res.status(500).json({ message: 'Error adding brand to database', error: err.message });
       }
       res.status(201).json({ message: 'Brand added successfully', id: result.insertId, name, status, imageUrl }); 
   });
});

// Update an existing brand
router.put('/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body; 
    let imageUrl = req.body.imageUrl;

    if (req.file) {
        imageUrl = req.file.filename;
    }

    if (!name) {
        return res.status(400).json({ message: 'Brand name is required.' });
    }

   const sql = 'UPDATE brands SET name = ?, status = ?, imageUrl = ? WHERE id = ?';
   db.query(sql, [name, status, imageUrl, id], (err, result) => {
       if (err) {
           console.error('Error updating brand:', err);
           return res.status(500).json({ message: 'Error updating brand in database', error: err.message });
       }
       if (result.affectedRows === 0) {
           return res.status(404).json({ message: 'Brand not found or no changes made' });
       }
       res.json({ message: 'Brand updated successfully' });
   });
});

// Delete a brand
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM brands WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting brand:', err);
            return res.status(500).json({ message: 'Error deleting brand from database', error: err.message });
        }
       if (result.affectedRows === 0) {
           return res.status(404).json({ message: 'Brand not found' });
       }
       res.json({ message: 'Brand deleted successfully' });
   });
});

module.exports = router;
