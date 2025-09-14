/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ModelProvider } from '../types';

interface ModelProviderSelectorProps {
  selectedProvider: ModelProvider;
  onProviderChange: (provider: ModelProvider) => void;
  disabled?: boolean;
}

const ModelProviderSelector: React.FC<ModelProviderSelectorProps> = ({ selectedProvider, onProviderChange, disabled }) => {
  const options: { id: ModelProvider; name: string; }[] = [
    { id: 'gemini', name: 'Gemini' },
    { id: 'fal', name: 'Fal.ai' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-center p-1 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onProviderChange(option.id)}
            disabled={disabled}
            className={`w-full px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 ${
              selectedProvider === option.id
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-800/50'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelProviderSelector;
