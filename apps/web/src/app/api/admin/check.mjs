import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_u3Gj6LcmVzHl@ep-billowing-band-a1h020y5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");

async function run() {
  const res = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contractors'`;
  console.log(JSON.stringify(res, null, 2));
}

run();
