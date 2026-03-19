import React, { useMemo } from 'react';
import katex from 'katex';

interface MathProps {
  /** LaTeX expression */
  children: string;
  /** Display mode (block) vs inline */
  display?: boolean;
}

export const Math: React.FC<MathProps> = ({ children, display = false }) => {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: display, throwOnError: false }),
    [children, display],
  );

  return display
    ? <div className="formula" dangerouslySetInnerHTML={{ __html: html }} />
    : <span className="formula" dangerouslySetInnerHTML={{ __html: html }} />;
};
