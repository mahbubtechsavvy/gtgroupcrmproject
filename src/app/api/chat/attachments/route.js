import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'audio/mpeg',
  'text/csv',
  'application/json',
  'text/plain',
];

const MAX_FILE_SIZE = 52428800; // 50MB

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const conversationId = formData.get('conversation_id');
    const groupId = formData.get('group_id');

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!conversationId && !groupId) {
      return NextResponse.json(
        { error: 'Either conversation_id or group_id is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('id, participant_a, participant_b')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      if (
        conversation.participant_a !== user.id &&
        conversation.participant_b !== user.id
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (groupId) {
      const { data: member, error: memberError } = await supabase
        .from('chat_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const fileExtension = file.name.split('.').pop();
    const objectPath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExtension}`;
    const buffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(objectPath, 60 * 60);

    if (signedError) {
      console.error('Signed URL error:', signedError);
      return NextResponse.json({ error: signedError.message }, { status: 500 });
    }

    const { data: attachment, error: dbError } = await supabase
      .from('chat_attachments')
      .insert({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: uploadData.path,
        public_url: signedUrlData.signedUrl,
        uploader_id: user.id,
        conversation_id: conversationId || null,
        group_id: groupId || null,
      })
      .select('*')
      .single();

    if (dbError) {
      console.error('Attachment record error:', dbError);
      await supabase.storage.from('chat-attachments').remove([objectPath]);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    await supabase.from('interactions').insert({
      user_id: user.id,
      action: 'upload_chat_attachment',
      entity_type: 'chat_attachment',
      entity_id: attachment.id,
      metadata: {
        file_name: file.name,
        file_size: file.size,
        conversation_id: conversationId,
        group_id: groupId,
      },
    });

    return NextResponse.json({
      ...attachment,
      file_url: signedUrlData.signedUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/attachments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const groupId = searchParams.get('group_id');

    if (!conversationId && !groupId) {
      return NextResponse.json(
        { error: 'Either conversation_id or group_id is required' },
        { status: 400 }
      );
    }

    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('id, participant_a, participant_b')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      if (
        conversation.participant_a !== user.id &&
        conversation.participant_b !== user.id
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (groupId) {
      const { data: member, error: memberError } = await supabase
        .from('chat_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let query = supabase
      .from('chat_attachments')
      .select('*, uploader:users(id, full_name)');

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    } else if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data: attachments, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const signedAttachments = await Promise.all(
      (attachments || []).map(async (attachment) => {
        if (!attachment.storage_path) return attachment;
        const { data: signedUrlData, error: signedError } = await supabase.storage
          .from('chat-attachments')
          .createSignedUrl(attachment.storage_path, 60 * 60);

        return {
          ...attachment,
          file_url: signedError ? attachment.public_url : signedUrlData.signedUrl,
        };
      })
    );

    return NextResponse.json(signedAttachments);
  } catch (error) {
    console.error('GET /api/chat/attachments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
