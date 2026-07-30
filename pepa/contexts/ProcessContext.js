import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const {
  DEFAULT_DESIGN,
  DEFAULT_PROFILE,
  calculateDesign,
  calculateProfile,
  evaluateTreatment,
  sanitizeDesign,
  sanitizeProfile,
} = require('../lib/processModel.cjs');

const ProcessContext = createContext(null);

function cloneDefaults() {
  return {
    design: { ...DEFAULT_DESIGN },
    profile: DEFAULT_PROFILE.map((point) => ({ ...point })),
  };
}

export function ProcessProvider({ children, enabled = true }) {
  const defaults = useRef(cloneDefaults());
  const [design, setDesign] = useState(defaults.current.design);
  const [profile, setProfile] = useState(defaults.current.profile);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('loading');
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      setSaveStatus('saved');
      return undefined;
    }
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/process');
        if (response.ok) {
          const saved = await response.json();
          if (active) {
            setDesign(sanitizeDesign(saved.design));
            setProfile(sanitizeProfile(saved.profile));
          }
        }
      } catch {
        // Defaults remain usable if persistence is temporarily unavailable.
      } finally {
        if (active) {
          setReady(true);
          setSaveStatus('saved');
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !ready) return undefined;
    setSaveStatus('saving');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/process', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ design, profile }),
        });
        setSaveStatus(response.ok ? 'saved' : 'error');
      } catch {
        setSaveStatus('error');
      }
    }, 650);

    return () => window.clearTimeout(saveTimer.current);
  }, [design, profile, ready, enabled]);

  const updateDesign = useCallback((field, value) => {
    setDesign((current) => ({ ...current, [field]: value }));
  }, []);

  const updateProfilePoint = useCallback((id, field, value) => {
    setProfile((current) =>
      current.map((point) => (point.id === id ? { ...point, [field]: value } : point))
    );
  }, []);

  const addProfilePoint = useCallback(() => {
    setProfile((current) => {
      const last = current[current.length - 1];
      const previous = current[current.length - 2];
      const step = last && previous ? Math.max(1, Number(last.time) - Number(previous.time)) : 2;
      const nextTime = last ? Number(last.time) + step : 0;
      return [
        ...current,
        {
          id: `p-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          time: Number.isFinite(nextTime) ? nextTime : 0,
          temperature: last ? Number(last.temperature) : 0,
        },
      ];
    });
  }, []);

  const removeProfilePoint = useCallback((id) => {
    setProfile((current) => (current.length > 2 ? current.filter((point) => point.id !== id) : current));
  }, []);

  const resetProcess = useCallback(() => {
    const next = cloneDefaults();
    setDesign(next.design);
    setProfile(next.profile);
  }, []);

  const designResult = useMemo(() => calculateDesign(design), [design]);
  const profileResult = useMemo(
    () => calculateProfile(profile, design.referenceTemperature, design.zValue),
    [profile, design.referenceTemperature, design.zValue]
  );
  const evaluation = useMemo(
    () => evaluateTreatment(profileResult.fReal, designResult.fDesign),
    [profileResult.fReal, designResult.fDesign]
  );

  const value = useMemo(
    () => ({
      design,
      profile,
      ready,
      saveStatus,
      designResult,
      profileResult,
      evaluation,
      updateDesign,
      updateProfilePoint,
      addProfilePoint,
      removeProfilePoint,
      resetProcess,
    }),
    [
      design,
      profile,
      ready,
      saveStatus,
      designResult,
      profileResult,
      evaluation,
      updateDesign,
      updateProfilePoint,
      addProfilePoint,
      removeProfilePoint,
      resetProcess,
    ]
  );

  return <ProcessContext.Provider value={value}>{children}</ProcessContext.Provider>;
}

export function useProcess() {
  const context = useContext(ProcessContext);
  if (!context) throw new Error('useProcess debe utilizarse dentro de ProcessProvider.');
  return context;
}
