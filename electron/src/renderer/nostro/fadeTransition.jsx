import { onCleanup } from "solid-js";

export const fadeTransition = (doChange, contentID) => {
    applyClassToElement("fade-out", contentID);
    const timerA = setTimeout(() => {
        removeClassFromElement("fade-out", contentID);
        applyClassToElement("fade-in", contentID);
        doChange();
        const timerB = setTimeout(() => {
            removeClassFromElement("fade-in", contentID);
        }, transitionDurationMs);
        onCleanup(() => {
            clearTimeout(timerB);
        });
    }, transitionDurationMs);
    onCleanup(() => {
        clearTimeout(timerA);
    });
}

const transitionDurationMs = 100;

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
