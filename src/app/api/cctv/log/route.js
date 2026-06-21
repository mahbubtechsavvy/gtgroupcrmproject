import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { employee_id, status, timestamp, camera_source } = body;

    if (!employee_id || !status) {
      return NextResponse.json({ error: 'Missing employee_id or status' }, { status: 400 });
    }

    // 1. Fetch the CCTV device matching the camera_source name or ID
    let cctv_device_id = null;
    if (camera_source) {
      // First try to match by name
      let { data: device } = await supabase
        .from('cctv_devices')
        .select('id')
        .eq('name', camera_source)
        .limit(1)
        .maybeSingle();

      if (!device) {
        // If not found by name, try to parse as UUID and match by ID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(camera_source);
        if (isUuid) {
          const { data: deviceById } = await supabase
            .from('cctv_devices')
            .select('id')
            .eq('id', camera_source)
            .limit(1)
            .maybeSingle();
          device = deviceById;
        }
      }

      if (device) {
        cctv_device_id = device.id;
      }
    }

    // 2. Fetch the last log to compute actual duration_seconds if transitioning
    let duration_seconds = 0;
    const { data: lastLog } = await supabase
      .from('cctv_tracking_logs')
      .select('logged_at, status')
      .eq('employee_id', employee_id)
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastLog) {
      const lastTime = new Date(lastLog.logged_at).getTime();
      const currTime = new Date(timestamp || new Date().toISOString()).getTime();
      duration_seconds = Math.max(0, Math.floor((currTime - lastTime) / 1000));
    }

    // 3. Insert the new log transition
    const { error: insertError } = await supabase
      .from('cctv_tracking_logs')
      .insert({
        cctv_device_id,
        employee_id,
        status,
        logged_at: timestamp || new Date().toISOString(),
        duration_seconds: duration_seconds
      });

    if (insertError) {
      console.error('Error inserting CCTV log:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CCTV log webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
