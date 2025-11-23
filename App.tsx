import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultsGallery } from './components/ResultsGallery';
import { generateTryOnView, generateStylistOpinion, generateRunwayVideo } from './services/geminiService';
import { ViewType, GeneratedImage, GenerationState, Language, AppState, ImageQuality, GarmentState } from './types';
import { translations } from './translations';
import { useHistory } from './hooks/useHistory';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

function App() {
  // Initialize as true to allow immediate access for testing without blocking
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(false);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
      } catch (e) {
        console.error("Error selecting key", e);
      }
      // Assume success to handle race condition
      setHasKey(true);
    }
  };

  const [lang, setLang] = useState<Language>('en');
  
  // Initialize history with default state
  const { state, set: setState, undo, redo, canUndo, canRedo } = useHistory<AppState>({
    person: { file: null, previewUrl: null, description: '', height: '', weight: '' },
    garments: [{ id: '1', file: null, previewUrl: null, description: '' }],
    selectedViews: [ViewType.FRONT, ViewType.SIDE],
    quality: 'standard',
    customPrompt: ''
  });

  // Local state for descriptions to handle typing without spamming history
  const [tempPersonDesc, setTempPersonDesc] = useState(state.person.description);
  const [tempHeight, setTempHeight] = useState(state.person.height || '');
  const [tempWeight, setTempWeight] = useState(state.person.weight || '');
  const [tempCustomPrompt, setTempCustomPrompt] = useState(state.customPrompt);
  
  // We need to sync temp garments desc with state
  const [tempGarments, setTempGarments] = useState<GarmentState[]>(state.garments);
  
  // State to hold the calculated size ONLY after generation
  const [resultSize, setResultSize] = useState<string | null>(null);

  // Sync local temp state when history state changes (e.g. via Undo/Redo)
  useEffect(() => {
    setTempPersonDesc(state.person.description);
    setTempHeight(state.person.height || '');
    setTempWeight(state.person.weight || '');
    setTempCustomPrompt(state.customPrompt);
  }, [state.person.description, state.person.height, state.person.weight, state.customPrompt]);

  useEffect(() => {
    setTempGarments(state.garments);
  }, [state.garments]);

  const [results, setResults] = useState<GeneratedImage[]>([]);
  
  const [genState, setGenState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    error: null
  });
  
  const t = translations[lang];

  // Helper to calculate size based on weight and height
  const calculateSize = (weightStr: string, heightStr: string): string => {
    const weight = parseFloat(weightStr);
    const height = parseFloat(heightStr);
    
    if (isNaN(weight)) return '';

    // Base scoring based on weight
    let score = 0;
    if (weight < 50) score = 0;      // XS
    else if (weight < 60) score = 1; // S
    else if (weight < 70) score = 2; // M
    else if (weight < 80) score = 3; // L
    else if (weight < 95) score = 4; // XL
    else score = 5;             // XXL

    // Adjust for height (Basic heuristic: Taller people distribution spreads weight more, 
    // but also requires length. Often taller = larger size for length).
    if (!isNaN(height)) {
        if (height > 185) score = Math.min(score + 1, 5);
        if (height < 155) score = Math.max(score - 1, 0);
    }
    
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    return sizes[score];
  };
  
  // Update history only when inputs are blurred/committed
  const commitPersonStats = () => {
     if (tempPersonDesc !== state.person.description || tempHeight !== state.person.height || tempWeight !== state.person.weight) {
      setState(prev => ({
        ...prev,
        person: { 
            ...prev.person, 
            description: tempPersonDesc,
            height: tempHeight,
            weight: tempWeight
        }
      }));
    }
  };

  const commitCustomPrompt = () => {
    if (tempCustomPrompt !== state.customPrompt) {
        setState(prev => ({
            ...prev,
            customPrompt: tempCustomPrompt
        }));
    }
  };

  const updateGarmentDesc = (id: string, desc: string) => {
    setTempGarments(prev => prev.map(g => g.id === id ? { ...g, description: desc } : g));
  };

  const commitGarmentDesc = () => {
    // Only update history if something actually changed
    const hasChanges = tempGarments.some((tempG, i) => {
        const stateG = state.garments[i];
        return stateG && tempG.description !== stateG.description;
    });

    if (hasChanges) {
        setState(prev => ({
            ...prev,
            garments: tempGarments
        }));
    }
  };

  const handlePersonFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      person: { ...prev.person, file, previewUrl: url }
    }));
  }, [setState]);

  const handleGarmentFile = useCallback((file: File, id: string) => {
    const url = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      garments: prev.garments.map(g => g.id === id ? { ...g, file, previewUrl: url } : g)
    }));
  }, [setState]);

  const removeGarment = useCallback((id: string) => {
    setState(prev => {
        // Don't remove the last one, just clear it
        if (prev.garments.length <= 1) {
            return {
                ...prev,
                garments: [{ id: prev.garments[0].id, file: null, previewUrl: null, description: '' }]
            };
        }
        return {
            ...prev,
            garments: prev.garments.filter(g => g.id !== id)
        };
    });
  }, [setState]);

  const addGarment = useCallback(() => {
    setState(prev => ({
        ...prev,
        garments: [...prev.garments, { id: crypto.randomUUID(), file: null, previewUrl: null, description: '' }]
    }));
  }, [setState]);

  const toggleView = (view: ViewType) => {
    setState(prev => {
      const currentViews = prev.selectedViews;
      const newViews = currentViews.includes(view) 
        ? currentViews.filter(v => v !== view) 
        : [...currentViews, view];
      return { ...prev, selectedViews: newViews };
    });
  };
  
  const setQuality = (quality: ImageQuality) => {
    setState(prev => ({ ...prev, quality }));
  };

  const handleClearPerson = useCallback((file: File) => {
    if (window.confirm("Clear person details?")) {
        setState(prev => ({
            ...prev,
            person: { file: null, previewUrl: null, description: '', height: '', weight: '' }
        }));
        setResultSize(null);
    }
  }, [setState]);

  const handleClearGarments = useCallback(() => {
    if (window.confirm("Clear all garments?")) {
        setState(prev => ({
            ...prev,
            garments: [{ id: crypto.randomUUID(), file: null, previewUrl: null, description: '' }]
        }));
    }
  }, [setState]);

  const handleClearAll = useCallback(() => {
    if (window.confirm("Are you sure you want to reset everything?")) {
      setState({
        person: { file: null, previewUrl: null, description: '', height: '', weight: '' },
        garments: [{ id: crypto.randomUUID(), file: null, previewUrl: null, description: '' }],
        selectedViews: [ViewType.FRONT, ViewType.SIDE],
        quality: 'standard',
        customPrompt: ''
      });
      setResults([]);
      setResultSize(null);
      setGenState({ isGenerating: false, progress: 0, error: null });
    }
  }, [setState]);

  const handleGenerateVideo = async (id: string, imageUrl: string) => {
     // Mark as generating
     setResults(prev => prev.map(img => img.id === id ? { ...img, isVideoGenerating: true } : img));

     try {
       // Extract Base64 from Data URL (remove "data:image/png;base64,")
       const base64Data = imageUrl.split(',')[1];
       if (!base64Data) throw new Error("Invalid image data");

       const videoUrl = await generateRunwayVideo(base64Data);
       
       setResults(prev => prev.map(img => img.id === id ? { 
           ...img, 
           videoUrl, 
           isVideoGenerating: false 
       } : img));

     } catch (e: any) {
        console.error("Video generation failed", e);
        // Reset generating state and show basic error alert (could be improved)
        setResults(prev => prev.map(img => img.id === id ? { ...img, isVideoGenerating: false } : img));
        
        let errorMessage = e.message || "Failed to generate video";
        if (errorMessage.includes('permission') || errorMessage.includes('key')) {
             setHasKey(false);
             if (window.aistudio) {
                window.aistudio.openSelectKey().then(() => setHasKey(true));
             }
        } else {
             alert(`Video generation failed: ${errorMessage}`);
        }
     }
  };

  const handleGenerate = async () => {
    // Validation
    const hasPerson = !!state.person.file;
    const validGarments = tempGarments.filter(g => !!g.file);
    const hasGarments = validGarments.length > 0;

    if (!hasPerson || !hasGarments) {
      setGenState(prev => ({ ...prev, error: t.config.errors.missingFiles }));
      return;
    }
    
    // Check missing descriptions for uploaded garments
    const missingDesc = validGarments.some(g => !g.description.trim());
    if (missingDesc) {
      setGenState(prev => ({ ...prev, error: t.config.errors.missingDesc }));
      return;
    }
    
    if (state.selectedViews.length === 0) {
      setGenState(prev => ({ ...prev, error: t.config.errors.missingView }));
      return;
    }

    setGenState({ isGenerating: true, progress: 0, error: null });
    setResults([]); 
    
    // Set Size Recommendation based on inputs at the time of generation (Weight + Height)
    const calculatedSize = calculateSize(tempWeight, tempHeight);
    setResultSize(calculatedSize || null);

    try {
      let completedCount = 0;
      const totalTasks = state.selectedViews.length;

      // Construct rich person description including stats
      let finalPersonDesc = tempPersonDesc;
      const size = calculatedSize;
      if (tempHeight || tempWeight) {
         const stats = [];
         if (tempHeight) stats.push(`Height: ${tempHeight}cm`);
         if (tempWeight) stats.push(`Weight: ${tempWeight}kg`);
         if (size) stats.push(`Approximate Size: ${size}`);
         
         finalPersonDesc = `${finalPersonDesc ? finalPersonDesc + '\n' : ''}Model Physical Stats: ${stats.join(', ')}.`;
      }
      
      // Fallback if description is empty
      if (!finalPersonDesc.trim()) {
          finalPersonDesc = "A photo of a person acting as a fashion model.";
      }

      // 1. Trigger Stylist Opinion Generation (Parallel with images)
      // We only need one opinion per outfit configuration, not per view.
      const stylistOpinionPromise = generateStylistOpinion(state.person.file!, validGarments, lang);

      // 2. Trigger Image Generations
      const imagePromises = state.selectedViews.map(async (view) => {
        try {
          const base64Image = await generateTryOnView(
            state.person.file!,
            finalPersonDesc,
            validGarments,
            view,
            state.quality,
            state.customPrompt
          );
          return { view, url: base64Image };
        } catch (e: any) {
           console.error(`Failed to generate ${view}`, e);
           // If permission error, rethrow to stop everything
           if (e.message && (e.message.includes('403') || e.message.includes('permission') || e.message.includes('not found'))) {
             throw e;
           }
           return null;
        } finally {
           completedCount++;
           setGenState(prev => ({ 
            ...prev, 
            progress: Math.round((completedCount / totalTasks) * 100)
           }));
        }
      });

      // Wait for everything
      const [opinion, ...generatedImagesData] = await Promise.all([stylistOpinionPromise, ...imagePromises]);

      // Process results
      const validImages: GeneratedImage[] = [];
      
      generatedImagesData.forEach(imgData => {
         if (imgData) {
            validImages.push({
                id: crypto.randomUUID(),
                url: imgData.url,
                prompt: `Generating ${imgData.view}...`,
                viewType: imgData.view,
                timestamp: Date.now(),
                expertOpinion: opinion // Attach the single opinion to all images in this batch
            });
         }
      });

      setResults(prev => [...prev, ...validImages]);

    } catch (e: any) {
      let errorMessage = e.message || t.config.errors.unexpected;

      // Handle Permission Denied (403) specifically
      if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('permission') || errorMessage.includes('Requested entity was not found')) {
          setHasKey(false); // Show landing page
          // Trigger selection again immediately
          if (window.aistudio) {
            window.aistudio.openSelectKey().then(() => setHasKey(true));
          }
          return;
      }

      setGenState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setGenState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `virtual-stitch-${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isCheckingKey) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
           <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-6 transform -rotate-3">
              <span className="text-white font-bold text-4xl">V</span>
           </div>
           <h1 className="text-2xl font-bold text-slate-900 mb-2">VirtualStitch AI</h1>
           <p className="text-slate-500 mb-8">Professional Virtual Try-On powered by Gemini.</p>
           
           <div className="bg-indigo-50 rounded-xl p-5 mb-8 text-left border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 text-sm mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-600">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                </svg>
                Access Required
              </h3>
              <p className="text-xs text-indigo-800 leading-relaxed mb-3">
                To use the Gemini API, you must select an API key.
              </p>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
              >
                Learn about billing
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M5 10a.75.75 0 0 1 .75-.75h6.638L10.23 7.29a.75.75 0 1 1 1.04-1.08l3.5 3.25a.75.75 0 0 1 0 1.08l-3.5 3.25a.75.75 0 1 1-1.04-1.08l2.158-1.96H5.75A.75.75 0 0 1 5 10Z" clipRule="evenodd" />
                </svg>
              </a>
           </div>

           <button
             onClick={handleConnectKey}
             className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
           >
             Select API Key
           </button>
           <p className="mt-4 text-[10px] text-slate-400">
             Securely connected via Google AI Studio
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              V
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              {t.header.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Undo/Redo Controls */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                title={t.header.undo}
                className={`p-1.5 rounded-md transition-all ${
                  canUndo ? 'text-slate-700 hover:bg-white hover:shadow-sm' : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <button
                onClick={redo}
                disabled={!canRedo}
                title={t.header.redo}
                className={`p-1.5 rounded-md transition-all ${
                  canRedo ? 'text-slate-700 hover:bg-white hover:shadow-sm' : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                </svg>
              </button>
            </div>

            {/* Clear All Button */}
            <button 
              onClick={handleClearAll}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-2 border border-transparent hover:border-red-100"
              title={t.header.clearAll}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <span className="hidden sm:inline">{t.header.clearAll}</span>
            </button>

            <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
              <span>{t.header.poweredBy}</span>
            </div>
            
            {/* Language Switcher */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              {(['en', 'es', 'pt'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all uppercase ${
                    lang === l 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs border border-slate-300">1</span>
                    {t.upload.step1}
                </h2>
                <button 
                    onClick={() => handleClearPerson({} as any)}
                    className="text-xs text-slate-400 hover:text-red-500 underline"
                >
                    {t.upload.clearPerson}
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Person Input */}
                <div className="space-y-3">
                  <ImageUploader 
                    id="person-input"
                    label={t.upload.personLabel} 
                    subLabel={t.upload.personSubLabel}
                    previewUrl={state.person.previewUrl}
                    onFileSelect={handlePersonFile}
                    onClear={() => handlePersonFile({} as any)} 
                    texts={{
                        dragDrop: t.upload.dragDrop,
                        fileType: t.upload.fileType,
                        remove: t.upload.remove
                    }}
                  />
                  
                  {/* Height / Weight Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="person-height" className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">{t.upload.heightLabel}</label>
                        <input
                            id="person-height"
                            type="number"
                            value={tempHeight}
                            onChange={(e) => setTempHeight(e.target.value)}
                            onBlur={commitPersonStats}
                            placeholder="170"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="person-weight" className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">{t.upload.weightLabel}</label>
                        <input
                            id="person-weight"
                            type="number"
                            value={tempWeight}
                            onChange={(e) => setTempWeight(e.target.value)}
                            onBlur={commitPersonStats}
                            placeholder="65"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                    </div>
                  </div>

                  <div>
                     <label htmlFor="person-desc" className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">{t.upload.personDescLabel}</label>
                     <textarea
                        id="person-desc"
                        value={tempPersonDesc}
                        onChange={(e) => setTempPersonDesc(e.target.value)}
                        onBlur={commitPersonStats}
                        placeholder={t.upload.personPlaceholder}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
                     />
                  </div>
                </div>
              </div>
            </div>

            {/* Garments Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs border border-slate-300">2</span>
                        {t.upload.outfitSectionTitle}
                    </h2>
                    <button 
                        onClick={handleClearGarments}
                        className="text-xs text-slate-400 hover:text-red-500 underline"
                    >
                        {t.upload.clearGarments}
                    </button>
                </div>

                <div className="space-y-8">
                    {tempGarments.map((garment, index) => (
                        <div key={garment.id} className="relative pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="flex items-start gap-4">
                                <div className="w-1/3">
                                    <ImageUploader
                                        id={`garment-${garment.id}`}
                                        label={`${t.upload.garmentLabel} ${index + 1}`}
                                        subLabel=""
                                        previewUrl={garment.previewUrl}
                                        onFileSelect={(f) => handleGarmentFile(f, garment.id)}
                                        onClear={() => handleGarmentFile({} as any, garment.id)}
                                        texts={{
                                            dragDrop: t.upload.dragDrop,
                                            fileType: t.upload.fileType,
                                            remove: t.upload.remove
                                        }}
                                    />
                                </div>
                                <div className="flex-1 space-y-2 pt-6">
                                    <label htmlFor={`g-desc-${garment.id}`} className="block text-[10px] font-semibold uppercase text-slate-500">{t.upload.garmentDescLabel}</label>
                                    <textarea
                                        id={`g-desc-${garment.id}`}
                                        value={garment.description}
                                        onChange={(e) => updateGarmentDesc(garment.id, e.target.value)}
                                        onBlur={commitGarmentDesc}
                                        placeholder={t.upload.garmentPlaceholder}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
                                    />
                                </div>
                            </div>
                            {tempGarments.length > 1 && (
                                <button 
                                    onClick={() => removeGarment(garment.id)}
                                    className="absolute -right-2 -top-2 p-1 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full border border-slate-200 hover:border-red-200 shadow-sm transition-all"
                                    title={t.upload.remove}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                    
                    <button 
                        onClick={addGarment}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-medium text-sm hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                        {t.upload.addGarment}
                    </button>
                </div>
            </div>
          </div>

          {/* Right Column: Configuration & Actions */}
          <div className="lg:col-span-7 space-y-8">
             
             {/* Configuration Panel */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs border border-slate-300">3</span>
                        {t.config.step2}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* View Types */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">{t.config.targetViews}</label>
                        <div className="grid grid-cols-1 gap-3">
                            {Object.values(ViewType).map((view) => (
                                <button
                                    key={view}
                                    onClick={() => toggleView(view)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group ${
                                        state.selectedViews.includes(view)
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                            state.selectedViews.includes(view)
                                                ? 'bg-indigo-600 border-indigo-600'
                                                : 'border-slate-300 group-hover:border-indigo-300'
                                        }`}>
                                            {state.selectedViews.includes(view) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`text-sm font-medium ${
                                            state.selectedViews.includes(view) ? 'text-indigo-900' : 'text-slate-600'
                                        }`}>
                                            {t.config.viewTypes[view] || view}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Side Config */}
                    <div className="space-y-6">
                        {/* Quality Selection */}
                        <div>
                             <label className="block text-sm font-semibold text-slate-700 mb-3">{t.config.qualityLabel}</label>
                             <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => setQuality('standard')}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                        state.quality === 'standard' 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{t.config.qualityStandard}</span>
                                    {state.quality === 'standard' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                                </button>
                                <button 
                                    onClick={() => setQuality('high')}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                        state.quality === 'high' 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{t.config.qualityHigh}</span>
                                    {state.quality === 'high' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                                </button>
                                <button 
                                    onClick={() => setQuality('ultra')}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                        state.quality === 'ultra' 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{t.config.qualityUltra}</span>
                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded border border-indigo-200 font-bold">PRO</span>
                                    </div>
                                    {state.quality === 'ultra' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                                </button>
                             </div>
                        </div>

                        {/* Custom Prompt */}
                        <div>
                             <label htmlFor="custom-prompt" className="block text-sm font-semibold text-slate-700 mb-2">{t.config.customPromptLabel}</label>
                             <textarea
                                id="custom-prompt"
                                value={tempCustomPrompt}
                                onChange={(e) => setTempCustomPrompt(e.target.value)}
                                onBlur={commitCustomPrompt}
                                placeholder={t.config.customPromptPlaceholder}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
                             />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <button
                        onClick={handleGenerate}
                        disabled={genState.isGenerating}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 ${
                            genState.isGenerating 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-200'
                        }`}
                    >
                        {genState.isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                {t.config.generatingBtn}
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" />
                                </svg>
                                {t.config.generateBtn}
                            </>
                        )}
                    </button>
                    {genState.error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                            </svg>
                            {genState.error}
                        </div>
                    )}
                </div>
             </div>
             
             {/* Results Section */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                {/* Size Recommendation Card - Only shows after generation */}
                {resultSize && (
                  <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-indigo-900">{t.analysis.title}</p>
                            <p className="text-xs text-indigo-600">{t.analysis.subtitle}</p>
                        </div>
                     </div>
                     <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-100">
                        <span className="text-lg font-bold text-indigo-700">{resultSize}</span>
                     </div>
                  </div>
                )}

                <ResultsGallery 
                    images={results}
                    isGenerating={genState.isGenerating}
                    progress={genState.progress}
                    onDownload={handleDownload}
                    onGenerateVideo={handleGenerateVideo}
                    texts={t.gallery}
                    viewTypeLabels={t.config.viewTypes}
                />
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;