import { useEffect, useState } from 'react';

export default function CredibilityGauge({ score, verdict }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const isSupported = verdict === 'supported';
    const color = isSupported ? 'var(--color-verdict-green-light)' : 'var(--color-verdict-red-light)';
    const glowColor = isSupported ? 'var(--color-verdict-green-glow)' : 'var(--color-verdict-red-glow)';

    // Circle math
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(score), 300);
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <div className="flex flex-col items-center" style={{ gap: '20px' }}>
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                    {/* Background circle */}
                    <circle
                        cx="70" cy="70" r={radius}
                        fill="none"
                        stroke="var(--color-noir-700)"
                        strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="70" cy="70" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        transform="rotate(-90 70 70)"
                        style={{
                            transition: 'stroke-dashoffset 1.5s ease-out',
                            filter: `drop-shadow(0 0 8px ${glowColor})`,
                        }}
                    />
                </svg>
                {/* Center text */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                }}>
                    <span style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '2.2rem',
                        fontWeight: 700,
                        color: color,
                        lineHeight: 1,
                    }}>
                        {animatedScore}
                    </span>
                    <br />
                    <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        color: 'var(--color-noir-400)',
                        letterSpacing: '0.15em',
                    }}>
                        / 100
                    </span>
                </div>
            </div>
            <p style={{
                fontFamily: 'var(--font-typewriter)',
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                color: 'var(--color-noir-300)',
                margin: 0,
            }}>
                CREDIBILITY SCORE
            </p>
        </div>
    );
}
