/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { GeneratedMockup } from '../types';
import { Trash2Icon } from './icons';

interface MockupHistoryPanelProps {
  history: GeneratedMockup[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClear: () => void;
}

const MockupHistoryPanel: React.FC<MockupHistoryPanelProps> = ({ history, currentIndex, onSelect, onClear }) => {
  if (history.length <= 1) {
    return null; // Don't show the panel if only the original logo is present
  }

  return (
    <div className="pt-6 border-t border-gray-400/50 dark:border-gray-500/50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-serif tracking-wider text-gray-800 dark:text-gray-200">Generated Mockups</h2>
        <button
          onClick={onClear}
          className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          aria-label="Clear mockup history"
        >
          <Trash2Icon className="w-4 h-4 mr-1" />
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {history.map((mockup, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={mockup.id}
              onClick={() => onSelect(index)}
              className={`w-full flex items-center p-2 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-gray-200/80 dark:bg-gray-700/80 ring-2 ring-gray-800 dark:ring-gray-300'
                  : 'bg-white/50 dark:bg-gray-800/50 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
              }`}
            >
              <img
                src={mockup.url}
                alt={`Mockup of ${mockup.name}`}
                className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0"
              />
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-left truncate">
                {mockup.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MockupHistoryPanel;