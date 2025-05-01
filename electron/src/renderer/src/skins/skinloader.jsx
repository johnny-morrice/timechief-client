import { render } from 'solid-js/web';
import { createSignal, onCleanup, Show } from 'solid-js';
import { addServiceDataCallback, removeDataCallback, initializeIPC } from '../ipc';
import { NostroSkin} from "./nostro/skin";
import { WebSetupPage } from './nostro/webSetup';
import { LoginPage } from './nostro/login';
import { callbackName } from '../util/callback';
import { IntroVideo } from '../components/introVideo';
import { MediaVideo } from '../components/mediavideo';
import { WindowResizer } from '../components/windowResizer';
import { ThemeDetector } from '../components/themeDetector';

function SkinnedApp(props) {
    console.log("SkinnedApp render");
    const [skin, setSkin] = createSignal("nostro")
    const cbName = callbackName("app");
    addServiceDataCallback(cbName, (data) => {
        const deviceProfileWrapper = data["device_profile"];
        if (!deviceProfileWrapper) {
            return;
        }
        const deviceProfile = deviceProfileWrapper["value"];
        if (!deviceProfile) {
            return;
        }
        const theme = deviceProfile["theme"];
        if (!theme) {
            return;
        }

        const skinName = theme["skin_name"];
        if (!skinName) {
            return;
        }
        setSkin(skinName);
    });
    onCleanup(() => {
        removeDataCallback(cbName);
    });

    function isUnknownSkin(skin) {
        return skin !== "nostro" && skin !== "winning";
    }

    return <>
        <Show when={skin() === "nostro"}>
            <NostroSkin />
        </Show>
        <Show when={skin() === "winning"}>
            <h1>Winning skin placeholder</h1>
        </Show>
        <Show when={isUnknownSkin(skin())}>
            <h1>Unknown skin: {skin()}</h1>
        </Show>
    </>
}

function App(props) {
    console.log("App render");
    let ipcIntervals = initializeIPC();
    onCleanup(() => {
        ipcIntervals.forEach(interval => clearInterval(interval));
    });

    // We will use nostro skin version of web setup and login pages for now.
    // This will make the job of implementing the first skin easier.
    return <WindowResizer element={
        <IntroVideo element={
            <ThemeDetector element={
                <MediaVideo element={
                    <WebSetupPage element={
                        <LoginPage element={<SkinnedApp />} />} />} />} />} />} />;
};

export function attachApp() {
    render(() => <App />, document.getElementById('app'));
}