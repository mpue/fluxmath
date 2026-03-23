import React, { useState } from 'react';
import { Math as M } from '../../../shared/Math';

interface FormulaEntry {
  name: string;
  formula: string;
  note?: string;
}

interface Section {
  title: string;
  formulas: FormulaEntry[];
}

const CATEGORIES: { id: string; label: string; icon: string; sections: Section[] }[] = [
  {
    id: 'grundlagen',
    label: 'Grundlagen',
    icon: '🧮',
    sections: [
      {
        title: 'Potenzgesetze',
        formulas: [
          { name: 'Multiplikation', formula: 'a^m \\cdot a^n = a^{m+n}' },
          { name: 'Division', formula: '\\frac{a^m}{a^n} = a^{m-n}' },
          { name: 'Potenz einer Potenz', formula: '(a^m)^n = a^{m \\cdot n}' },
          { name: 'Produkt-Potenz', formula: '(a \\cdot b)^n = a^n \\cdot b^n' },
          { name: 'Negative Exponenten', formula: 'a^{-n} = \\frac{1}{a^n}' },
          { name: 'Wurzel als Potenz', formula: '\\sqrt[n]{a} = a^{\\frac{1}{n}}' },
        ],
      },
      {
        title: 'Logarithmengesetze',
        formulas: [
          { name: 'Definition', formula: '\\log_a(b) = c \\Leftrightarrow a^c = b' },
          { name: 'Produkt', formula: '\\log_a(x \\cdot y) = \\log_a(x) + \\log_a(y)' },
          { name: 'Quotient', formula: '\\log_a\\left(\\frac{x}{y}\\right) = \\log_a(x) - \\log_a(y)' },
          { name: 'Potenz', formula: '\\log_a(x^n) = n \\cdot \\log_a(x)' },
          { name: 'Basiswechsel', formula: '\\log_a(x) = \\frac{\\ln(x)}{\\ln(a)}' },
        ],
      },
      {
        title: 'Binomische Formeln',
        formulas: [
          { name: '1. Binomische Formel', formula: '(a + b)^2 = a^2 + 2ab + b^2' },
          { name: '2. Binomische Formel', formula: '(a - b)^2 = a^2 - 2ab + b^2' },
          { name: '3. Binomische Formel', formula: '(a + b)(a - b) = a^2 - b^2' },
          { name: 'Binomischer Lehrsatz', formula: '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k' },
        ],
      },
      {
        title: 'Quadratische Gleichungen',
        formulas: [
          { name: 'p-q-Formel', formula: 'x_{1,2} = -\\frac{p}{2} \\pm \\sqrt{\\left(\\frac{p}{2}\\right)^2 - q}' },
          { name: 'Mitternachtsformel', formula: 'x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
          { name: 'Diskriminante', formula: 'D = b^2 - 4ac', note: 'D > 0: zwei Lösungen, D = 0: eine, D < 0: keine reelle' },
          { name: 'Satz von Vieta', formula: 'x_1 + x_2 = -p, \\quad x_1 \\cdot x_2 = q' },
        ],
      },
    ],
  },
  {
    id: 'funktionen',
    label: 'Funktionen',
    icon: '📈',
    sections: [
      {
        title: 'Lineare Funktionen',
        formulas: [
          { name: 'Normalform', formula: 'f(x) = mx + b' },
          { name: 'Steigung', formula: 'm = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{\\Delta y}{\\Delta x}' },
          { name: 'Punkt-Steigungs-Form', formula: 'y - y_1 = m(x - x_1)' },
          { name: 'Parallele Geraden', formula: 'm_1 = m_2' },
          { name: 'Senkrechte Geraden', formula: 'm_1 \\cdot m_2 = -1' },
        ],
      },
      {
        title: 'Quadratische Funktionen',
        formulas: [
          { name: 'Normalform', formula: 'f(x) = ax^2 + bx + c' },
          { name: 'Scheitelpunktform', formula: 'f(x) = a(x - d)^2 + e' },
          { name: 'Scheitelpunkt', formula: 'S\\left(-\\frac{b}{2a},\\; f\\left(-\\frac{b}{2a}\\right)\\right)' },
          { name: 'Nullstellen', formula: 'x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
        ],
      },
      {
        title: 'Exponentialfunktionen',
        formulas: [
          { name: 'Allgemeine Form', formula: 'f(x) = a \\cdot b^x' },
          { name: 'Natürliche e-Funktion', formula: 'f(x) = e^x, \\quad e \\approx 2{,}718' },
          { name: 'Wachstum / Zerfall', formula: 'f(t) = f_0 \\cdot e^{kt}', note: 'k > 0: Wachstum, k < 0: Zerfall' },
          { name: 'Verdopplungszeit', formula: 'T_2 = \\frac{\\ln 2}{k}' },
          { name: 'Halbwertszeit', formula: 'T_{1/2} = \\frac{\\ln 2}{|k|}' },
        ],
      },
      {
        title: 'Trigonometrische Funktionen',
        formulas: [
          { name: 'Sinus', formula: 'f(x) = a \\cdot \\sin(bx + c) + d' },
          { name: 'Periode', formula: 'T = \\frac{2\\pi}{|b|}' },
          { name: 'Pythagoras (trig.)', formula: '\\sin^2(x) + \\cos^2(x) = 1' },
          { name: 'Additionstheoreme', formula: '\\sin(\\alpha \\pm \\beta) = \\sin\\alpha\\cos\\beta \\pm \\cos\\alpha\\sin\\beta' },
          { name: 'Cosinus Addition', formula: '\\cos(\\alpha \\pm \\beta) = \\cos\\alpha\\cos\\beta \\mp \\sin\\alpha\\sin\\beta' },
          { name: 'Doppelter Winkel', formula: '\\sin(2\\alpha) = 2\\sin\\alpha\\cos\\alpha' },
        ],
      },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: '∫',
    sections: [
      {
        title: 'Ableitungsregeln',
        formulas: [
          { name: 'Potenzregel', formula: 'f(x)=x^n \\Rightarrow f\'(x)=n\\cdot x^{n-1}' },
          { name: 'Faktorregel', formula: '[c \\cdot f(x)]\' = c \\cdot f\'(x)' },
          { name: 'Summenregel', formula: '[f(x) + g(x)]\' = f\'(x) + g\'(x)' },
          { name: 'Produktregel', formula: '[f \\cdot g]\' = f\' \\cdot g + f \\cdot g\'' },
          { name: 'Quotientenregel', formula: '\\left[\\frac{f}{g}\\right]\' = \\frac{f\' \\cdot g - f \\cdot g\'}{g^2}' },
          { name: 'Kettenregel', formula: '[f(g(x))]\' = f\'(g(x)) \\cdot g\'(x)' },
        ],
      },
      {
        title: 'Wichtige Ableitungen',
        formulas: [
          { name: 'e-Funktion', formula: '(e^x)\' = e^x' },
          { name: 'Logarithmus', formula: '(\\ln x)\' = \\frac{1}{x}' },
          { name: 'Sinus', formula: '(\\sin x)\' = \\cos x' },
          { name: 'Cosinus', formula: '(\\cos x)\' = -\\sin x' },
          { name: 'Tangens', formula: '(\\tan x)\' = \\frac{1}{\\cos^2 x} = 1 + \\tan^2 x' },
          { name: 'Allg. Exponential', formula: '(a^x)\' = a^x \\cdot \\ln a' },
          { name: 'Allg. Logarithmus', formula: '(\\log_a x)\' = \\frac{1}{x \\cdot \\ln a}' },
        ],
      },
      {
        title: 'Integralregeln',
        formulas: [
          { name: 'Potenzregel', formula: '\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)' },
          { name: 'e-Funktion', formula: '\\int e^x\\,dx = e^x + C' },
          { name: '1/x', formula: '\\int \\frac{1}{x}\\,dx = \\ln|x| + C' },
          { name: 'Sinus', formula: '\\int \\sin x\\,dx = -\\cos x + C' },
          { name: 'Cosinus', formula: '\\int \\cos x\\,dx = \\sin x + C' },
          { name: 'Partielle Integration', formula: '\\int f\'g\\,dx = fg - \\int fg\'\\,dx' },
          { name: 'Substitution', formula: '\\int f(g(x))\\cdot g\'(x)\\,dx = F(g(x)) + C' },
          { name: 'Bestimmtes Integral (HSI)', formula: '\\int_a^b f(x)\\,dx = F(b) - F(a)' },
        ],
      },
      {
        title: 'Kurvendiskussion',
        formulas: [
          { name: 'Nullstellen', formula: 'f(x) = 0' },
          { name: 'Extremstellen', formula: 'f\'(x_0) = 0 \\text{ und } f\'\'(x_0) \\neq 0' },
          { name: 'Maximum', formula: 'f\'(x_0)=0,\\; f\'\'(x_0) < 0' },
          { name: 'Minimum', formula: 'f\'(x_0)=0,\\; f\'\'(x_0) > 0' },
          { name: 'Wendestellen', formula: 'f\'\'(x_0)=0 \\text{ und } f\'\'\'(x_0) \\neq 0' },
          { name: 'Symmetrie (achsen)', formula: 'f(-x)=f(x) \\text{ (gerade Funktion)}' },
          { name: 'Symmetrie (punkt)', formula: 'f(-x)=-f(x) \\text{ (ungerade Funktion)}' },
        ],
      },
      {
        title: 'Grenzwerte & Reihen',
        formulas: [
          { name: 'L\'Hôpital', formula: '\\lim_{x \\to a}\\frac{f(x)}{g(x)} = \\lim_{x \\to a}\\frac{f\'(x)}{g\'(x)}', note: 'Falls 0/0 oder ∞/∞' },
          { name: 'Geometrische Reihe', formula: '\\sum_{k=0}^{\\infty} q^k = \\frac{1}{1-q}, \\quad |q|<1' },
          { name: 'Euler-Zahl', formula: 'e = \\lim_{n\\to\\infty}\\left(1+\\frac{1}{n}\\right)^n = \\sum_{k=0}^{\\infty}\\frac{1}{k!}' },
          { name: 'Taylor-Reihe', formula: 'f(x)=\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(a)}{n!}(x-a)^n' },
        ],
      },
      {
        title: 'Differentialgleichungen',
        formulas: [
          { name: 'Separierbar', formula: 'y\' = f(x)\\cdot g(y) \\Rightarrow \\int\\frac{dy}{g(y)} = \\int f(x)\\,dx' },
          { name: 'Linear 1. Ordnung', formula: 'y\' + p(x)y = q(x)', note: 'Lösung via Variation der Konstanten' },
          { name: 'Homogen 2. Ordnung', formula: 'y\'\' + py\' + qy = 0', note: 'Ansatz: y = e^{λx}' },
          { name: 'Charakteristische Gl.', formula: '\\lambda^2 + p\\lambda + q = 0' },
        ],
      },
    ],
  },
  {
    id: 'linalg',
    label: 'Lineare Algebra',
    icon: '⊞',
    sections: [
      {
        title: 'Vektoren',
        formulas: [
          { name: 'Betrag', formula: '|\\vec{a}| = \\sqrt{a_1^2 + a_2^2 + a_3^2}' },
          { name: 'Skalarprodukt', formula: '\\vec{a} \\cdot \\vec{b} = a_1 b_1 + a_2 b_2 + a_3 b_3' },
          { name: 'Winkel', formula: '\\cos\\varphi = \\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}|\\cdot|\\vec{b}|}' },
          { name: 'Kreuzprodukt', formula: '\\vec{a}\\times\\vec{b} = \\begin{pmatrix} a_2 b_3 - a_3 b_2 \\\\ a_3 b_1 - a_1 b_3 \\\\ a_1 b_2 - a_2 b_1 \\end{pmatrix}' },
          { name: 'Spatprodukt', formula: '(\\vec{a}\\times\\vec{b})\\cdot\\vec{c} = \\det(\\vec{a},\\vec{b},\\vec{c})' },
        ],
      },
      {
        title: 'Geraden & Ebenen',
        formulas: [
          { name: 'Geradengleichung', formula: '\\vec{r} = \\vec{a} + t\\cdot\\vec{u}' },
          { name: 'Ebene (Parameter)', formula: '\\vec{r} = \\vec{a} + s\\cdot\\vec{u} + t\\cdot\\vec{v}' },
          { name: 'Ebene (Normal)', formula: '\\vec{n}\\cdot(\\vec{r}-\\vec{a})=0' },
          { name: 'Ebene (Koordinaten)', formula: 'ax + by + cz = d' },
          { name: 'Abstand Punkt–Ebene', formula: 'd = \\frac{|ax_0+by_0+cz_0-d|}{\\sqrt{a^2+b^2+c^2}}' },
        ],
      },
      {
        title: 'Matrizen',
        formulas: [
          { name: 'Multiplikation (Elem.)', formula: '(AB)_{ij} = \\sum_k a_{ik}\\cdot b_{kj}' },
          { name: 'Transponierte', formula: '(A^T)_{ij} = A_{ji}' },
          { name: 'Inverse (2×2)', formula: 'A^{-1} = \\frac{1}{ad-bc}\\begin{pmatrix}d & -b \\\\ -c & a\\end{pmatrix}' },
          { name: 'Determinante (2×2)', formula: '\\det\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix} = ad - bc' },
          { name: 'Determinante (3×3)', formula: '\\text{Regel von Sarrus oder Laplace-Entwicklung}' },
        ],
      },
      {
        title: 'Eigenwerte & LGS',
        formulas: [
          { name: 'Eigenwertgleichung', formula: 'A\\vec{v} = \\lambda\\vec{v}' },
          { name: 'Charakt. Polynom', formula: '\\det(A - \\lambda I) = 0' },
          { name: 'Gauß-Algorithmus', formula: 'A|\\vec{b} \\xrightarrow{\\text{ZSF}} \\text{Lösung}' },
          { name: 'Rang', formula: '\\text{rg}(A) = \\text{Anzahl Pivotelemente}' },
          { name: 'Lösbarkeit', formula: '\\text{rg}(A) = \\text{rg}(A|b) \\Rightarrow \\text{lösbar}' },
        ],
      },
    ],
  },
  {
    id: 'stochastik',
    label: 'Stochastik',
    icon: '🎲',
    sections: [
      {
        title: 'Grundlagen',
        formulas: [
          { name: 'Laplace-Wahrscheinl.', formula: 'P(A) = \\frac{|A|}{|\\Omega|}' },
          { name: 'Komplementärereignis', formula: 'P(\\bar{A}) = 1 - P(A)' },
          { name: 'Additionssatz', formula: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)' },
          { name: 'Bedingte Wahrscheinl.', formula: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)}' },
          { name: 'Multiplikationssatz', formula: 'P(A \\cap B) = P(A) \\cdot P(B|A)' },
          { name: 'Satz von Bayes', formula: 'P(A|B) = \\frac{P(B|A)\\cdot P(A)}{P(B)}' },
        ],
      },
      {
        title: 'Kombinatorik',
        formulas: [
          { name: 'Fakultät', formula: 'n! = 1 \\cdot 2 \\cdot 3 \\cdots n' },
          { name: 'Permutationen', formula: 'n!' },
          { name: 'Variation ohne Zurücklegen', formula: '\\frac{n!}{(n-k)!}' },
          { name: 'Kombination ohne Zurücklegen', formula: '\\binom{n}{k} = \\frac{n!}{k!(n-k)!}' },
          { name: 'Variation mit Zurücklegen', formula: 'n^k' },
          { name: 'Komb. mit Zurücklegen', formula: '\\binom{n+k-1}{k}' },
        ],
      },
      {
        title: 'Verteilungen',
        formulas: [
          { name: 'Binomialverteilung', formula: 'P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}' },
          { name: 'Erwartungswert (Binom.)', formula: 'E(X) = n \\cdot p' },
          { name: 'Varianz (Binom.)', formula: 'Var(X) = n \\cdot p \\cdot (1-p)' },
          { name: 'Normalverteilung (Dichte)', formula: 'f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}' },
          { name: '68-95-99,7-Regel', formula: 'P(\\mu-\\sigma \\le X \\le \\mu+\\sigma) \\approx 68{,}3\\%' },
        ],
      },
      {
        title: 'Hypothesentests',
        formulas: [
          { name: 'Nullhypothese', formula: 'H_0: p = p_0 \\quad \\text{(z.B. Anteil)}' },
          { name: 'Ablehnungsbereich', formula: 'P(X \\in \\bar{A}) \\le \\alpha', note: 'α = Signifikanzniveau' },
          { name: 'Fehler 1. Art', formula: '\\alpha = P(\\text{Ablehnung}\\,|\\,H_0\\text{ wahr})' },
          { name: 'Fehler 2. Art', formula: '\\beta = P(\\text{Annahme}\\,|\\,H_0\\text{ falsch})' },
        ],
      },
    ],
  },
  {
    id: 'komplex',
    label: 'Komplexe Zahlen',
    icon: 'ℂ',
    sections: [
      {
        title: 'Darstellungsformen',
        formulas: [
          { name: 'Kartesisch', formula: 'z = a + bi' },
          { name: 'Polarform', formula: 'z = r(\\cos\\varphi + i\\sin\\varphi)' },
          { name: 'Exponentialform', formula: 'z = r \\cdot e^{i\\varphi}' },
          { name: 'Betrag', formula: '|z| = r = \\sqrt{a^2 + b^2}' },
          { name: 'Argument', formula: '\\varphi = \\arg(z) = \\arctan\\frac{b}{a}' },
          { name: 'Konjugiert', formula: '\\bar{z} = a - bi' },
        ],
      },
      {
        title: 'Rechenregeln',
        formulas: [
          { name: 'Multiplikation (polar)', formula: 'z_1 \\cdot z_2 = r_1 r_2 \\cdot e^{i(\\varphi_1+\\varphi_2)}' },
          { name: 'Division (polar)', formula: '\\frac{z_1}{z_2} = \\frac{r_1}{r_2} \\cdot e^{i(\\varphi_1-\\varphi_2)}' },
          { name: 'Euler-Formel', formula: 'e^{i\\varphi} = \\cos\\varphi + i\\sin\\varphi' },
          { name: 'Moivre', formula: '(r e^{i\\varphi})^n = r^n e^{in\\varphi}' },
          { name: 'n-te Wurzeln', formula: 'w_k = \\sqrt[n]{r}\\cdot e^{i\\frac{\\varphi + 2k\\pi}{n}}' },
        ],
      },
    ],
  },
];

export const Formelsammlung: React.FC = () => {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [search, setSearch] = useState('');

  const cat = CATEGORIES.find(c => c.id === activeCat)!;

  const filteredSections = search.trim()
    ? cat.sections
        .map(s => ({
          ...s,
          formulas: s.formulas.filter(
            f =>
              f.name.toLowerCase().includes(search.toLowerCase()) ||
              f.formula.toLowerCase().includes(search.toLowerCase()) ||
              (f.note && f.note.toLowerCase().includes(search.toLowerCase())),
          ),
        }))
        .filter(s => s.formulas.length > 0)
    : cat.sections;

  return (
    <>
      <section className="explanation" style={{ animationDelay: '.05s' }}>
        <h2>Formelsammlung</h2>
        <p>
          Alle wichtigen Formeln auf einen Blick — sortiert nach Themengebiet.
          Wähle eine Kategorie und nutze die Suche, um schnell die richtige Formel zu finden.
        </p>
      </section>

      {/* Category Tabs */}
      <div className="fs-tabs" style={{ animationDelay: '.1s' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`tab-btn${activeCat === c.id ? ' active' : ''}`}
            onClick={() => setActiveCat(c.id)}
          >
            <span className="fs-tab-icon">{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="fs-search" style={{ animationDelay: '.15s' }}>
        <input
          type="text"
          placeholder="Formel suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="fs-search-input"
        />
        {search && (
          <button className="fs-search-clear" onClick={() => setSearch('')}>
            ✕
          </button>
        )}
      </div>

      {/* Formula Cards */}
      {filteredSections.length === 0 && (
        <div className="fs-empty">Keine Formeln gefunden für „{search}"</div>
      )}

      {filteredSections.map((section, si) => (
        <section
          key={section.title}
          className="fs-section"
          style={{ animationDelay: `${0.2 + si * 0.06}s` }}
        >
          <h3 className="fs-section-title">{section.title}</h3>
          <div className="fs-grid">
            {section.formulas.map((f, fi) => (
              <div key={fi} className="fs-card">
                <div className="fs-card-name">{f.name}</div>
                <div className="fs-card-formula">
                  <M display>{f.formula}</M>
                </div>
                {f.note && <div className="fs-card-note">{f.note}</div>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
};
