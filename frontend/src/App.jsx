import { useState } from 'react';
import Topbar from './components/layout/Topbar';
import Sidebar from './components/layout/Sidebar';
import ChatPanel from './components/layout/ChatPanel';
import Workspace from './pages/Workspace';
import { MOCK_SUPPORTED_CASE, MOCK_CONTRADICTED_CASE } from './data/mockData';
import './App.css';

export default function App() {
  const [caseData, setCaseData] = useState(null);
  const [activeCaseId, setActiveCaseId] = useState(null);

  const handleAnalyze = (result) => {
    setCaseData(result);
    setActiveCaseId(result.caseId);
  };

  const handleSelectCase = (caseItem) => {
    setActiveCaseId(caseItem.id);
    // Load the corresponding mock data for demo
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
        <Workspace
          caseData={caseData}
          onAnalyze={handleAnalyze}
        />
        <ChatPanel
          isUnlocked={!!caseData}
          caseData={caseData}
        />
      </div>
    </div>
  );
}
