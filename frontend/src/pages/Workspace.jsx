import { useState, useRef } from 'react';
import { analyzeComplete, transformBackendResponse } from '../api/analysis';
import { MOCK_SUPPORTED_CASE, MOCK_CONTRADICTED_CASE } from '../data/mockData';

export default function Workspace({ caseData, onAnalyze, onStartAnalysis }) {
    const [title, setTitle] = useState('');
    const [claim, setClaim] = useState('');
    const [fileName, setFileName] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState('');
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setVideoFile(file);
            setError(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setFileName(file.name);
            setVideoFile(file);
            setError(null);
        }
    };

    const handleSubmit = async () => {
        if (!claim.trim() || !title.trim()) {
            setError('Please provide both a case title and witness claim');
            return;
        }

        if (!videoFile) {
            setError('Please upload a video file');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setAnalysisProgress('Creating case...');

        try {
            // Step 1: Create case ID
            const caseId = await onStartAnalysis({
                title: title.trim(),
                claim: claim.trim(),
                videoLink: ''
            });
            
            console.log('✅ Case ID:', caseId);

            // Step 2: Upload and analyze with backend
            setAnalysisProgress('Uploading video...');
            setAnalysisProgress('Processing video with TwelveLabs...');
            
            const response = await analyzeComplete({
                claim: claim.trim(),
                videoFile: videoFile,
                caseId: caseId
            });

            setAnalysisProgress('Analyzing credibility with AI...');

            // Step 3: Transform response to frontend format
            console.log('✅ Backend response received:', response);
            const transformedData = transformBackendResponse(response);
            console.log('✅ Transformed data:', transformedData);
            
            // Step 4: Pass to parent component to display
            onAnalyze({
                ...transformedData,
                claim: claim.trim(),
                caseTitle: title.trim()
            });
            
            console.log('✅ Analysis complete - should display now!');

            // Reset form
            setTitle('');
            setClaim('');
            setFileName('');
            setVideoFile(null);
            
        } catch (err) {
            console.error('❌ Analysis failed:', err);
            setError(err.message || 'Analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
            setAnalysisProgress('');
        }
    };

    // ============================
    // STATE: Analyzing (loading)
    // ============================
    if (isAnalyzing) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12" style={{ backgroundColor: 'var(--color-noir-950)' }}>
                <div className="text-center">
                    <div className="mb-8" style={{ display: 'inline-block' }}>
                        <svg width="60" height="60" viewBox="0 0 60 60" style={{ animation: 'spin 2s linear infinite' }}>
                            <circle cx="30" cy="30" r="25" fill="none" stroke="var(--color-noir-700)" strokeWidth="4" />
                            <circle cx="30" cy="30" r="25" fill="none" stroke="var(--color-gold-500)" strokeWidth="4"
                                strokeDasharray="40 120" strokeLinecap="round" />
                        </svg>
                    </div>
                    <p className="text-xl mb-3" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-gold-400)' }}>
                        ANALYZING EVIDENCE...
                    </p>
                    <p className="text-sm mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-noir-400)' }}>
                        {analysisProgress || 'Cross-referencing claim against video timeline'}
                    </p>
                    <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-noir-500)' }}>
                        This may take 50-60 seconds...
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
                <div className="max-w-4xl mx-auto p-8 sm:p-10 stagger-children">

                    {/* ═══════════ REPORT HEADER ═══════════ */}
                    <div className="animate-fade-in-up" style={{
                        opacity: 0,
                        animationFillMode: 'forwards',
                        textAlign: 'center',
                        padding: '36px 28px',
                        marginBottom: '32px',
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
                            margin: 0,
                        }}>
                            "{caseData.claim}"
                        </p>
                    </ReportSection>

                    {/* ═══════════ VIDEO EVIDENCE ANALYSIS ═══════════ */}
                    <ReportSection title="VIDEO EVIDENCE ANALYSIS (TwelveLabs)" delay="0.3s">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6">
                            <InfoField label="Source" value={caseData.videoSource} />
                            <InfoField label="Duration" value={caseData.videoDuration} />
                        </div>

                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-gold-400)', letterSpacing: '0.15em', marginBottom: '14px', marginTop: '4px' }}>
                            Key Detections:
                        </p>
                        <div style={{ paddingLeft: '12px' }}>
                            {caseData.keyDetections.map((det, i) => (
                                <div key={i} className="flex gap-3 mb-4 items-start">
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
                            <div className="mt-6">
                                <InfoField label="On-Screen Text" value={caseData.onScreenText} />
                            </div>
                        )}

                        <div className="mt-4">
                            <InfoField label="GPS Metadata" value={caseData.gpsMetadata} />
                        </div>

                        {caseData.speechTranscription && (
                            <div className="mt-6">
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-gold-400)', letterSpacing: '0.15em', marginBottom: '10px' }}>
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
                        <div style={{ paddingLeft: '8px' }}>
                            {caseData.comparisons.map((comp, i) => (
                                <div key={i} className="flex gap-3 mb-4 items-start">
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
                        <div className="flex items-center gap-4 mb-6">
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
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-noir-700)', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
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
                        <div className="flex items-center gap-3 mb-6">
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
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-gold-400)', letterSpacing: '0.15em', marginBottom: '12px', marginTop: '4px' }}>
                            INVESTIGATION RECOMMENDATION:
                        </p>
                        <div style={{ paddingLeft: '12px' }}>
                            <p style={{
                                fontFamily: 'var(--font-typewriter)',
                                fontSize: '0.84rem',
                                color: 'var(--color-noir-200)',
                                lineHeight: 1.7,
                                marginBottom: '10px',
                            }}>
                                → {caseData.recommendation}
                            </p>
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
                                    marginBottom: '10px',
                                    paddingLeft: '16px',
                                    position: 'relative',
                                }}>
                                    <span style={{ position: 'absolute', left: 0, color: 'var(--color-gold-500)' }}>•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        {/* Detective quote */}
                        <div className="mt-6 p-5 rounded-lg" style={{
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
                        padding: '28px 28px',
                        borderTop: `3px double ${accentColor}`,
                        borderBottom: `3px double ${accentColor}`,
                        marginBottom: '40px',
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
    // STATE: Upload (idle) — order: Title → Description → Evidence (wireframe)
    // ============================
    const canSubmit = title.trim() && claim.trim() && fileName;
    return (
        <div className="flex-1 flex items-center justify-center p-10 sm:p-12" style={{ backgroundColor: 'var(--color-noir-950)' }}>
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10 animate-fade-in-up">
                    <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold-400)', letterSpacing: '0.1em' }}>
                        NEW INVESTIGATION
                    </h2>
                    <p className="text-base" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-noir-300)' }}>
                        Create a new case and provide evidence to support your claim
                    </p>
                </div>

                {/* 1. What is this about? */}
                <div className="vintage-card animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0, animationFillMode: 'forwards', marginBottom: '48px', padding: '32px 28px' }}>
                    <label className="block" style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--color-gold-400)',
                        letterSpacing: '0.15em',
                        marginBottom: '16px',
                    }}>
                        WHAT IS THIS ABOUT?
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief title or summary of the incident"
                        className="w-full p-4 rounded-lg text-sm outline-none"
                        style={{
                            backgroundColor: 'var(--color-noir-800)',
                            border: '1px solid var(--color-noir-600)',
                            color: 'var(--color-paper-100)',
                            fontFamily: 'var(--font-typewriter)',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-gold-500)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-noir-600)'}
                    />
                </div>

                {/* 2. Describe the incident */}
                <div className="vintage-card animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards', marginBottom: '48px', padding: '32px 28px' }}>
                    <label className="block" style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--color-gold-400)',
                        letterSpacing: '0.15em',
                        marginBottom: '16px',
                    }}>
                        DESCRIBE THE INCIDENT
                    </label>
                    <textarea
                        value={claim}
                        onChange={(e) => setClaim(e.target.value)}
                        placeholder="Enter the claim, witness statement, or alibi to verify against the video evidence..."
                        rows={4}
                        className="w-full p-4 rounded-lg text-sm outline-none resize-none"
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

                {/* 3. Provide evidence (upload) — compact */}
                <div className="vintage-card animate-fade-in-up" style={{
                    animationDelay: '0.25s',
                    opacity: 0,
                    animationFillMode: 'forwards',
                    marginBottom: '48px',
                    padding: '32px 28px',
                    border: isDragging ? '2px dashed var(--color-gold-500)' : '2px dashed var(--color-noir-600)',
                    backgroundColor: isDragging ? 'rgba(201,162,39,0.05)' : undefined,
                }}>
                    <label className="block" style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--color-gold-400)',
                        letterSpacing: '0.15em',
                        marginBottom: '20px',
                    }}>
                        PROVIDE EVIDENCE TO SUPPORT YOUR CLAIM
                    </label>
                    <div
                        className="text-center cursor-pointer transition-all duration-200 flex items-center justify-center gap-4"
                        style={{ paddingTop: '8px' }}
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
                            <>
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: 'var(--color-verdict-green-glow)', border: '2px solid var(--color-verdict-green)' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-verdict-green-light)" strokeWidth="2" strokeLinecap="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-verdict-green-light)' }}>
                                        EVIDENCE FILE LOADED
                                    </p>
                                    <p className="text-xs truncate" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-noir-300)' }}>
                                        {fileName}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 animate-pulse-glow"
                                    style={{ backgroundColor: 'var(--color-noir-800)', border: '2px solid var(--color-noir-600)' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-noir-200)' }}>
                                        Upload video evidence
                                    </p>
                                    <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-noir-500)' }}>
                                        MP4, MOV, AVI — drop here or click to browse
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 4. Submit */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.35s', opacity: 0, animationFillMode: 'forwards', marginTop: '24px' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="w-full py-4 rounded-lg text-sm font-bold tracking-[0.25em] transition-all duration-200 cursor-pointer"
                        style={{
                            fontFamily: 'var(--font-typewriter)',
                            background: !canSubmit
                                ? 'var(--color-noir-700)'
                                : 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-400))',
                            color: !canSubmit ? 'var(--color-noir-500)' : 'var(--color-noir-950)',
                            border: 'none',
                            opacity: !canSubmit ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (canSubmit) e.target.style.boxShadow = '0 0 30px rgba(201,162,39,0.4)';
                        }}
                        onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; }}
                    >
                        ▶ BEGIN INVESTIGATION
                    </button>
                    
                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-4 rounded-lg" style={{
                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                            border: '1px solid var(--color-verdict-red)',
                        }}>
                            <p className="text-sm" style={{
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--color-verdict-red-light)',
                            }}>
                                ⚠️ {error}
                            </p>
                        </div>
                    )}
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
        <div className="vintage-card animate-fade-in-up" style={{
            opacity: 0,
            animationFillMode: 'forwards',
            animationDelay: delay,
            overflow: 'hidden',
            marginBottom: '48px',
        }}>
            {/* Section header */}
            <div style={{
                padding: '20px 28px',
                backgroundColor: 'var(--color-noir-700)',
                borderBottom: '1px solid var(--color-noir-600)',
            }}>
                <h3 style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-gold-400)',
                    letterSpacing: '0.2em',
                    margin: 0,
                }}>
                    {title}
                </h3>
            </div>
            {/* Section body */}
            <div style={{ padding: '32px 28px' }}>
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
        <div className="mb-3">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-noir-400)', letterSpacing: '0.1em' }}>
                {label}:{' '}
            </span>
            <span style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.82rem', color: 'var(--color-noir-100)' }}>
                {value}
            </span>
        </div>
    );
}
