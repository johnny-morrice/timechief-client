import { SmallStatusNote } from "./smallStatusNote";
import { SmallFortune } from "./smallFortune";
import { setActionCenterSignals } from "./actionCenterMascot";


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

function getNextEventShortText(signals) {
    const nextEvent = signals.nextEvent();
    if (!nextEvent) {
        return "";
    }
    return nextEvent.eventShortText(20);
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

export function SmallActionCenter(props) {
    const signals = props.signals;
    setActionCenterSignals(signals);
    return <div id="action-center" class="home-action-center flex-grow crt-box home-box">
        <div id="home-action-center-content" className={`flex-row flex-grow ${signals.actionCentreTransition()}`}>
            <Show when={hasNextEvent(signals)}>
                <div class='next-event-wrapper'>
                    <div class='next-event-summary flex-row flex-grow'>
                        <div class='next-event-time flex-row'>
                            <div class='next-event-time'>{getNextEventStartTime(signals)}</div>
                        </div>
                        <div class='next-event-shorttext'>
                            {getNextEventShortText(signals)}
                        </div>
                    </div>
                </div>
            </Show>
            <Show when={!hasNextEvent(signals)}>
                <SmallFortune />
            </Show>
            <SmallStatusNote />
        </div>
    </div>;
}