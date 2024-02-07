import { onCleanup, createSignal } from "solid-js";
import { callbackName } from "./callback"
import { addServiceDataCallback, removeDataCallback, addSSHPasswordRegenCallback, removeSSHPasswordRegenCallback, sendSSHRegenPassword, sendSetSSHEnabled } from "./ipc";
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
    console.log("updateSignalsOnSSHPasswordRegen", JSON.stringify(data));
    if ("password" in data && data["password"].length > 0 && "username" in data && data["username"].length > 0) {
        signals.setSSHUser(data["username"]);
        signals.setSSHPassword(data["password"]);
    }
}

export const SSHSecurity = () => {
    const signals = new Signals();
    const cbName = callbackName("SSHSecurity");
    addServiceDataCallback(cbName, (data) => {
        updateSignalsOnData(signals, data);
    });

    addSSHPasswordRegenCallback(cbName, (data) => {
        updateSignalsOnSSHPasswordRegen(signals, data);
    });

    onCleanup(() => {
        removeDataCallback(cbName);
        removeSSHPasswordRegenCallback(cbName);
    });

    function onClickDisableSSH() {
        console.log("onClickDisableSSH");
        sendSetSSHEnabled(false);
    }

    function onClickEnableSSH() {
        console.log("onClickEnableSSH");
        sendSetSSHEnabled(true);
    }

    function onClickRegenPassword() {
        console.log("onClickRegenPassword");
        sendSSHRegenPassword();
    }

    const label = labelMaker("ssh-security");

    return <div class="ssh-security flex-grow">
        <Show when={!signals.isLoaded()}>
            <Loading />
        </Show>
        <Show when={signals.isLoaded()}>
            <div class="ssh-security-title flex-row">{label("title")}</div>
            <Show when={signals.isSshEnabled()}>
                <div class="ssh-security-enabled flex-row">{label("is-enabled")}</div>
                <div class="ssh-security-enable-button-wrapper">
                    <button class='action-button crt-box' onClick={onClickDisableSSH}>{label("disable")}</button>
                </div>
            </Show>
            <Show when={!signals.isSshEnabled()}>
                <div class="ssh-security-disabled flex-row">{label("is-disabled")}</div>
                <div class="ssh-security-enable-button-wrapper">
                    <button class='action-button crt-box' onClick={onClickEnableSSH}>{label("enable")}</button>
                </div>
            </Show>
            <div class="ssh-security-user flex-row flex-grow">
                <div class="ssh-security-label flex-row">{label("username")}</div>
                <div class="ssh-security-value flex-row">{signals.sshUser}</div>
            </div>
            <div class="ssh-security-password flex-row flex-grow">
                <div class="ssh-security-label flex-row">{label("password")}</div>
                <div class="ssh-security-value flex-row">{signals.sshPassword}</div>
            </div>
            <div class="ssh-security-regen">
                <button class='action-button crt-box' onClick={onClickRegenPassword}>{label("regen-password")}</button>
            </div>
        </Show >
    </div >
}