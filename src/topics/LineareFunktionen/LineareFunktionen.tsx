import React, { useState } from 'react';
import { LinearCanvas } from './LinearCanvas';

function fmt(n: number): string {
  return Math.abs(n) < 0.001 ? '0' : n.toFixed(1);
}

export const LineareFunktionen: React.FC = () => {
  const [sliderM, setSliderM] = useState(10);
  const [sliderB, setSliderB] = useState(20);

  const m = sliderM / 10;
  const b = sliderB / 10;

  // Equation display
  let equation: string;
  const bSign = b >= 0 ? ' + ' : ' \u2212 ';
  const bAbs = fmt(Math.abs(b));
  if (Math.abs(m) < 0.001) {
    equation = 'f(x) = ' + fmt(b);
  } else if (Math.abs(b) < 0.001) {
    equation = 'f(x) = ' + fmt(m) + 'x';
  } else {
    equation = 'f(x) = ' + fmt(m) + 'x' + bSign + bAbs;
  }

  // Zero point
  let zeroVal: string;
  let zeroDetail: string;
  if (Math.abs(m) < 0.001) {
    zeroVal = b === 0 ? 'alle x \u2208 \u211D' : 'keine';
    zeroDetail = b === 0 ? 'Gerade liegt auf x-Achse' : 'parallel zur x-Achse';
  } else {
    const zx = -b / m;
    zeroVal = 'x\u2080 = ' + fmt(zx);
    zeroDetail = 'f(' + fmt(zx) + ') = 0';
  }

  // Slope info
  let slopeDetail: string;
  if (m > 0.001) slopeDetail = 'steigend \u2197';
  else if (m < -0.001) slopeDetail = 'fallend \u2198';
  else slopeDetail = 'horizontal \u2192';

  return (
    <>
      <div className="header-eyebrow">Mathematik <span>// interaktiv</span></div>
      <h1>Lineare <em>Funktionen</em></h1>
      <p className="subtitle">Geraden, Steigung &amp; Nullstellen im 4-Quadranten-Koordinatensystem</p>

      <LinearCanvas m={m} b={b} />

      <div className="controls">
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Steigung m</span>
            <span className="ctrl-value cyan">{fmt(m)}</span>
          </div>
          <input
            type="range"
            min={-40} max={40} step={1}
            value={sliderM}
            onChange={e => setSliderM(Number(e.target.value))}
          />
        </div>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">y-Achsenabschnitt b</span>
            <span className="ctrl-value amber">{fmt(b)}</span>
          </div>
          <input
            type="range"
            min={-60} max={60} step={1}
            value={sliderB}
            onChange={e => setSliderB(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card eq">
          <div className="label">Funktionsgleichung</div>
          <div className="value">{equation}</div>
        </div>
        <div className="info-card zero">
          <div className="label">Nullstelle</div>
          <div className="value">{zeroVal}</div>
          <div className="detail">{zeroDetail}</div>
        </div>
        <div className="info-card slope">
          <div className="label">Steigung</div>
          <div className="value">m = {fmt(m)}</div>
          <div className="detail">{slopeDetail}</div>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Gerade f(x)</div>
        <div className="legend-item"><div className="legend-dot glow-red" />Nullstelle</div>
        <div className="legend-item"><div className="legend-dot glow-lime" />y-Achsenabschnitt</div>
        <div className="legend-item"><div className="legend-dot glow-amber" />Steigungsdreieck</div>
      </div>

      <div className="explanation">
        <h2>Erläuterung</h2>
        <p>
          Eine <strong>lineare Funktion</strong> hat die Form <span className="formula">f(x) = m &middot; x + b</span>.
          Der Parameter <strong>m</strong> ist die <strong>Steigung</strong> — er bestimmt, wie steil die Gerade verläuft.
          Ist m &gt; 0, steigt die Gerade; ist m &lt; 0, fällt sie; bei m = 0 verläuft sie horizontal.
        </p>
        <p>
          Der Parameter <strong>b</strong> ist der <strong>y-Achsenabschnitt</strong> — der Punkt, an dem die Gerade
          die y-Achse schneidet, also <span className="formula">(0 | b)</span>.
        </p>
        <p>
          Die <strong>Nullstelle</strong> ist der x-Wert, bei dem <span className="formula">f(x) = 0</span> gilt.
          Durch Umstellen erhält man <span className="formula">x&#x2080; = &#x2212;b / m</span> (sofern m &#x2260; 0).
          Das ist der Schnittpunkt der Geraden mit der x-Achse.
        </p>
        <p>
          Das <strong>Steigungsdreieck</strong> (gestrichelt) veranschaulicht die Steigung:
          Bei einer horizontalen Änderung von 1 ändert sich y um genau m.
        </p>
      </div>
    </>
  );
};
