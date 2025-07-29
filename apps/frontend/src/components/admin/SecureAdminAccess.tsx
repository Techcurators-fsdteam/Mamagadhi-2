'use client';

import React from 'react';

interface SecureAdminAccessProps {
  children: React.ReactNode;
}

const SecureAdminAccess: React.FC<SecureAdminAccessProps> = ({ children }) => {
  // Simply render children - authentication is handled by the admin components themselves
  return <>{children}</>;
};

export default SecureAdminAccess;