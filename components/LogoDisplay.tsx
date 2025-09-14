/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface LogoDisplayProps {
  logoUrl: string | null;
}

const LogoDisplay: React.FC<LogoDisplayProps> = ({ logoUrl }) => {
  if (!logoUrl) return null;

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 dark:text-gray-200 border-b border-gray-400/50 dark:border-gray-500/50 pb-2 mb-3">Your Logo</h2>
      <div className="flex items-center justify-center bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200/80 dark:border-gray-700/80">
        <img
          src={logoUrl}
          alt="User's uploaded logo"
          className="max-w-full max-h-24 object-contain"
        />
      </div>
    </div>
  );
};

export default LogoDisplay;
