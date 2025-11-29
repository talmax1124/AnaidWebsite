const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verifyTestUser() {
  try {
    console.log('🔄 Verifying test user...');

    // Update the test user to be verified
    const result = await sql`
      UPDATE users 
      SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
      WHERE email = 'test@test.com'
      RETURNING id, email, first_name, last_name, email_verified
    `;

    if (result.length > 0) {
      console.log('✅ Test user verified successfully:');
      console.log(`   Email: ${result[0].email}`);
      console.log(`   Name: ${result[0].first_name} ${result[0].last_name}`);
      console.log(`   Verified: ${result[0].email_verified}`);
      console.log('\n🎉 You can now log in with test@test.com / password123');
    } else {
      console.log('❌ Test user not found. Creating verified test user...');
      
      // Create a verified test user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const newUser = await sql`
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, email_verified, created_at
        ) VALUES (
          'test@test.com', ${hashedPassword}, 'Test', 'User', 'customer', true, NOW()
        )
        RETURNING id, email, first_name, last_name, email_verified
      `;
      
      if (newUser.length > 0) {
        console.log('✅ Verified test user created successfully:');
        console.log(`   Email: ${newUser[0].email}`);
        console.log(`   Name: ${newUser[0].first_name} ${newUser[0].last_name}`);
        console.log(`   Verified: ${newUser[0].email_verified}`);
        console.log('\n🎉 You can now log in with test@test.com / password123');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyTestUser().then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  });
}

module.exports = { verifyTestUser };