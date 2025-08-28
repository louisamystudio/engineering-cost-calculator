import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

export default function DataVizProDashboard() {
  const [, navigate] = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try to find existing demo project
        const res = await fetch('/api/projects', { credentials: 'include' });
        const projects = await res.json();
        let demo = projects.find((p: any) => p.isDemo);
        if (!demo) {
          // Create demo with sensible defaults (DataVizPro sample)
          const demoInput = {
            projectName: 'Demo Project',
            buildingUse: 'Residential',
            buildingType: 'Custom Houses',
            buildingTier: 'Mid',
            designLevel: 2,
            category: 5,
            newBuildingArea: 0,
            existingBuildingArea: 4407,
            siteArea: 972,
            historicMultiplier: 1.0,
            remodelMultiplier: 0.5,
          };
          const createRes = await apiRequest('POST', '/api/projects/calculate', demoInput);
          const data = await createRes.json();
          demo = data.project;
        }
        if (!cancelled && demo?.id) navigate(`/projects/${demo.id}`);
      } catch (e) {
        // fallback: go to projects list
        if (!cancelled) navigate('/projects');
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-sm text-muted-foreground">Loading DataVizPro Dashboard…</div>
    </div>
  );
}

