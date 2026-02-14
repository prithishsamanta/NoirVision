import { useState, useRef } from 'react';
import { MOCK_SUPPORTED_CASE, MOCK_CONTRADICTED_CASE } from '../data/mockData';

export default function Workspace({ caseData, onAnalyze }) {
    const [claim, setClaim] = useState('');
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) setFileName(file.name);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) setFileName(file.name);
    };

    const handleSubmit = () => {
        if (!fileName || !claim.trim()) return;
        setIsAnalyzing(true);
        setTimeout(() => {
            const mockResult = Math.random() > 0.5 ? MOCK_SUPPORTED_CASE : MOCK_CONTRADICTED_CASE;
            onAnalyze({ ...mockResult, claim: claim });
            setIsAnalyzing(false);
        }, 2500);
    };

    // ============================
    // STATE: Analyzing (loading)
    // ============================
    if (isAnalyzing) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ backgroundColor: 'var(--color-noir-950)' }}>
                <div className="text-center">
                    <div className="mb-6" style={{ display: 'inline-block' }}>
                        <svg width="60" height="60" viewBox="0 0 60 60" style={{ animation: 'spin 2s linear infinite' }}>
                            <circle cx="30" cy="30" r="25" fill="none" stroke="var(--color-noir-700)" strokeWidth="4" />
                            <circle cx="30" cy="30" r="25" fill="none" stroke="var(--color-gold-500)" strokeWidth="4"
                                strokeDasharray="40 120" strokeLinecap="round" />
                        </svg>
                    </div>
                    <p className="text-lg mb-2" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-gold-400)' }}>
                        ANALYZING EVIDENCE...
                    </p>
                    <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-noir-400)' }}>
                        Cross-referencing claim against video timeline
                    </p>
                </div>
            </div>
        );
    }

    // ============================
    // STATE: VERITAS CREDIBILITY REPORT
    // ============================
    if (caseData) {
        const isSupported = caseData.verdict === 'supported';
        const accentColor = isSupported ? 'var(--color-verdict-green)' : 'var(--color-verdict-red)';
        const accentLight = isSupported ? 'var(--color-verdict-green-light)' : 'var(--color-verdict-red-light)';
        const accentGlow = isSupported ? 'var(--color-verdict-green-glow)' : 'var(--color-verdict-red-glow)';

        return (
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--color-noir-950)' }}>
                <div className="max-w-4xl mx-auto p-6 stagger-children">

                    {/* ═══════════ REPORT HEADER ═══════════ */}
                    <div className="animate-fade-in-up" style={{
                        opacity: 0,
                        animationFillMode: 'forwards',
                        textAlign: 'center',
                        padding: '28px 24px',
                        marginBottom: '20px',
                        borderTop: `3px double ${accentColor}`,
                        borderBottom: `3px double ${accentColor}`,
                        background: `linear-gradient(180deg, var(--color-noir-900) 0%, var(--color-noir-950) 100%)`,
                        position: 'relative',
                    }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-noir-400)', letterSpacing: '0.3em', marginBottom: '8px' }}>
                            ═══════════════════════════════════════════
                        </p>
                        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-gold-400)', letterSpacing: '0.15em', marginBottom: '10px' }}>
                            VERITAS CREDIBILITY REPORT
                        </h1>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-noir-200)', marginBottom: '4px' }}>
                            Case #: {caseData.caseId}
                        </p>
                        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontStyle: 'italic', color: accentLight }}>
                            "{caseData.caseTitle}"
                        </p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-noir-400)', letterSpacing: '0.3em', marginTop: '8px' }}>
                            ═══════════════════════════════════════════
                        </p>

                        {/* Verdict stamp overlay */}
                        <div className="animate-stamp" style={{
                            position: 'absolute',
                            top: '14px',
                            right: '24px',
                            transform: 'rotate(-12deg)',
                            padding: '6px 16px',
                            border: `3px solid ${accentColor}`,
                            borderRadius: '6px',
                            fontFamily: 'var(--font-serif)',
                            fontSize: '1rem',
                            fontWeight: 900,
                            letterSpacing: '0.12em',
                            color: accentColor,
                            opacity: 0.65,
                            pointerEvents: 'none',
                        }}>
                            {isSupported ? 'VERIFIED' : 'REJECTED'}
                        </div>
                    </div>

                    {/* ═══════════ WITNESS CLAIM ═══════════ */}
                    <ReportSection title="WITNESS CLAIM" delay="0.15s">
                        <p style={{
                            fontFamily: 'var(--font-typewriter)',
                            fontSize: '0.88rem',
                            color: 'var(--color-paper-100)',
                            lineHeight: 1.8,
                            fontStyle: 'italic',
                        }}>
                            "{caseData.claim}"
                        </p>
                    </ReportSection>

                    {/* ═══════════ VIDEO EVIDENCE ANALYSIS ═══════════ */}
                    <ReportSection title="VIDEO EVIDENCE ANALYSIS (TwelveLabs)" delay="0.3s">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5">
                            <InfoField label="Source" value={caseData.videoSource} />
                            <InfoField label="Duration" value={caseData.videoDuration} />
                        </div>

                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-gold-400)', letterSpacing: '0.15em', marginBottom: '12px' }}>
                            Key Detections:
                        </p>
                        <div style={{ paddingLeft: '8px' }}>
                            {caseData.keyDetections.map((det, i) => (
                                <div key={i} className="flex gap-3 mb-2.5 items-start">
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-gold-300)', whiteSpace: 'nowrap' }}>
                                        ⏱ {det.time}
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.82rem', color: 'var(--color-noir-100)', lineHeight: 1.5 }}>
                                        {det.event}
                                        {det.details && (
                                            <span style={{ color: 'var(--color-noir-400)', fontSize: '0.78rem' }}> ({det.details})</span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {caseData.onScreenText && (
                            <div className="mt-4">
                                <InfoField label="On-Screen Text" value={caseData.onScreenText} />
                            </div>
                        )}

                        <div className="mt-2">
                            <InfoField label="GPS Metadata" value={caseData.gpsMetadata} />
                        </div>

                        {caseData.speechTranscription && (
                            <div className="mt-4">
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-gold-400)', letterSpacing: '0.15em', marginBottom: '8px' }}>
                                    Speech Transcription (from nearby mic):
                                </p>
                                {caseData.speechTranscription.map((line, i) => (
                                    <p key={i} style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.82rem', color: 'var(--color-noir-200)', marginBottom: '4px', paddingLeft: '8px' }}>
                                        <span style={{ color: 'var(--color-gold-300)' }}>— {line.speaker}:</span> "{line.text}"
                                    </p>
                                ))}
                            </div>
                        )}
                    </ReportSection>

                    {/* ═══════════ COMPARISON ENGINE ANALYSIS ═══════════ */}
                    <ReportSection title="COMPARISON ENGINE ANALYSIS" delay="0.45s">
                        <div style={{ paddingLeft: '4px' }}>
                            {caseData.comparisons.map((comp, i) => (
                                <div key={i} className="flex gap-3 mb-3 items-start">
                                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚖️</span>
                                    <span style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.84rem', color: 'var(--color-noir-100)', lineHeight: 1.5 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--color-noir-100)' }}>{comp.label}: </span>
                                        <span style={{
                                            color: comp.match ? 'var(--color-verdict-green-light)' : 'var(--color-verdict-red-light)',
                                            fontWeight: 700,
                                            filter: `drop-shadow(0 0 3px ${comp.match ? 'var(--color-verdict-green-glow)' : 'var(--color-verdict-red-glow)'})`
                                        }}>
                                            {comp.match ? '✓' : '✗'}
                                        </span>
                                        <span style={{ color: 'var(--color-noir-300)', marginLeft: '6px' }}>({comp.detail})</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ReportSection>

                    {/* ═══════════ VERDICT ═══════════ */}
                    <ReportSection title="VERDICT" delay="0.6s">
                        {/* Credibility Score */}
                        <div className="flex items-center gap-4 mb-4">
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-noir-200)', letterSpacing: '0.1em' }}>
                                CREDIBILITY SCORE:
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontSize: '2rem',
                                    fontWeight: 900,
                                    color: accentLight,
                                    lineHeight: 1,
                                    textShadow: `0 0 12px ${accentGlow}`,
                                }}>
                                    {caseData.credibilityScore}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-noir-400)' }}>/100</span>
                            </div>
                        </div>

                        {/* Credibility bar */}
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-noir-700)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${caseData.credibilityScore}%`,
                                backgroundColor: accentLight,
                                borderRadius: '3px',
                                boxShadow: `0 0 10px ${accentGlow}`,
                                transition: 'width 1.5s ease-out',
                            }} />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3 mb-5">
                            <span style={{ fontSize: '1.1rem' }}>{isSupported ? '✅' : '❌'}</span>
                            <span style={{
                                fontFamily: 'var(--font-typewriter)',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: accentLight,
                                letterSpacing: '0.05em',
                            }}>
                                {caseData.statusLabel}
                            </span>
                        </div>

                        {/* Investigation Recommendation */}
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-gold-400)', letterSpacing: '0.15em', marginBottom: '10px' }}>
                            INVESTIGATION RECOMMENDATION:
                        </p>
                        <div style={{ paddingLeft: '8px' }}>
                            {caseData.recommendations.map((rec, i) => (
                                <p key={i} style={{
                                    fontFamily: 'var(--font-typewriter)',
                                    fontSize: '0.84rem',
                                    color: 'var(--color-noir-200)',
                                    lineHeight: 1.7,
                                    marginBottom: '6px',
                                }}>
                                    → {rec}
                                </p>
                            ))}
                        </div>
                    </ReportSection>

                    {/* ═══════════ EVIDENCE SUMMARY ═══════════ */}
                    <ReportSection title="EVIDENCE SUMMARY (for detective's notebook)" delay="0.75s">
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {caseData.evidenceSummary.map((item, i) => (
                                <li key={i} style={{
                                    fontFamily: 'var(--font-typewriter)',
                                    fontSize: '0.84rem',
                                    color: 'var(--color-noir-200)',
                                    lineHeight: 1.7,
                                    marginBottom: '4px',
                                    paddingLeft: '16px',
                                    position: 'relative',
                                }}>
                                    <span style={{ position: 'absolute', left: 0, color: 'var(--color-gold-500)' }}>•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        {/* Detective quote */}
                        <div className="mt-5 p-4 rounded" style={{
                            borderLeft: `3px solid ${accentColor}`,
                            backgroundColor: 'var(--color-noir-800)',
                        }}>
                            <p style={{
                                fontFamily: 'var(--font-typewriter)',
                                fontSize: '0.88rem',
                                fontStyle: 'italic',
                                color: 'var(--color-paper-200)',
                                lineHeight: 1.7,
                            }}>
                                {caseData.detectiveQuote}
                            </p>
                        </div>
                    </ReportSection>

                    {/* ═══════════ REPORT FOOTER ═══════════ */}
                    <div className="animate-fade-in-up" style={{
                        opacity: 0,
                        animationFillMode: 'forwards',
                        animationDelay: '0.9s',
                        textAlign: 'center',
                        padding: '20px 24px',
                        borderTop: `3px double ${accentColor}`,
                        borderBottom: `3px double ${accentColor}`,
                        marginBottom: '32px',
                    }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-noir-400)', letterSpacing: '0.3em', marginBottom: '6px' }}>
                            ═══════════════════════════════════════════
                        </p>
                        <p style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.85rem', color: 'var(--color-noir-200)', marginBottom: '4px' }}>
                            Case filed by: {caseData.filedBy}
                        </p>
                        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--color-gold-400)' }}>
                            {caseData.tagline}
                        </p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-noir-400)', letterSpacing: '0.3em', marginTop: '6px' }}>
                            ═══════════════════════════════════════════
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ============================
    // STATE: Upload (idle)
    // ============================
    return (
        <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: 'var(--color-noir-950)' }}>
            <div className="w-full max-w-2xl">
                {/* Title */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold-400)', letterSpacing: '0.1em' }}>
                        NEW INVESTIGATION
                    </h2>
                    <p className="text-sm" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-noir-300)' }}>
                        Upload surveillance footage and enter the claim to verify
                    </p>
                </div>

                {/* Upload area */}
                <div
                    className="vintage-card p-8 mb-5 text-center cursor-pointer transition-all duration-200 animate-fade-in-up"
                    style={{
                        border: isDragging ? '2px dashed var(--color-gold-500)' : '2px dashed var(--color-noir-600)',
                        animationDelay: '0.1s',
                        opacity: 0,
                        animationFillMode: 'forwards',
                        backgroundColor: isDragging ? 'rgba(201,162,39,0.05)' : undefined,
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {fileName ? (
                        <div>
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'var(--color-verdict-green-glow)', border: '2px solid var(--color-verdict-green)' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-verdict-green-light)" strokeWidth="2" strokeLinecap="round">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-verdict-green-light)' }}>
                                EVIDENCE FILE LOADED
                            </p>
                            <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-noir-300)' }}>
                                {fileName}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center animate-pulse-glow"
                                style={{ backgroundColor: 'var(--color-noir-800)', border: '2px solid var(--color-noir-600)' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" strokeWidth="1.5" strokeLinecap="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            <p className="text-sm mb-1" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-noir-200)' }}>
                                DROP VIDEO EVIDENCE HERE
                            </p>
                            <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-noir-500)' }}>
                                or click to browse files — MP4, MOV, AVI accepted
                            </p>
                        </div>
                    )}
                </div>

                {/* Claim input */}
                <div className="vintage-card p-5 mb-5 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
                    <label className="block mb-2" style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        color: 'var(--color-gold-400)',
                        letterSpacing: '0.2em',
                    }}>
                        CLAIM / WITNESS STATEMENT TO VERIFY
                    </label>
                    <textarea
                        value={claim}
                        onChange={(e) => setClaim(e.target.value)}
                        placeholder="Enter the claim, witness statement, or alibi to verify against the video evidence..."
                        rows={4}
                        className="w-full p-3 rounded text-sm outline-none resize-none"
                        style={{
                            backgroundColor: 'var(--color-noir-800)',
                            border: '1px solid var(--color-noir-600)',
                            color: 'var(--color-paper-100)',
                            fontFamily: 'var(--font-typewriter)',
                            lineHeight: 1.7,
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-gold-500)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-noir-600)'}
                    />
                </div>

                {/* Submit button */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={!fileName || !claim.trim()}
                        className="w-full py-3.5 rounded text-sm font-bold tracking-[0.25em] transition-all duration-200 cursor-pointer"
                        style={{
                            fontFamily: 'var(--font-typewriter)',
                            background: (!fileName || !claim.trim())
                                ? 'var(--color-noir-700)'
                                : 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-400))',
                            color: (!fileName || !claim.trim()) ? 'var(--color-noir-500)' : 'var(--color-noir-950)',
                            border: 'none',
                            opacity: (!fileName || !claim.trim()) ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (fileName && claim.trim()) e.target.style.boxShadow = '0 0 30px rgba(201,162,39,0.4)';
                        }}
                        onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; }}
                    >
                        ▶ BEGIN INVESTIGATION
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Reusable Report Section Component
// ============================================
function ReportSection({ title, delay, children }) {
    return (
        <div className="vintage-card mb-5 animate-fade-in-up" style={{
            opacity: 0,
            animationFillMode: 'forwards',
            animationDelay: delay,
            overflow: 'hidden',
        }}>
            {/* Section header */}
            <div style={{
                padding: '10px 20px',
                backgroundColor: 'var(--color-noir-700)',
                borderBottom: '1px solid var(--color-noir-600)',
            }}>
                <h3 style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-gold-400)',
                    letterSpacing: '0.2em',
                }}>
                    {title}
                </h3>
            </div>
            {/* Section body */}
            <div style={{ padding: '20px' }}>
                {children}
            </div>
        </div>
    );
}

// ============================================
// Info Field Component
// ============================================
function InfoField({ label, value }) {
    return (
        <div className="mb-1">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-noir-400)', letterSpacing: '0.1em' }}>
                {label}:{' '}
            </span>
            <span style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.82rem', color: 'var(--color-noir-100)' }}>
                {value}
            </span>
        </div>
    );
}
