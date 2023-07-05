import { onCleanup } from "solid-js";

const transitionDurationMs = 190;

export const fadeTransition = (contentID, doChange) => {
    // console.log("starting fade transition");
    applyClassToElement("fade-out", contentID);
    var actionIndex = 0;
    const actions = [
        () => {
            removeClassFromElement("fade-out", contentID);
            applyClassToElement("fade-in", contentID);
            doChange();
        },
        () => {
            removeClassFromElement("fade-in", contentID);
        },
    ];
    const interval = setInterval(() => {
        // console.log("fade transition interval");
        if (actionIndex < actions.length) {
            // console.log("fade transition action: ", actionIndex)
            actions[actionIndex]();
            actionIndex++;
        } else {
            // console.log("fade transition done");
            clearInterval(interval);
        }
    }, transitionDurationMs);
    onCleanup(() => {
        // console.log("cleaning up fade transition");
        removeClassFromElement("fade-out", contentID);
        removeClassFromElement("fade-in", contentID);
        clearInterval(interval);
    });
};

function applyClassToElement(cls, id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add(cls);
    }
}

function removeClassFromElement(cls, id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove(cls);
    }
}
