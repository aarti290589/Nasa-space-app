
import React, { useEffect, useState, useMemo } from 'react';
import type { AnalyzedSolarData } from '../types';

// Lazy load react-globe.gl to improve initial page load
const Globe = React.lazy(() => import('react-globe.gl'));

interface GlobeProps {
  data: AnalyzedSolarData[];
  topSite: AnalyzedSolarData;
}

const GlobeComponent: React.FC<GlobeProps> = ({ data, topSite }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // react-globe.gl relies on window, so we only render it on the client
    setIsClient(true);
  }, []);

  const colorScale = (score: number) => {
    // Viridis-like color scale: from blue (low) to yellow (high)
    if (score < 0.2) return 'rgba(68, 1, 84, 0.7)';
    if (score < 0.4) return 'rgba(59, 82, 139, 0.7)';
    if (score < 0.6) return 'rgba(33, 145, 140, 0.7)';
    if (score < 0.8) return 'rgba(94, 201, 98, 0.7)';
    return 'rgba(253, 231, 37, 0.7)';
  };

  const globeData = useMemo(() => data.map(d => ({
    ...d,
    lat: d.lat,
    lng: d.lon,
    size: d.final_suitability_score * 0.2 + 0.05,
    color: colorScale(d.final_suitability_score)
  })), [data]);

  const topSiteLabel = useMemo(() => ({
    lat: topSite.lat,
    lng: topSite.lon,
    text: '★ Top Site',
    color: 'red',
    size: 20
  }), [topSite]);


  if (!isClient) {
    return <div className="flex items-center justify-center h-full"><p className="text-white">Loading Globe...</p></div>;
  }
  
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-full"><p className="text-white">Loading Globe...</p></div>}>
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={globeData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0}
        pointRadius="size"
        pointColor="color"
        pointLabel={d => `
          <div><b>${(d as AnalyzedSolarData).locationName}</b></div>
          <div>Score: ${((d as AnalyzedSolarData).final_suitability_score).toFixed(4)}</div>
          <div>Lat: ${((d as AnalyzedSolarData).lat).toFixed(2)}, Lon: ${((d as AnalyzedSolarData).lon).toFixed(2)}</div>
        `}
        labelsData={[topSiteLabel]}
        labelLat="lat"
        labelLng="lng"
        labelText="text"
        labelSize={() => 1}
        labelColor="color"
        labelDotRadius={() => 0}
        labelResolution={2}
        
      />
    </React.Suspense>
  );
};

export default GlobeComponent;
