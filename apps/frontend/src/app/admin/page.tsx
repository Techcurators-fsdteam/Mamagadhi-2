'use client';

import SecureAdminAccess from '../../components/admin/SecureAdminAccess';
import AdminLogin from '../../components/admin/AdminLogin';
import AdminLoading from '../../components/admin/AdminLoading';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminStatsCards from '../../components/admin/AdminStatsCards';
import AdminFilters from '../../components/admin/AdminFilters';
import UsersTable from '../../components/admin/UsersTable';
import UserDetailModal from '../../components/admin/UserDetailModal';
import ConfirmationDialog from '../../components/admin/ConfirmationDialog';
import { useAdminLogic } from '../../hooks/useAdminLogic';

export default function AdminPage() {
  const {
    // State
    users,
    stats,
    loadingData,
    error,
    selectedUser,
    isDetailModalOpen,
    searchTerm,
    filterRole,
    filterVerification,
    isAuthenticated,
    authError,
    showConfirmDialog,
    confirmAction,
    isCheckingAuth,

    // Handlers
    handleAdminLogin,
    handleAdminLogout,
    openDetailModal,
    closeDetailModal,
    handleVerifyDocument,
    confirmVerification,
    cancelConfirmation,
    setSearchTerm,
    setFilterRole,
    setFilterVerification
  } = useAdminLogic();

  return (
      <AdminDashboard />
  );
}

function AdminDashboard() {
  const {
    // State
    users,
    stats,
    loadingData,
    error,
    selectedUser,
    isDetailModalOpen,
    searchTerm,
    filterRole,
    filterVerification,
    isAuthenticated,
    authError,
    showConfirmDialog,
    confirmAction,
    isCheckingAuth,

    // Handlers
    handleAdminLogin,
    handleAdminLogout,
    openDetailModal,
    closeDetailModal,
    handleVerifyDocument,
    confirmVerification,
    cancelConfirmation,
    setSearchTerm,
    setFilterRole,
    setFilterVerification
  } = useAdminLogic();

  // Show loading while checking existing session
  if (isCheckingAuth) {
    return <AdminLoading />;
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleAdminLogin} authError={authError} />;
  }

  if (loadingData) {
    return <AdminLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
        <AdminHeader error={error} onLogout={handleAdminLogout} />
        
        <AdminFilters
          searchTerm={searchTerm}
          filterRole={filterRole}
          filterVerification={filterVerification}
          onSearchChange={setSearchTerm}
          onRoleChange={setFilterRole}
          onVerificationChange={setFilterVerification}
        />

        <AdminStatsCards stats={stats} />

        <UsersTable users={users} onViewDetails={openDetailModal} />

        <UserDetailModal
          isOpen={isDetailModalOpen}
          user={selectedUser}
          onClose={closeDetailModal}
          onVerifyDocument={handleVerifyDocument}
        />

        <ConfirmationDialog
          isOpen={showConfirmDialog}
          action={confirmAction}
          onConfirm={confirmVerification}
          onCancel={cancelConfirmation}
        />
      </main>
    </div>
  );
}
