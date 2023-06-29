import { createSignal, onCleanup } from "solid-js";

function hasWidget(widgets) {
    return widgets.length > 0;
}
function nextIndex(currentIndex, widgets) {
    if (currentIndex + 1 >= widgets.length) {
        return 0;
    }
    return currentIndex + 1;
}
function prevIndex(currentIndex, widgets) {
    if (currentIndex - 1 < 0) {
        return widgets.length - 1;
    }
    return currentIndex - 1;
}

function getCurrentWidget(widgets, currentIndex) {
    return widgets[currentIndex()];
}
function getPrevWidget(widgets, currentIndex) {
    const index = prevIndex(currentIndex(), widgets);
    return widgets[index];
}
function getNextWidget(widgets, currentIndex) {
    const index = nextIndex(currentIndex(), widgets);
    return widgets[index];
}

const transitionDurationMs = 100;

function onClickNext(widgets, currentIndex, setCurrentIndex) {
    return changeSwitcherContent(nextIndex, widgets, currentIndex, setCurrentIndex);
}

function onClickPrev(widgets, currentIndex, setCurrentIndex) {
    return changeSwitcherContent(prevIndex, widgets, currentIndex, setCurrentIndex);
}

function changeSwitcherContent(func, widgets, currentIndex, setCurrentIndex) {
    return () => {
        applyClassToElement("fade-out", "switcher-widget-content");
        const timerA = setTimeout(() => {
            removeClassFromElement("fade-out", "switcher-widget-content");
            applyClassToElement("fade-in", "switcher-widget-content");
            setCurrentIndex(func(currentIndex(), widgets));
            const timerB = setTimeout(() => {
                removeClassFromElement("fade-in", "switcher-widget-content");
            }, transitionDurationMs);
            onCleanup(() => {
                clearTimeout(timerB);
            });
        }, transitionDurationMs);
        onCleanup(() => {
            clearTimeout(timerA);
        });
    };
}

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

export const SwitcherWidget = (props) => {
    const widgets = props.widgets;
    const [currentIndex, setCurrentIndex] = createSignal(0);

    return <div class="switcher-widget flex-column flex-grow">
        <Show when={hasWidget(widgets)}>
            <div id="switcher-widget-content">
                {getCurrentWidget(widgets, currentIndex).element()}
            </div>
            <div class="switcher-widget-button-wrapper flex-row flex-grow">
                <div class="switcher-widget-button switcher-widget-prev-button">
                    <button class="action-button crt-box" onClick={onClickPrev(widgets, currentIndex, setCurrentIndex)}><i class="fa-solid fa-chevron-left"></i> &nbsp;&nbsp; {getPrevWidget(widgets, currentIndex).icon()}</button>
                </div>
                <div class="switcher-widget-button switcher-widget-current-icon">
                    {getCurrentWidget(widgets, currentIndex).icon()}
                </div>
                <div class="switcher-widget-button switcher-widget-next-button">
                    <button class="action-button crt-box" onClick={onClickNext(widgets, currentIndex, setCurrentIndex)}>{getNextWidget(widgets, currentIndex).icon()} &nbsp;&nbsp; <i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>
        </Show>
    </div>;  
};