'use client';

import { Globe, EyeOff } from 'lucide-react';

export default function PublishToggle({ isPublished, onChange, label = 'Visibility' }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isPublished ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
          {isPublished ? <Globe size={18} /> : <EyeOff size={18} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-[11px] text-gray-500">
            {isPublished ? 'Live on website' : 'Visible only in CRM'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!isPublished)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          isPublished ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isPublished ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
