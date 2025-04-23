import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestCollaborator() {
  try {
    const timestamp = new Date().getTime();
    const testEmail = `collaborator_${timestamp}@hexatech.com`;
    const testPassword = 'test123456';

    // Create user using admin API
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        role: 'collaborator'
      }
    });

    if (createError) {
      throw createError;
    }

    if (!user) {
      throw new Error('No user data returned from create user');
    }

    console.log('Auth user created:', user.id);

    // Wait a moment for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create user record in the database
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: user.id,
          email: user.email,
          role: 'collaborator',
          created_at: new Date().toISOString(),
        },
      ]);

    if (dbError) {
      throw dbError;
    }

    console.log('Test collaborator created successfully!');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('Error creating test collaborator:', error.message);
    process.exit(1);
  }
}

createTestCollaborator(); 