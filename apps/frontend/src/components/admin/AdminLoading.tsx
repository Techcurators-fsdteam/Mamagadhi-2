'use client';

const AdminLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4AAAFF]"></div>
      </div>
    </div>
  );
};

export default AdminLoading;
