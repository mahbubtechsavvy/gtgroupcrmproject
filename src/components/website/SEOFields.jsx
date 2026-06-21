'use client';

import { Search } from 'lucide-react';

export default function SEOFields({ seoTitle, setSeoTitle, seoDescription, setSeoDescription, titleHint = '' }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Search size={16} className="text-blue-500" />
        <h4 className="text-sm font-semibold text-gray-800">Search Engine Optimization (SEO)</h4>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Meta Title
          <span className="ml-2 font-normal text-gray-400">
            ({seoTitle?.length || 0}/60 chars recommended)
          </span>
        </label>
        <input
          type="text"
          value={seoTitle || ''}
          onChange={(e) => setSeoTitle(e.target.value)}
          placeholder={titleHint || 'Page title for Google search...'}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Meta Description
          <span className="ml-2 font-normal text-gray-400">
            ({seoDescription?.length || 0}/160 chars recommended)
          </span>
        </label>
        <textarea
          value={seoDescription || ''}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={3}
          placeholder="Brief summary of the page content for search results..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      {/* Google Preview Simulation */}
      <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
        <p className="text-[10px] text-gray-400 mb-1">Search Preview:</p>
        <p className="text-[14px] text-blue-700 font-medium truncate mb-0.5">
          {seoTitle || titleHint || 'Example Page Title | GT Group'}
        </p>
        <p className="text-[12px] text-green-700 mb-0.5 truncate">
          gtgroup.com › ... › {titleHint?.toLowerCase().replace(/ /g, '-') || 'page'}
        </p>
        <p className="text-[12px] text-gray-600 line-clamp-2">
          {seoDescription || 'Provide a compelling meta description to improve click-through rates from search engines.'}
        </p>
      </div>
    </div>
  );
}
