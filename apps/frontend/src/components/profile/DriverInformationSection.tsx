'use client';

import { useRouter } from 'next/navigation';

interface DriverInformationSectionProps {
  isIdVerified: boolean;
  isDlVerified: boolean;
  drivingLicenceFile: File | null;
  idCardFile: File | null;
  dlUploadStatus: 'idle' | 'uploading' | 'uploaded' | 'error';
  idUploadStatus: 'idle' | 'uploading' | 'uploaded' | 'error';
  isDLFieldLocked: boolean;
  isIDFieldLocked: boolean;
  onDrivingLicenceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIdCardChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadDL: () => Promise<void>;
  onUploadID: () => Promise<void>;
}

const DriverInformationSection: React.FC<DriverInformationSectionProps> = ({
  isIdVerified,
  isDlVerified,
  drivingLicenceFile,
  idCardFile,
  dlUploadStatus,
  idUploadStatus,
  isDLFieldLocked,
  isIDFieldLocked,
  onDrivingLicenceChange,
  onIdCardChange,
  onUploadDL,
  onUploadID
}) => {
  const router = useRouter();

  return (
    <div className="bg-white p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Driver Information</h3>
            <p className="text-gray-600">Upload your documents to become a verified driver</p>
          </div>
        </div>
        
        {/* Driver Verification Status and Publish Button */}
        <div className="flex items-center gap-4">
          {(isIdVerified && isDlVerified) ? (
            <>
              <div className="flex items-center bg-green-100 px-4 py-2 rounded-lg">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">Verified Driver</span>
              </div>
              <button
                onClick={() => router.push('/publish')}
                className="px-6 py-2 bg-[#4AAAFF] text-white font-medium rounded-lg hover:bg-blue-600 transition-all duration-300"
              >
                Publish Ride
              </button>
            </>
          ) : (
            <div className="flex items-center bg-amber-100 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-amber-800 font-medium">Pending Verification</span>
            </div>
          )}
        </div>
      </div>

      {/* Document Upload Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Driving License Upload */}
        <div className="bg-white rounded-lg p-6 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div>
                <h4 className="text-lg font-bold text-gray-800">Driving License</h4>
                <p className="text-gray-600 text-sm">Required for verification</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isDlVerified 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              {isDlVerified ? 'Verified' : 'Not Verified'}
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">Upload your valid driving license document</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.webp,.bmp"
                onChange={onDrivingLicenceChange}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#4AAAFF] focus:border-[#4AAAFF] outline-none disabled:bg-gray-50 disabled:cursor-not-allowed font-medium transition-all duration-300"
                disabled={isDLFieldLocked}
              />
              {!isDLFieldLocked && drivingLicenceFile && dlUploadStatus !== 'uploaded' && (
                <button
                  type="button"
                  onClick={onUploadDL}
                  className="bg-[#4AAAFF] text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 transition-all duration-300"
                  disabled={dlUploadStatus === 'uploading'}
                >
                  {dlUploadStatus === 'uploading' ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Upload'
                  )}
                </button>
              )}
            </div>
            
            {drivingLicenceFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 font-medium text-sm">
                  Selected: <span className="font-medium">{drivingLicenceFile.name}</span>
                  {dlUploadStatus === 'uploaded' && <span className="ml-2 text-green-600 font-medium">(Uploaded Successfully)</span>}
                </p>
              </div>
            )}
            
            {isDLFieldLocked && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-700 font-medium">Driving license uploaded successfully!</p>
                </div>
                <p className="text-green-600 mt-1 text-sm">Document is locked and cannot be changed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Government ID Upload */}
        <div className="bg-white rounded-lg p-6 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div>
                <h4 className="text-lg font-bold text-gray-800">Government ID</h4>
                <p className="text-gray-600 text-sm">Identity verification</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isIdVerified 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              {isIdVerified ? 'Verified' : 'Not Verified'}
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">Upload your Aadhar Card, PAN Card, or other government ID</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.webp,.bmp"
                onChange={onIdCardChange}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#4AAAFF] focus:border-[#4AAAFF] outline-none disabled:bg-gray-50 disabled:cursor-not-allowed font-medium transition-all duration-300"
                disabled={isIDFieldLocked}
              />
              {!isIDFieldLocked && idCardFile && idUploadStatus !== 'uploaded' && (
                <button
                  type="button"
                  onClick={onUploadID}
                  className="bg-[#4AAAFF] text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 transition-all duration-300"
                  disabled={idUploadStatus === 'uploading'}
                >
                  {idUploadStatus === 'uploading' ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Upload'
                  )}
                </button>
              )}
            </div>
            
            {idCardFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 font-medium text-sm">
                  Selected: <span className="font-medium">{idCardFile.name}</span>
                  {idUploadStatus === 'uploaded' && <span className="ml-2 text-green-600 font-medium">(Uploaded Successfully)</span>}
                </p>
              </div>
            )}
            
            {isIDFieldLocked && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-700 font-medium">ID document uploaded successfully!</p>
                </div>
                <p className="text-green-600 mt-1 text-sm">Document is locked and cannot be changed.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Driver Information Message */}
      {(!isIdVerified || !isDlVerified) && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            
            <div>
              <p className="text-amber-800 font-medium text-lg mb-2">
                Important: Complete Your Driver Verification
              </p>
              <p className="text-amber-700 mb-1">
                Both documents must be verified by admin before you can publish rides.
              </p>
              <p className="text-amber-600">
                {!isIdVerified && !isDlVerified && "Please upload both your driving license and government ID documents above."}
                {(isIdVerified && !isDlVerified) && "Your ID is verified. Please upload your driving license for verification."}
                {(!isIdVerified && isDlVerified) && "Your driving license is verified. Please upload your ID for verification."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverInformationSection;
