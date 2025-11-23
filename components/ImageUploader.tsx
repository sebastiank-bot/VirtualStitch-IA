

import React, { useRef } from 'react';

interface ImageUploaderProps {
  label: string;
  subLabel: string;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  id: string;
  texts: {
    dragDrop: string;
    fileType: string;
    remove: string;
  };
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  subLabel,
  previewUrl,
  onFileSelect,
  onClear,
  id,
  texts
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
            onFileSelect(blob);
        }
        break;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} <span className="text-slate-400 font-normal ml-1">- {subLabel}</span>
      </label>
      
      {!previewUrl ? (
        <div 
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="group relative h-48 w-full border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-white hover:border-indigo-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center"
        >
          <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:shadow-md transition-shadow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 1 5.25 21h13.5A2.25 2.25 0 0 1 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">{texts.dragDrop}</p>
          <p className="text-xs text-slate-400 mt-1">{texts.fileType}</p>
          <input 
            type="file" 
            ref={inputRef}
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/jpg, image/webp" 
            className="hidden" 
            id={id}
          />
        </div>
      ) : (
        <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
          <img src={previewUrl} alt="Preview" className="w-full h-auto block" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                if(inputRef.current) inputRef.current.value = '';
              }}
              className="px-4 py-2 bg-white/90 text-red-600 rounded-full text-sm font-medium hover:bg-white shadow-lg transform transition-transform hover:scale-105"
            >
              {texts.remove}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};