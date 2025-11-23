

import React, { useState, useEffect } from 'react';
import { GeneratedImage, ViewType } from '../types';

interface ResultsGalleryProps {
  images: GeneratedImage[];
  isGenerating: boolean;
  progress?: number;
  onDownload: (url: string, id: string) => void;
  onGenerateVideo?: (id: string, imageUrl: string) => void; // Optional for compatibility
  texts: {
    emptyTitle: string;
    emptyDesc: string;
    title: string;
    items: string;
    designing: string;
    stitching: string;
    close: string;
    download: string;
    zoomIn: string;
    zoomOut: string;
    reset: string;
    stylistTitle: string;
    stylistRole: string;
    animate: string;
    generatingVideo: string;
    playVideo: string;
  };
  viewTypeLabels: Record<string, string>;
}

export const ResultsGallery: React.FC<ResultsGalleryProps> = ({ 
  images, 
  isGenerating, 
  progress, 
  onDownload, 
  onGenerateVideo,
  texts, 
  viewTypeLabels 
}) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [zoom, setZoom] = useState(1);

  // Reset zoom when opening a new image
  useEffect(() => {
    if (selectedImage) {
      setZoom(1);
    }
  }, [selectedImage]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
  };

  if (images.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 min-h-[300px] border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
        <p className="text-lg font-medium">{texts.emptyTitle}</p>
        <p className="text-sm">{texts.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          {texts.title}
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{images.length} {texts.items}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img) => (
          <div 
            key={img.id} 
            className="group relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedImage(img)}
          >
            <div className="aspect-[3/4] overflow-hidden bg-slate-100 relative">
              <img src={img.url} alt={img.viewType} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {/* Badge for expert opinion */}
              {img.expertOpinion && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                  <span>Mía</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M10 2a.75.75 0 0 1 .75.75v5.59l2.68-2.68a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06l2.68 2.68V2.75A.75.75 0 0 1 10 2Z" />
                  </svg>
                </div>
              )}
              {/* Badge for Video Available */}
              {img.videoUrl && (
                <div className="absolute top-2 right-12 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 z-10 border border-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-red-500">
                    <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 0 0 1.28-.53V4.75Z" />
                  </svg>
                  <span>Video</span>
                </div>
              )}
            </div>
            
            <div className="p-4 relative">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{viewTypeLabels[img.viewType] || img.viewType}</p>
              <p className="text-xs text-slate-500 truncate">{img.prompt}</p>

              {/* Animate / Video Button */}
              {onGenerateVideo && (
                 <div className="mt-3 border-t border-slate-100 pt-3 flex justify-end">
                    {img.videoUrl ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(img);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-full hover:bg-slate-800 transition-colors"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                           </svg>
                           {texts.playVideo}
                        </button>
                    ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!img.isVideoGenerating) onGenerateVideo(img.id, img.url);
                          }}
                          disabled={img.isVideoGenerating}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${
                             img.isVideoGenerating 
                               ? 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed'
                               : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
                          }`}
                        >
                           {img.isVideoGenerating ? (
                             <>
                               <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                               {texts.generatingVideo}
                             </>
                           ) : (
                             <>
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                  <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 0 0 1.28-.53V4.75Z" />
                               </svg>
                               {texts.animate}
                             </>
                           )}
                        </button>
                    )}
                 </div>
              )}
            </div>

            {/* Download Overlay Button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(img.url, img.id);
                }}
                className="bg-white/90 hover:bg-white text-slate-700 p-2 rounded-lg shadow-sm backdrop-blur-sm"
                title="Download"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 9.75v10.5m0 0L7.5 15.75M12 20.25l4.5-4.5M12 3v9" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        
        {isGenerating && (
          <div className="aspect-[3/4] bg-slate-50 rounded-xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center p-6 animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium text-indigo-700">{texts.designing}</p>
            <p className="text-xs text-indigo-400 mt-1">{texts.stitching}</p>
             {/* Progress indicator in gallery card */}
             {progress !== undefined && (
              <div className="w-24 h-1 bg-indigo-100 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {progress !== undefined && <span className="text-[10px] text-indigo-400 mt-1">{progress}%</span>}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex"
          onClick={() => setSelectedImage(null)}
        >
          {/* Main Image Container */}
          <div className={`flex-1 flex flex-col relative h-full transition-all duration-300 ${selectedImage.expertOpinion ? 'mr-[350px] md:mr-[400px]' : ''}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
              <div className="text-white/80 text-sm font-medium pointer-events-auto">
                {viewTypeLabels[selectedImage.viewType]}
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-white/80 hover:text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all backdrop-blur-sm pointer-events-auto"
                title={texts.close}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
              </button>
            </div>

            {/* Image Canvas */}
            <div 
              className="flex-1 overflow-auto flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div onClick={e => e.stopPropagation()} className="relative">
                  {/* If video exists and user wants to play it, we could show it. For now, let's overlay play if available */}
                  {selectedImage.videoUrl ? (
                    <video
                        src={selectedImage.videoUrl}
                        controls
                        autoPlay
                        loop
                        className="transition-all duration-200 ease-out rounded-sm shadow-2xl max-h-[85vh] max-w-full"
                    />
                  ) : (
                    <img 
                        src={selectedImage.url} 
                        alt="Full view" 
                        className="transition-all duration-200 ease-out rounded-sm shadow-2xl"
                        style={{ 
                        cursor: zoom > 1 ? 'grab' : 'zoom-in',
                        maxHeight: zoom === 1 ? '85vh' : 'none',
                        maxWidth: zoom === 1 ? '100%' : 'none',
                        height: zoom === 1 ? 'auto' : `${80 * zoom}vh`,
                        }}
                        onClick={(e) => {
                        if (zoom === 1) handleZoomIn(e);
                        else handleResetZoom(e);
                        }}
                    />
                  )}
              </div>
            </div>

            {/* Floating Controls Bar - Hide zoom controls if video is playing */}
            {!selectedImage.videoUrl && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 border-r border-white/20 pr-3 mr-1">
                    <button 
                        onClick={handleZoomOut}
                        disabled={zoom <= 1}
                        className={`p-2 rounded-full transition-colors ${zoom <= 1 ? 'text-white/30 cursor-not-allowed' : 'text-white hover:bg-white/20'}`}
                        title={texts.zoomOut}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                    </button>
                    <span className="text-white font-mono text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button 
                        onClick={handleZoomIn}
                        disabled={zoom >= 4}
                        className={`p-2 rounded-full transition-colors ${zoom >= 4 ? 'text-white/30 cursor-not-allowed' : 'text-white hover:bg-white/20'}`}
                        title={texts.zoomIn}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                    <button 
                        onClick={handleResetZoom}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors ml-1"
                        title={texts.reset}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                    </div>

                    <button 
                    onClick={() => onDownload(selectedImage.url, selectedImage.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full text-sm transition-colors flex items-center gap-2"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 9.75v10.5m0 0L7.5 15.75M12 20.25l4.5-4.5M12 3v9" />
                    </svg>
                    {texts.download}
                    </button>
                </div>
            )}
            
            {/* Download/Video DL (If video active) */}
            {selectedImage.videoUrl && (
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => onDownload(selectedImage.videoUrl!, `${selectedImage.id}-video.mp4`)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-full text-sm transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 0 0 1.28-.53V4.75Z" />
                        </svg>
                        Download Video
                    </button>
                 </div>
            )}
          </div>

          {/* Expert Opinion Sidebar (Desktop) / Bottom Sheet (Mobile view TBD, keeping sidebar for now) */}
          {selectedImage.expertOpinion && (
             <div 
               className="fixed top-0 right-0 bottom-0 w-[350px] md:w-[400px] bg-white shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-300"
               onClick={(e) => e.stopPropagation()}
             >
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-pink-50 border-b border-indigo-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 to-indigo-500 p-[2px] shadow-md">
                         <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <span className="text-xl">👩🏻‍🎨</span>
                         </div>
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-900">{texts.stylistTitle}</h3>
                         <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">{texts.stylistRole}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedImage(null)} className="md:hidden text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                   <div className="prose prose-sm prose-indigo text-slate-600 leading-relaxed whitespace-pre-line">
                      {selectedImage.expertOpinion}
                   </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center">
                  VirtualStitch AI • Fashion Consultant
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};