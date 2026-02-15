import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import Topbar from './components/layout/Topbar';
import Sidebar from './components/layout/Sidebar';
import ChatPanel from './components/layout/ChatPanel';
import Workspace from './pages/Workspace';
import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import { MOCK_SUPPORTED_CASE, MOCK_CONTRADICTED_CASE } from './data/mockData';
import * as usersApi from './api/users';
import './App.css';

function generateIncidentId() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const n = Math.floor(Math.random() * 1000);
  return `${dateStr}-${String(n).padStart(3, '0')}`;
}

function WorkspacePage() {
  const auth = useAuth();
  const idToken = auth.user?.id_token;

  const [incidents, setIncidents] = useState([]);
  const [localCases, setLocalCases] = useState([]); // Local storage for unauthenticated users
  const [caseData, setCaseData] = useState(null);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentsError, setIncidentsError] = useState(null);

  // Simplified: No database loading, just use local storage
  useEffect(() => {
    setIncidentsLoading(false);
    setIncidents([]);
    console.log('ℹ️  Using local storage only (simplified mode)');
  }, []);

  // Simplified: No database refresh needed
  const refreshIncidents = useCallback(() => {
    console.log('ℹ️  Using local storage (no database refresh needed)');
  }, []);

  const handleAnalyze = useCallback((result) => {
    console.log('✅ handleAnalyze called with result:', result);
    console.log('✅ result.caseId:', result.caseId);
    console.log('✅ result.keyDetections:', result.keyDetections);
    console.log('✅ result.comparisons:', result.comparisons);
    
    // Display results immediately
    setCaseData(result);
    setActiveCaseId(result.caseId);
    
    console.log('✅ caseData state updated');
    
    // Save to local storage (simple and reliable)
    const localCase = {
      id: result.caseId,
      title: result.caseTitle,
      description: result.claim,
      verdict: result.verdict,
      score: result.credibilityScore,
      timestamp: new Date().toISOString()
    };
    setLocalCases(prev => [localCase, ...prev].slice(0, 10));
    console.log('✅ Case saved locally');
    
    // No database operations - keep it simple!
  }, []);

  const handleSelectCase = useCallback((caseItem) => {
    setActiveCaseId(caseItem.id);
    const base = caseItem.verdict === 'supported' ? MOCK_SUPPORTED_CASE : (caseItem.verdict === 'contradicted' ? MOCK_CONTRADICTED_CASE : MOCK_SUPPORTED_CASE);
    setCaseData({
      ...base,
      caseId: caseItem.id,
      caseTitle: caseItem.title,
      claim: caseItem.description || base.claim,
    });
  }, []);

  const handleNewCase = useCallback(() => {
    setCaseData(null);
    setActiveCaseId(null);
  }, []);

  const handleStartAnalysis = useCallback(async ({ title, claim, videoLink }) => {
    // Simple: just generate and return a case ID
    const incidentId = `case-${Date.now()}`;
    console.log('✅ Case ID generated:', incidentId);
    return incidentId;
  }, []);

  return (
    <div className="app-shell">
      <Topbar />
      <div className="app-body">
        <Sidebar
          cases={localCases}
          loading={false}
          error={null}
          onSelectCase={handleSelectCase}
          activeCaseId={activeCaseId}
          onNewCase={handleNewCase}
        />
        <Workspace
          caseData={caseData}
          onAnalyze={handleAnalyze}
          onStartAnalysis={handleStartAnalysis}
        />
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

  // Allow workspace without authentication for core analysis functionality
  // Authentication is optional - used only for saving cases to database
  
  if (!auth.isAuthenticated && location.pathname === '/') {
    return <Navigate to="/workspace" replace />;
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
