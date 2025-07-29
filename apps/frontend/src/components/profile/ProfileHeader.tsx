'use client';

interface ProfileHeaderProps {
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel
}) => {
  return (
    <header className="w-full flex flex-row items-center justify-between mb-8 mt-4 gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>
      {!isEditing ? (
        <button
          onClick={onEdit}
          className="bg-[#4AAAFF] text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap font-medium"
        >
          Edit Profile
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-2 border-2 border-[#4AAAFF] rounded-lg text-[#4AAAFF] hover:bg-[#4AAAFF] hover:text-white transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="bg-[#4AAAFF] text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </header>
  );
};

export default ProfileHeader;
