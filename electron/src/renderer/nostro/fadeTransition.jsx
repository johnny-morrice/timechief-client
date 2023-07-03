import { onCleanup } from "solid-js";

const transitionDurationMs = 190;

export const fadeTransition = (contentID, doChange) => {
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
        console.log("actionIndex: " + actionIndex);
        if (actionIndex < actions.length) {
            actions[actionIndex]();
            actionIndex++;
        } else {
            clearInterval(interval);
        }
    }, transitionDurationMs);
    onCleanup(() => {
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
