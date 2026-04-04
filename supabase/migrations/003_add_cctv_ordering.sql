-- 003: Add display_order to cctv_devices for drag-and-drop camera sorting
ALTER TABLE cctv_devices ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Initialize ordering based on created_at timestamp for existing cameras
UPDATE cctv_devices
SET display_order = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY office_id ORDER BY created_at) as row_num
  FROM cctv_devices
) sub
WHERE cctv_devices.id = sub.id;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_cctv_devices_office_order 
ON cctv_devices(office_id, display_order);
