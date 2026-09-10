import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          width: '100%',
        }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Preserve attempted URL in state for post-login redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
