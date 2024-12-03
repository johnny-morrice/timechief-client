import { SmallCurrentWeather } from "./smallCurrentWeather";
import { SmallDeviceControl } from "./smallDeviceControl";
import { SmallSwitcherWidget } from "./smallSwitcherWidget";
import { SmallActionCenter } from "./smallActionCenter";
import { SmallSetupControl } from "./smallSetupControl";
import { FortuneMascotCanvas } from "./fortuneMascot";
import { EventMascotCanvas } from "./actionCenterMascot";

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

export function HomeSmall(props) {
    const signals = props.signals;
    const switcherWidgets = [
        { icon: () => <i class="fa-solid fa-cloud-sun"></i>, element: () => <SmallCurrentWeather /> },
        { icon: () => <i class="fa-solid fa-power-off"></i>, element: () => <SmallDeviceControl /> },
        { icon: () => <i class="fa-solid fa-gear"></i>, element: () => <SmallSetupControl /> },
    ];

    const useDebug = false;
    if (useDebug) {
        switcherWidgets.push(
            { icon: () => <i class="fa-solid fa-fire"></i>, element: () => <Debug /> },
        )
    }

    return <div class="home-screen">
        <div class="home-lhs-column flex-grow">
            <SmallSwitcherWidget widgets={switcherWidgets} />
        </div>
        <div class='home-rhs-column flex-column flex-grow'>
            <div id="date-time" class="home-time-wrapper flex-grow">
                <div class="home-time home-time-small">{signals.myTime}</div>
                <div class="home-date">{signals.myDate}</div>
            </div>

            {/* When we do have an event render the main mascot, otherwise render the fortune mascot. */}
            <Show when={hasNextEvent(signals)}>
                <EventMascotCanvas />
            </Show>

            <Show when={!hasNextEvent(signals)}>
                <FortuneMascotCanvas />
            </Show>
        </div>
        <SmallActionCenter signals={signals} />
    </div>
}