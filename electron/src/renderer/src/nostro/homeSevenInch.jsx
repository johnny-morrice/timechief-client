import { CurrentWeather } from './currentWeather';
import { StatusNote } from './statusNote';
import { SwitcherWidget } from './switcherWidget';
import { DeviceControl } from './deviceControl';
import { Astro } from './astro';
import { Fortune } from './fortune';
import { DeviceInfo } from './deviceInfo';
import { Locale } from './locale';
import { Forecast } from './forecast';
import { EventCalendar } from './eventCalendar';
import { SSHSecurity } from './sshSecurity';
import { APISecurity } from './apiSecurity';
import { Debug } from './debugPanel';


function getNextEventStartTime(signals) {
    const nextEvent = signals.nextEvent();
    if (!nextEvent) {
        return "";
    }
    return nextEvent.formatStartTime(getLocale(signals), getTimeZone(signals));
}

function getNextEventShortText(signals) {
    const nextEvent = signals.nextEvent();
    if (!nextEvent) {
        return "";
    }
    return nextEvent.eventShortText();
}

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

export function HomeSevenInch(props) {
    const signals = props.signals;
    const switcherWidgets = [
        { icon: () => <i class="fa-solid fa-cloud-sun"></i>, element: () => <CurrentWeather /> },
        { icon: () => <i class="fa-solid fa-gear"></i>, element: () => <DeviceControl /> },
        { icon: () => <i class="fa-solid fa-network-wired"></i>, element: () => <DeviceInfo /> },
        { icon: () => <i class="fa-brands fa-linux"></i>, element: () => <SSHSecurity /> },
        { icon: () => <i class="fa-solid fa-house-laptop"></i>, element: () => <APISecurity /> },
        { icon: () => <i class="fa-solid fa-earth-americas"></i>, element: () => <Locale /> },
        { icon: () => <i class="fa-solid fa-moon"></i>, element: () => <Astro /> },
        { icon: () => <i class="fa-solid fa-mountain-sun"></i>, element: () => <Forecast /> },
        { icon: () => <i class="fa-solid fa-calendar-days"></i>, element: () => <EventCalendar /> },
    ];

    const useDebug = false;
    if (useDebug) {
        switcherWidgets.push(
            { icon: () => <i class="fa-solid fa-fire"></i>, element: () => <Debug /> },
        )
    }

    return <div class="home-screen flex-row">
        <div class="home-lhs-column flex-column flex-grow">
            <SwitcherWidget widgets={switcherWidgets} />
        </div>
        <div class='home-rhs-column flex-column flex-grow'>
            <div id="date-time" class="home-time-wrapper flex-grow">
                <div class="home-time">{signals.myTime}</div>
                <div class="home-date">{signals.myDate}</div>
            </div>

            <div id="action-center" class="home-action-center flex-grow border crt-box home-box">
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
                            <div class="event-mascot-wrapper">
                                <canvas id="event-canvas" class="fortune-mascot" data-sig-fg-color={signals.foregroundColor()} data-sig-bg-color={signals.boxBackgroundColor()} data-sig-emote={signals.emote()}></canvas>
                            </div>
                        </div>
                    </Show>
                    <Show when={!hasNextEvent(signals)}>
                        <Fortune />
                    </Show>
                </div>
            </div>
        </div>
    </div>
}