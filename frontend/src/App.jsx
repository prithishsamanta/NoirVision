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

  // When authenticated: ensure profile exists and load incidents from DynamoDB
  useEffect(() => {
    if (!idToken) {
      setIncidentsLoading(false);
      setIncidents([]);
      return;
    }
    let cancelled = false;
    setIncidentsLoading(true);
    setIncidentsError(null);
    usersApi.putProfile(idToken).catch(() => {}).then(() => {
      if (cancelled) return;
      return usersApi.listIncidents(idToken);
    }).then((list) => {
      if (cancelled) return;
      setIncidents(Array.isArray(list) ? list : []);
    }).catch((e) => {
      if (!cancelled) setIncidentsError(e.message || 'Failed to load cases');
    }).finally(() => {
      if (!cancelled) setIncidentsLoading(false);
    });
    return () => { cancelled = true; };
  }, [idToken]);

  const refreshIncidents = useCallback(() => {
    if (!idToken) return;
    usersApi.listIncidents(idToken).then(setIncidents).catch(() => {});
  }, [idToken]);

  const handleAnalyze = useCallback((result) => {
    setCaseData(result);
    setActiveCaseId(result.caseId);

    const localCase = {
      id: result.caseId,
      title: result.caseTitle,
      description: result.claim,
      verdict: result.verdict,
      score: result.credibilityScore,
      timestamp: new Date().toISOString(),
    };
    setLocalCases((prev) => [localCase, ...prev].slice(0, 10));

    // When authenticated: update DynamoDB incident with backboard output (generated_text)
    if (idToken && result.caseId && result.backendResponse != null) {
      const generatedText = typeof result.backendResponse === 'string'
        ? result.backendResponse
        : JSON.stringify(result.backendResponse);
      usersApi.updateIncident(idToken, result.caseId, { generated_text: generatedText }).then(() => {
        refreshIncidents();
      }).catch((err) => console.error('Failed to update incident with report', err));
    }
  }, [idToken, refreshIncidents]);

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
    if (idToken) {
      const incidentId = generateIncidentId();
      await usersApi.createIncident(idToken, {
        incident_id: incidentId,
        incident_name: title,
        description: claim || '',
        video_link: videoLink || '',
        generated_text: '',
      });
      refreshIncidents();
      return incidentId;
    }
    return `case-${Date.now()}`;
  }, [idToken, refreshIncidents]);

  return (
    <div className="app-shell">
      <Topbar />
      <div className="app-body">
        <Sidebar
          cases={idToken ? incidents : localCases}
          loading={idToken ? incidentsLoading : false}
          error={idToken ? incidentsError : null}
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
