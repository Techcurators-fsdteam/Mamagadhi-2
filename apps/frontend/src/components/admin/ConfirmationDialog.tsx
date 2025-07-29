'use client';

interface ConfirmationDialogProps {
  isOpen: boolean;
  action: {
    userId: string;
    documentType: 'id' | 'dl';
    verified: boolean;
    userName: string;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  action,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl w-96 mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {action.verified ? 'Verify Document' : 'Revoke Verification'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to {action.verified ? 'verify' : 'revoke'} the{' '}
              <span className="font-medium">{action.documentType === 'dl' ? 'Driving License' : 'ID Card'}</span>{' '}
              for <span className="font-medium">{action.userName}</span>?
              {action.verified && (
                <span className="block mt-2 text-green-600">
                  This will allow the user to publish rides.
                </span>
              )}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-2 rounded-md text-white transition-colors ${
                  action.verified
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action.verified ? 'Yes, Verify' : 'Yes, Revoke'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
