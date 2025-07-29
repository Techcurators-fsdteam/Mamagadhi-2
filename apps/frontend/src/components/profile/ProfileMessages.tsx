'use client';

interface ProfileMessagesProps {
  message: string;
  error: string;
}

const ProfileMessages: React.FC<ProfileMessagesProps> = ({ message, error }) => {
  if (!message && !error) return null;

  return (
    <>
      {/* Success Message */}
      {message && (
        <div className="w-full max-w-4xl mx-auto mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center">
          <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{message}</span>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="w-full max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center">
          <svg className="w-5 h-5 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}
    </>
  );
};

export default ProfileMessages;
