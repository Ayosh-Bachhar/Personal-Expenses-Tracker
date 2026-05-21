import { Navigate, Outlet } from 'react-router-dom';
import { useGoogleAuth } from './GoogleAuthProvider.jsx';

function LoginRequiredRoute() {
  const { isAuthenticated } = useGoogleAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default LoginRequiredRoute;