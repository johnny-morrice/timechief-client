
class LauncherClient {
    constructor(axios) {
        this.axios = axios;
        this.baseURL = getAPIBaseURL();
    }

    reboot() {
        let cfg = {
            url: this.baseURL + '/api/system/reboot',
            method: 'post'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status != 204) {
                logger.error(`reboot failed: ${resp.status}`);
                return {
                    "APIError": "reboot failed"
                }
            }
            return {};
        });
    }

    shutdown() {
        let cfg = {
            url: this.baseURL + '/api/system/shutdown',
            method: 'post'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status != 204) {
                logger.error(`shutdown failed: ${resp.status}`);
                return {
                    "APIError": "shutdown failed"
                }
            }
            return {};
        });
    }

    postLoggedIn() {
        let cfg = {
            url: this.baseURL + '/api/launcher/on-login',
            method: 'post'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 204) {
                return {};
            }
        });
    }

    createPairing() {
        let cfg = {
            url: this.baseURL + '/api/data/pairing',
            method: 'post'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 204) {
                return {};
            }
        });
    }

    getPairing() {
        let cfg = {
            url: this.baseURL + '/api/data/pairing',
            method: 'get'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return resp.data;
            }
        });
    }
    postSetupBeginState() {
        let cfg = {
            url: this.baseURL + '/api/launcher/setup',
            method: 'post',
            data: {
                "State": "Begin"
            }
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return {};
            }
        });
    }

    postSetupInternetConnectedState() {
        let cfg = {
            url: this.baseURL + '/api/launcher/setup',
            method: 'post',
            data: {
                "State": "InternetConnected"
            }
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return {};
            }
        });
    }

    postWifiConnect() {
        let cfg = {
            url: this.baseURL + '/api/system/wifi/connect',
            method: 'post',
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return {};
            }
        });
    }

    postWifiMarkReady() {
        let cfg = {
            url: this.baseURL + '/api/system/wifi/state',
            method: 'post',
            data: {
                "Ready": true
            }
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return {};
            }
        });
    }

    postLogOut() {
        let cfg = {
            url: this.baseURL + '/api/data/logout',
            method: 'post'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 204) {
                return {};
            }
        });
    }

    postWifiMarkNotReady() {
        let cfg = {
            url: this.baseURL + '/api/system/wifi/state',
            method: 'post',
            data: {
                "Ready": false
            }
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return {};
            }
        });
    }

    postRefreshMyDevices() {
        let cfg = {
            url: this.baseURL + '/api/data/mydevice/refresh',
            method: 'post'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 204) {
                return {};
            }
        });
    }

    getDeviceData() {
        let cfg = {
            url: this.baseURL + '/api/data/device',
            method: 'get'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return resp.data;
            }
        });
    }

    postSSHEnabled(isEnabled) {
        if (typeof isEnabled !== 'boolean') {
            console.log("isEnabled must be a boolean but was: " + JSON.stringify(isEnabled));
            return Promise.reject("isEnabled must be a boolean");
        }
        let cfg = {
            url: this.baseURL + '/api/system/firewall/ssh',
            method: 'post',
            data: {
                "state": isEnabled
            }
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return {};
            }
        });
    }

    postAPIEnabled(isEnabled) {
        let cfg = {
            url: this.baseURL + '/api/system/firewall/api',
            method: 'post',
            data: {
                "state": isEnabled
            }
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return {};
            }
        });
    }

    postSSHRegenPassword() {
        let cfg = {
            url: this.baseURL + '/api/system/ssh/regenerate',
            method: 'post'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return resp.data;
            }
        });
    }

    postAPIRegenKey() {
        let cfg = {
            url: this.baseURL + '/api/launcher/api-key/user',
            method: 'post'
        };
        return this.axios(cfg).then(resp => {
            if (resp.status == 200) {
                return resp.data;
            }
        });
    }
};

function getAPIBaseURL() {
    return process.env.clockAPIBaseURL;
  }

exports.LauncherClient = LauncherClient;