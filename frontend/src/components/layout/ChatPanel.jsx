import { useState, useRef, useEffect } from 'react';
import { MOCK_CHAT_RESPONSES } from '../../data/mockData';

export default function ChatPanel({ isUnlocked, caseData }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isUnlocked && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                text: `Case ${caseData?.caseId || 'N/A'} analysis complete. I'm ready to assist with further investigative queries. What aspect of the evidence would you like to examine?`
            }]);
        }
    }, [isUnlocked]);

    const handleSend = () => {
        if (!input.trim() || !isUnlocked) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');

        // Simple keyword matching for demo
        setTimeout(() => {
            const lowerMsg = userMsg.toLowerCase();
            const matched = MOCK_CHAT_RESPONSES.responses.find(r =>
                r.keywords.some(k => lowerMsg.includes(k))
            );
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: matched ? matched.response : MOCK_CHAT_RESPONSES.default
            }]);
        }, 800);
    };

    return (
        <aside
            className="shrink-0 flex flex-col h-full transition-all duration-300"
            style={{
                width: isOpen ? '340px' : '48px',
                background: 'linear-gradient(180deg, var(--color-noir-900) 0%, var(--color-noir-950) 100%)',
                borderLeft: '1px solid var(--color-noir-700)',
            }}>

            {/* Toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-10 shrink-0 flex items-center gap-2 px-3 text-xs tracking-wider cursor-pointer transition-colors"
                style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-gold-400)',
                    borderBottom: '1px solid var(--color-noir-700)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--color-noir-700)',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {isOpen && <span>INVESTIGATIVE CHAT</span>}
            </button>

            {isOpen && (
                <>
                    {!isUnlocked ? (
                        /* Locked state */
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ border: '2px solid var(--color-noir-600)', backgroundColor: 'var(--color-noir-800)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-noir-500)' }}>
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <p className="text-sm mb-2" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-noir-300)' }}>
                                CHAT LOCKED
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-noir-500)' }}>
                                Complete a case analysis to unlock the investigative chatbot for follow-up questions.
                            </p>
                        </div>
                    ) : (
                        /* Chat messages */
                        <>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[90%] p-3 rounded text-sm leading-relaxed"
                                            style={{
                                                fontFamily: msg.role === 'assistant' ? 'var(--font-typewriter)' : 'var(--font-sans)',
                                                backgroundColor: msg.role === 'user' ? 'var(--color-noir-700)' : 'var(--color-noir-800)',
                                                color: msg.role === 'user' ? 'var(--color-noir-100)' : 'var(--color-paper-200)',
                                                border: msg.role === 'assistant' ? '1px solid var(--color-noir-600)' : 'none',
                                                fontSize: '0.8rem',
                                            }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--color-noir-700)' }}>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask about the evidence..."
                                        className="flex-1 px-3 py-2 rounded text-sm outline-none"
                                        style={{
                                            backgroundColor: 'var(--color-noir-800)',
                                            border: '1px solid var(--color-noir-600)',
                                            color: 'var(--color-noir-100)',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.8rem',
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        className="px-3 py-2 rounded cursor-pointer transition-opacity"
                                        style={{
                                            background: 'linear-gradient(135deg, var(--color-gold-500), var(--color-gold-400))',
                                            border: 'none',
                                            color: 'var(--color-noir-950)',
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </aside>
    );
}
