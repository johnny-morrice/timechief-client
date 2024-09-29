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

    return <div class="switcher-widget flex-column flex-grow">
        <Show when={hasWidget(widgets)}>
            <div id="switcher-widget-content" className={switcherWidgetTransition()}>
                {getCurrentWidget(widgets, currentIndex).element()}
            </div>
            <div class="switcher-widget-button-wrapper flex-row flex-grow">
                <div class="switcher-widget-button switcher-widget-prev-button">
                    <button class="action-button crt-box" onClick={onClickPrev(setSwitcherWidgetTransition, widgets, currentIndex, setCurrentIndex)}><i class="fa-solid fa-chevron-left"></i> &nbsp;&nbsp; {getPrevWidget(widgets, currentIndex).icon()}</button>
                </div>
                <div class="switcher-widget-button switcher-widget-current-icon">
                    {getCurrentWidget(widgets, currentIndex).icon()}
                </div>
                <div class="switcher-widget-button switcher-widget-next-button">
                    <button class="action-button crt-box" onClick={onClickNext(setSwitcherWidgetTransition, widgets, currentIndex, setCurrentIndex)}>{getNextWidget(widgets, currentIndex).icon()} &nbsp;&nbsp; <i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>
        </Show>
    </div>;  
};