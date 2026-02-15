import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

export default function Topbar() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [currentTime] = useState(new Date().toLocaleString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        year: 'numeric', month: 'short', day: 'numeric'
    }));

    const userInitial = auth.user?.profile?.email
        ? auth.user.profile.email.charAt(0).toUpperCase()
        : '?';

    const handleSignOut = () => {
        auth.removeUser();
        navigate('/login');
    };

    return (
        <header className="h-16 bg-noir-950 border-b border-noir-700 flex items-center justify-between shrink-0"
            style={{ paddingLeft: '24px', paddingRight: '24px' }}
            style={{ borderBottom: '1px solid var(--color-noir-700)' }}>

            {/* Logo & Title */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-300))' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                </div>
                <h1 className="text-lg tracking-[0.3em] font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold-400)' }}>
                    NOIRVISION
                </h1>
                <span className="text-xs tracking-widest ml-2 hidden sm:inline"
                    style={{ color: 'var(--color-noir-400)', fontFamily: 'var(--font-mono)' }}>
                    CASE VERIFICATION SYSTEM
                </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-5 sm:gap-6">
                <span className="text-xs tracking-wide"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-noir-400)' }}>
                    {currentTime}
                </span>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-verdict-green)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-noir-300)', fontFamily: 'var(--font-mono)' }}>
                        SYSTEM ACTIVE
                    </span>
                </div>
                <span className="text-xs max-w-[120px] truncate hidden sm:inline" style={{ color: 'var(--color-noir-300)' }} title={auth.user?.profile?.email}>
                    {auth.user?.profile?.email}
                </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-noir-600), var(--color-noir-700))',
                        border: '1px solid var(--color-gold-500)',
                        color: 'var(--color-gold-400)',
                        fontFamily: 'var(--font-serif)'
                    }}
                    title={auth.user?.profile?.email}>
                    {userInitial}
                </div>
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-xs px-3 py-2 rounded-md border transition-opacity hover:opacity-90"
                    style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-gold-400)',
                        borderColor: 'var(--color-noir-500)',
                    }}
                >
                    Sign out
                </button>
            </div>
        </header>
    );
}
