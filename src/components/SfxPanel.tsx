import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audioEngine, SfxKey } from '../shared/AudioEngine';

const SFX_ROWS: { key: SfxKey; label: string }[] = [
  { key: 'in', label: 'SLIDE_IN' },
  { key: 'out', label: 'SLIDE_OUT' },
  { key: 'click', label: 'CLICK' },
];

export const SfxPanel: React.FC = () => {
  const [, setTick] = useState(0);
  const fileRefs = useRef<Record<SfxKey, HTMLInputElement | null>>({ in: null, out: null, click: null });

  const rerender = useCallback(() => setTick(n => n + 1), []);

  useEffect(() => {
    return audioEngine.subscribeSfx(rerender);
  }, [rerender]);

  const sfxState = audioEngine.getSfxState();

  const handleFile = (k: SfxKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) audioEngine.sfxLoadFile(k, f);
  };

  return (
    <div id="sfxp">
      <div className="sfx-head">Sound FX</div>
      {SFX_ROWS.map(({ key, label }) => {
        const dotClass = sfxState.playing[key]
          ? 'sfx-dot playing'
          : sfxState.loaded[key]
          ? 'sfx-dot loaded'
          : 'sfx-dot';

        return (
          <div className="sfx-row" key={key}>
            <span className="sfx-lbl">{label}</span>
            <div className={dotClass} />
            <span className="sfx-file">{sfxState.names[key]}</span>
            <button className="sfx-btn" onClick={() => audioEngine.sfxPlay(key)}>▶</button>
            <button className="sfx-up" onClick={() => fileRefs.current[key]?.click()}>↑ LOAD</button>
            <input
              ref={el => { fileRefs.current[key] = el; }}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(key, e)}
            />
          </div>
        );
      })}
    </div>
  );
};
