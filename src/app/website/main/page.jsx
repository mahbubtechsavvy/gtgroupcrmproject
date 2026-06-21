'use client';

import { useState, useEffect } from 'react';
import WebsiteManagerHub from '@/components/website/WebsiteManagerHub';
import { getSupabaseClient } from '@/lib/supabase';

export default function MainWebsitePage() {
  const [liveUrl, setLiveUrl] = useState('http://localhost:3000');

  useEffect(() => {
    const fetchUrl = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'site_url_main')
        .single();
      if (data?.value) setLiveUrl(data.value);
    };
    fetchUrl();
  }, []);

  return (
    <WebsiteManagerHub 
      type="main"
      title="GT Group Main CMS"
      subtitle="Manage corporate announcements, group history, and global team profiles."
      liveUrl={liveUrl}
    />
  );
}
