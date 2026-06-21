'use client';

import { useState, useEffect } from 'react';
import WebsiteManagerHub from '@/components/website/WebsiteManagerHub';
import { getSupabaseClient } from '@/lib/supabase';

export default function NexusWebsitePage() {
  const [liveUrl, setLiveUrl] = useState('http://localhost:3002');

  useEffect(() => {
    const fetchUrl = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'site_url_nexus')
        .single();
      if (data?.value) setLiveUrl(data.value);
    };
    fetchUrl();
  }, []);

  return (
    <WebsiteManagerHub 
      type="nexus"
      title="Nexus Digital CMS"
      subtitle="Complete control over Nexus Digital services, portfolio, and branding."
      liveUrl={liveUrl}
    />
  );
}
