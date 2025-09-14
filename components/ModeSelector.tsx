/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { AppMode } from '../types';
import { ShirtIcon } from './icons'; // Assuming an icon for mockups

const PaintBrushIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
    </svg>
);


interface ModeSelectorProps {
  selectedMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, onModeChange, disabled }) => {
  const options: { id: AppMode; name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'try-on', name: 'Virtual Try-on', icon: ShirtIcon },
    { id: 'mockups', name: 'Create Mockups', icon: PaintBrushIcon },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-center p-1 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onModeChange(option.id)}
            disabled={disabled}
            className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 flex items-center justify-center gap-2 ${
              selectedMode === option.id
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800/50'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <option.icon className="w-4 h-4" />
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
