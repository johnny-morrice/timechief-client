import { getEditSelection } from "./clockeditselection";
import { getNavSignals } from "./navigation";
import { fetchAccountsHandler } from "./accountshandler";

export const ClockHome = () => {
    const editSelection = getEditSelection();
    const navSignals = getNavSignals();
    const [accounts, _] = fetchAccountsHandler();

    function getClockLocation(clock) {
        if ("Location" in clock) {
            return clock["Location"];
        }
        return "";
    }

    function onClickEditLocation() {
        navSignals.showScreen("editClockLocation");
    }

    function onClickEditAdvancedLocation() {
        navSignals.showScreen("editClockAdvancedLocation");
    }

    function onClickLinkGoogleCalendar() {
        navSignals.showScreen("editGoogleAccount");
    }

    function isGoogleAccountLinked(accounts) {
        if (accounts) {
            return accounts.isGoogleAccountLinked();
        }

        return false;
    }

    return <div class="clock-home">
        <div class="clock-home-title">My Timechief</div>
        <div class="clock-preview">
            <div class="clock-preview-location">
                {getClockLocation(editSelection.clock())}
            </div>
        </div>
        <div class="clock-home-links">
            <div class="clock-home-link" onClick={onClickEditLocation}>
               <i class="fa-solid fa-circle-chevron-right"></i> Change clock location <i class="fa-solid fa-map-location-dot"></i>
            </div>
            <div class="clock-home-link" onClick={onClickEditAdvancedLocation}>
                <i class="fa-solid fa-circle-chevron-right"></i> Change clock locale and advanced location preferences <i class="fa-solid fa-language"></i>
            </div>
            <div class="clock-home-link" onClick={onClickLinkGoogleCalendar}>
                <div class="accounts-link-button-text">
                    <i class="fa-solid fa-circle-chevron-right"></i> Import Google Calendar <i class="fa-brands fa-google"></i>
                    <Show when={isGoogleAccountLinked(accounts())}>
                        <span class="accounts-link-button-email">
                            ({accounts().getGoogleEmail()})
                        </span>
                    </Show>
                </div>
            </div>
        </div>
    </div>
}