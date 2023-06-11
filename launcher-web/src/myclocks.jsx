import { createResource, onCleanup } from 'solid-js';
import { getEditSelection } from './clockeditselection';
import { getNavSignals } from './navigation';
import { getClockPage } from './api';

function getClocksList(page) {
    if (page && "Clocks" in page) {
        return page["Clocks"];
    }
    return [];
  }

export const MyClocks = () => {
    const [clockPage, { mutate, refetch }] = createResource(getClockPage);
    const editSelection = getEditSelection();
    const navSignals = getNavSignals();
    const refetchDuration = 30 * 1000;
    var refetchInterval = setInterval(() => {
        refetch();
    }, refetchDuration)
    onCleanup(() => {
        clearInterval(refetchInterval);
    });

    function onClickClock(clock) {
        return () => {
            editSelection.setClock(clock);
            navSignals.showScreen("clockHome");
        }
    }

    function hasClocks(clockPage) {
        console.log("has clocks...")
        console.log(clockPage);
        return getClocksList(clockPage).length > 0;
    }

    return <div class="my-clocks">
        <Show when={hasClocks(clockPage())}>
            <div class="about-my-clocks">My clocks</div>
            <div class="my-clocks-entries">
            <For each={getClocksList(clockPage())}>{clock =>
                <div class="my-clocks-entry" onClick={onClickClock(clock)}>
                    <div class="clock-name">My Timechief</div>
                    <div class="clock-location">{clock["Location"]}</div>
                </div>
            }</For>
            </div>
        </Show>
        <Show when={!hasClocks(clockPage())}>
        <div class="about-my-clocks">You have no clocks</div>
        </Show>
    </div>
}