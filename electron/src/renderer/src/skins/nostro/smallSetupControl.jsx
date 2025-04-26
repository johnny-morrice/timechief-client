import { sendSetupBegin, sendLogOut } from "./ipc";

function onClickSetup() {
    console.log("setup clicked")
    sendSetupBegin();
}

function onClickLogout() {
    console.log("logout clicked")
    sendLogOut();
}

export const SmallSetupControl = () => {
    console.log("DeviceControl render");

    return <div class="device-control flex-grow">
        <div class="flex-column flex-grow">
                <button class='action-button crt-box flex-grow' onClick={onClickSetup}><i class="fa-solid fa-gear"></i></button>
                <button class='action-button crt-box flex-grow' onClick={onClickLogout}><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
    </div>;
};