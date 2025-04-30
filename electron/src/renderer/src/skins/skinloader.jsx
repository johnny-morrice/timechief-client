import { render } from 'solid-js/web';
import { createSignal, onCleanup, Show } from 'solid-js';
import { addServiceDataCallback, removeDataCallback, initializeIPC } from '../ipc';
import { NostroSkin } from "./nostro/skin";
import { callbackName } from '../util/callback';

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
        setSkin(skinName);
    });
    onCleanup(() => {
        removeDataCallback(cbName);
    });

    return <>
        <Show when={skin() === "nostro"}>
            <NostroSkin />
        </Show>
        <Show when={skin() === "winning"}>
            <h1>Winning skin placeholder</h1>
        </Show>
    </>
} 

function App(props) {
    console.log("App render");
    let ipcIntervals = initializeIPC();
    onCleanup(() => {
        ipcIntervals.forEach(interval => clearInterval(interval));
    });

    return <SkinnedApp />
};

export function attachApp() {
    render(() => <App />, document.getElementById('app'));
}