#!/bin/bash
set -e
set -x

. "${BASE_DIR}/config"
on_chroot << EOF
echo -n "${FIRST_USER_NAME:='pi'}:" > /boot/userconf.txt
openssl passwd -5 "${FIRST_USER_PASS:='raspberry'}" >> /boot/userconf.txt
touch /boot/ssh

echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections
export DEBIAN_FRONTEND=noninteractive
EOF

install -m 644 files/config.txt "${ROOTFS_DIR}/boot/"
install -m 644 files/cmdline.txt "${ROOTFS_DIR}/boot/"
install -m 644 files/nginx.conf "${ROOTFS_DIR}/etc/nginx/sites-available/timechief.conf"
HOME="${ROOTFS_DIR}/home/${FIRST_USER_NAME}"
install -m 644 -o 1000 -g 1000 files/.profile "${HOME}/"
install -m 644 -o 1000 -g 1000 files/.xinitrc "${HOME}/"
install -m 644 -o 1000 -g 1000 files/.hushlogin "${HOME}/"
install -m 755 -o 1000 -g 1000 -d "${HOME}/bin/"

cp -r "${TIMECHIEF_ROOT}" "${ROOTFS_DIR}/opt"
find "${ROOTFS_DIR}/opt/timechief-launcher" | xargs chown 1000:1000

# If the environment variable $CURSOR is "yes", then install the .cursor file.
# This will cause the cursor to be visible on the screen.
if [ "$CURSOR" = "yes" ]; then
    install -m 644 -o 1000 -g 1000 files/.cursor "${HOME}/"
fi

# Set up lightdm for autologin
on_chroot << EOF
cat > /etc/lightdm/lightdm.conf << CATEND
[Seat:*]
autologin-user=timechief
autologin-user-timeout=0
user-session=weston
CATEND
EOF

# Make lightdm use weston for window management
on_chroot << EOF
cat > /usr/share/wayland-sessions/weston.desktop << CATEND
[Desktop Entry]
Name=Weston
Comment=Start Weston compositor
Exec=weston
Type=Application
CATEND
EOF

# Disable the cursor
on_chroot << EOF
cat > /etc/xdg/weston/weston.ini << CATEND
[core]
cursor-size=0
CATEND
EOF

# Set up desktop file to autostart timechief
on_chroot << EOF
cat > /etc/xdg/autostart/timechief.desktop << CATEND
[Desktop Entry]
Name=Timechief Autologin
Comment=Session for autologin with Timechief launcher
Exec=/opt/timechief-launcher/bin/timechief-bootstrap
Type=Application
CATEND
EOF

# timechief-launcher daemon.
# Use sigkill and timeout after 5 seconds.
on_chroot << EOF
cat > /etc/systemd/system/timechief-launcher.service << CATEND
[Unit]
Description=TimeChief Launcher Service
After=network.target timechief-launcher-sound.service

[Service]
User=$FIRST_USER_NAME
Group=$FIRST_USER_NAME
WorkingDirectory=/opt/timechief-launcher
ExecStart=/opt/timechief-launcher/bin/timechief-launcher daemon --system-automation
Restart=always
KillSignal=SIGKILL
TimeoutStopSec=5

[Install]
WantedBy=multi-user.target
CATEND
    systemctl enable timechief-launcher
EOF

# timechief-launcher sound daemon
on_chroot << EOF
cat > /etc/systemd/system/timechief-launcher-sound.service << CATEND
[Unit]
Description=TimeChief Launcher Sound Service
After=network.target

[Service]
WorkingDirectory=/opt/timechief-launcher
ExecStart=/opt/timechief-launcher/bin/timechief-launcher daemon-sound
Restart=always
KillSignal
Nice=1

[Install]
WantedBy=multi-user.target
CATEND
    systemctl enable timechief-launcher-sound
EOF

# DNSMasq unit file.
on_chroot << EOF
cat > /etc/systemd/system/dnsmasq-timechief.service << CATEND
[Unit]
Description=DNSmasq DNS and DHCP server
After=syslog.target network.target

[Service]
ExecStart=/usr/sbin/dnsmasq -k -C /tmp/dnsmasq.conf
Restart=always

[Install]
WantedBy=multi-user.target
CATEND
    systemctl disable dnsmasq-timechief
    systemctl disable dnsmasq
EOF

# Hostapd unit file.
on_chroot << 'EOF'
cat > /etc/systemd/system/hostapd-timechief.service << CATEND
[Unit]
Description=HostAP Daemon
After=syslog.target network.target

[Service]
Type=simple
ExecStart=/usr/sbin/hostapd -B -P /run/hostapd.pid /tmp/hostapd.conf
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/run/hostapd.pid
User=root
Group=root

[Install]
WantedBy=multi-user.target
CATEND
    systemctl disable hostapd-timechief
    systemctl disable hostapd
EOF

# SSH
on_chroot << EOF
    systemctl enable ssh
EOF

# Disable wpa_supplicant.
on_chroot << EOF
    systemctl disable wpa_supplicant
    cat >> /etc/dhcpcd.conf << ENDCAT
interface wlan0
nohook wpa_supplicant
ENDCAT
EOF

# Run secure scripts with sudo
on_chroot << EOF
echo "$FIRST_USER_NAME ALL=(ALL) NOPASSWD: /opt/timechief-launcher/bin/secure/" > /etc/sudoers.d/timechief
EOF

# Change issue
on_chroot << EOF
echo "Timechief Linux \n \l" > /etc/issue
echo >> /etc/issue
echo "Timechief Linux" > /etc/issue.net
EOF

# Set wifi country.
# TODO: we need to do this dynamically at runtime based on the user's location.
on_chroot << EOF
raspi-config nonint do_wifi_country GB
EOF

# Set up nginx proxy.
on_chroot << 'EOF'
# Enable the Nginx configuration for your project
ln -s /etc/nginx/sites-available/timechief.conf /etc/nginx/sites-enabled/

# Disable the default Nginx configuration
rm /etc/nginx/sites-enabled/default

# Restart Nginx to apply the changes
systemctl enable nginx
EOF

# Enable i2c
on_chroot << EOF
raspi-config nonint do_i2c 0
EOF

# Disable username set prompt
on_chroot << EOF
systemctl disable userconfig
rm /etc/systemd/system/multi-user.target.wants/userconfig.service -f
sed -i '/^WantedBy=/d' /usr/lib/systemd/system/userconfig.service
EOF