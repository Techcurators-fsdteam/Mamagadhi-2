'use client';

interface AdminFiltersProps {
  searchTerm: string;
  filterRole: 'all' | 'driver' | 'passenger' | 'both';
  filterVerification: 'all' | 'verified' | 'unverified';
  onSearchChange: (value: string) => void;
  onRoleChange: (value: 'all' | 'driver' | 'passenger' | 'both') => void;
  onVerificationChange: (value: 'all' | 'verified' | 'unverified') => void;
}

const AdminFilters: React.FC<AdminFiltersProps> = ({
  searchTerm,
  filterRole,
  filterVerification,
  onSearchChange,
  onRoleChange,
  onVerificationChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Users
          </label>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4AAAFF] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Role
          </label>
          <select
            value={filterRole}
            onChange={(e) => onRoleChange(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4AAAFF] focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="passenger">Passenger</option>
            <option value="driver">Driver</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Verification
          </label>
          <select
            value={filterVerification}
            onChange={(e) => onVerificationChange(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4AAAFF] focus:border-transparent"
          >
            <option value="all">All Users</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdminFilters;
