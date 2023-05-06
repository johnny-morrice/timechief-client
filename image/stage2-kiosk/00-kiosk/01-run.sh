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

# Autologin
on_chroot << EOF
    systemctl --quiet set-default multi-user.target
    cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf << CATEND
[Service]
ExecStart=
ExecStart=-/sbin/agetty --noissue --skip-login --autologin $FIRST_USER_NAME --noclear %I \$TERM
CATEND
EOF


# timechief-launcher daemon.
on_chroot << EOF

[Unit]
Description=TimeChief Launcher Service
After=network.target

[Service]
User=$FIRST_USER_NAME
Group=$FIRST_USER_NAME
WorkingDirectory=/opt/timechief-launcher
ExecStart=/opt/timechief-launcher/bin/timechief-launcher daemon
Restart=always

[Install]
WantedBy=multi-user.target
CATEND
    systemctl enable timechief-launcher
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
on_chroot << EOF
cat > /etc/systemd/system/hostapd-timechief.service << CATEND
[Unit]
Description=HostAP Daemon
After=syslog.target network.target

[Service]
Type=simple
ExecStart=/usr/sbin/hostapd -B -P /run/hostapd.pid /tmp/hostapd.conf
ExecReload=/bin/kill -HUP \$MAINPID
PIDFile=/run/hostapd.pid
User=root
Group=root

[Install]
WantedBy=multi-user.target
CATEND
    systemctl disable hostapd-timechief
    systemctl disable hostapd

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

# Shutdown without password
on_chroot << EOF
echo "user_name ALL=(ALL) NOPASSWD: /sbin/poweroff, /sbin/reboot, /sbin/shutdown" >> /etc/sudoers
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