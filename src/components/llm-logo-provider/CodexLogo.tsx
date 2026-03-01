import React from 'react';

type CodexLogoProps = {
  className?: string;
};

const CodexLogo = ({ className = 'w-5 h-5' }: CodexLogoProps) => {
  return (
    <img
      src="/icons/codex-white.svg"
      alt="Codex"
      className={className}
    />
  );
};

export default CodexLogo;
