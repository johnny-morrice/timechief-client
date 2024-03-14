export async function getListNetworks() {
    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    };
    const url = `/web-setup/network`;
    return await fetch(url, options).then(response => response.json());
}

export async function postNetworkSelect(ssid, key) {
    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "ssid": ssid,
            "key": key,
        }),
    };
    const url = `/web-setup/network`;
    return await fetch(url, options);
}