'use client';

import { File, Download, ExternalLink, Image as ImageIcon, Video, FileText } from 'lucide-react';

export default function ChatFilesGallery({ attachments }) {
  if (!attachments || attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-50">
        <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
          <File size={32} className="text-text-dim" />
        </div>
        <div className="text-xs uppercase tracking-widest font-bold mb-1">No files shared yet</div>
        <p className="text-[10px] text-text-dim">Attachments in this channel will appear here.</p>
      </div>
    );
  }

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <ImageIcon size={18} />;
    if (type?.startsWith('video/')) return <Video size={18} />;
    if (type?.includes('pdf') || type?.includes('word') || type?.includes('excel')) return <FileText size={18} />;
    return <File size={18} />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gold flex items-center gap-2">
          Shared Files
        </h3>
        <span className="text-[10px] text-text-dim">{attachments.length} items</span>
      </div>

      <div className="grid gap-3">
        {attachments.map((file) => (
          <div 
            key={file.id} 
            className="group relative flex items-center gap-3 p-3 rounded-2xl border border-border bg-surface-2/70 hover:bg-surface-3 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              {getFileIcon(file.file_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate pr-6">{file.file_name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-text-dim uppercase tracking-wider">{formatSize(file.file_size)}</span>
                <span className="text-[9px] text-text-dim">•</span>
                <span className="text-[9px] text-text-dim truncate">by {file.uploader?.full_name || 'User'}</span>
              </div>
            </div>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a 
                href={file.file_url} 
                target="_blank" 
                rel="noreferrer" 
                className="p-1.5 rounded-lg bg-surface-1 text-text-dim hover:text-gold transition-colors"
                title="View original"
              >
                <ExternalLink size={14} />
              </a>
              <a 
                href={file.file_url} 
                download={file.file_name}
                className="p-1.5 rounded-lg bg-surface-1 text-text-dim hover:text-gold transition-colors"
                title="Download"
              >
                <Download size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
