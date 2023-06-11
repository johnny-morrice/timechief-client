export const Home = () => {
    return <div>
        <div id="app-root">
            <nav class="site-nav-bar">
                <div class="main-links">
                    <div class="site-name-home" onClick={displayHomePage}>Timechief</div>
                    <div class="bar-devices-wrapper">
                        <div class="bar-devices-button" onClick={onClickShowDevices}>
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
                <div class="footer">Footer content</div>
            </div>
        </div>
    </div>;
}