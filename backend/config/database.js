const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'lashed_by_anna',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Execute query with error handling
async function executeQuery(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Get a single row
async function getOne(query, params = []) {
    const rows = await executeQuery(query, params);
    return rows[0] || null;
}

// Get multiple rows
async function getMany(query, params = []) {
    return await executeQuery(query, params);
}

// Insert data and return insert ID
async function insert(query, params = []) {
    const result = await executeQuery(query, params);
    return result.insertId;
}

// Update data and return affected rows
async function update(query, params = []) {
    const result = await executeQuery(query, params);
    return result.affectedRows;
}

// Delete data and return affected rows
async function remove(query, params = []) {
    const result = await executeQuery(query, params);
    return result.affectedRows;
}

// Transaction wrapper
async function transaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        connection.release();
        return result;
    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
}

module.exports = {
    pool,
    testConnection,
    executeQuery,
    getOne,
    getMany,
    insert,
    update,
    remove,
    transaction
};