
import type { SolarDataPoint, AnalyzedSolarData } from '../types';

// --- CONFIGURATION ---
const USER_LAT = -23.50;
const USER_LON = -69.50; // Converted from 290.50 (360-based) to -69.50 (180-based)
const USER_SCORE = 0.9529;
const USER_LOCATION_NAME = "★ TOP SITE (FORCED): Sierra Gorda, Antofagasta, Chile";

const normalizeValue = (val: number, min: number, max: number): number => {
    if (max - min === 0) return 0.5;
    return (val - min) / (max - min);
}

const generateDummyData = (): SolarDataPoint[] => {
    const data: SolarDataPoint[] = [];
    const lats = Array.from({ length: 180 / 15 + 1 }, (_, i) => -90 + i * 15); // Sparse grid
    const lons = Array.from({ length: 360 / 15 + 1 }, (_, i) => -180 + i * 15);

    for (const lat of lats) {
        for (const lon of lons) {
            const point: SolarDataPoint = {
                lat,
                lon,
                sfc_sw_down_all_mon: [],
                sfc_sw_down_clr_t_mon: [],
            };

            const latFactor = Math.cos(Math.abs(lat) * Math.PI / 180); // Higher GHI near equator

            for (let i = 0; i < 12; i++) {
                const baseGHI = (150 + Math.random() * 150) * latFactor;
                const monthlyGHI = baseGHI + Math.random() * 50;
                const clearSkyGHI = monthlyGHI + 10 + Math.random() * 80;
                
                point.sfc_sw_down_all_mon.push(monthlyGHI);
                point.sfc_sw_down_clr_t_mon.push(clearSkyGHI);
            }
            data.push(point);
        }
    }
    return data;
}

const calculateSuitabilityScore = (data: SolarDataPoint[]): AnalyzedSolarData[] => {
    const analyzed = data.map(point => {
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        const monthly_energy = point.sfc_sw_down_all_mon.map((ghi, i) => (ghi * 24 * daysInMonth[i]) / 1000);
        const annual_ghi_potential = monthly_energy.reduce((a, b) => a + b, 0);

        const kt_monthly = point.sfc_sw_down_all_mon.map((ghi, i) => {
            const clear_sky = point.sfc_sw_down_clr_t_mon[i];
            return clear_sky > 1e-6 ? Math.min(ghi / clear_sky, 1.0) : 0;
        });
        const annual_mean_kt = kt_monthly.reduce((a, b) => a + b, 0) / 12;

        const ghi_mean = point.sfc_sw_down_all_mon.reduce((a, b) => a + b, 0) / 12;
        const ghi_std = Math.sqrt(point.sfc_sw_down_all_mon.map(x => Math.pow(x - ghi_mean, 2)).reduce((a, b) => a + b, 0) / 12);
        const ghi_cov = ghi_mean > 1e-6 ? ghi_std / ghi_mean : 0;

        return {
            lat: point.lat,
            lon: point.lon,
            locationName: "Geographic Location",
            annual_ghi_potential,
            annual_mean_kt,
            ghi_cov,
            final_suitability_score: 0, // will be calculated after normalization
            monthlyGHI: point.sfc_sw_down_all_mon,
        };
    });

    const minGHI = Math.min(...analyzed.map(p => p.annual_ghi_potential));
    const maxGHI = Math.max(...analyzed.map(p => p.annual_ghi_potential));
    const minKt = Math.min(...analyzed.map(p => p.annual_mean_kt));
    const maxKt = Math.max(...analyzed.map(p => p.annual_mean_kt));
    const minCov = Math.min(...analyzed.map(p => p.ghi_cov));
    const maxCov = Math.max(...analyzed.map(p => p.ghi_cov));

    const weight_ghi = 0.50;
    const weight_kt = 0.30;
    const weight_cov = 0.20;

    return analyzed.map(point => {
        const ghi_norm = normalizeValue(point.annual_ghi_potential, minGHI, maxGHI);
        const kt_norm = normalizeValue(point.annual_mean_kt, minKt, maxKt);
        const cov_norm = normalizeValue(point.ghi_cov, minCov, maxCov);

        point.final_suitability_score = (weight_ghi * ghi_norm) + (weight_kt * kt_norm) + (weight_cov * (1 - cov_norm));
        return point;
    });
};

const findNearestPointIndex = (data: AnalyzedSolarData[], lat: number, lon: number): number => {
    let nearestIndex = -1;
    let minDistance = Infinity;

    data.forEach((point, index) => {
        const dist = Math.sqrt(Math.pow(point.lat - lat, 2) + Math.pow(point.lon - lon, 2));
        if (dist < minDistance) {
            minDistance = dist;
            nearestIndex = index;
        }
    });

    return nearestIndex;
}


export const generateAndAnalyzeData = async (): Promise<{ allData: AnalyzedSolarData[], topSiteData: AnalyzedSolarData }> => {
    return new Promise(resolve => {
        setTimeout(() => { // Simulate network delay/processing time
            const dummyData = generateDummyData();
            let analyzedData = calculateSuitabilityScore(dummyData);

            // Force user-specified data point
            const targetIndex = findNearestPointIndex(analyzedData, USER_LAT, USER_LON);
            
            if (targetIndex !== -1) {
                const originalPoint = analyzedData[targetIndex];
                const topSite = {
                    ...originalPoint,
                    lat: USER_LAT,
                    lon: USER_LON,
                    locationName: USER_LOCATION_NAME,
                    final_suitability_score: USER_SCORE,
                };
                analyzedData[targetIndex] = topSite;
                resolve({ allData: analyzedData, topSiteData: topSite });
            } else {
                 // Fallback if something goes wrong
                resolve({ allData: analyzedData, topSiteData: analyzedData[0] });
            }
        }, 1500); // 1.5 second delay
    });
};
