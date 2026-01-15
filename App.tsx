
import React, { useState, useEffect, useMemo } from 'react';
import Globe from './components/Globe';
import BarChartComponent from './components/BarChartComponent';
import Header from './components/Header';
import MetricsCard from './components/MetricsCard';
import Spinner from './components/Spinner';
import { generateAndAnalyzeData } from './services/solarDataService';
import type { AnalyzedSolarData, MonthlyData } from './types';

const App: React.FC = () => {
  const [analyzedData, setAnalyzedData] = useState<AnalyzedSolarData[] | null>(null);
  const [topSite, setTopSite] = useState<AnalyzedSolarData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { allData, topSiteData } = await generateAndAnalyzeData();
        setAnalyzedData(allData);
        setTopSite(topSiteData);
      } catch (err) {
        setError('Failed to generate and analyze data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const topSiteMonthlyData: MonthlyData[] | null = useMemo(() => {
    if (!topSite) return null;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return topSite.monthlyGHI.map((ghi, index) => ({
      month: monthNames[index],
      ghi,
    }));
  }, [topSite]);


  if (isLoading) {
    return <Spinner />;
  }

  if (error || !analyzedData || !topSite || !topSiteMonthlyData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">An Error Occurred</h2>
          <p className="text-gray-700">{error || "Could not load dashboard data."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-800 p-4 bg-gray-50 border-b">Global Solar Site Suitability Score</h3>
             <div className="h-[400px] md:h-[550px] lg:h-[650px] w-full bg-gray-800">
                <Globe data={analyzedData} topSite={topSite} />
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
             <MetricsCard topSite={topSite} />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4 h-full">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly GHI Climatology at Top Site</h3>
                <div className="w-full h-80">
                   <BarChartComponent data={topSiteMonthlyData} />
                </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Dashboard created by translating a Python/Dash prototype into a React application.</p>
      </footer>
    </div>
  );
};

export default App;
