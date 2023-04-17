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