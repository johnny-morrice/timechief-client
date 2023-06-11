export async function getDeviceData() {
    options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    };
    const url = `/api/data/device`;
    return await fetch(url, options).then(response => response.json());
}