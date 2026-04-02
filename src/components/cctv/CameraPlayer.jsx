'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Maximize2, Minimize2, Volume2, VolumeX, AlertCircle, RefreshCw } from 'lucide-react';
import styles from './CameraPlayer.module.css';

export default function CameraPlayer({ streamUrl, cameraName, onRetry }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    setIsLoading(true);
    setError(null);

    // Initialize HLS
    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        videoRef.current.play().catch(e => {
          console.warn("Auto-play blocked:", e);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("HLS Network error", data);
              setError("Network error. Retrying...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("HLS Media error", data);
              setError("Media error. Recovering...");
              hls.recoverMediaError();
              break;
            default:
              console.error("HLS Fatal error", data);
              setError("Fatal streaming error.");
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        videoRef.current.play();
        setIsPlaying(true);
      });
      videoRef.current.addEventListener('error', () => {
        setError("Native playback error.");
      });
    } else {
      setError("HLS playback is not supported in this browser.");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div ref={containerRef} className={`${styles.playerContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.header}>
        <span className={styles.cameraName}>{cameraName}</span>
        <div className={styles.status}>
          <span className={`${styles.dot} ${isPlaying ? styles.online : styles.offline}`} />
          {isPlaying ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>

      <video 
        ref={videoRef} 
        className={styles.video} 
        autoPlay 
        muted 
        playsInline
      />

      {isLoading && (
        <div className={styles.overlay}>
          <RefreshCw className={styles.spinner} size={48} />
          <p>Connecting to stream...</p>
        </div>
      )}

      {error && (
        <div className={styles.overlay}>
          <AlertCircle className={styles.errorIcon} size={48} />
          <p>{error}</p>
          <button onClick={onRetry} className={styles.retryBtn}>Retry Connection</button>
        </div>
      )}

      <div className={styles.controls}>
        <button onClick={toggleMute} className={styles.controlBtn}>
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <div className={styles.spacer} />
        <button onClick={toggleFullscreen} className={styles.controlBtn}>
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>
    </div>
  );
}
