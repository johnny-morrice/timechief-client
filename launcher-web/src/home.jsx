import { createSignal, onCleanup } from "solid-js";
import { getDeviceData } from "./api";

export const Home = () => {
    var [setupState, setSetupState] = createSignal("");
    var [networks, setNetworks] = createSignal([]);
    var [selectedNetwork, setSelectedNetwork] = createSignal("");
    var [lastUpdateTime, setLastUpdateTime] = createSignal(new Date());

    const isLoading = () => {
        return setupState() !== "WaitUserSelectNetwork";
    }
    const isDisplayNetworks = () => {
        const loading = isLoading();
        return !loading && selectedNetwork() === "";
    }

    const isDisplayEnterNetworkKey = () => {
        const loading = isLoading();
        return !loading && selectedNetwork() !== "";
    }

    const isErrorTimeout = () => {
        const timeout = new Date();
        const timeoutDuration = 30;
        timeout.setSeconds(timeout.getSeconds() - timeoutDuration);
        return lastUpdateTime() < timeout;
    }

    const hasNetworks = () => {
        return networks().length > 0;
    }

    const onNetworkSelectBack = () => {
        setSelectedNetwork("");
    }

    const onNetworkSelect = (network) => {
        return () => setSelectedNetwork(network);
    };

    const onNetworkConnectClick = () => {
        const ssid = selectedNetwork();
        const key = document.getElementById("network-key-input").value;
        const messageElem = document.getElementById("network-key-input-message");
        // Use postNetworkSelect to send the network key to the device.
        // If this method is successful, we may never get a response because of a race condition when the device changes networks.
        // If we get a response with a 400 or 500 error code, it means either the SSID is bad or the network key failed to validate.
        // We cannot at this stage know if the network key is correct or not.
        // If we get a response with a 200 error code, it means the network key was accepted and the device is attempting to connect to the network.
        postNetworkSelect(ssid, key).then(data => {
            // Check for in status code in 200 range
            if (data.status >= 200 && data.status < 300) {
                // Write a message to the user that the network key was accepted and the device is attempting to connect to the network.
                messageElem.innerHTML = "Network key accepted.  Check your device for updates";
            } else if (data.status >= 400 && data.status < 600) {
                // Write a message to the user that the network key was not accepted and the device is attempting to connect to the network.
                console.log("error response selecting network");
                console.log(data);
                messageElem.innerHTML = "Network key not accepted.";
            }
        }).catch(error => {
            // It could be that the device has had a network change because is has successfully connected.  Or it could be some other kind of error.
            // We cannot know this is an error case.  We will just write a message to the user to check their device.
            console.log("error after selecting network")
            console.log(error);
            messageElem.innerHTML = "Check your device for updates";
        });
    }

    const NetworkList = () => {
        return <div>
            <ul class="network-list">
            <Index each={networks()}>{(network, i) =>
                <li>
                    <button onClick={onNetworkSelect(network)}>{network()}</button>    
                </li>
                }</Index>
            </ul>
        </div>   
    }
    
    const Loading = () => {
        return <div>
            <div class="loading-message">
                <p>Loading <i class="fa-solid fa-spinner fa-spin"></i></p>
                <p>Check your device for updates</p>
            </div>
        </div>
    }

    const EnterNetworkKey = () => {
        return <div>
            <div class="network-key-input">
                <div id="network-key-input-message"></div>
                <div class="network-key-input-label">
                    Enter network key for {selectedNetwork()}
                </div>
                <div class="network-key-input-field">
                    <input type="password" id="network-key-input"/>
                </div>
                <div class="network-key-input-button">
                    <button onClick={onNetworkConnectClick}>Connect</button>
                </div>
                <div class="network-key-input-back">
                    <button onClick={onNetworkSelectBack}>Back</button>
                </div>
            </div>
        </div>
    }

    // Start a poll for device data
    // This is going to function as a heartbeat but all the crucial information we need is also there.
    function pollDeviceData() {
        // {
        //     "LauncherState": {
        //         "ActiveTargetVersion": "timechief-linux-arm64 dev-sys v0.0.169",
        //         "SetupState": "WaitUserSelectNetwork",
        //         "WebURL": "http://172.16.0.1/",
        //         "WifiState": {
        //             "ActiveWifiInterface": "wlan0",
        //             "InterfaceMode": "Master",
        //             "ActiveSSID": "",
        //             "IsWifiError": false,
        //             "HotspotSSID": "timechief414948",
        //             "HotspotKey": "tc782297",
        //             "WifiNetworks": [
        //                 {
        //                     "SSID": "jammyBeanTaters2.4",
        //                     "SignalStrength": 57
        //                 },
        //                 {
        //                     "SSID": "jammyBeanTaters",
        //                     "SignalStrength": 70
        //                 }
        //             ]
        //         }
        //     }
        getDeviceData().then(data => {
            if (data) {
                if ("LauncherState" in data) {
                    const launcherState = data.LauncherState;
                    setSetupState(launcherState.SetupState);
                    if ("WifiState" in launcherState && "WifiNetworks" in launcherState.WifiState) {
                        setNetworks(launcherState.WifiState.WifiNetworks);
                    }
                    setLastUpdateTime(new Date());
                }
            }
        });
    }

    // Poll every 5 seconds
    const pollInterval = setInterval(pollDeviceData, 5000);
    onCleanup(() => clearInterval(pollInterval));
    return <div>
        <div id="app-root">
            <div class="site-nav-bar">
                <div class="main-links">
                    <div class="site-name-home">Timechief</div>
                    <div class="bar-devices-wrapper">
                        <div class="bar-device-setup">
                            DEVICE SETUP
                        </div>
                    </div>
                </div>
                <div class="bar-account-wrapper">
                    <div class="status-indicator">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                </div>
            </div>
            <div class="root-wrapper">
                <div class="main-content">
                    <h1>It works!</h1>
                    <p>Font awesome loaded indicator below</p>
                    <i class="fa-solid fa-thumbs-up"></i>
                </div>
            </div>
        </div>
    </div>;
}