
import React, { useEffect, useState, useCallback } from 'react';
import { fetchDashboardData } from './services/googleSheetService';
import { getAiInsights } from './services/geminiService';
import { DashboardData } from './types';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string>("");
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const fetchedData = await fetchDashboardData();
      setData(fetchedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleGenerateInsights = async () => {
    if (!data) return;
    setIsGeneratingInsights(true);
    try {
      const result = await getAiInsights(data);
      setInsights(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse">Loading Production Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Sync Failed</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => loadData()}
            className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold hover:bg-slate-900 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {refreshing && (
        <div className="fixed top-4 right-4 z-[100] bg-white px-4 py-2 rounded-full shadow-lg border border-blue-100 flex items-center gap-3">
          <i className="fas fa-sync-alt animate-spin text-blue-600"></i>
          <span className="text-xs font-bold text-slate-700">Updating...</span>
        </div>
      )}
      {data && (
        <Dashboard 
          data={data} 
          insights={insights} 
          isGeneratingInsights={isGeneratingInsights}
          onGenerateInsights={handleGenerateInsights}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default App;
