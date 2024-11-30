import { SmallCurrentWeather } from "./smallCurrentWeather";
import { SmallDeviceControl } from "./smallDeviceControl";
import { SmallSwitcherWidget } from "./smallSwitcherWidget";
import { SmallActionCenter } from "./smallActionCenter";
import { SmallSetupControl } from "./smallSetupControl";

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
                <div class="home-time">{signals.myTime}</div>
                <div class="home-date">{signals.myDate}</div>
            </div>

            <SmallActionCenter signals={signals} />
        </div>
    </div>
}