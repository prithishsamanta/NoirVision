export default function Timeline({ events }) {
    return (
        <div className="stagger-children">
            <h3 className="text-sm tracking-[0.2em] font-semibold mb-4"
                style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-gold-400)' }}>
                ▌ EVIDENCE TIMELINE
            </h3>
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
                {/* Vertical line */}
                <div style={{
                    position: 'absolute',
                    left: '7px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    background: 'linear-gradient(180deg, var(--color-noir-600), var(--color-noir-800))',
                }} />

                {events.map((evt, i) => {
                    const isMismatch = evt.status === 'mismatch';
                    const isPartial = evt.status === 'partial';
                    const dotColor = isMismatch
                        ? 'var(--color-verdict-red)'
                        : isPartial
                            ? 'var(--color-gold-500)'
                            : 'var(--color-verdict-green)';

                    return (
                        <div key={i} className="animate-fade-in-up mb-4" style={{ opacity: 0 }}>
                            {/* Dot */}
                            <div style={{
                                position: 'absolute',
                                left: '2px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: dotColor,
                                boxShadow: `0 0 8px ${dotColor}`,
                                marginTop: '4px',
                            }} />

                            <div className="vintage-card p-3 ml-3">
                                {/* Time */}
                                <div className="flex items-center justify-between mb-1">
                                    <span style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.75rem',
                                        color: 'var(--color-gold-300)',
                                        letterSpacing: '0.1em',
                                    }}>
                                        {evt.time}
                                    </span>
                                    <span style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.6rem',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        backgroundColor: isMismatch ? 'var(--color-verdict-red-glow)' : isPartial ? 'rgba(201,162,39,0.2)' : 'var(--color-verdict-green-glow)',
                                        color: isMismatch ? 'var(--color-verdict-red-light)' : isPartial ? 'var(--color-gold-400)' : 'var(--color-verdict-green-light)',
                                        letterSpacing: '0.1em',
                                    }}>
                                        {isMismatch ? 'CONFLICT' : isPartial ? 'PARTIAL' : 'MATCH'}
                                    </span>
                                </div>
                                {/* Event */}
                                <p style={{
                                    fontFamily: 'var(--font-typewriter)',
                                    fontSize: '0.8rem',
                                    color: 'var(--color-noir-100)',
                                    marginBottom: '4px',
                                    lineHeight: 1.5,
                                }}>
                                    {evt.event}
                                </p>
                                {/* Claim ref */}
                                <p style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.7rem',
                                    color: 'var(--color-noir-400)',
                                    fontStyle: 'italic',
                                }}>
                                    Ref: "{evt.claimRef}"
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
