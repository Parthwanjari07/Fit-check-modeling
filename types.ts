/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type ModelProvider = 'gemini' | 'fal';

export type AppMode = 'try-on' | 'mockups';

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
  provider: ModelProvider;
}

export interface MockupItem {
  id: string;
  name: string;
  thumbnailUrl: string;
  description: string; // The prompt description for the AI
}

export interface GeneratedMockup {
  id: string;
  name: string;
  url: string;
}