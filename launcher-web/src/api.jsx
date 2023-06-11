export async function getDeviceData() {
    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    };
    const url = `/api/data/device`;
    return await fetch(url, options).then(response => response.json());
}

export async function postNetworkSelect(ssid, key) {
    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            "SSID": ssid,
            "KEY": key,
        },
    };
    const url = `/api/data/device`;
    return await fetch(url, options).then(response => response.json());
}