import React from 'react';

interface FormattedJobDescriptionProps {
  text?: string | null;
  className?: string;
}

/** Renders inline **bold** segments safely without HTML injection. */
const renderInlineBold = (line: string) => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
};

/**
 * Formats plain or markdown-lite job descriptions (e.g. **Responsibilities:** and `- item` bullets)
 * into clean headings, bullet lists, and readable paragraphs.
 */
const FormattedJobDescription: React.FC<FormattedJobDescriptionProps> = ({ text, className = '' }) => {
  const lines = String(text || '').split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (keyPrefix: string) => {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={`${keyPrefix}-ul`} className="list-disc pl-5 space-y-1.5 text-gray-700">
        {bulletBuffer.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInlineBold(item)}
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushBullets(`empty-${index}`);
      return;
    }

    const bulletMatch = trimmed.match(/^(?:[-•*]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
      return;
    }

    flushBullets(`line-${index}`);

    const isStandaloneHeading =
      (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) ||
      (/^[A-Za-z][A-Za-z\s/&()-]{1,40}:$/.test(trimmed));

    if (isStandaloneHeading) {
      const headingText = trimmed.startsWith('**') && trimmed.endsWith('**')
        ? trimmed.slice(2, -2)
        : trimmed;
      blocks.push(
        <h5 key={`h-${index}`} className="pt-2 font-bold text-gray-900 text-[15px]">
          {headingText}
        </h5>
      );
      return;
    }

    blocks.push(
      <p key={`p-${index}`} className="text-gray-700 leading-relaxed">
        {renderInlineBold(trimmed)}
      </p>
    );
  });

  flushBullets('end');

  return <div className={`space-y-2.5 text-sm break-words ${className}`}>{blocks}</div>;
};

export default FormattedJobDescription;

