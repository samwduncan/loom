import React from 'react';

type CursorLogoProps = {
  className?: string;
};

const CursorLogo = ({ className = 'w-5 h-5' }: CursorLogoProps) => {
  return (
    <img
      src="/icons/cursor-white.svg"
      alt="Cursor"
      className={className}
    />
  );
};

export default CursorLogo;
