import { onCleanup, Show } from "solid-js";
import { callbackName } from "./callback";
import { addDebugSystemCallback, removeDebugSystemCallback, sendDebugSystem } from "./ipc";
import { Loading } from "./loading";

class Signals {
    constructor() {
        [this.debugMessage, this.setDebugMessage] = createSignal("");
    }
}

function updateSignals(signals, data) {
    const message = data["message"];
    if (message) {
        signals.setDebugMessage(message);
    }
}

export function NoConnection() {
    console.log("NoConnection render");
    const signals = new Signals();
    const cbName = callbackName("NoConnection");
    addDebugSystemCallback(cbName, (data) => {
        console.log(`NoConnection callback: ${JSON.stringify(data)}`);
        updateSignals(signals, data);
    });
    onCleanup(() => {
        removeDebugSystemCallback(cbName);
        console.log("NoConnection cleanup");
    })

    function hasDebugMessage(signals) {
        return signals.debugMessage() !== "";
    }

    function onClickDebug() {
        sendDebugSystem();
    }

    return <div class="system-error">
        <div>No connection to local Linux service</div>
        <Loading />
        
        <button class="action-button debug-button" onClick={onClickDebug}>Debug</button>
        
        <Show when={hasDebugMessage(signals)}>
            <div class="debug-message">{signals.debugMessage()}</div>
        </Show>
    </div>;
}