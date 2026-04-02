import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/cctv/encryption';
import { isSuperAdmin } from '@/lib/permissions';
import { streamManager } from '@/lib/cctv/StreamManager';

export async function POST(req) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isSuperAdmin(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json();
  const { deviceId } = body;

  if (!deviceId) {
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
  }

  // Fetch device details from DB
  const { data: device, error } = await supabase
    .from('cctv_devices')
    .select('*')
    .eq('id', deviceId)
    .single();

  if (error || !device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  // Decrypt the password
  const decryptedPassword = decrypt(device.password);
  if (!decryptedPassword) {
    return NextResponse.json({ error: 'Encryption error. Could not decrypt password.' }, { status: 500 });
  }

  try {
    // Cleanup old streams occasionally (e.g. 1% of requests as a simple heuristic)
    if (Math.random() < 0.1) {
      streamManager.cleanup();
    }

    const streamPath = await streamManager.startStream(device, decryptedPassword);
    
    return NextResponse.json({ 
      streamUrl: streamPath,
      deviceName: device.name,
      lastRequested: Date.now()
    });
  } catch (err) {
    console.error('Stream Manager Error:', err);
    return NextResponse.json({ error: 'Failed to start stream' }, { status: 500 });
  }
}
