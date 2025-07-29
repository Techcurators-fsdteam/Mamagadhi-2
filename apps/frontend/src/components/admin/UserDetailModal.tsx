'use client';

import { UserProfile, DriverProfile } from 'shared-types';

interface CombinedUserData {
  userProfile: UserProfile;
  driverProfile?: DriverProfile;
}

interface UserDetailModalProps {
  isOpen: boolean;
  user: CombinedUserData | null;
  onClose: () => void;
  onVerifyDocument: (userId: string, documentType: 'id' | 'dl', verified: boolean) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  user,
  onClose,
  onVerifyDocument
}) => {
  if (!isOpen || !user) return null;

  const { userProfile, driverProfile } = user;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#4AAAFF] text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#4AAAFF] font-bold text-lg">
                  {userProfile.display_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {userProfile.display_name}
                </h3>
                <p className="text-blue-100 text-sm">
                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-600 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* User Profile Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#4AAAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              User Profile
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-sm text-gray-900 font-medium">{userProfile.first_name} {userProfile.last_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{userProfile.email}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    userProfile.is_email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {userProfile.is_email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Role</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    userProfile.role === 'driver' ? 'bg-blue-100 text-blue-800' :
                    userProfile.role === 'both' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {userProfile.role}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Display Name</label>
                  <p className="text-sm text-gray-900 font-medium">{userProfile.display_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900">{userProfile.phone}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    userProfile.is_phone_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {userProfile.is_phone_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Joined</label>
                  <p className="text-sm text-gray-900">{new Date(userProfile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Profile Section */}
          {driverProfile && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#4AAAFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Driver Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Driving License */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 118 0v2m-4 0a2 2 0 104 0m-4 0v2m0 0v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                      </svg>
                      Driving License
                    </h5>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      driverProfile.dl_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {driverProfile.dl_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  {driverProfile.dl_url && (
                    <a
                      href={driverProfile.dl_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4AAAFF] hover:underline text-sm flex items-center mb-3"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Document
                    </a>
                  )}
                  <button
                    onClick={() => onVerifyDocument(userProfile.id, 'dl', !driverProfile.dl_verified)}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      driverProfile.dl_verified 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {driverProfile.dl_verified ? 'Revoke Verification' : 'Verify Document'}
                  </button>
                </div>

                {/* ID Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 118 0v2m-4 0a2 2 0 104 0m-4 0v2m0 0v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                      </svg>
                      ID Card
                    </h5>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      driverProfile.id_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {driverProfile.id_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  {driverProfile.id_url && (
                    <a
                      href={driverProfile.id_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4AAAFF] hover:underline text-sm flex items-center mb-3"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Document
                    </a>
                  )}
                  <button
                    onClick={() => onVerifyDocument(userProfile.id, 'id', !driverProfile.id_verified)}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      driverProfile.id_verified 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {driverProfile.id_verified ? 'Revoke Verification' : 'Verify Document'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
