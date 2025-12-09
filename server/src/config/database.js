// database.js  ← 100% guaranteed to find .env
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules (__dirname doesn't exist)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// THIS IS THE IMPORTANT LINE
dotenv.config({ path: path.resolve(__dirname, '../.env') });  
// If .env is in the same folder, use: path.resolve(__dirname, '.env')

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mohan@2005',
    database: process.env.DB_NAME || 'pos_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log('Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
    });

export default pool;