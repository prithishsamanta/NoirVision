import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import Topbar from './components/layout/Topbar';
import Sidebar from './components/layout/Sidebar';
import ChatPanel from './components/layout/ChatPanel';
import Workspace from './pages/Workspace';
import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import { MOCK_SUPPORTED_CASE, MOCK_CONTRADICTED_CASE } from './data/mockData';
import './App.css';

function WorkspacePage() {
  const [caseData, setCaseData] = useState(null);
  const [activeCaseId, setActiveCaseId] = useState(null);

  const handleAnalyze = (result) => {
    setCaseData(result);
    setActiveCaseId(result.caseId);
  };

  const handleSelectCase = (caseItem) => {
    setActiveCaseId(caseItem.id);
    if (caseItem.verdict === 'supported') {
      setCaseData({ ...MOCK_SUPPORTED_CASE, caseId: caseItem.id });
    } else {
      setCaseData({ ...MOCK_CONTRADICTED_CASE, caseId: caseItem.id });
    }
  };

  const handleNewCase = () => {
    setCaseData(null);
    setActiveCaseId(null);
  };

  return (
    <div className="app-shell">
      <Topbar />
      <div className="app-body">
        <Sidebar
          onSelectCase={handleSelectCase}
          activeCaseId={activeCaseId}
          onNewCase={handleNewCase}
        />
        <Workspace caseData={caseData} onAnalyze={handleAnalyze} />
        <ChatPanel key={caseData ? `chat-${caseData.caseId}` : 'chat-locked'} isUnlocked={!!caseData} caseData={caseData} />
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-noir-950)', padding: '40px' }}>
        <div className="text-center">
          <div style={{ marginBottom: '32px', display: 'inline-block' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'spin 1.5s linear infinite' }}>
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-noir-700)" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-gold-500)" strokeWidth="4"
                strokeDasharray="32 96" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-lg" style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-gold-400)', margin: 0 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-noir-950)', padding: '40px' }}>
        <div className="text-center max-w-md">
          <p className="text-lg" style={{ color: 'var(--color-noir-100)', marginBottom: '24px', marginTop: 0 }}>Auth error: {auth.error.message}</p>
          <a href="/login" className="underline" style={{ color: 'var(--color-gold-400)' }}>Back to login</a>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated && isAuthPage) {
    return <Navigate to="/workspace" replace />;
  }

  if (!auth.isAuthenticated && location.pathname === '/workspace') {
    return <Navigate to="/login" replace />;
  }

  if (!auth.isAuthenticated && location.pathname === '/') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/workspace" element={<WorkspacePage />} />
      <Route path="/" element={auth.isAuthenticated ? <Navigate to="/workspace" replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={auth.isAuthenticated ? '/workspace' : '/login'} replace />} />
    </Routes>
  );
}
