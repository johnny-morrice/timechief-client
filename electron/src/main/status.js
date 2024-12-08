import { networkInterfaces } from 'os';

function getIpAddress() {
    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            // Just return the first IP address
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                return net.address;
            }
        }
    }

    return "unknown";
}

function getClientVersion() {
    return process.env.TIMECHIEF_CLIENT_VERSION;
}


function getWwwBaseURL() {
    return process.env.TIMECHIEF_WWW_BASE_URL;
}

export function baseDeviceStatus() {
    return {
        "status": "ok",
        "ip_address": getIpAddress(),
        "www_base_url": getWwwBaseURL(),
        "client_version": getClientVersion()
    }
}