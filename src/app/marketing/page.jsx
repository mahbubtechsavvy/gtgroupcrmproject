'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { toast } from 'react-hot-toast';

export default function MarketingPage() {
  const user = useUser();
  const [description, setDescription] = useState('');
  const [type, setType] = useState('ad_copy');
  const [platform, setPlatform] = useState('Facebook');
  const [audience, setAudience] = useState('Students');
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!description) {
      toast.error('Please enter a description or topic');
      return;
    }

    try {
      setGenerating(true);
      setResult('');

      const response = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          platform,
          description,
          audience,
          tone
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate copy');

      setResult(data.result);
      toast.success('Marketing material generated!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyToClipboard() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Copy failed');
    }
  }

  async function handleSaveAsset() {
    if (!result) return;
    try {
      setSaving(true);

      const newAsset = {
        office_id: user?.office_id,
        title: `AI Generated ${type.replace('_', ' ').toUpperCase()} (${platform})`,
        type: type === 'study_plan' ? 'template' : type,
        content: result,
        tags: [platform.toLowerCase(), type.toLowerCase(), tone.toLowerCase()],
        ai_generated: true,
        created_by: user?.id
      };

      const { error } = await supabase
        .from('marketing_assets')
        .insert(newAsset);

      if (error) throw error;
      toast.success('Asset saved to Marketing library!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save asset');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-gold">📢</span> AI Marketing Assistant
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Generate premium social media ad copies, promotional reels, and 14-day campaign calendars using AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-1 bg-surface-2 border border-white/5 rounded-xl p-6 h-fit space-y-6">
          <h2 className="font-display text-lg font-bold text-white">Generation Parameters</h2>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-white/70 text-xs font-semibold">Goal / Output Format</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
              >
                <option value="ad_copy">Social Media Ad Copy</option>
                <option value="social_post">Standard Social Post</option>
                <option value="reel_idea">Video Script & Reel Storyboard</option>
                <option value="campaign">14-Day Campaign Calendar</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-xs font-semibold">Target Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
              >
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="WhatsApp">WhatsApp Message</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-xs font-semibold">Target Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
              >
                <option value="Students">Prospective Students</option>
                <option value="Parents">Parents of Students</option>
                <option value="Partners">Partner Universities & Agencies</option>
                <option value="General">General Public</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-xs font-semibold">Tone of Voice</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
              >
                <option value="professional">Professional & Academic</option>
                <option value="educational">Educational & Informative</option>
                <option value="promotional">Urgent & Promotional</option>
                <option value="casual">Casual & Friendly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-xs font-semibold">Event description / Campaign Topic *</label>
              <textarea
                required
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Study Abroad Expo 2026. Spot assessments for South Korea universities, up to 100% scholarships, free consultations."
                className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-gold hover:bg-gold-light disabled:bg-white/5 disabled:text-white/20 text-navy font-semibold px-4 py-2.5 rounded-lg transition-all text-sm shadow-md hover:scale-[1.02]"
            >
              {generating ? 'Generating Content...' : 'Generate with AI'}
            </button>
          </form>
        </div>

        {/* Right Column: AI Output Results */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 flex-1 flex flex-col justify-between min-h-[450px]">
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-display text-lg font-bold text-white">Generated Output</h3>
                {result && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyToClipboard}
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 px-3 py-1.5 rounded transition-all"
                    >
                      Copy Copy
                    </button>
                    <button
                      disabled={saving}
                      onClick={handleSaveAsset}
                      className="text-xs bg-gold/10 hover:bg-gold/20 border border-gold/20 hover:border-gold/40 text-gold px-3 py-1.5 rounded transition-all"
                    >
                      {saving ? 'Saving...' : 'Save to Library'}
                    </button>
                  </div>
                )}
              </div>

              {generating ? (
                <div className="flex flex-col justify-center items-center h-64 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
                  <p className="text-white/40 text-xs animate-pulse">Running marketing algorithms...</p>
                </div>
              ) : result ? (
                <div className="bg-surface-3 border border-white/5 rounded-lg p-6 font-mono text-xs text-white/80 overflow-y-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
                  {result}
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 text-white/30 text-xs">
                  Fill parameters and click "Generate with AI" to generate copywriting.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
