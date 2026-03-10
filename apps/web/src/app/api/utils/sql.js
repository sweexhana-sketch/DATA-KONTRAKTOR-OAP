import { neon } from '@neondatabase/serverless';

let sqlInstance;

const getSql = () => {
  if (sqlInstance) return sqlInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('No database connection string was provided to `neon()`. Perhaps process.env.DATABASE_URL has not been set');
  }

  sqlInstance = neon(connectionString);
  return sqlInstance;
};

// Export a proxy that calls getSql() on every invocation
const sql = (...args) => getSql()(...args);
sql.transaction = (...args) => getSql().transaction(...args);

export default sql;