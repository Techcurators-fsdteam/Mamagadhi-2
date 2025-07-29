'use client';

interface AdminHeaderProps {
  error?: string;
  onLogout?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ error, onLogout }) => {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and verify driver documents</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          )}
        </div>
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Live Data:</strong> This admin panel is connected to the database. All user data and verification actions are real and will be saved.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
          {error}
        </div>
      )}
    </>
  );
};

export default AdminHeader;
