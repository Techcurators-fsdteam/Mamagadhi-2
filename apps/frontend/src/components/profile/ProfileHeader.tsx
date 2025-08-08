'use client';

interface ProfileHeaderProps {
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onDeleteProfile: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  onDeleteProfile
}) => {
  return (
    <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 mt-4 gap-4 sm:gap-6">
      <div className="flex-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Profile Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your account information and preferences</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {!isEditing ? (
          <>
            <button
              onClick={onDeleteProfile}
              className="flex-1 sm:flex-none bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap font-medium text-sm sm:text-base"
            >
              Delete Profile
            </button>
            <button
              onClick={onEdit}
              className="flex-1 sm:flex-none bg-[#4AAAFF] text-white px-4 sm:px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap font-medium text-sm sm:text-base"
            >
              Edit Profile
            </button>
          </>
        ) : (
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2 border-2 border-[#4AAAFF] rounded-lg text-[#4AAAFF] hover:bg-[#4AAAFF] hover:text-white transition-colors disabled:opacity-50 font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none bg-[#4AAAFF] text-white px-4 sm:px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium text-sm sm:text-base"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default ProfileHeader;
