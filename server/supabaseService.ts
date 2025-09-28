import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
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
    // Check if applications table exists by attempting to select from it
    const { error } = await supabase
      .from('applications')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('🔧 Creating applications table...');
      // Table doesn't exist, create it using raw SQL
      const { error: createError } = await supabase.rpc('create_applications_table');
      if (createError) {
        console.error('❌ Error creating table:', createError);
        throw createError;
      }
      console.log('✅ Applications table created successfully');
    } else {
      console.log('✅ Applications table already exists');
    }
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

// Admin function to create the table via SQL using Supabase SQL editor
export async function createApplicationsTable() {
  try {
    console.log('📝 Creating applications table...');

    // First, let's try to create the table using a direct INSERT to test connection
    // In production, you would create this table via Supabase SQL editor or migrations
    const tableSchema = `
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

      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);
    `;

    console.log('⚠️  To create the applications table, please run the following SQL in your Supabase SQL Editor:');
    console.log(tableSchema);

    // For now, let's just test if we can connect and the table exists
    const { error } = await supabase
      .from('applications')
      .select('count', { count: 'exact', head: true });

    if (error && error.code === 'PGRST116') {
      throw new Error('Applications table does not exist. Please create it using the Supabase SQL Editor with the provided schema.');
    }

    console.log('✅ Applications table verified or connection successful');
    return { success: true, message: 'Applications table ready' };
  } catch (error) {
    console.error('Error with applications table:', error);
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