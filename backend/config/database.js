const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL);

const database = {
  // Query function leveraging Neon's new .query helper
  async query(queryText, params = []) {
    try {
      console.log('Executing query:', queryText);
      console.log('With params:', params);

      if (!params || params.length === 0) {
        // sql.query expects at least one parameter, so run param-less queries via unsafe
        return await sql.unsafe(queryText);
      }

      return await sql.query(queryText, params);
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query text:', queryText);
      console.error('Params:', params);
      throw error;
    }
  },

  async transaction(queries) {
    try {
      await sql`BEGIN`;
      const results = [];
      
      for (const { query, params } of queries) {
        const result = await this.query(query, params);
        results.push(result);
      }
      
      await sql`COMMIT`;
      return results;
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  }
};

module.exports = database;
