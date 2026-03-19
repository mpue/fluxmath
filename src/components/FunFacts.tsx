import React, { useState, useEffect } from 'react';

const facts = [
  'Pi (π) ist eine transzendente Zahl — sie ist keine Lösung einer Polynomgleichung.',
  'Eine Googol ist eine 1 mit 100 Nullen — größer als die Anzahl aller Atome im Universum.',
  'Die Fibonacci-Folge taucht überall auf: in Blütenblättern, Muscheln und Galaxien.',
  'Euler\'s Identität e^{iπ} + 1 = 0 verbindet die fünf wichtigsten Konstanten der Mathematik.',
  '0! = 1 — die leere Produktregel macht das Rechnen mit Kombinatorik konsistent.',
  'Das Möbiusband hat nur eine Seite und eine Kante.',
  'Es gibt unendlich viele Primzahlen — Euklid hat das schon ~300 v. Chr. bewiesen.',
  'Die Normalverteilung heißt auch „Glockenkurve" — sie beschreibt fast alles im Alltag.',
  'Das Wort „Algebra" kommt vom arabischen al-ǧabr (الجبر) — „das Einrenken".',
  'Jede gerade Zahl > 2 ist (vermutlich) die Summe zweier Primzahlen — Goldbachs Vermutung.',
  'Der Satz des Pythagoras hat über 370 verschiedene Beweise.',
  'Die Zahl 1089 × 9 = 9801 — sie ist ihr eigenes Spiegelbild mal 9.',
  '111111111 × 111111111 = 12345678987654321.',
  'Ein Kartenspiel mit 52 Karten hat mehr mögliche Reihenfolgen als es Atome auf der Erde gibt.',
  'Die Mandelbrot-Menge erzeugt aus einer simplen Formel unendliche Komplexität.',
];

export const FunFacts: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % facts.length);
        setVisible(true);
      }, 600);
    }, 5000);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="funfact-bar">
      <span className={`funfact-text ${visible ? 'funfact-visible' : 'funfact-hidden'}`}>
        💡 {facts[index]}
      </span>
    </div>
  );
};
