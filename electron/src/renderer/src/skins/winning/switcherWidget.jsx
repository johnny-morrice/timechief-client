import { createSignal } from "solid-js";
import { fadeTransition } from "./fadeTransition";

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

function onClickNext(onTransition, widgets, currentIndex, setCurrentIndex) {
    return changeSwitcherContent(onTransition, nextIndex, widgets, currentIndex, setCurrentIndex);
}

function onClickPrev(onTransition, widgets, currentIndex, setCurrentIndex) {
    return changeSwitcherContent(onTransition, prevIndex, widgets, currentIndex, setCurrentIndex);
}

function changeSwitcherContent(onTransition, indexFunc, widgets, currentIndex, setCurrentIndex) {
    return () => {
        fadeTransition(onTransition, () => setCurrentIndex(indexFunc(currentIndex(), widgets)));
    }
}

export const SwitcherWidget = (props) => {
    console.log("SwitcherWidget render");
    const widgets = props.widgets;
    const [switcherWidgetTransition, setSwitcherWidgetTransition] = createSignal("no-transition");
    const [currentIndex, setCurrentIndex] = createSignal(0);

    function getWidgetName(widgets, currentIndex) {
        if (!hasWidget(widgets)) {
            return "Please wait..."
        }
        return widgets[currentIndex()].name;
    }

    return <div id="switcher-widget" class="window switcher-widget flex-column flex-grow border crt-box home-box">
          <div class="title-bar">
            <div class="title-bar-text">{getWidgetName(widgets, currentIndex)}</div>
            <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
            </div>
        </div>
        <div class="window-body switcher-widget-window-body">
        <Show when={hasWidget(widgets)}>
            <div id="switcher-widget-content" className={switcherWidgetTransition()}>
                {getCurrentWidget(widgets, currentIndex).element()}
            </div>
            <div class="switcher-widget-button-wrapper flex-row">
                <div class="switcher-widget-button switcher-widget-prev-button">
                    <button class="action-button crt-box switcher-button" onClick={onClickPrev(setSwitcherWidgetTransition, widgets, currentIndex, setCurrentIndex)}>Previous</button>
                </div>
                <div class="switcher-widget-button switcher-widget-next-button">
                    <button class="action-button crt-box switcher-button" onClick={onClickNext(setSwitcherWidgetTransition, widgets, currentIndex, setCurrentIndex)}>Next</button>
                </div>
            </div>
        </Show>
        </div>
    </div>;  
};