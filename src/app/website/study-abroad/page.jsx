'use client';

import { useState, useEffect } from 'react';
import WebsiteManagerHub from '@/components/website/WebsiteManagerHub';
import { getSupabaseClient } from '@/lib/supabase';

export default function StudyAbroadWebsitePage() {
  const [liveUrl, setLiveUrl] = useState('http://localhost:3001');

  useEffect(() => {
    const fetchUrl = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'site_url_study_abroad')
        .single();
      if (data?.value) setLiveUrl(data.value);
    };
    fetchUrl();
  }, []);

  return (
    <WebsiteManagerHub 
      type="study_abroad"
      title="Study Abroad CMS"
      subtitle="Full control over destinations, universities, courses, and educational events."
      liveUrl={liveUrl}
    />
  );
}
