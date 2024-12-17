export async function getMe(token) {
    if (!token) {
        throw new Error('no token');
    }
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        }
    };
    const url = `/auth/me`;
    return await fetch(url, options).then(response => {
        if (response.status === 401) {
            console.log("auth failed, reloading");
            window.location.reload();
        }
        if (response.status !== 200) {
            throw new Error('Not authorized');
        }
        return response.json();
    });
}

export async function getListNetworks(token) {
    if (!token) {
        throw new Error('no token');
    }
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        }
    };
    const url = `/web-setup/wifi`;
    return await fetch(url, options).then(response => {
        if (response.status === 401) {
            console.log("auth failed, reloading");
            window.location.reload();
        }
        if (response.status !== 200) {
            throw new Error('Not authorized');
        }
        return response.json()
    });
}

export async function postNetworkSelect(token, ssid, key) {
    if (!token) {
        throw new Error('no token');
    }
    if (!ssid) {
        throw new Error('no ssid');
    }
    if (!key) {
        throw new Error('no key');
    }

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
    const url = `/web-setup/wifi`;
    return await fetch(url, options).then(response => {
        if (response.status !== 204) {
            throw new Error('Not authorized');
        }
    });
}