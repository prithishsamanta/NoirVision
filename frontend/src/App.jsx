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
  const [caseData, setCaseData] = useState(null);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentsError, setIncidentsError] = useState(null);

  // Load incidents from DynamoDB when authenticated
  useEffect(() => {
    if (!idToken) {
      setIncidentsLoading(false);
      setIncidents([]);
      console.log('ℹ️  Not authenticated - please log in to view cases');
      return;
    }
    
    let cancelled = false;
    setIncidentsLoading(true);
    setIncidentsError(null);
    
    // Create profile if needed, then load incidents
    usersApi.putProfile(idToken)
      .catch((err) => {
        console.warn('⚠️  Profile creation failed:', err.message);
        return null;
      })
      .then(() => {
        if (cancelled) return;
        return usersApi.listIncidents(idToken);
      })
      .then((list) => {
        if (cancelled) return;
        setIncidents(Array.isArray(list) ? list : []);
        console.log('✅ Loaded', list?.length || 0, 'incidents from DynamoDB');
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('❌ Failed to load incidents:', e.message);
          setIncidentsError(e.message || 'Failed to load cases');
        }
      })
      .finally(() => {
        if (!cancelled) setIncidentsLoading(false);
      });
    
    return () => { cancelled = true; };
  }, [idToken]);

  // Refresh incidents from DynamoDB
  const refreshIncidents = useCallback(() => {
    if (!idToken) {
      console.log('ℹ️  Not authenticated - cannot refresh');
      return;
    }
    usersApi.listIncidents(idToken)
      .then((list) => {
        setIncidents(Array.isArray(list) ? list : []);
        console.log('✅ Refreshed', list?.length || 0, 'incidents from DynamoDB');
      })
      .catch((err) => console.error('❌ Failed to refresh incidents:', err.message));
  }, [idToken]);

  const handleAnalyze = useCallback((result) => {
    console.log('✅ Analysis complete, displaying results:', result.caseId);
    
    // Display results immediately
    setCaseData(result);
    setActiveCaseId(result.caseId);
    
    console.log('✅ caseData state updated');
    
    // Save to DynamoDB (required)
    if (!idToken) {
      console.error('❌ Not authenticated - cannot save report');
      alert('Please log in to save your investigation report');
      return;
    }
    
    const generatedText = JSON.stringify(result);
    usersApi.updateIncident(idToken, result.caseId, { generated_text: generatedText })
      .then(() => {
        console.log('✅ Report saved to DynamoDB');
        refreshIncidents();
      })
      .catch((err) => {
        console.error('❌ Failed to save report to DynamoDB:', err.message);
        alert(`Failed to save report: ${err.message}`);
      });
  }, [idToken, refreshIncidents]);

  const handleSelectCase = useCallback(async (caseItem) => {
    setActiveCaseId(caseItem.id);
    
    // If authenticated, try to load full report from DynamoDB
    if (idToken) {
      try {
        const incident = await usersApi.getIncident(idToken, caseItem.id);
        if (incident && incident.generated_text) {
          // Parse the stored report
          const storedReport = JSON.parse(incident.generated_text);
          console.log('✅ Loaded report from DynamoDB:', caseItem.id);
          setCaseData(storedReport);
          return;
        }
      } catch (err) {
        console.warn('⚠️  Could not load from DynamoDB:', err.message);
      }
    }
    
    // Fallback to mock data or local case
    console.log('ℹ️  Using mock data for case:', caseItem.id);
    const base = caseItem.verdict === 'supported' ? MOCK_SUPPORTED_CASE : 
                 (caseItem.verdict === 'contradicted' ? MOCK_CONTRADICTED_CASE : MOCK_SUPPORTED_CASE);
    setCaseData({
      ...base,
      caseId: caseItem.id,
      caseTitle: caseItem.title,
      claim: caseItem.description || base.claim,
    });
  }, [idToken]);

  const handleNewCase = useCallback(() => {
    setCaseData(null);
    setActiveCaseId(null);
  }, []);

  const handleStartAnalysis = useCallback(async ({ title, claim, videoLink }) => {
    // Check authentication first
    if (!idToken) {
      console.error('❌ Not authenticated - cannot create investigation');
      alert('Please log in to create an investigation report');
      throw new Error('Authentication required');
    }
    
    // Generate case ID
    const incidentId = `case-${Date.now()}`;
    console.log('✅ Case ID generated:', incidentId);
    
    // Save to DynamoDB
    try {
      await usersApi.createIncident(idToken, {
        incident_id: incidentId,
        incident_name: title,
        description: claim || '',
        video_link: videoLink || '',
        generated_text: '',
      });
      console.log('✅ Incident created in DynamoDB:', incidentId);
      refreshIncidents();
    } catch (err) {
      console.error('❌ Failed to create incident in DynamoDB:', err.message);
      alert(`Failed to create investigation: ${err.message}`);
      throw err;
    }
    
    return incidentId;
  }, [idToken, refreshIncidents]);

  return (
    <div className="app-shell">
      <Topbar />
      <div className="app-body">
        <Sidebar
          cases={incidents}
          loading={incidentsLoading}
          error={incidentsError}
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

  // Redirect to login if trying to access workspace without auth
  if (!auth.isAuthenticated && location.pathname === '/workspace') {
    return <Navigate to="/login" replace />;
  }

  // Redirect to workspace if already authenticated and on auth pages
  if (auth.isAuthenticated && isAuthPage) {
    return <Navigate to="/workspace" replace />;
  }

  // Redirect to workspace if authenticated and on root
  if (auth.isAuthenticated && location.pathname === '/') {
    return <Navigate to="/workspace" replace />;
  }
  
  // Redirect to login if not authenticated and on root
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
