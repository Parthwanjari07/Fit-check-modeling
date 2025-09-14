/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import { generateVirtualTryOnImage as generateWithGemini, generatePoseVariation, generateMockupImage } from './services/geminiService';
import { generateVirtualTryOnImage_Fal as generateWithFal } from './services/falService';
import { OutfitLayer, WardrobeItem, ModelProvider, AppMode, MockupItem, GeneratedMockup } from './types';
import { ChevronDownIcon, ChevronUpIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';
import MockupItemsPanel from './components/MockupItemsPanel';
import { defaultMockupItems } from './mockupItems';
import LogoDisplay from './components/LogoDisplay';
import MockupHistoryPanel from './components/MockupHistoryPanel';

const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  // Common State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [theme, setTheme] = useState<Theme>('light');

  // App Mode State
  const [appMode, setAppMode] = useState<AppMode | null>(null);

  // Try-On Mode State
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [modelProvider, setModelProvider] = useState<ModelProvider>('gemini');

  // Mockup Mode State
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [mockupHistory, setMockupHistory] = useState<GeneratedMockup[]>([]);
  const [currentMockupIndex, setCurrentMockupIndex] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleStartImageFinalized = (url: string, file: File, mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'try-on') {
      setModelImageUrl(url);
      setOutfitHistory([{
        garment: null,
        poseImages: { [POSE_INSTRUCTIONS[0]]: url },
        provider: 'gemini',
      }]);
      setCurrentOutfitIndex(0);
    } else { // mockup mode
      setLogoImageUrl(url);
      setLogoFile(file);
      const initialMockup: GeneratedMockup = { id: `logo-${Date.now()}`, name: 'Original Logo', url };
      setMockupHistory([initialMockup]);
      setCurrentMockupIndex(0);
    }
  };

  const handleStartOver = () => {
    // Reset all state
    setAppMode(null);
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(false);
    setWardrobe(defaultWardrobe);
    setLogoImageUrl(null);
    setMockupHistory([]);
    setCurrentMockupIndex(0);
    setLogoFile(null);
  };
  
  // --- Try-On Logic ---

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const tryOnDisplayUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);
  
  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!tryOnDisplayUrl || isLoading) return;

    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0);
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Adding ${garmentInfo.name} with ${modelProvider === 'gemini' ? 'Gemini' : 'Fal.ai'}...`);

    try {
      let newImageUrl: string;
      if (modelProvider === 'gemini') {
        newImageUrl = await generateWithGemini(tryOnDisplayUrl, garmentFile);
      } else {
        newImageUrl = await generateWithFal(tryOnDisplayUrl, garmentFile);
      }
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl },
        provider: modelProvider,
      };

      setOutfitHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, currentOutfitIndex + 1);
        return [...newHistory, newLayer];
      });
      setCurrentOutfitIndex(prev => prev + 1);
      
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) {
            return prev;
        }
        return [...prev, garmentInfo];
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, `Failed to apply garment with ${modelProvider === 'gemini' ? 'Gemini' : 'Fal.ai'}`));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [tryOnDisplayUrl, isLoading, currentPoseIndex, outfitHistory, currentOutfitIndex, modelProvider]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0);
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (!currentLayer) {
      console.error("handlePoseSelect: currentLayer is undefined at index", currentOutfitIndex);
      setError("An unexpected error occurred while changing pose. Please try again.");
      return;
    }

    if (currentLayer.provider !== 'gemini') {
        setError("Pose variations are only available for items generated with Gemini.");
        return;
    }

    if (currentLayer.poseImages[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) {
      console.error("handlePoseSelect: No base image found in the current layer to generate a new pose.");
      setError("An unexpected error occurred while changing pose. Please try again.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Changing pose...`);
    
    const prevPoseIndex = currentPoseIndex;
    setCurrentPoseIndex(newIndex);

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = newHistory[currentOutfitIndex];
        if (updatedLayer) {
          updatedLayer.poseImages[poseInstruction] = newImageUrl;
        } else {
            console.error("setOutfitHistory in handlePoseSelect: updatedLayer is undefined at index", currentOutfitIndex);
        }
        return newHistory;
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to change pose'));
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex]);

  // --- Mockup Logic ---
  const handleMockupItemSelect = useCallback(async (item: MockupItem) => {
    if (!logoFile || isLoading) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Creating mockup for ${item.name}...`);
    
    try {
      const newImageUrl = await generateMockupImage(logoFile, item.description);
      const newMockup: GeneratedMockup = {
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        url: newImageUrl,
      };
      setMockupHistory(prev => [...prev, newMockup]);
      setCurrentMockupIndex(mockupHistory.length); // new length is the index of the new item
    } catch (err) {
      setError(getFriendlyErrorMessage(err, `Failed to create mockup for ${item.name}`));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [logoFile, isLoading, mockupHistory.length]);

  const handleSelectMockupFromHistory = (index: number) => {
    if (isLoading) return;
    setCurrentMockupIndex(index);
  };
  
  const handleClearMockupHistory = () => {
    if (mockupHistory.length > 1) {
      setMockupHistory(prev => [prev[0]]); // Keep only the original logo
      setCurrentMockupIndex(0);
    }
  };

  // --- Common Logic & Rendering ---

  const displayImageUrl = useMemo(() => {
    if (appMode === 'try-on') return tryOnDisplayUrl;
    if (appMode === 'mockups') return mockupHistory[currentMockupIndex]?.url ?? null;
    return null;
  }, [appMode, tryOnDisplayUrl, mockupHistory, currentMockupIndex]);

  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="font-sans bg-white dark:bg-gray-950 transition-colors duration-300">
      <AnimatePresence mode="wait">
        {!appMode ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onStartImageFinalized={handleStartImageFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white dark:bg-gray-900 pb-16 relative">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                  provider={appMode === 'try-on' ? outfitHistory[currentOutfitIndex]?.provider : undefined}
                  appMode={appMode}
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60 dark:border-gray-700/60 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50 dark:bg-gray-800/50"
                    aria-label={isSheetCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />}
                  </button>
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 p-4 mb-4 rounded-md" role="alert">
                        <p className="font-bold text-red-800 dark:text-red-200">Error</p>
                        <p>{error}</p>
                      </div>
                    )}
                    {appMode === 'try-on' ? (
                      <>
                        <OutfitStack 
                          outfitHistory={activeOutfitLayers}
                          onRemoveLastGarment={handleRemoveLastGarment}
                        />
                        <WardrobePanel
                          onGarmentSelect={handleGarmentSelect}
                          activeGarmentIds={activeGarmentIds}
                          isLoading={isLoading}
                          wardrobe={wardrobe}
                          modelProvider={modelProvider}
                          onProviderChange={setModelProvider}
                        />
                      </>
                    ) : (
                      <>
                        <LogoDisplay logoUrl={logoImageUrl} />
                        <MockupHistoryPanel
                          history={mockupHistory}
                          currentIndex={currentMockupIndex}
                          onSelect={handleSelectMockupFromHistory}
                          onClear={handleClearMockupHistory}
                        />
                        <MockupItemsPanel
                          items={defaultMockupItems}
                          onSelect={handleMockupItemSelect}
                          isLoading={isLoading}
                        />
                      </>
                    )}
                  </div>
              </aside>
            </main>
            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-serif text-gray-700 dark:text-gray-300 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!appMode} theme={theme} toggleTheme={toggleTheme} />
    </div>
  );
};

export default App;