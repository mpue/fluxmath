import React, { useState, useCallback } from 'react';

/* ── types ─────────────────────────────────────────────── */
type Mat = number[][];

/* ── matrix helpers ────────────────────────────────────── */
function zeros(r: number, c: number): Mat {
  return Array.from({ length: r }, () => Array(c).fill(0));
}

function add(a: Mat, b: Mat): Mat {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

function sub(a: Mat, b: Mat): Mat {
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

function scale(a: Mat, s: number): Mat {
  return a.map(row => row.map(v => v * s));
}

function mult(a: Mat, b: Mat): Mat {
  const rows = a.length, cols = b[0].length, inner = b.length;
  const res = zeros(rows, cols);
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      for (let k = 0; k < inner; k++)
        res[i][j] += a[i][k] * b[k][j];
  return res;
}

function transpose(a: Mat): Mat {
  return a[0].map((_, j) => a.map(row => row[j]));
}

function det(m: Mat): number {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let d = 0;
  for (let j = 0; j < n; j++) {
    const minor = m.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
    d += (j % 2 === 0 ? 1 : -1) * m[0][j] * det(minor);
  }
  return d;
}

function inverse(m: Mat): Mat | null {
  const n = m.length;
  const d = det(m);
  if (Math.abs(d) < 1e-10) return null;
  // augment [m | I]
  const aug: Mat = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  // Gauss-Jordan
  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivotRow][col])) pivotRow = r;
    }
    [aug[col], aug[pivotRow]] = [aug[pivotRow], aug[col]];
    const pv = aug[col][col];
    if (Math.abs(pv) < 1e-12) return null;
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = aug[r][col];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= f * aug[col][j];
    }
  }
  return aug.map(row => row.slice(n));
}

function trace(m: Mat): number {
  let s = 0;
  for (let i = 0; i < Math.min(m.length, m[0].length); i++) s += m[i][i];
  return s;
}

function rank(m: Mat): number {
  const n = m.length, c = m[0].length;
  const a: Mat = m.map(r => [...r]);
  let r = 0;
  for (let col = 0; col < c && r < n; col++) {
    let pivotRow = -1;
    for (let i = r; i < n; i++) {
      if (Math.abs(a[i][col]) > 1e-10) { pivotRow = i; break; }
    }
    if (pivotRow < 0) continue;
    [a[r], a[pivotRow]] = [a[pivotRow], a[r]];
    const pv = a[r][col];
    for (let j = col; j < c; j++) a[r][j] /= pv;
    for (let i = 0; i < n; i++) {
      if (i === r) continue;
      const f = a[i][col];
      for (let j = col; j < c; j++) a[i][j] -= f * a[r][j];
    }
    r++;
  }
  return r;
}

function power(m: Mat, p: number): Mat {
  if (p === 0) return m.map((row, i) => row.map((_, j) => i === j ? 1 : 0));
  let res = m.map(r => [...r]);
  for (let k = 1; k < p; k++) res = mult(res, m);
  return res;
}

/* ── formatting ────────────────────────────────────────── */
function fmtN(n: number): string {
  if (!isFinite(n)) return '—';
  const r = Math.round(n * 1000) / 1000;
  if (Math.abs(r) < 1e-9) return '0';
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

/* ── input cell style ──────────────────────────────────── */
const cellStyle: React.CSSProperties = {
  width: 56,
  textAlign: 'center' as const,
  background: 'rgba(0,212,255,0.03)',
  border: '1px solid rgba(0,212,255,0.1)',
  borderRadius: '2px',
  padding: '8px 4px',
  color: 'var(--text)',
  fontFamily: '"Share Tech Mono", monospace',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color .3s, box-shadow .3s',
};

const resultCellStyle: React.CSSProperties = {
  ...cellStyle,
  background: 'rgba(255,170,0,0.04)',
  border: '1px solid rgba(255,170,0,0.15)',
  color: '#ffaa00',
  cursor: 'default',
};

/* ── operations ────────────────────────────────────────── */
type Op = 'A+B' | 'A-B' | 'A·B' | 'A·s' | 'Aᵀ' | 'det(A)' | 'A⁻¹' | 'Aⁿ' | 'Rang' | 'Spur';
const OPS: Op[] = ['A+B', 'A-B', 'A·B', 'A·s', 'Aᵀ', 'det(A)', 'A⁻¹', 'Aⁿ', 'Rang', 'Spur'];
const needsB = (op: Op) => op === 'A+B' || op === 'A-B' || op === 'A·B';

/* ── component ─────────────────────────────────────────── */
export const MatrixRechner: React.FC = () => {
  const [rowsA, setRowsA] = useState(3);
  const [colsA, setColsA] = useState(3);
  const [rowsB, setRowsB] = useState(3);
  const [colsB, setColsB] = useState(3);
  const [matA, setMatA] = useState<Mat>(() => zeros(3, 3));
  const [matB, setMatB] = useState<Mat>(() => zeros(3, 3));
  const [op, setOp] = useState<Op>('A+B');
  const [scalar, setScalar] = useState(2);
  const [exponent, setExponent] = useState(2);

  /* resize helpers */
  const resize = (mat: Mat, r: number, c: number): Mat => {
    return Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => (mat[i] && mat[i][j] != null ? mat[i][j] : 0))
    );
  };

  const changeRowsA = (n: number) => { setRowsA(n); setMatA(prev => resize(prev, n, colsA)); };
  const changeColsA = (n: number) => { setColsA(n); setMatA(prev => resize(prev, rowsA, n)); };
  const changeRowsB = (n: number) => { setRowsB(n); setMatB(prev => resize(prev, n, colsB)); };
  const changeColsB = (n: number) => { setColsB(n); setMatB(prev => resize(prev, rowsB, n)); };

  const setCellA = (i: number, j: number, v: string) => {
    setMatA(prev => {
      const m = prev.map(r => [...r]);
      m[i][j] = v === '' || v === '-' ? 0 : Number(v) || 0;
      return m;
    });
  };
  const setCellB = (i: number, j: number, v: string) => {
    setMatB(prev => {
      const m = prev.map(r => [...r]);
      m[i][j] = v === '' || v === '-' ? 0 : Number(v) || 0;
      return m;
    });
  };

  /* compute */
  const compute = useCallback((): { mat?: Mat; scalar?: number; error?: string } => {
    try {
      switch (op) {
        case 'A+B':
          if (rowsA !== rowsB || colsA !== colsB) return { error: 'Dimensionen müssen übereinstimmen' };
          return { mat: add(matA, matB) };
        case 'A-B':
          if (rowsA !== rowsB || colsA !== colsB) return { error: 'Dimensionen müssen übereinstimmen' };
          return { mat: sub(matA, matB) };
        case 'A·B':
          if (colsA !== rowsB) return { error: `Spalten A (${colsA}) ≠ Zeilen B (${rowsB})` };
          return { mat: mult(matA, matB) };
        case 'A·s':
          return { mat: scale(matA, scalar) };
        case 'Aᵀ':
          return { mat: transpose(matA) };
        case 'det(A)':
          if (rowsA !== colsA) return { error: 'Matrix muss quadratisch sein' };
          return { scalar: det(matA) };
        case 'A⁻¹': {
          if (rowsA !== colsA) return { error: 'Matrix muss quadratisch sein' };
          const inv = inverse(matA);
          if (!inv) return { error: 'Matrix ist singulär (det = 0)' };
          return { mat: inv };
        }
        case 'Aⁿ':
          if (rowsA !== colsA) return { error: 'Matrix muss quadratisch sein' };
          return { mat: power(matA, exponent) };
        case 'Rang':
          return { scalar: rank(matA) };
        case 'Spur':
          if (rowsA !== colsA) return { error: 'Matrix muss quadratisch sein' };
          return { scalar: trace(matA) };
      }
    } catch {
      return { error: 'Berechnungsfehler' };
    }
  }, [op, matA, matB, rowsA, colsA, rowsB, colsB, scalar, exponent]);

  const result = compute();

  /* ── matrix grid renderer ──────────────────────────── */
  const MatrixGrid = ({ mat, onCell, label, color }: {
    mat: Mat; onCell?: (i: number, j: number, v: string) => void;
    label: string; color: string;
  }) => (
    <div style={{ display: 'inline-block' }}>
      <div style={{
        fontFamily: '"Share Tech Mono", monospace', fontSize: '10px',
        letterSpacing: '.18em', textTransform: 'uppercase' as const,
        color, marginBottom: 8, textShadow: `0 0 12px ${color}44`,
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* left bracket */}
        <div style={{
          borderLeft: `2px solid ${color}`, borderTop: `2px solid ${color}`, borderBottom: `2px solid ${color}`,
          width: 6, alignSelf: 'stretch', borderRadius: '3px 0 0 3px', opacity: 0.5,
        }} />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mat[0]?.length || 1}, 56px)`, gap: 2 }}>
          {mat.map((row, i) => row.map((v, j) => (
            onCell ? (
              <input
                key={`${i}-${j}`}
                type="text"
                inputMode="decimal"
                defaultValue={v === 0 ? '' : String(v)}
                placeholder="0"
                style={cellStyle}
                onChange={e => onCell(i, j, e.target.value)}
                onFocus={e => {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.boxShadow = `0 0 10px ${color}44`;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            ) : (
              <div key={`${i}-${j}`} style={resultCellStyle}>{fmtN(v)}</div>
            )
          )))}
        </div>
        {/* right bracket */}
        <div style={{
          borderRight: `2px solid ${color}`, borderTop: `2px solid ${color}`, borderBottom: `2px solid ${color}`,
          width: 6, alignSelf: 'stretch', borderRadius: '0 3px 3px 0', opacity: 0.5,
        }} />
      </div>
    </div>
  );

  /* ── dimension selector ────────────────────────────── */
  const DimSelector = ({ label, rows, cols, onRows, onCols }: {
    label: string; rows: number; cols: number;
    onRows: (n: number) => void; onCols: (n: number) => void;
  }) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' as const }}>
      <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '10px', letterSpacing: '.12em', color: 'var(--muted)', textTransform: 'uppercase' as const }}>
        {label}
      </span>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={`r${n}`} onClick={() => onRows(n)} style={{
          padding: '4px 8px', border: 'none', cursor: 'pointer',
          fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
          background: n === rows ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
          color: n === rows ? '#00d4ff' : '#2a5a70',
        }}>{n}</button>
      ))}
      <span style={{ color: 'var(--muted)', fontSize: '12px' }}>×</span>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={`c${n}`} onClick={() => onCols(n)} style={{
          padding: '4px 8px', border: 'none', cursor: 'pointer',
          fontFamily: '"Share Tech Mono", monospace', fontSize: '11px',
          background: n === cols ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
          color: n === cols ? '#00d4ff' : '#2a5a70',
        }}>{n}</button>
      ))}
    </div>
  );

  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
    fontFamily: '"Share Tech Mono", monospace', fontSize: '10px', letterSpacing: '.06em',
    background: active ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.03)',
    color: active ? '#00d4ff' : '#2a5a70',
    transition: 'background .2s, color .2s',
  });

  return (
    <>
      <div className="header-eyebrow">Tools <span>// Matrixrechner</span></div>
      <h1>Matrix<em>rechner</em></h1>
      <p className="subtitle">Matrizen eingeben, Operationen wählen &amp; Ergebnis berechnen</p>

      {/* ─── Operation selector ─────────────────────── */}
      <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
        <div className="ctrl">
          <div className="ctrl-header">
            <span className="ctrl-label">Operation</span>
            <span className="ctrl-value cyan">{op}</span>
          </div>
          <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap' }}>
            {OPS.map(o => (
              <button key={o} onClick={() => setOp(o)} style={btnStyle(o === op)}>{o}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Dimension selectors ────────────────────── */}
      <div className="controls" style={{ gridTemplateColumns: needsB(op) ? '1fr 1fr' : '1fr' }}>
        <div className="ctrl">
          <DimSelector label="Matrix A" rows={rowsA} cols={colsA} onRows={changeRowsA} onCols={changeColsA} />
        </div>
        {needsB(op) && (
          <div className="ctrl">
            <DimSelector label="Matrix B" rows={rowsB} cols={colsB} onRows={changeRowsB} onCols={changeColsB} />
          </div>
        )}
      </div>

      {/* ─── Scalar / exponent inputs ───────────────── */}
      {op === 'A·s' && (
        <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">Skalar s</span>
              <span className="ctrl-value cyan">{scalar}</span>
            </div>
            <input type="range" min={-10} max={10} step={0.5} value={scalar}
              onChange={e => setScalar(Number(e.target.value))} />
          </div>
        </div>
      )}
      {op === 'Aⁿ' && (
        <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ctrl">
            <div className="ctrl-header">
              <span className="ctrl-label">Exponent n</span>
              <span className="ctrl-value cyan">{exponent}</span>
            </div>
            <input type="range" min={0} max={8} step={1} value={exponent}
              onChange={e => setExponent(Number(e.target.value))} />
          </div>
        </div>
      )}

      {/* ─── Matrix inputs ──────────────────────────── */}
      <div style={{
        display: 'flex', gap: 32, flexWrap: 'wrap' as const, justifyContent: 'center',
        padding: '24px 0',
      }}>
        <MatrixGrid mat={matA} onCell={setCellA} label="Matrix A" color="#00d4ff" />
        {needsB(op) && (
          <MatrixGrid mat={matB} onCell={setCellB} label="Matrix B" color="#00ff88" />
        )}
      </div>

      {/* ─── Result ─────────────────────────────────── */}
      <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="info-card eq">
          <div className="label">Ergebnis — {op}</div>
          {result.error ? (
            <div className="value" style={{ color: '#ff4466' }}>{result.error}</div>
          ) : result.scalar != null ? (
            <div className="value" style={{ fontSize: '24px' }}>{fmtN(result.scalar)}</div>
          ) : result.mat ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              <MatrixGrid mat={result.mat} label="Ergebnis" color="#ffaa00" />
            </div>
          ) : null}
        </div>
      </div>

      {/* ─── Legend ──────────────────────────────────── */}
      <div className="legend">
        <div className="legend-item"><div className="legend-dot glow-cyan" />Matrix A</div>
        {needsB(op) && <div className="legend-item"><div className="legend-dot glow-lime" />Matrix B</div>}
        <div className="legend-item"><div className="legend-dot glow-amber" />Ergebnis</div>
      </div>

      {/* ─── Explanation ────────────────────────────── */}
      <div className="explanation">
        <h2>Bedienung</h2>
        <p>
          Wähle eine <strong>Operation</strong>, stelle die <strong>Dimensionen</strong> ein und gib die Matrixwerte ein.
          Das Ergebnis wird sofort berechnet.
        </p>
        <p>
          Verfügbare Operationen: <strong>Addition</strong>, <strong>Subtraktion</strong>, <strong>Multiplikation</strong>,
          <strong>Skalarmultiplikation</strong>, <strong>Transponieren</strong>, <strong>Determinante</strong>,
          <strong>Inverse</strong>, <strong>Potenz</strong>, <strong>Rang</strong> und <strong>Spur</strong>.
        </p>
        <p>
          Matrizen bis 5×5 werden unterstützt. Für Determinante, Inverse, Potenz und Spur muss die Matrix quadratisch sein.
        </p>
      </div>
    </>
  );
};
