import React, { useEffect, useState, useCallback } from 'react';
import { checkAchievements, getUnlocked, ACHIEVEMENTS, AchievementDef } from '../shared/AchievementStore';

/* Toast notification for newly unlocked achievements */
const AchievementToast: React.FC<{ ach: AchievementDef; onDone: () => void }> = ({ ach, onDone }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', top: visible ? 24 : -80, right: 24, zIndex: 9999,
      background: 'linear-gradient(135deg, rgba(0,20,30,0.95), rgba(0,40,60,0.95))',
      border: '1px solid rgba(0,212,255,0.4)',
      borderRadius: 6, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 0 30px rgba(0,212,255,0.25), 0 4px 20px rgba(0,0,0,0.5)',
      transition: 'top 0.4s cubic-bezier(.4,0,.2,1)',
      fontFamily: '"Share Tech Mono", monospace',
    }}>
      <span style={{ fontSize: 28 }}>{ach.icon}</span>
      <div>
        <div style={{ color: '#00d4ff', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const }}>
          Achievement freigeschaltet
        </div>
        <div style={{ color: '#fff', fontSize: 15, fontFamily: '"Orbitron", sans-serif', marginTop: 2 }}>
          {ach.title}
        </div>
        <div style={{ color: 'rgba(0,212,255,0.6)', fontSize: 11, marginTop: 2 }}>
          {ach.description}
        </div>
      </div>
    </div>
  );
};

/* Provider that checks on interval + manual trigger */
export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<AchievementDef[]>([]);

  const doCheck = useCallback(() => {
    const ids = checkAchievements();
    if (ids.length) {
      const defs = ids.map(id => ACHIEVEMENTS.find(a => a.id === id)!).filter(Boolean);
      setQueue(prev => [...prev, ...defs]);
    }
  }, []);

  // Check on mount and every 10 seconds
  useEffect(() => {
    doCheck();
    const iv = setInterval(doCheck, 10_000);
    return () => clearInterval(iv);
  }, [doCheck]);

  const dismiss = useCallback(() => setQueue(q => q.slice(1)), []);

  return (
    <>
      {children}
      {queue.length > 0 && <AchievementToast key={queue[0].id} ach={queue[0]} onDone={dismiss} />}
    </>
  );
};

/* Badge display panel for embedding in a page */
export const AchievementPanel: React.FC = () => {
  const unlocked = getUnlocked();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
      {ACHIEVEMENTS.map(ach => {
        const done = !!unlocked[ach.id];
        return (
          <div key={ach.id} style={{
            background: done ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${done ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 4, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center',
            opacity: done ? 1 : 0.4,
          }}>
            <span style={{ fontSize: 24, filter: done ? 'none' : 'grayscale(1)' }}>{ach.icon}</span>
            <div>
              <div style={{ color: done ? '#00d4ff' : '#667', fontSize: 13, fontFamily: '"Orbitron", sans-serif' }}>{ach.title}</div>
              <div style={{ color: done ? 'rgba(0,212,255,0.6)' : '#445', fontSize: 11 }}>{ach.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
