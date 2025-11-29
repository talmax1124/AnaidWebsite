const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function addEmailVerificationColumns() {
  try {
    console.log('Adding email verification columns to users table...');

    // Add email verification columns
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(64),
      ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64),
      ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP
    `;

    console.log('✅ Email verification columns added successfully!');

    // Verify the columns were added
    const result = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires', 'reset_token', 'reset_token_expires')
    `;

    console.log('📋 Verification columns:', result);

    // Set existing users to verified (optional - for existing test data)
    const updateResult = await sql`
      UPDATE users 
      SET email_verified = TRUE 
      WHERE email_verified IS NULL
    `;

    console.log(`✅ Updated ${updateResult.length} existing users to verified status`);

  } catch (error) {
    console.error('❌ Error adding email verification columns:', error);
    throw error;
  }
}

// Run the migration
addEmailVerificationColumns()
  .then(() => {
    console.log('🎉 Email verification migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });