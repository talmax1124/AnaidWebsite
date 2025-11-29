import { neon } from '@neondatabase/serverless';

// Get the database URL from environment variables
const databaseUrl = process.env.REACT_APP_NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('REACT_APP_NEON_DATABASE_URL is not defined in environment variables');
}

// Create the Neon client
export const sql = neon(databaseUrl);

// Helper function to handle database queries with error handling
export async function executeQuery<T>(
  query: string, 
  params?: any[]
): Promise<T[]> {
  try {
    const result = await sql(query, params);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
export async function executeTransaction<T>(
  queries: Array<{ query: string; params?: any[] }>
): Promise<T[]> {
  try {
    await sql('BEGIN');
    
    const results: T[] = [];
    for (const { query, params } of queries) {
      const result = await sql(query, params);
      results.push(result as T);
    }
    
    await sql('COMMIT');
    return results;
  } catch (error) {
    await sql('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  }
}

// Utility function to convert JS Date to PostgreSQL timestamp
export function toPostgresTimestamp(date: Date): string {
  return date.toISOString();
}

// Utility function to parse PostgreSQL timestamp to JS Date
export function fromPostgresTimestamp(timestamp: string): Date {
  return new Date(timestamp);
}

// Pagination helper
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export function buildPaginationQuery(
  baseQuery: string,
  options: PaginationOptions = {}
): { query: string; offset: number } {
  const { 
    page = 1, 
    limit = 10, 
    orderBy = 'created_at', 
    orderDirection = 'DESC' 
  } = options;
  
  const offset = (page - 1) * limit;
  
  let query = baseQuery;
  
  if (orderBy) {
    query += ` ORDER BY ${orderBy} ${orderDirection}`;
  }
  
  query += ` LIMIT ${limit} OFFSET ${offset}`;
  
  return { query, offset };
}

// Search helper
export function buildSearchConditions(
  searchTerm: string,
  searchColumns: string[]
): { condition: string; params: string[] } {
  if (!searchTerm || searchColumns.length === 0) {
    return { condition: '', params: [] };
  }
  
  const searchPattern = `%${searchTerm}%`;
  const conditions = searchColumns.map((column, index) => 
    `${column} ILIKE $${index + 1}`
  ).join(' OR ');
  
  const params = searchColumns.map(() => searchPattern);
  
  return { 
    condition: `(${conditions})`,
    params 
  };
}

// Batch insert helper
export async function batchInsert<T>(
  tableName: string,
  records: T[],
  returningColumns?: string[]
): Promise<any[]> {
  if (records.length === 0) return [];
  
  const columns = Object.keys(records[0] as any);
  const values: any[] = [];
  const placeholders: string[] = [];
  
  records.forEach((record, recordIndex) => {
    const recordPlaceholders: string[] = [];
    columns.forEach((column, columnIndex) => {
      const paramIndex = recordIndex * columns.length + columnIndex + 1;
      recordPlaceholders.push(`$${paramIndex}`);
      values.push((record as any)[column]);
    });
    placeholders.push(`(${recordPlaceholders.join(', ')})`);
  });
  
  let query = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES ${placeholders.join(', ')}
  `;
  
  if (returningColumns && returningColumns.length > 0) {
    query += ` RETURNING ${returningColumns.join(', ')}`;
  }
  
  return executeQuery(query, values);
}

// Upsert helper
export async function upsert<T>(
  tableName: string,
  record: T,
  conflictColumns: string[],
  updateColumns: string[],
  returningColumns?: string[]
): Promise<any> {
  const columns = Object.keys(record as any);
  const values = Object.values(record as any);
  
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  
  const updateSet = updateColumns.map(column => 
    `${column} = EXCLUDED.${column}`
  ).join(', ');
  
  let query = `
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT (${conflictColumns.join(', ')}) 
    DO UPDATE SET ${updateSet}
  `;
  
  if (returningColumns && returningColumns.length > 0) {
    query += ` RETURNING ${returningColumns.join(', ')}`;
  }
  
  const result = await executeQuery(query, values);
  return result[0];
}

export default sql;