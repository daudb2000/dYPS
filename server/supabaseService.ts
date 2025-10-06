import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.SUPABASE_URL || 'https://wziukmmsnlijehdjbbwv.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6aXVrbW1zbmxpamVoZGpiYnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTIyNjAsImV4cCI6MjA3NDY2ODI2MH0.hsgOfXG6LSuw8HputKY7IQbwjRLEiQM7ZdrmpjXpCfk';
const postgresUrl = process.env.DATABASE_URL; // For direct PostgreSQL connection

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL environment variable is required');
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY environment variable is required');
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

console.log(`🔧 Configuring Supabase with URL: ${supabaseUrl}`);
console.log(`🔧 Using anon key: ${supabaseKey.substring(0, 20)}...`);
if (postgresUrl) {
  console.log(`🔧 PostgreSQL connection available: ${postgresUrl.substring(0, 30)}...`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface MembershipApplication {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  linkedin: string;
  consent: boolean;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  status: 'pending' | 'accepted' | 'rejected';
}

// Initialize database table if needed
export async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');

    // Check if applications table exists by attempting to select from it
    const { error } = await supabase
      .from('applications')
      .select('count', { count: 'exact', head: true });

    if (error && error.code === 'PGRST116') {
      console.log('🔧 Applications table does not exist, creating it...');
      // Table doesn't exist, create it using the createApplicationsTable function
      await createApplicationsTable();
      console.log('✅ Applications table created successfully');
    } else if (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    } else {
      console.log('✅ Applications table already exists and is accessible');
    }

    // Verify we can perform basic operations
    const { error: testError } = await supabase
      .from('applications')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Database access test failed:', testError);
      throw testError;
    }

    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export async function createApplication(data: Omit<MembershipApplication, 'id' | 'submitted_at' | 'status' | 'reviewed_at' | 'reviewed_by'>): Promise<MembershipApplication> {
  try {
    const { data: application, error } = await supabase
      .from('applications')
      .insert([
        {
          name: data.name,
          company: data.company,
          role: data.role,
          email: data.email,
          linkedin: data.linkedin,
          consent: data.consent,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          reviewed_at: null,
          reviewed_by: null
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating application in Supabase:', error);
      throw new Error('Failed to create application');
    }

    return {
      id: application.id,
      name: application.name,
      company: application.company,
      role: application.role,
      email: application.email,
      linkedin: application.linkedin,
      consent: application.consent,
      submitted_at: application.submitted_at,
      reviewed_at: application.reviewed_at,
      reviewed_by: application.reviewed_by,
      status: application.status
    };
  } catch (error) {
    console.error('Error creating application in Supabase:', error);
    throw new Error('Failed to create application');
  }
}

export async function getAllApplications(): Promise<MembershipApplication[]> {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications from Supabase:', error);
      throw new Error('Failed to fetch applications');
    }

    return applications.map(app => ({
      id: app.id,
      name: app.name || "",
      company: app.company || "",
      role: app.role || "",
      email: app.email || "",
      linkedin: app.linkedin || "",
      consent: app.consent || false,
      submitted_at: app.submitted_at || "",
      reviewed_at: app.reviewed_at,
      reviewed_by: app.reviewed_by,
      status: app.status || "pending"
    }));
  } catch (error) {
    console.error('Error fetching applications from Supabase:', error);
    throw new Error('Failed to fetch applications');
  }
}

export async function updateApplicationStatus(id: string, status: 'pending' | 'accepted' | 'rejected'): Promise<void> {
  try {
    const { error } = await supabase
      .from('applications')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin' // You can customize this based on your auth system
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating application status in Supabase:', error);
      throw new Error('Failed to update application status');
    }
  } catch (error) {
    console.error('Error updating application status in Supabase:', error);
    throw new Error('Failed to update application status');
  }
}

// Admin function to create the table via SQL using Supabase RPC
export async function createApplicationsTable() {
  try {
    console.log('📝 Creating applications table...');

    // Create the applications table using Supabase's built-in SQL execution
    const tableCreationSQL = `
      -- Create applications table
      CREATE TABLE IF NOT EXISTS applications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT NOT NULL,
        linkedin TEXT,
        consent BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);

      -- Disable Row Level Security to allow anonymous submissions
      -- This is appropriate for a membership application system
      ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
    `;

    console.log('🔧 Executing table creation SQL...');

    // Execute the SQL using Supabase RPC with sql function
    const { error: sqlError } = await supabase.rpc('sql', {
      query: tableCreationSQL
    });

    if (sqlError) {
      console.log('⚠️ RPC sql function not available, trying direct table creation...');

      // Fallback: Try creating table by attempting an operation that will create it
      // This approach works by inserting a test record, which will auto-create the table if DDL is allowed
      const { error: insertError } = await supabase
        .from('applications')
        .insert([{
          name: 'Test Application',
          company: 'Test Company',
          role: 'Test Role',
          email: 'test@test.com',
          linkedin: null,
          consent: true,
          status: 'pending'
        }])
        .select()
        .single();

      if (insertError && insertError.code === 'PGRST116') {
        console.log('📝 Table does not exist. Please manually create it in Supabase SQL Editor with the following schema:');
        console.log(tableCreationSQL);
        throw new Error('Applications table does not exist and cannot be created automatically. Please create it manually in Supabase SQL Editor.');
      } else if (insertError && insertError.code !== 'PGRST116') {
        console.log('⚠️ Table exists but insert failed:', insertError);
        // Table exists, that's what we wanted to confirm
      } else {
        console.log('✅ Test record inserted successfully, cleaning up...');
        // Delete the test record
        await supabase
          .from('applications')
          .delete()
          .eq('email', 'test@test.com');
      }
    } else {
      console.log('✅ Table creation SQL executed successfully via RPC');
    }

    // Verify table exists and is accessible
    const { error: verifyError } = await supabase
      .from('applications')
      .select('count', { count: 'exact', head: true });

    if (verifyError) {
      console.error('❌ Table verification failed:', verifyError);
      throw new Error(`Table verification failed: ${verifyError.message}`);
    }

    console.log('✅ Applications table created and verified successfully');
    return { success: true, message: 'Applications table created and ready for use' };
  } catch (error) {
    console.error('❌ Error creating applications table:', error);
    throw error;
  }
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return false;
  }
}

// Admin user interface and functions
export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

// Hash password using SHA-256
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Create admin users table
export async function createAdminUsersTable() {
  try {
    console.log('📝 Creating admin_users table...');

    const tableCreationSQL = `
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

      ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
    `;

    const { error: sqlError } = await supabase.rpc('sql', {
      query: tableCreationSQL
    });

    if (sqlError) {
      console.log('⚠️ RPC sql function not available for admin_users table');
      console.log('📝 Please create the table manually in Supabase SQL Editor:');
      console.log(tableCreationSQL);
    } else {
      console.log('✅ Admin users table created successfully');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error creating admin_users table:', error);
    throw error;
  }
}

// Verify admin credentials
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  try {
    console.log(`🔍 Verifying credentials for user: ${username}`);
    const passwordHash = hashPassword(password);
    console.log(`🔐 Password hash: ${passwordHash.substring(0, 10)}...`);

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Supabase query timeout')), 5000);
    });

    const queryPromise = supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', passwordHash)
      .single();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ Supabase query error:', error);
      return false;
    }

    if (!data) {
      console.log('❌ No matching user found');
      return false;
    }

    console.log('✅ Admin credentials verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Error verifying admin credentials:', error);
    return false;
  }
}

// Create or update admin user
export async function createAdminUser(username: string, password: string): Promise<void> {
  try {
    const passwordHash = hashPassword(password);

    // Try to update first
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      // Update existing user
      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: passwordHash })
        .eq('username', username);

      if (error) throw error;
      console.log(`✅ Updated admin user: ${username}`);
    } else {
      // Create new user
      const { error } = await supabase
        .from('admin_users')
        .insert([{ username, password_hash: passwordHash }]);

      if (error) throw error;
      console.log(`✅ Created admin user: ${username}`);
    }
  } catch (error) {
    console.error(`❌ Error creating/updating admin user ${username}:`, error);
    throw error;
  }
}

// Initialize admin users with default accounts
export async function initializeAdminUsers() {
  try {
    console.log('🔧 Initializing admin users...');

    // Check if table exists
    const { error: checkError } = await supabase
      .from('admin_users')
      .select('count', { count: 'exact', head: true });

    if (checkError && checkError.code === 'PGRST116') {
      console.log('📝 Admin users table does not exist, creating it...');
      await createAdminUsersTable();
    }

    // Create the three admin users
    await createAdminUser('Daud', 'DYPS123');
    await createAdminUser('Alkesh', 'DYPS123');
    await createAdminUser('Max', 'DYPS123');

    console.log('✅ Admin users initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing admin users:', error);
    throw error;
  }
}