import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

const SPACE = { sm: 24, md: 32, lg: 40 };

export default function SignUp() {
  const auth = useAuth();

  const handleSignUp = (e) => {
    e.preventDefault();
    auth.signinRedirect();
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-10 sm:p-12"
      style={{ backgroundColor: 'var(--color-noir-950)' }}
    >
      <div
        className="w-full max-w-md rounded-xl border-2"
        style={{
          padding: `${SPACE.lg}px ${SPACE.md}px`,
          borderColor: 'var(--color-noir-700)',
          background: 'linear-gradient(180deg, var(--color-noir-900) 0%, var(--color-noir-950) 100%)',
          boxShadow: '0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="flex items-center justify-center gap-4"
          style={{ marginBottom: `${SPACE.lg}px` }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-300))' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h1
            className="text-2xl tracking-[0.25em] font-semibold"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold-400)' }}
          >
            NOIRVISION
          </h1>
        </div>

        <p
          className="text-center text-sm tracking-widest"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-noir-400)',
            marginBottom: `${SPACE.lg}px`,
          }}
        >
          CASE VERIFICATION SYSTEM
        </p>

        <h2
          className="text-xl text-center"
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-noir-100)',
            marginBottom: `${SPACE.lg}px`,
          }}
        >
          Create account
        </h2>

        {auth.error && (
          <p
            className="text-sm text-center"
            style={{
              color: 'var(--color-verdict-red-light)',
              marginBottom: `${SPACE.md}px`,
            }}
          >
            {auth.error.message}
          </p>
        )}

        <form onSubmit={handleSignUp} style={{ marginTop: `${SPACE.md}px`, marginBottom: 0 }}>
          <button
            type="submit"
            className="w-full py-4 px-5 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-400))',
              color: 'var(--color-noir-950)',
              border: '1px solid var(--color-gold-300)',
            }}
          >
            Sign up with NoirVision
          </button>
        </form>

        <p
          className="text-center text-sm"
          style={{
            color: 'var(--color-noir-400)',
            marginTop: `${SPACE.lg}px`,
            marginBottom: 0,
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="underline font-medium hover:opacity-90"
            style={{ color: 'var(--color-gold-400)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
