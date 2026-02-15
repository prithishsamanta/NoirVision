export default function ComparisonTable({ comparisons }) {
    return (
        <div>
            <h3 className="text-sm tracking-[0.2em] font-semibold"
                style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-gold-400)', marginBottom: '20px', marginTop: 0 }}>
                ▌ CLAIM vs. REALITY ANALYSIS
            </h3>

            <div className="vintage-card overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_1fr_60px]" style={{
                    backgroundColor: 'var(--color-noir-700)',
                    borderBottom: '2px solid var(--color-gold-500)',
                }}>
                    <div style={{ padding: '16px' }}>
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            color: 'var(--color-gold-400)',
                            letterSpacing: '0.2em',
                        }}>CLAIM STATES</span>
                    </div>
                    <div style={{ padding: '16px' }}>
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            color: 'var(--color-gold-400)',
                            letterSpacing: '0.2em',
                        }}>VIDEO SHOWS</span>
                    </div>
                    <div className="text-center" style={{ padding: '16px' }}>
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            color: 'var(--color-gold-400)',
                            letterSpacing: '0.2em',
                        }}>STATUS</span>
                    </div>
                </div>

                {/* Rows */}
                {comparisons.map((row, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-[1fr_1fr_60px] animate-fade-in-up"
                        style={{
                            borderBottom: i < comparisons.length - 1 ? '1px solid var(--color-noir-700)' : 'none',
                            opacity: 0,
                            animationDelay: `${i * 0.1}s`,
                            animationFillMode: 'forwards',
                        }}
                    >
                        <div style={{
                            padding: '16px',
                            fontFamily: 'var(--font-typewriter)',
                            fontSize: '0.78rem',
                            color: 'var(--color-noir-200)',
                            lineHeight: 1.5,
                        }}>
                            {row.claim}
                        </div>
                        <div style={{
                            padding: '16px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            color: 'var(--color-noir-100)',
                            lineHeight: 1.5,
                        }}>
                            {row.reality}
                        </div>
                        <div className="flex items-center justify-center" style={{ padding: '16px' }}>
                            {row.match ? (
                                <span style={{
                                    color: 'var(--color-verdict-green-light)',
                                    fontSize: '1.2rem',
                                    filter: 'drop-shadow(0 0 4px var(--color-verdict-green-glow))',
                                }}>✓</span>
                            ) : (
                                <span style={{
                                    color: 'var(--color-verdict-red-light)',
                                    fontSize: '1.2rem',
                                    filter: 'drop-shadow(0 0 4px var(--color-verdict-red-glow))',
                                }}>✗</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
