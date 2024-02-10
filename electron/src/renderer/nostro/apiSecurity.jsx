import { onCleanup, createSignal } from "solid-js";
import { callbackName } from "./callback"
import { addServiceDataCallback, removeDataCallback, addAPIRegenKeyCallback, removeAPIRegenKeyCallback, sendAPIRegenKey, sendSetAPIEnabled } from "./ipc";
import { textTransitionSignal } from "./textGlitch";
import { labelMaker } from "./label";

class Signals {
    constructor() {
        [this.key, this.setKey] = textTransitionSignal("********");
        [this.isAPIEnabled, this.setAPIEnabled] = createSignal(false);
        [this.isLoaded, this.setLoaded] = createSignal(false);
    }
}

function updateSignalsOnData(signals, data) {
    signals.setLoaded(true);
}

function updateSignalsOnAPIKeyRegen(signals, data) {
    console.log("updateSignalsOnAPIKeyRegen", JSON.stringify(data));
    if ("key" in data && data["key"].length > 0) {
        signals.setKey(data["key"]);
    }
}

export const APISecurity = () => {
    const signals = new Signals();
    const cbName = callbackName("APISecurity");
    addServiceDataCallback(cbName, (data) => {
        updateSignalsOnData(signals, data);
    });

    addAPIRegenKeyCallback(cbName, (data) => {
        updateSignalsOnAPIKeyRegen(signals, data);
    });

    onCleanup(() => {
        removeDataCallback(cbName);
        removeAPIRegenKeyCallback(cbName);
    });

    function onClickDisableAPI() {
        console.log("onClickDisableAPI");
        sendSetAPIEnabled(false);
    }

    function onClickEnableAPI() {
        console.log("onClickEnableAPI");
        sendSetAPIEnabled(true);
    }

    function onClickRegenKey() {
        console.log("onClickRegenKey");
        sendAPIRegenKey();
    }

    const label = labelMaker("api-security");

    return <div class="api-security flex-grow">
        <Show when={!signals.isLoaded()}>
            <Loading />
        </Show>
        <Show when={signals.isLoaded()}>
            <Show when={signals.isAPIEnabled()}>
                <div class="api-security-enabled flex-row data-label">{label("is-enabled")}</div>
                <div class="api-security-enable-button-wrapper">
                    <button class='action-button crt-box' onClick={onClickDisableAPI}>{label("disable")}</button>
                </div>
            </Show>
            <Show when={!signals.isAPIEnabled()}>
                <div class="api-security-disabled flex-row data-label">{label("is-disabled")}</div>
                <div class="api-security-enable-button-wrapper">
                    <button class='action-button crt-box' onClick={onClickEnableAPI}>{label("enable")}</button>
                </div>
            </Show>
            <div class="api-security-user flex-row flex-grow">
                <div class="api-security-label flex-row data-label">{label("key")}</div>
                <div class="api-security-value flex-row">{signals.key}</div>
            </div>
            <div class="api-security-regen">
                <button class='action-button crt-box' onClick={onClickRegenKey}>{label("regen-key")}</button>
            </div>
        </Show >
    </div >
}