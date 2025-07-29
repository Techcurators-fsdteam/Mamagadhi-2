'use client';

import Image from 'next/image';
import { UserProfile, DriverProfile } from 'shared-types';

interface CombinedUserData {
  userProfile: UserProfile;
  driverProfile?: DriverProfile;
}

interface UsersTableProps {
  users: CombinedUserData[];
  onViewDetails: (userData: CombinedUserData) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, onViewDetails }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Users ({users.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver Docs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((userData) => {
              const { userProfile, driverProfile } = userData;
              return (
                <tr key={userProfile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {userProfile.profile_url ? (
                          <Image
                            src={userProfile.profile_url}
                            alt={userProfile.display_name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {userProfile.display_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {userProfile.display_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userProfile.first_name} {userProfile.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{userProfile.email}</div>
                    <div className="text-sm text-gray-500">{userProfile.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      userProfile.role === 'driver' ? 'bg-blue-100 text-blue-800' :
                      userProfile.role === 'both' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {userProfile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        userProfile.is_email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        Email: {userProfile.is_email_verified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        userProfile.is_phone_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        Phone: {userProfile.is_phone_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {driverProfile ? (
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          driverProfile.dl_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          DL: {driverProfile.dl_verified ? 'Verified' : 'Pending'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          driverProfile.id_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          ID: {driverProfile.id_verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No docs</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(userProfile.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onViewDetails(userData)}
                      className="text-[#4AAAFF] hover:text-blue-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
