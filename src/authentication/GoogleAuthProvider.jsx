import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const GoogleAuthContext = createContext(null);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_STORAGE_KEY = 'personal_expenses_tracker_google_access_token';
const AUTO_LOGOUT_TIME_MS = 5 * 60 * 1000;

function getRedirectUri() {
  return `${window.location.origin}/login`;
}

function getAccessTokenFromUrl() {
  const hash = window.location.hash;

  if (!hash) {
    return '';
  }

  const hashParams = new URLSearchParams(hash.replace('#', ''));
  return hashParams.get('access_token') || '';
}

function getOAuthErrorFromUrl() {
  const hash = window.location.hash;

  if (!hash) {
    return '';
  }

  const hashParams = new URLSearchParams(hash.replace('#', ''));
  const error = hashParams.get('error') || '';
  const errorDescription = hashParams.get('error_description') || '';

  if (errorDescription) {
    return errorDescription;
  }

  return error;
}

function buildGoogleOAuthUrl() {
  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  oauthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  oauthUrl.searchParams.set('redirect_uri', getRedirectUri());
  oauthUrl.searchParams.set('response_type', 'token');
  oauthUrl.searchParams.set('scope', GOOGLE_SCOPE);
  oauthUrl.searchParams.set('include_granted_scopes', 'true');
  oauthUrl.searchParams.set('prompt', 'consent');

  return oauthUrl.toString();
}

export function GoogleAuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState('');
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [loginError, setLoginError] = useState('');
  const inactivityTimerRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setLoginError('Google Client ID is missing.');
      setIsGoogleReady(false);
      return;
    }

    const oauthError = getOAuthErrorFromUrl();

    if (oauthError) {
      setLoginError(oauthError);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      setIsGoogleReady(true);
      return;
    }

    const redirectedAccessToken = getAccessTokenFromUrl();

    if (redirectedAccessToken) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, redirectedAccessToken);
      setAccessToken(redirectedAccessToken);
      setLoginError('');

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      setIsGoogleReady(true);
      return;
    }

    const savedAccessToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);

    if (savedAccessToken) {
      setAccessToken(savedAccessToken);
    }

    setIsGoogleReady(true);
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    function clearInactivityTimer() {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }

    function autoLogoutUser() {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      setAccessToken('');
      setLoginError('You were logged out after 5 minutes of inactivity.');
      window.location.href = '/login';
    }

    function resetInactivityTimer() {
      clearInactivityTimer();

      inactivityTimerRef.current = setTimeout(() => {
        autoLogoutUser();
      }, AUTO_LOGOUT_TIME_MS);
    }

    resetInactivityTimer();

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer);
    });

    return () => {
      clearInactivityTimer();

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [accessToken]);

  function login() {
    setLoginError('');

    if (!GOOGLE_CLIENT_ID) {
      setLoginError('Google Client ID is missing.');
      return;
    }

    window.location.href = buildGoogleOAuthUrl();
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setAccessToken('');
    setLoginError('');
  }

  const authValue = useMemo(
    () => ({
      accessToken,
      isAuthenticated: Boolean(accessToken),
      isGoogleReady,
      loginError,
      login,
      logout,
    }),
    [accessToken, isGoogleReady, loginError]
  );

  return (
    <GoogleAuthContext.Provider value={authValue}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);

  if (!context) {
    throw new Error('useGoogleAuth must be used inside GoogleAuthProvider.');
  }

  return context;
}

export default GoogleAuthProvider;