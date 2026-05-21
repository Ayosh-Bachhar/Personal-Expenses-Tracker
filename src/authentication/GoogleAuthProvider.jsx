import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const GoogleAuthContext = createContext(null);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function getRedirectUri() {
  return `${window.location.origin}/login`;
}

function loadGoogleIdentityScript() {
  return new Promise((resolve, reject) => {
    if (
      window.google &&
      window.google.accounts &&
      window.google.accounts.oauth2
    ) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', resolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = resolve;

    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services script.'));
    };

    document.body.appendChild(script);
  });
}

function getAccessTokenFromUrl() {
  const hash = window.location.hash;

  if (!hash) {
    return '';
  }

  const hashParams = new URLSearchParams(hash.replace('#', ''));
  return hashParams.get('access_token') || '';
}

export function GoogleAuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState('');
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [tokenClient, setTokenClient] = useState(null);

  useEffect(() => {
    const redirectedAccessToken = getAccessTokenFromUrl();

    if (redirectedAccessToken) {
      setAccessToken(redirectedAccessToken);
      setLoginError('');

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, []);

  useEffect(() => {
    async function prepareGoogleLogin() {
      try {
        if (!GOOGLE_CLIENT_ID) {
          setLoginError('Google Client ID is missing.');
          return;
        }

        await loadGoogleIdentityScript();

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_SCOPE,
          ux_mode: 'redirect',
          redirect_uri: getRedirectUri(),
        });

        setTokenClient(client);
        setIsGoogleReady(true);
      } catch (error) {
        setLoginError(error.message || 'Google login initialization failed.');
      }
    }

    prepareGoogleLogin();
  }, []);

  function login() {
    setLoginError('');

    if (!tokenClient) {
      setLoginError('Google login is not ready yet. Please wait and try again.');
      return;
    }

    tokenClient.requestAccessToken({
      prompt: 'consent',
    });
  }

  function logout() {
    if (accessToken && window.google && window.google.accounts) {
      window.google.accounts.oauth2.revoke(accessToken);
    }

    setAccessToken('');
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