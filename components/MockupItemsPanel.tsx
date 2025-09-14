/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import type { MockupItem } from '../types';
import { CheckCircleIcon } from './icons';

interface MockupItemsPanelProps {
  items: MockupItem[];
  onSelect: (item: MockupItem) => void;
  isLoading: boolean;
  // Optional: to show which item is currently displayed
  // currentItemId?: string | null;
}

const MockupItemsPanel: React.FC<MockupItemsPanelProps> = ({ items, onSelect, isLoading }) => {
  return (
    <div className="pt-6 border-t border-gray-400/50 dark:border-gray-500/50">
        <h2 className="text-xl font-serif tracking-wider text-gray-800 dark:text-gray-200 mb-3">Select an Item</h2>
        <div className="grid grid-cols-3 gap-3">
            {items.map((item) => {
            // const isActive = currentItemId === item.id;
            return (
                <button
                key={item.id}
                onClick={() => onSelect(item)}
                disabled={isLoading}
                className="relative aspect-square border dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 dark:focus:ring-gray-300 group disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={`Create mockup for ${item.name}`}
                >
                <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                </div>
                {/* {isActive && (
                    <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                    </div>
                )} */}
                </button>
            );
            })}
        </div>
    </div>
  );
};

export default MockupItemsPanel;
