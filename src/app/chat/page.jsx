'use client';

import { useUser } from '@/components/layout/AppLayout';
import { ExecutiveHero } from '@/components/crm/ExecutivePage';
import ChatShell from '@/components/chat/ChatShell';

export default function ChatPage() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 24px', zIndex: 2 }}>
        <ExecutiveHero
          eyebrow="Realtime Internal Comms"
          title="GT Chat"
          subtitle="Cross-office staff communication, team channels, and direct messages."
        />
      </div>
      
      <div style={{ flex: 1, padding: '0 24px 24px 24px' }}>
        <ChatShell />
      </div>
    </div>
  );
}

