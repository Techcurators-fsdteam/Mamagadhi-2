'use client';

interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  verifiedUsers: number;
  driversWithDocs: number;
  verifiedDLs: number;
  verifiedIDs: number;
}

interface AdminStatsCardsProps {
  stats: AdminStats;
}

const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Drivers</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Verified Users</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.verifiedUsers}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Driver Documents</h3>
        <p className="text-2xl font-bold text-gray-900">{stats.driversWithDocs}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Verified DLs</h3>
        <p className="text-2xl font-bold text-blue-600">{stats.verifiedDLs}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">Verified IDs</h3>
        <p className="text-2xl font-bold text-green-600">{stats.verifiedIDs}</p>
      </div>
    </div>
  );
};

export default AdminStatsCards;
