export default function VerdictStamp({ verdict }) {
    const isSupported = verdict === 'supported';

    return (
        <div className="animate-stamp" style={{
            position: 'absolute',
            top: '20px',
            right: '30px',
            transform: 'rotate(-12deg)',
            zIndex: 10,
            pointerEvents: 'none',
        }}>
            <div style={{
                padding: '8px 24px',
                border: `4px solid ${isSupported ? 'var(--color-verdict-green)' : 'var(--color-verdict-red)'}`,
                borderRadius: '8px',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.8rem',
                fontWeight: 900,
                letterSpacing: '0.15em',
                color: isSupported ? 'var(--color-verdict-green)' : 'var(--color-verdict-red)',
                opacity: 0.75,
                textTransform: 'uppercase',
                lineHeight: 1,
                textShadow: `0 0 10px ${isSupported ? 'var(--color-verdict-green-glow)' : 'var(--color-verdict-red-glow)'}`,
            }}>
                {isSupported ? 'VERIFIED' : 'REJECTED'}
            </div>
        </div>
    );
}
