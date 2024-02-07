import { onCleanup, createSignal } from "solid-js";
import { callbackName } from "./callback"
import { addServiceDataCallback, removeDataCallback } from "./ipc";
import { textTransitionSignal } from "./textGlitch";
import { labelMaker } from "./label";

class Signals {
    constructor() {
        [this.sshUser, this.setSSHUser] = textTransitionSignal("********");
        [this.sshPassword, this.setSSHPassword] = textTransitionSignal("********");
        [this.isSshEnabled, this.setSSHEnabled] = createSignal(false);
        [this.isLoaded, this.setLoaded] = createSignal(false);
    }
}

function updateSignalsOnData(signals, data) {
    signals.setLoaded(true);
}

function updateSignalsOnSSHPasswordRegen(signals, data) {
}

export const SSHSecurity = () => {
    const signals = new Signals();
    const cbName = callbackName("SSHSecurity");
    addServiceDataCallback(cbName, (data) => {
        updateSignalsOnData(signals, data);
    });

    onCleanup(() => {
        removeDataCallback(cbName);
    });

    const label = labelMaker("ssh-security");

    return <div class="current-weather flex-grow">
        <Show when={!signals.isLoaded()}>
            <Loading />
        </Show>
        <Show when={signals.isLoaded()}>
            <div class="ssh-security-title flex-row">{label("title")}</div>
            <Show when={signals.isSshEnabled()}>
                <div class="ssh-security-enabled flex-row">{label("is-enabled")}</div>
                <button class='action-button crt-box' >{label("disable")}</button>
            </Show>
            <Show when={!signals.isSshEnabled()}>
                <div class="ssh-security-disabled flex-row">{label("is-disabled")}</div>
                <button class='action-button crt-box'>{label("enable")}</button>
            </Show>
            <div class="ssh-security-regen">
                <button class='action-button crt-box'>{label("regen-password")}</button>
            </div>
            <div class="ssh-security-user flex-row flex-grow">
                <div class="ssh-security-label flex-row">{label("username")}</div>
                <div class="ssh-security-value flex-row">{signals.sshUser}</div>
            </div>
            <div class="ssh-security-password flex-row flex-grow">
                <div class="ssh-security-label flex-row">{label("password")}</div>
                <div class="ssh-security-value flex-row">{signals.sshPassword}</div>
            </div>
        </Show >
    </div >
}