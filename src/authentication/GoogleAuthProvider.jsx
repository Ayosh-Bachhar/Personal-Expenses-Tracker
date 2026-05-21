import { createContext, useContext, useMemo, useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

const GoogleAuthContext = createContext(null);

const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

export function GoogleAuthProvider({ children }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <section className="max-w-xl rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8">
          <h1 className="text-2xl font-black text-rose-300">
            Google Client ID Missing
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            Create a <span className="font-bold">.env</span> file in the project
            root and add:
          </p>

          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-rose-200">
            VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
          </pre>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            Restart the development server after adding it.
          </p>
        </section>
      </main>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleAuthStateProvider>{children}</GoogleAuthStateProvider>
    </GoogleOAuthProvider>
  );
}

function GoogleAuthStateProvider({ children }) {
  const [accessToken, setAccessToken] = useState('');
  const [loginError, setLoginError] = useState('');

  const login = useGoogleLogin({
    scope: GOOGLE_SHEETS_SCOPE,
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      setLoginError('');
    },
    onError: () => {
      setLoginError('Google login failed. Please try again.');
    },
  });

  function logout() {
    setAccessToken('');
    setLoginError('');
  }

  const authValue = useMemo(
    () => ({
      accessToken,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
      loginError,
    }),
    [accessToken, login, loginError]
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