import { StatusNote } from "./statusNote";
import { Fortune } from "./fortune";
import { EventMascotCanvas, setActionCenterSignals } from "./actionCenterMascot";

function hasNextEvent(signals) {
    const nextEvent = signals.nextEvent();
    if (!nextEvent) {
        return false;
    }
    if (!nextEvent.eventShortText()) {
        return false;
    }
    return true;
}

function getNextEventShortText(signals, truncateLength = 20) {
    const nextEvent = signals.nextEvent();
    if (!nextEvent) {
        return "";
    }
    return nextEvent.eventShortText(truncateLength);
}

function getNextEventStartTime(signals) {
    const nextEvent = signals.nextEvent();
    if (!nextEvent) {
        return "";
    }
    return nextEvent.formatStartTime(getLocale(signals), getTimeZone(signals));
}

function getTimeZone(signals) {
    let tz = signals.timeZone();
    if (tz) {
        return tz;
    }
    return "Europe/London";
}


function getLocale(signals) {
    const locale = signals.locale();
    if (!locale) {
        return "en-GB";
    }
    return locale;
}

function titleText(signals) {
    if (hasNextEvent(signals)) {
        return `${getNextEventStartTime(signals)} - ${getNextEventShortText(signals, 10)}`;
    }

    return "Fortune Cookie"
}

export function ActionCenter(props) {
    const signals = props.signals;
    setActionCenterSignals(signals);
    return <div id="action-center" class="window home-action-center flex-grow border crt-box home-box">
        <div class="title-bar">
            <div class="title-bar-text">{titleText(signals)}</div>
            <div class="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
            </div>
        </div>
        <div class="window-body">
            <div id="home-action-center-content" className={`flex-row flex-grow ${signals.actionCentreTransition()}`}>
                <StatusNote />
            <Show when={hasNextEvent(signals)}>
                <div class='next-event-wrapper'>
                    <div class='next-event-summary flex-column flex-grow'>
                        <div class='next-event-time flex-row'>
                            <div class='next-event-icon'><i class="fa-solid fa-calendar-day"></i></div>
                            <div class='next-event-time'>{getNextEventStartTime(signals)}</div>
                        </div>
                        <div class='next-event-shorttext'>
                            {getNextEventShortText(signals)}
                        </div>
                    </div>
                    <EventMascotCanvas />
                </div>
            </Show>
            <Show when={!hasNextEvent(signals)}>
                <Fortune />
            </Show>
            </div>
        </div>
    </div>;
}