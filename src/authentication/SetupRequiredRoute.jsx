import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  hasValidAppConfig,
  loadAppConfig,
} from '../utilities/appConfigStorage.js';

function SetupRequiredRoute() {
  const location = useLocation();
  const appConfig = loadAppConfig();

  if (!hasValidAppConfig(appConfig)) {
    return <Navigate to="/setup" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default SetupRequiredRoute;