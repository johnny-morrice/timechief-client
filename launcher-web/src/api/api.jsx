export async function getMe(token) {
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        }
    };
    const url = `/auth/me`;
    return await fetch(url, options).then(response => response.json());

}

export async function getListNetworks(token) {
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        }
    };
    const url = `/web-setup/network`;
    return await fetch(url, options).then(response => response.json());
}

export async function postNetworkSelect(ssid, key, token) {
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
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