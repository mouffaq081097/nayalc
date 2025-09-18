const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Market@123', // REMINDER: In production, use environment variables for sensitive data!
    database: 'nayalc',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.promise().getConnection().then(connection => {
    
    connection.release();
}).catch(err => {
    console.error('Error getting connection from pool:', err.stack);
    process.exit(1);
});

module.exports = db;
