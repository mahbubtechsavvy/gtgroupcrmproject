'use client';

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { createBrowserClient } from '@supabase/ssr';
import { Play, Square, Upload, Users, Activity, Trash2, Edit3, Save, Target } from 'lucide-react';
import styles from './AiTracker.module.css';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AiTracker({ devices, offices, streams, startStream }) {
  const [activeDeviceId, setActiveDeviceId] = useState('');
  const [activeOfficeId, setActiveOfficeId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State for workstation coordinates
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [workstationName, setWorkstationName] = useState('');
  const [xMin, setXMin] = useState(10);
  const [yMin, setYMin] = useState(10);
  const [xMax, setXMax] = useState(40);
  const [yMax, setYMax] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const activeDevice = devices.find(d => d.id === activeDeviceId);

  const streamUrl = streams?.[activeDeviceId];
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Initialize background video feed for bounds designer
  useEffect(() => {
    if (isTracking) return; // Only show in setup mode
    
    // Auto-request stream if not active
    if (activeDeviceId && !streamUrl && startStream) {
      startStream(activeDeviceId);
      return;
    }

    if (!streamUrl || !videoRef.current) return;

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play().catch(e => {
          console.warn("Bounds video auto-play blocked:", e);
        });
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current.play();
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [activeDeviceId, streamUrl, isTracking, startStream]);

  // Set default office & device
  useEffect(() => {
    if (devices.length > 0) {
      setActiveDeviceId(devices[0].id);
      setActiveOfficeId(devices[0].office_id || '');
    }
  }, [devices]);

  // Fetch workstations and employees when selected device/office changes
  useEffect(() => {
    if (!activeDeviceId) return;

    const device = devices.find(d => d.id === activeDeviceId);
    if (device && device.office_id !== activeOfficeId) {
      setActiveOfficeId(device.office_id);
    }

    fetchWorkstations(activeDeviceId);
    // Fetch current tracker status
    checkTrackerStatus();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeviceId]);

  // Fetch employees for the office
  useEffect(() => {
    if (!activeOfficeId) return;
    fetchEmployees(activeOfficeId);
  }, [activeOfficeId]);

  // Handle active status polling when tracking is active
  useEffect(() => {
    if (isTracking) {
      pollIntervalRef.current = setInterval(() => {
        fetchStatusAndLogs();
      }, 2000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, activeDeviceId]);

  const fetchEmployees = async (officeId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('office_id', officeId)
        .eq('is_active', true);

      if (error) throw error;
      setEmployees(data || []);
      if (data && data.length > 0) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchWorkstations = async (deviceId) => {
    try {
      const { data, error } = await supabase
        .from('cctv_workstations')
        .select(`
          *,
          users:employee_id(full_name)
        `)
        .eq('cctv_device_id', deviceId);

      if (error) throw error;
      setWorkstations(data || []);
    } catch (err) {
      console.error('Error fetching workstations:', err);
    }
  };

  const fetchStatusAndLogs = async () => {
    try {
      // 1. Fetch Flask status
      const res = await fetch('/status');
      if (res.ok) {
        const data = await res.json();
        setTrackingStatus(data);
        setIsTracking(data.status === 'active');
      }

      // 2. Fetch db logs for employees in this office
      if (employees.length > 0) {
        const employeeIds = employees.map(e => e.id);
        const { data: logsData, error: logsError } = await supabase
          .from('cctv_tracking_logs')
          .select(`
            *,
            users:employee_id(full_name)
          `)
          .in('employee_id', employeeIds)
          .order('logged_at', { ascending: false })
          .limit(20);

        if (logsError) throw logsError;
        setLogs(logsData || []);
      }
    } catch (err) {
      console.error('Error polling status/logs:', err);
    }
  };

  const checkTrackerStatus = async () => {
    try {
      const res = await fetch('/status');
      if (res.ok) {
        const data = await res.json();
        setIsTracking(data.status === 'active');
        setTrackingStatus(data);
      }
    } catch (err) {
      console.error('Error checking tracker status:', err);
    }
  };

  const handleAddWorkstation = async (e) => {
    e.preventDefault();
    if (!activeDeviceId || !selectedEmployeeId || !workstationName) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('cctv_workstations')
        .upsert({
          cctv_device_id: activeDeviceId,
          employee_id: selectedEmployeeId,
          name: workstationName,
          x_min: xMin / 100,
          y_min: yMin / 100,
          x_max: xMax / 100,
          y_max: yMax / 100
        });

      if (error) throw error;

      setWorkstationName('');
      fetchWorkstations(activeDeviceId);
    } catch (err) {
      console.error('Error saving workstation:', err);
      alert('Error saving workstation bounds: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkstation = async (id) => {
    if (!confirm('Are you sure you want to delete this workstation boundary?')) return;

    try {
      const { error } = await supabase
        .from('cctv_workstations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchWorkstations(activeDeviceId);
    } catch (err) {
      console.error('Error deleting workstation:', err);
    }
  };

  const handleStartTracking = async () => {
    if (workstations.length === 0) {
      alert('Please configure at least one employee workstation boundary before starting tracking.');
      return;
    }

    try {
      const payload = {
        source_type: activeDevice?.ip_address === '0' ? 'webcam' : 'custom',
        camera_source: activeDevice?.ip_address || '0',
        absence_threshold: 5,
        confidence: 0.5,
        workstations: workstations.map(ws => ({
          employee_id: ws.employee_id,
          employee_name: ws.users?.full_name || ws.name,
          coords: [parseFloat(ws.x_min), parseFloat(ws.y_min), parseFloat(ws.x_max), parseFloat(ws.y_max)]
        }))
      };

      const res = await fetch('/start_tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsTracking(true);
        fetchStatusAndLogs();
      } else {
        alert('Failed to start AI tracker service.');
      }
    } catch (err) {
      console.error('Error starting tracking:', err);
    }
  };

  const handleStopTracking = async () => {
    try {
      const res = await fetch('/stop_tracking', { method: 'POST' });
      if (res.ok) {
        setIsTracking(false);
        setTrackingStatus(null);
      }
    } catch (err) {
      console.error('Error stopping tracking:', err);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || workstations.length === 0) {
      if (workstations.length === 0) {
        alert('Please configure at least one employee workstation boundary before uploading a demo video.');
      }
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('absence_threshold', '5');
    formData.append('confidence', '0.5');
    formData.append('area_method', 'manual');
    formData.append('workstations', JSON.stringify(workstations.map(ws => ({
      employee_id: ws.employee_id,
      employee_name: ws.users?.full_name || ws.name,
      coords: [parseFloat(ws.x_min), parseFloat(ws.y_min), parseFloat(ws.x_max), parseFloat(ws.y_max)]
    }))));

    try {
      const res = await fetch('/upload_video', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setIsTracking(true);
        fetchStatusAndLogs();
      } else {
        alert('Failed to upload demo video loop.');
      }
    } catch (err) {
      console.error('Error uploading video:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Target size={24} color="#ffd700" />
          <h2>AI Employee Tracking</h2>
          <span>YOLOv4-Tiny Powered</span>
        </div>

        <div className={styles.controls}>
          <select
            className={styles.select}
            value={activeDeviceId}
            onChange={(e) => setActiveDeviceId(e.target.value)}
          >
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {isTracking ? (
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleStopTracking}>
              <Square size={16} />
              Stop AI Tracking
            </button>
          ) : (
            <>
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`} 
                onClick={handleStartTracking}
                disabled={workstations.length === 0}
              >
                <Play size={16} />
                Start AI Webcam Feed
              </button>

              <button 
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || workstations.length === 0}
              >
                <Upload size={16} />
                {isUploading ? 'Uploading Demo...' : 'Upload Demo Video'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="video/*"
                onChange={handleVideoUpload}
              />
            </>
          )}
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Left Side: Live Feed Stream */}
        <div className={styles.feedCard}>
          <div className={styles.feedHeader}>
            <div className={styles.feedHeaderTitle}>
              <Activity size={16} className={styles.feedDot} />
              <span>{isTracking ? 'AI LIVE PROCESSED FEED' : 'WORKSTATION BOUNDS DESIGNER'}</span>
            </div>
            {isTracking && (
              <span className={styles.badge} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                LIVE STREAM ACTIVE
              </span>
            )}
          </div>

          <div className={styles.feedBody}>
            {isTracking ? (
              <img
                src="/video_feed"
                alt="AI CCTV Feed"
                className={styles.videoFeed}
                onError={(e) => {
                  console.error('CCTV Stream error');
                }}
              />
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', borderRadius: '12px' }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  autoPlay
                  muted
                  playsInline
                />

                {/* Visual coordinate mapper boxes */}
                <div className={styles.visualOverlay} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
                  {workstations.map(ws => (
                    <div
                      key={ws.id}
                      className={styles.visualBox}
                      style={{
                        left: `${ws.x_min * 100}%`,
                        top: `${ws.y_min * 100}%`,
                        width: `${(ws.x_max - ws.x_min) * 100}%`,
                        height: `${(ws.y_max - ws.y_min) * 100}%`,
                      }}
                    >
                      <span className={styles.visualBoxLabel}>
                        {ws.users?.full_name || ws.name}
                      </span>
                    </div>
                  ))}
                  {/* Current drawing workstation */}
                  {selectedEmployeeId && workstationName && (
                    <div
                      className={styles.visualBox}
                      style={{
                        left: `${xMin}%`,
                        top: `${yMin}%`,
                        width: `${xMax - xMin}%`,
                        height: `${yMax - yMin}%`,
                        borderColor: '#22c55e',
                        background: 'rgba(34, 197, 94, 0.1)',
                      }}
                    >
                      <span className={styles.visualBoxLabel} style={{ background: '#22c55e' }}>
                        PREVIEW: {workstationName}
                      </span>
                    </div>
                  )}
                </div>

                {!streamUrl && (
                  <div className={styles.placeholder} style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(0,0,0,0.85)' }}>
                    <Users size={48} />
                    <p>Connecting to live camera feed for precise coordinate drafting...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Setup and Realtime list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Workstation Bounds Designer */}
          {!isTracking && (
            <div className={styles.configCard}>
              <h3 className={styles.sectionTitle}>
                <Target size={18} />
                Workstation Bounds Designer
              </h3>

              <form onSubmit={handleAddWorkstation}>
                <div className={styles.formGroup}>
                  <label>Assign Employee</label>
                  <select
                    className={styles.select}
                    style={{ width: '100%', minWidth: 'auto' }}
                    value={selectedEmployeeId}
                    onChange={(e) => {
                      setSelectedEmployeeId(e.target.value);
                      const emp = employees.find(emp => emp.id === e.target.value);
                      if (emp) {
                        setWorkstationName(`${emp.full_name.split(' ')[0]}'s Desk`);
                      }
                    }}
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Workstation Label</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Desk A"
                    value={workstationName}
                    onChange={(e) => setWorkstationName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.coordsGrid}>
                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderHeader}>
                      <span>X Min</span>
                      <span>{xMin}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className={styles.rangeInput}
                      value={xMin}
                      onChange={(e) => setXMin(Math.min(parseInt(e.target.value), xMax - 5))}
                    />
                  </div>

                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderHeader}>
                      <span>Y Min</span>
                      <span>{yMin}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className={styles.rangeInput}
                      value={yMin}
                      onChange={(e) => setYMin(Math.min(parseInt(e.target.value), yMax - 5))}
                    />
                  </div>

                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderHeader}>
                      <span>X Max</span>
                      <span>{xMax}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className={styles.rangeInput}
                      value={xMax}
                      onChange={(e) => setXMax(Math.max(parseInt(e.target.value), xMin + 5))}
                    />
                  </div>

                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderHeader}>
                      <span>Y Max</span>
                      <span>{yMax}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className={styles.rangeInput}
                      value={yMax}
                      onChange={(e) => setYMax(Math.max(parseInt(e.target.value), yMin + 5))}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                  disabled={isSubmitting}
                >
                  <Save size={16} />
                  {isSubmitting ? 'Saving...' : 'Save Workstation Bound'}
                </button>
              </form>
            </div>
          )}

          {/* Active Workstations List & Status */}
          <div className={styles.presenceSection}>
            <h3 className={styles.sectionTitle}>
              <Users size={18} />
              Workstation Presence
            </h3>

            <div className={styles.workstationList}>
              {workstations.length === 0 ? (
                <div className={styles.emptyLogs}>No workstation boundaries configured.</div>
              ) : (
                workstations.map(ws => {
                  // Find matching state from Flask status
                  const wsState = trackingStatus?.workstations?.find(s => s.id === ws.employee_id);
                  const isPresent = wsState ? wsState.present : false;

                  return (
                    <div key={ws.id} className={styles.workstationItem}>
                      <div className={styles.workstationInfo}>
                        <span className={styles.workstationName}>{ws.name}</span>
                        <span className={styles.employeeName}>{ws.users?.full_name}</span>
                        <span className={styles.coordsBadge}>
                          [{Math.round(ws.x_min * 100)}, {Math.round(ws.y_min * 100)}] to [{Math.round(ws.x_max * 100)}, {Math.round(ws.y_max * 100)}]
                        </span>
                      </div>

                      <div className={styles.statusArea}>
                        {isTracking ? (
                          <span className={`${styles.badge} ${isPresent ? styles.badgePresent : styles.badgeAbsent}`}>
                            {isPresent ? 'PRESENT' : 'ABSENT'}
                          </span>
                        ) : (
                          <span className={styles.badge} style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                            STANDBY
                          </span>
                        )}

                        {!isTracking && (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteWorkstation(ws.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Stream */}
      {isTracking && (
        <div className={styles.activityCard}>
          <h3 className={styles.sectionTitle}>
            <Activity size={18} />
            Live Presence Transition Logs
          </h3>

          <div className={styles.logsArea}>
            {logs.length === 0 ? (
              <div className={styles.emptyLogs}>Awaiting events... Status changes will display here in real-time.</div>
            ) : (
              logs.map(log => {
                const isPresent = log.status === 'PRESENT';
                const formattedTime = new Date(log.logged_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                return (
                  <div
                    key={log.id}
                    className={`${styles.logItem} ${isPresent ? styles.logItemPresent : styles.logItemAbsent}`}
                  >
                    <span className={styles.logTime}>{formattedTime}</span>
                    <span className={styles.logText}>
                      Employee <strong>{log.users?.full_name || 'Staff'}</strong> is now{' '}
                      <strong style={{ color: isPresent ? '#22c55e' : '#ef4444' }}>
                        {log.status}
                      </strong>{' '}
                      at their desk.
                      {log.duration_seconds > 0 && ` (Last state lasted ${log.duration_seconds}s)`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
