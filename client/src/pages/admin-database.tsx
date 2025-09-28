import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Database, ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function AdminDatabase() {
  const [, setLocation] = useLocation();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [initStatus, setInitStatus] = useState<'idle' | 'initializing' | 'success' | 'error'>('idle');
  const [tableStatus, setTableStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const response = await fetch('/api/admin/database/test', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setConnectionStatus('success');
        setStatusMessage('Supabase connection successful');
      } else {
        setConnectionStatus('error');
        setStatusMessage(data.message || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setStatusMessage('Failed to test connection');
    }
  };

  const initializeDatabase = async () => {
    setInitStatus('initializing');
    try {
      const response = await fetch('/api/admin/database/init', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setInitStatus('success');
        setStatusMessage('Database initialized successfully');
      } else {
        setInitStatus('error');
        setStatusMessage(data.message || 'Database initialization failed');
      }
    } catch (error) {
      setInitStatus('error');
      setStatusMessage('Failed to initialize database');
    }
  };

  const createTable = async () => {
    setTableStatus('creating');
    try {
      const response = await fetch('/api/admin/database/create-table', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setTableStatus('success');
        setStatusMessage('Applications table created successfully');
      } else {
        setTableStatus('error');
        setStatusMessage(data.message || 'Table creation failed');
      }
    } catch (error) {
      setTableStatus('error');
      setStatusMessage('Failed to create table');
    }
  };

  const StatusIcon = ({ status }: { status: 'idle' | 'testing' | 'initializing' | 'creating' | 'success' | 'error' }) => {
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'error') return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (status === 'testing' || status === 'initializing' || status === 'creating') {
      return <RefreshCw className="h-5 w-5 text-amber-600 animate-spin" />;
    }
    return <Database className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center text-amber-900 hover:text-amber-800 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Database Management</h1>
          <p className="text-muted-foreground">
            Manage your Supabase database connection and table structure
          </p>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            connectionStatus === 'success' || initStatus === 'success' || tableStatus === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : connectionStatus === 'error' || initStatus === 'error' || tableStatus === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Database Operations */}
        <div className="space-y-6">
          {/* Connection Test */}
          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <StatusIcon status={connectionStatus} />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Test Database Connection</h3>
                  <p className="text-muted-foreground">Verify that your Supabase connection is working</p>
                </div>
              </div>
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {/* Database Initialization */}
          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <StatusIcon status={initStatus} />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Initialize Database</h3>
                  <p className="text-muted-foreground">Check if the database tables exist and are properly configured</p>
                </div>
              </div>
              <button
                onClick={initializeDatabase}
                disabled={initStatus === 'initializing'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {initStatus === 'initializing' ? 'Initializing...' : 'Initialize Database'}
              </button>
            </div>
          </div>

          {/* Table Creation */}
          <div className="bg-white p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <StatusIcon status={tableStatus} />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Create Applications Table</h3>
                  <p className="text-muted-foreground">Create the applications table with proper schema and indexes</p>
                </div>
              </div>
              <button
                onClick={createTable}
                disabled={tableStatus === 'creating'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {tableStatus === 'creating' ? 'Creating...' : 'Create Table'}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-amber-800">
            <li>First, test your Supabase connection to ensure the credentials are working</li>
            <li>Initialize the database to check for existing tables</li>
            <li>Create the applications table if it doesn't exist</li>
            <li>Once complete, you can return to the dashboard to manage applications</li>
          </ol>
          <div className="mt-4 p-3 bg-white rounded border border-amber-200">
            <p className="text-sm text-amber-700">
              <strong>Environment Variables Required:</strong><br />
              • SUPABASE_URL<br />
              • SUPABASE_ANON_KEY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}