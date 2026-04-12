import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

export default function ImageCropperModal({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping] = useState(false);

  const onCropCompleteLocal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setCropping(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
      alert('Error cropping image');
    }
    setCropping(false);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ width: '400px', maxWidth: '90%' }}>
        <div className="modal-header">
          <h2 className="modal-title">Adjust Profile Photo</h2>
          <button className="modal-close" onClick={onCancel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body" style={{ position: 'relative', height: '300px', background: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteLocal}
            onZoomChange={setZoom}
          />
        </div>
        <div className="form-group px-16 mt-16">
          <label className="text-sm text-muted mb-8" style={{ display: 'block' }}>Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            style={{ width: '100%', accentColor: 'var(--color-gold)' }}
          />
        </div>
        <div className="modal-footer" style={{ marginTop: '0' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={cropping}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={cropping}>
            {cropping ? 'Processing...' : 'Save Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
