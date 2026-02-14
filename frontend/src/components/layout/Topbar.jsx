import { useState } from 'react';

export default function Topbar() {
    const [currentTime] = useState(new Date().toLocaleString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        year: 'numeric', month: 'short', day: 'numeric'
    }));

    return (
        <header className="h-14 bg-noir-950 border-b border-noir-700 flex items-center justify-between px-5 shrink-0"
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
            <div className="flex items-center gap-4">
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-noir-600), var(--color-noir-700))',
                        border: '1px solid var(--color-gold-500)',
                        color: 'var(--color-gold-400)',
                        fontFamily: 'var(--font-serif)'
                    }}>
                    SK
                </div>
            </div>
        </header>
    );
}
