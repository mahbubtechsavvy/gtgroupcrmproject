#!/usr/bin/env bash

# ==============================================================================
# GT GROUP CRM & ERP DEPLOYMENT SETUP SCRIPT FOR HOSTINGER KVM 8 VPS
# Target OS: Ubuntu 22.04 LTS (x86_64)
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Setup Text Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0;3m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}  GT GROUP CRM & ERP - PRODUCTION VPS INITIAL PROVISIONING SCRIPT    ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Check if script is running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: This script must be run as root (use sudo).${NC}"
  exit 1
fi

# 1. Update the System Packages
echo -e "\n${YELLOW}[Step 1/6] Updating system repository and upgrade packages...${NC}"
apt update && apt upgrade -y

# 2. Install Basic Prerequisites
echo -e "\n${YELLOW}[Step 2/6] Installing administrative utilities & packages...${NC}"
apt install -y curl wget git nano ufw fail2ban unzip gnupg2 ca-certificates lsb-release

# 3. Configure Firewall & Network Security (UFW)
echo -e "\n${YELLOW}[Step 3/6] Setting up Firewall rules (UFW)...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp          # SSH
ufw allow 80/tcp          # HTTP
ufw allow 443/tcp         # HTTPS
ufw allow 5432/tcp        # PostgreSQL Database port (optional, close if db is private)
echo -e "${YELLOW}Enabling firewall...${NC}"
ufw --force enable
ufw status verbose

# 4. Install Docker & Docker Compose (v2)
echo -e "\n${YELLOW}[Step 4/6] Installing Docker Engine & Docker Compose...${NC}"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Check docker status
systemctl enable docker
systemctl start docker
docker --version
docker compose version

# 5. Create Storage Directories and Files
echo -e "\n${YELLOW}[Step 5/6] Creating deployment project directories...${NC}"
mkdir -p /opt/gt-crm
cd /opt/gt-crm

# Create placeholder .env file
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating config .env file skeleton...${NC}"
  cat <<EOT >> .env
# --- DATABASE CONFIG ---
DB_PASSWORD=replace_with_strong_database_password_here

# --- NEXT.JS CONFIG ---
NEXT_PUBLIC_SUPABASE_URL=http://crm-api.gtgroupedu.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace_with_vps_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=replace_with_vps_supabase_service_role_key

# --- GOOGLE OAUTH ---
GOOGLE_CLIENT_ID=your_google_cloud_client_id
GOOGLE_CLIENT_SECRET=your_google_cloud_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://crm.gtgroupedu.com/api/auth/google/callback

# --- EMAIL NOTIFICATION KEY ---
RESEND_API_KEY=your_resend_api_key
EOT
  chmod 600 .env
  echo -e "${GREEN}.env file created at /opt/gt-crm/.env (Please fill in the variables!)${NC}"
fi

# 6. Setup Daily PostgreSQL Backup Cronjob
echo -e "\n${YELLOW}[Step 6/6] Establishing Daily PostgreSQL Backup Cronjob...${NC}"
BACKUP_SCRIPT="/opt/gt-crm/backup_db.sh"
cat <<'EOF' > "$BACKUP_SCRIPT"
#!/usr/bin/env bash

# GT Group CRM - Daily DB backup Script
BACKUP_DIR="/opt/gt-crm/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/gt_crm_db_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

# Run PostgreSQL dump through Docker container
docker exec -t gt-crm-db pg_dump -U postgres postgres | gzip > "$BACKUP_FILE"

# Keep only the last 30 days of backups locally
find "$BACKUP_DIR" -type f -mtime +30 -name "*.sql.gz" -delete

# OPTIONAL: Upload to S3 (Uncomment if aws-cli or rclone is configured)
# aws s3 cp "$BACKUP_FILE" s3://gtgroup-crm-backups/database/
EOF

chmod +x "$BACKUP_SCRIPT"

# Add backup script to root crontab (run daily at 2:00 AM)
CRON_JOB="0 2 * * * $BACKUP_SCRIPT"
(crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT") || (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}  SUCCESS: VPS INITIAL SETUP & SECURITY HARDENING COMPLETED!          ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Edit /opt/gt-crm/.env on your server and paste in your production secret values."
echo -e "2. Copy docker-compose.prod.yml and Caddyfile to /opt/gt-crm/ directory."
echo -e "3. Build & Run the system: docker compose -f docker-compose.prod.yml up -d --build"
echo -e "${GREEN}======================================================================${NC}"
