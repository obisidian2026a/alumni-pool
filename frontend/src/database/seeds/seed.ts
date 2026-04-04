import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { hash } from 'bcryptjs';
import * as schema from '../schema';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for seeding');
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  const demoEmail = 'demo@alumnipool.app';
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, demoEmail))
    .limit(1);

  if (existing) {
    console.log('Demo user already exists. Skipping seed.');
    return;
  }

  const passwordHash = await hash('DemoPass123', 12);

  await db.insert(schema.users).values({
    name: 'Demo Manager',
    email: demoEmail,
    password: passwordHash,
    role: 'manager',
  });

  console.log('Seed complete: demo@alumnipool.app / DemoPass123');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
