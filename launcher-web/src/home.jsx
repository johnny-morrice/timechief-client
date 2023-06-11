import { getDeviceData } from "./api";

export const Home = () => {
    // Start a poll for device data
    // This is going to function as a heartbeat but all the crucial information we need is also there.
    function pollDeviceData() {
        getDeviceData().then(data => {
            console.log(data);
        });
    }

    // Poll every 5 seconds
    setInterval(pollDeviceData, 5000);
    return <div>
        <div id="app-root">
            <nav class="site-nav-bar">
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
            </nav>
            <div class="root-wrapper">
                <div class="main-content">
                    <h1>It works!</h1>
                    <p>Font awesome loaded indicator below</p>
                    <i class="fa-solid fa-thumbs-up"></i>
                </div>
            </div>
            <footer class="footer">Footer content</footer>
        </div>
    </div>;
}