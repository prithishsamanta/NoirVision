import { MOCK_PAST_CASES } from '../../data/mockData';

export default function Sidebar({ onSelectCase, activeCaseId, onNewCase }) {
    return (
        <aside className="w-[280px] shrink-0 flex flex-col h-full"
            style={{
                background: 'linear-gradient(180deg, var(--color-noir-900) 0%, var(--color-noir-950) 100%)',
                borderRight: '1px solid var(--color-noir-700)',
            }}>

            {/* Header */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--color-noir-700)' }}>
                <button
                    onClick={onNewCase}
                    className="w-full py-2.5 px-4 rounded text-sm font-semibold tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
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
            <div className="px-4 pt-4 pb-2">
                <h3 className="text-xs tracking-[0.2em] font-medium"
                    style={{ color: 'var(--color-noir-400)', fontFamily: 'var(--font-mono)' }}>
                    CASE FILES
                </h3>
            </div>

            {/* Case List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {MOCK_PAST_CASES.map((caseItem) => {
                    const isActive = caseItem.id === activeCaseId;
                    const isContradicted = caseItem.verdict === 'contradicted';

                    return (
                        <button
                            key={caseItem.id}
                            onClick={() => onSelectCase(caseItem)}
                            className="w-full text-left p-3 rounded mb-1 transition-all duration-200 cursor-pointer"
                            style={{
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
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs tracking-wide"
                                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold-400)' }}>
                                    {caseItem.id}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded tracking-wide font-bold"
                                    style={{
                                        backgroundColor: isContradicted ? 'var(--color-verdict-red-glow)' : 'var(--color-verdict-green-glow)',
                                        color: isContradicted ? 'var(--color-verdict-red-light)' : 'var(--color-verdict-green-light)',
                                        fontFamily: 'var(--font-mono)',
                                    }}>
                                    {isContradicted ? 'REJ' : 'VER'}
                                </span>
                            </div>

                            {/* Title */}
                            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-noir-100)' }}>
                                {caseItem.title}
                            </p>

                            {/* Date & snippet */}
                            <p className="text-xs leading-relaxed"
                                style={{ color: 'var(--color-noir-400)', fontFamily: 'var(--font-mono)' }}>
                                {caseItem.date}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t text-center" style={{ borderColor: 'var(--color-noir-700)' }}>
                <span className="text-[10px] tracking-widest"
                    style={{ color: 'var(--color-noir-500)', fontFamily: 'var(--font-mono)' }}>
                    {MOCK_PAST_CASES.length} CASES ON FILE
                </span>
            </div>
        </aside>
    );
}
