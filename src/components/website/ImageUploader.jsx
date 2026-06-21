'use client';

import { Image as ImageIcon, X, UploadCloud } from 'lucide-react';

export default function ImageUploader({ label, value, onChange, placeholder = 'https://...', aspect = 'video' }) {
  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    flag: 'aspect-[3/2]'
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <ImageIcon size={14} className="text-purple-500" />
        {label}
      </label>
      
      <div className="space-y-3">
        {value ? (
          <div className={`relative group overflow-hidden rounded-lg border-2 border-gold-500/30 ${aspectClasses[aspect] || 'aspect-video'}`}>
            <img 
              src={value} 
              alt={label} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Invalid+Image+URL'; }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => onChange('')}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-transform hover:scale-110"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div 
            className={`border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 hover:border-gold-300 transition-all cursor-pointer p-4 ${aspectClasses[aspect] || 'aspect-video'}`}
            onClick={() => {
              const url = prompt('Enter Image URL:');
              if (url) onChange(url);
            }}
          >
            <div className="p-3 rounded-full bg-white shadow-sm text-gray-400">
              <UploadCloud size={24} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600">Click to add image URL</p>
              <p className="text-[10px] text-gray-400">Supports PNG, JPG, WebP</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
