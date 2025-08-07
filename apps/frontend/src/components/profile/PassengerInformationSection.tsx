'use client';

interface PassengerInformationSectionProps {
  formData: {
    first_name: string;
    last_name: string;
    display_name: string;
    phone: string;
    role: 'driver' | 'passenger' | 'both';
  };
  userProfile: {
    email_verified?: boolean;
    email?: string;
    is_phone_verified?: boolean;
  } | null;
  user: {
    email?: string;
    uid: string;
    emailVerified?: boolean;
  } | null;
  isEditing: boolean;
  isVerifyingEmail: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onEmailVerification: () => Promise<void>;
}

const PassengerInformationSection: React.FC<PassengerInformationSectionProps> = ({
  formData,
  userProfile,
  user,
  isEditing,
  isVerifyingEmail,
  onInputChange,
  onEmailVerification
}) => {
  return (
    <div className="lg:col-span-2 p-6 lg:p-8">
      <div className="bg-white rounded-lg p-6 h-full">
        <div className="flex items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Passenger Information</h3>
            <p className="text-gray-600">Your personal details and preferences</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={onInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4AAAFF] focus:border-[#4AAAFF] outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium group-hover:border-gray-300"
                placeholder="Enter your first name"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={onInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4AAAFF] focus:border-[#4AAAFF] outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium group-hover:border-gray-300"
                placeholder="Enter your last name"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={onInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4AAAFF] focus:border-[#4AAAFF] outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium group-hover:border-gray-300"
                placeholder="How you want to be displayed"
              />
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4AAAFF] focus:border-[#4AAAFF] outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium group-hover:border-gray-300"
                placeholder="Enter your phone number"
              />
              <div className="flex items-center mt-2">
                {(userProfile && userProfile.is_phone_verified) ? (
                  <div className="flex items-center bg-green-100 px-2 py-1 rounded-lg">
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700 font-medium text-sm">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center bg-amber-100 px-2 py-1 rounded-lg">
                    <svg className="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-amber-700 font-medium text-sm">Not verified</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-medium"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  {user?.emailVerified ? (
                    <div className="flex items-center bg-green-100 px-2 py-1 rounded-lg">
                      <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-700 font-medium text-sm">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-amber-100 px-2 py-1 rounded-lg">
                      <svg className="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-amber-700 font-medium text-sm">Not verified</span>
                    </div>
                  )}
                </div>
                {!user?.emailVerified && (
                  <button
                    onClick={onEmailVerification}
                    disabled={isVerifyingEmail}
                    className="bg-[#4AAAFF] text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm font-medium disabled:opacity-50 transition-all duration-300"
                  >
                    {isVerifyingEmail ? 'Sending...' : 'Verify Email'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={onInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4AAAFF] focus:border-[#4AAAFF] outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium group-hover:border-gray-300"
              >
                <option value="passenger">Passenger (Book rides only)</option>
                <option value="driver">Driver (Offer rides only)</option>
                <option value="both">Both (Book & Offer rides)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerInformationSection;
