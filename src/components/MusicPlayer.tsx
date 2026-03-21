import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audioEngine } from '../shared/AudioEngine';

const WAVE_HEIGHTS = [4, 7, 13, 9, 17, 11, 5, 15, 8, 11, 13, 5];

function fmtTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export const MusicPlayer: React.FC = () => {
  const [, setTick] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const wfRef = useRef<number>(0);
  const wfTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  const rerender = useCallback(() => setTick(n => n + 1), []);

  useEffect(() => {
    return audioEngine.subscribe(rerender);
  }, [rerender]);

  const state = audioEngine.getState();
  const pct = state.duration ? (state.currentTime / state.duration * 100) : 0;

  // Waveform animation
  useEffect(() => {
    if (state.playing && !wfTimerRef.current) {
      wfRef.current = 0;
      wfTimerRef.current = setInterval(() => {
        barsRef.current.forEach(b => b?.classList.remove('a'));
        const bar = barsRef.current[wfRef.current % barsRef.current.length];
        bar?.classList.add('a');
        wfRef.current++;
      }, 100);
    } else if (!state.playing && wfTimerRef.current) {
      clearInterval(wfTimerRef.current);
      wfTimerRef.current = null;
      barsRef.current.forEach(b => b?.classList.remove('a'));
    }
    return () => {
      if (wfTimerRef.current) clearInterval(wfTimerRef.current);
      wfTimerRef.current = null;
    };
  }, [state.playing]);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    audioEngine.seek((e.clientX - r.left) / r.width);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) audioEngine.loadFile(f);
  };

  return (
    <>
      {/* Mini toggle button – visible only on mobile when collapsed */}
      <button
        className={`player-mini${collapsed ? '' : ' hidden'}`}
        onClick={() => setCollapsed(false)}
        aria-label="Musik-Player öffnen"
      >
        {state.playing ? '\u25A0' : '\u266B'}
      </button>

      <div id="player" className={collapsed ? 'mobile-collapsed' : ''}>
        {/* Close button – visible only on mobile */}
        <button
          className="player-close"
          onClick={() => setCollapsed(true)}
          aria-label="Player minimieren"
        >✕</button>

        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <button className="ply-upload" onClick={() => fileRef.current?.click()}>
          ▲ Audio
        </button>
        <div className="ply-info">
          <div className="ply-title">{state.title}</div>
          <div className="ply-bar" onClick={handleBarClick}>
            <div className="ply-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="ply-time">
            <span>{fmtTime(state.currentTime)}</span>
            <div className="wavefm">
              {WAVE_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  ref={el => { barsRef.current[i] = el; }}
                  className="wb"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <span>{fmtTime(state.duration)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <button
            className={`ply-btn${state.playing ? ' on' : ''}`}
            onClick={() => audioEngine.togglePlay()}
          >
            {state.playing ? '\u275A\u275A' : '\u25B6'}
          </button>
          <div className="ply-vol">
            <span style={{ fontSize: '9px', color: 'var(--muted)' }}>▪</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.volume}
              onChange={e => audioEngine.setVolume(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>
    </>
  );
};
