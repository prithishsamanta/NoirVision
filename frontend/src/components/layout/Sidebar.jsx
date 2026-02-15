export default function Sidebar({ cases = [], loading, error, onSelectCase, activeCaseId, onNewCase }) {
    const caseList = cases.map((inc) => ({
        id: inc.id ?? inc.incident_id,
        title: inc.title ?? inc.incident_name,
        date: inc.date ?? (inc.created_at || '').slice(0, 10),
        description: inc.description ?? '',
        verdict: inc.verdict ?? (inc.generated_text ? 'supported' : 'pending'),
    }));

    return (
        <aside className="w-[300px] shrink-0 flex flex-col h-full"
            style={{
                background: 'linear-gradient(180deg, var(--color-noir-900) 0%, var(--color-noir-950) 100%)',
                borderRight: '1px solid var(--color-noir-700)',
            }}>

            {/* Header */}
            <div className="border-b" style={{ borderColor: 'var(--color-noir-700)', padding: '24px 20px' }}>
                <button
                    onClick={onNewCase}
                    className="w-full py-3 px-5 rounded-lg text-sm font-semibold tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-400))',
                        color: 'var(--color-noir-950)',
                        fontFamily: 'var(--font-typewriter)',
                    }}
                    onMouseEnter={e => e.target.style.boxShadow = '0 0 20px rgba(201,162,39,0.4)'}
                    onMouseLeave={e => e.target.style.boxShadow = 'none'}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    NEW INVESTIGATION
                </button>
            </div>

            {/* Section Title */}
            <div style={{ padding: '28px 20px 16px' }}>
                <h3 className="text-xs tracking-[0.2em] font-medium"
                    style={{ color: 'var(--color-noir-400)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                    CASE FILES
                </h3>
            </div>

            {/* Case List */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '0 12px 24px' }}>
                {error && (
                    <p className="text-xs" style={{ color: 'var(--color-verdict-red-light)', padding: '12px', margin: 0 }}>
                        {error}
                    </p>
                )}
                {loading && (
                    <p className="text-xs" style={{ color: 'var(--color-noir-400)', padding: '12px', margin: 0 }}>
                        Loading cases...
                    </p>
                )}
                {!loading && !error && caseList.map((caseItem) => {
                    const isActive = caseItem.id === activeCaseId;
                    const isContradicted = caseItem.verdict === 'contradicted';
                    const isPending = caseItem.verdict === 'pending';

                    return (
                        <button
                            key={caseItem.id}
                            onClick={() => onSelectCase(caseItem)}
                            className="w-full text-left rounded-lg transition-all duration-200 cursor-pointer"
                            style={{
                                padding: '16px',
                                marginBottom: '12px',
                                background: isActive
                                    ? 'linear-gradient(135deg, var(--color-noir-700), var(--color-noir-800))'
                                    : 'transparent',
                                border: isActive ? '1px solid var(--color-gold-500)' : '1px solid transparent',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'var(--color-noir-800)';
                                    e.currentTarget.style.borderColor = 'var(--color-noir-600)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }
                            }}
                        >
                            {/* Case number + verdict badge */}
                            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                                <span className="text-xs tracking-wide"
                                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold-400)' }}>
                                    {caseItem.id}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded tracking-wide font-bold"
                                    style={{
                                        backgroundColor: isPending ? 'var(--color-noir-600)' : (isContradicted ? 'var(--color-verdict-red-glow)' : 'var(--color-verdict-green-glow)'),
                                        color: isPending ? 'var(--color-noir-300)' : (isContradicted ? 'var(--color-verdict-red-light)' : 'var(--color-verdict-green-light)'),
                                        fontFamily: 'var(--font-mono)',
                                    }}>
                                    {isPending ? 'PEND' : (isContradicted ? 'REJ' : 'VER')}
                                </span>
                            </div>

                            {/* Title */}
                            <p className="text-sm font-medium" style={{ color: 'var(--color-noir-100)', marginBottom: '8px', marginTop: 0 }}>
                                {caseItem.title}
                            </p>

                            {/* Date & snippet */}
                            <p className="text-xs leading-relaxed"
                                style={{ color: 'var(--color-noir-400)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                                {caseItem.date}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="border-t text-center" style={{ borderColor: 'var(--color-noir-700)', padding: '20px 16px' }}>
                <span className="text-[10px] tracking-widest"
                    style={{ color: 'var(--color-noir-500)', fontFamily: 'var(--font-mono)' }}>
                    {caseList.length} CASES ON FILE
                </span>
            </div>
        </aside>
    );
}
