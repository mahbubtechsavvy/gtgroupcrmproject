'use client';

import { useState, useEffect } from 'react';
import { Link as LinkIcon, RefreshCw } from 'lucide-react';

export default function SlugGenerator({ title, value, onChange, prefix = '' }) {
  const [autoGenerate, setAutoGenerate] = useState(!value);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  };

  useEffect(() => {
    if (autoGenerate && title) {
      onChange(generateSlug(title));
    }
  }, [title, autoGenerate, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <LinkIcon size={14} className="text-gold-500" />
          URL Slug
        </label>
        <button
          type="button"
          onClick={() => setAutoGenerate(!autoGenerate)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            autoGenerate 
              ? 'bg-gold-100 text-gold-700 font-semibold' 
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {autoGenerate ? 'Auto-generating' : 'Manual Entry'}
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        {prefix && (
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-2 border border-gray-200 rounded-l-md border-r-0">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setAutoGenerate(false);
            onChange(e.target.value.toLowerCase().replace(/ /g, '-'));
          }}
          className={`flex-1 px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all ${
            prefix ? 'rounded-l-none' : ''
          }`}
          placeholder="e.g. study-in-korea"
        />
        {!autoGenerate && (
          <button
            type="button"
            onClick={() => setAutoGenerate(true)}
            className="p-2 text-gray-400 hover:text-gold-500 transition-colors"
            title="Reset to auto-generate"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>
      <p className="text-[10px] text-gray-400">
        The slug is used for the page URL. Avoid changing this after publication.
      </p>
    </div>
  );
}
