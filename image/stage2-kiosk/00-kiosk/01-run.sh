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

cp -r "${TIMECHIEF_ROOT}" "${ROOTFS_DIR}/opt"
find "${ROOTFS_DIR}/opt/timechief-launcher" | xargs chown 1000:1000