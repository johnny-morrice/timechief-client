import { getEditSelection, refreshClock } from "./clockeditselection";
import { updateClock, autocompleteTimezones, listTimezones, autocompleteLocales, listLocales } from './api';
import { buildAutocompleteHandler, delay, getClockDeviceSerial, getClockLatitude, getClockLongitude, getClockLocale, getClockLocation, getClockTimezone, isClockDisplayTimezone, isClockHourCycle12H, isClockHourCycle24H, isClockHourCycleLocaleDefault, createAutocompleteResource, autocompleteUniq, showSavedFader } from "./clockeditor_helper";
import { getNavSignals } from "./navigation";


function clearFormError() {
    setFormError("");
}

function setFormError(errorText) {
    const errorElem = document.getElementById("form-error");
    errorElem.innerText = errorText;
}

const clockTextFormMapping = {
    "DeviceSerial": "clock-editor-device-serial",
    "Location": "clock-editor-location",
    "Latitude": "clock-editor-latitude",
    "Longitude": "clock-editor-longitude",
    "Timezone": "clock-editor-timezone",
    "Locale": "clock-editor-locale"
};

function readClockFromForm(clock) {
    for (const [clockKey, formId] of Object.entries(clockTextFormMapping)) {
        const elem = document.getElementById(formId);
        if (elem == null) {
            console.log(`advanced clock edit form no longer on page: ${formId}`);
            return false;
        }
        clock[clockKey] = elem.value;
    }
    const hourCycle = document.querySelector('input[name="clock-editor-hourcycle"]:checked').value;
    clock["HourCycleOption"] = hourCycle;
    const checkedDisplayTimezoneElem = document.querySelector('input[name="clock-editor-display-timezone"]:checked');
    if (checkedDisplayTimezoneElem) {
        clock["DisplayTimezone"] = true;
    }
    return true;
}


async function saveClockEditForm() {
    const clock = {};
    let wasRead = readClockFromForm(clock);
    if (wasRead) {
        updateClock(clock).then(() => {
            console.log("updated clock");
            showSavedFader();
            refreshClock(clock);
            clearFormError();
        }).catch(error => 
            setFormError(error.toString())
        );
    } else {
        console.log("aborting clock update after probable page change");
    };
}

const timezoneInputAutocomplete = buildAutocompleteHandler(
    'clock-editor-timezone',
    () => listTimezones().then(res => res["TimeZones"]),
    term => autocompleteTimezones(term).then(res => res["TimeZones"])
);

const localeInputAutocomplete = buildAutocompleteHandler(
    'clock-editor-locale',
    () => listLocales().then(res => res["Locales"]),
    term => autocompleteLocales(term).then(res => res["Locales"])
)

export const ClockEditorAdvancedLocation = () => {
    const navSignals = getNavSignals();

    const [timezoneAutocompleteList, triggerTzAutocomplete] = createAutocompleteResource(timezoneInputAutocomplete);
    const [localeAutocompleteList, triggerLocaleAutocomplete] = createAutocompleteResource(localeInputAutocomplete);

    const onKeyUpTimezone = delay(() => {
        triggerTzAutocomplete({ show: true, num: autocompleteUniq() });
    }, 50);
    const onKeyUpLocale = delay(() => {
        triggerLocaleAutocomplete({ show: true, num: autocompleteUniq() });
    }, 50);
    const handleFormChange = delay(saveClockEditForm, 500);
    const editSelection = getEditSelection();
    function onclickTzAutocompleteItem(tz) {
        return function () {
            triggerTzAutocomplete({ show: false, num: autocompleteUniq() });
            const elem = document.getElementById('clock-editor-timezone');
            elem.value = tz["Tz"];
            handleFormChange();
        };
    }
    function onclickLocaleAutocompleteItem(locale) {
        return function () {
            triggerLocaleAutocomplete({ show: false, num: autocompleteUniq() });
            const elem = document.getElementById('clock-editor-locale');
            elem.value = locale;
            handleFormChange();
        };
    }
    function onClickReturn() {
        navSignals.showScreen("clockHome");
    }
    return <div class="clock-editor-location-advanced">
        <div class="clock-edit-back-button" onClick={onClickReturn}>
            <i class="fa-solid fa-circle-chevron-left"></i> Return to clock settings 
        </div>
        <Show when={"DeviceSerial" in editSelection.clock()}>
            <div class="clock-editor-form-wapper">
                <div id="form-error"></div>
                <form name="clock-editor-form" autocomplete="off">
                    <input name="clock-editor-device-serial" id="clock-editor-device-serial" type="hidden" value={getClockDeviceSerial(editSelection.clock())}></input>
                    <div class="clock-editor-field">
                        <label for="clock-editor-location">Location</label>
                        <input name="clock-editor-location" id="clock-editor-location" type="text" onKeyUp={handleFormChange} onBlur={handleFormChange} value={getClockLocation(editSelection.clock())}></input>
                    </div>
                    <div class="clock-editor-field">
                        <label for="clock-editor-latitude">Latitude</label>
                        <input name="clock-editor-latitude" id="clock-editor-latitude" type="number" onKeyUp={handleFormChange} onBlur={handleFormChange} value={getClockLatitude(editSelection.clock())}></input>
                    </div>
                    <div class="clock-editor-field">
                        <label for="clock-editor-longitude">Longitude</label>
                        <input name="clock-editor-longitude" id="clock-editor-longitude" type="number" onKeyUp={handleFormChange} onBlur={handleFormChange} value={getClockLongitude(editSelection.clock())}></input>
                    </div>
                    <div class="clock-editor-field">
                        <label for="clock-editor-display-timezone">Show Timezone</label>
                        <input name="clock-editor-display-timezone" id="clock-editor-display-timezone" type="checkbox" onChange={handleFormChange} onBlur={handleFormChange} checked={isClockDisplayTimezone(editSelection.clock())}></input>
                    </div>
                    <fieldset>
                        <legend>12 or 24 Hour:</legend>

                        <div>
                            <input type="radio" id="clock-editor-hourcycle-locale-default" name="clock-editor-hourcycle" value="" checked={isClockHourCycleLocaleDefault(editSelection.clock())} onChange={handleFormChange} />
                            <label for="clock-editor-hourcycle-locale-default">Default for my location</label>
                        </div>

                        <div>
                            <input type="radio" id="clock-editor-hourcycle-24h" name="clock-editor-hourcycle" value="24h" checked={isClockHourCycle24H(editSelection.clock())} onChange={handleFormChange} />
                            <label for="clock-editor-hourcycle-24h">24 Hour Clock</label>
                        </div>
                        <div>
                            <input type="radio" id="clock-editor-hourcycle-12h" name="clock-editor-hourcycle" value="12h" checked={isClockHourCycle12H(editSelection.clock())} onChange={handleFormChange} />
                            <label for="clock-editor-hourcycle-12h">12 Hour Clock</label>
                        </div>
                    </fieldset>
                    <div class="clock-editor-field">
                        <label for="clock-editor-locale">Locale</label>
                        <div class="locale-autocomplete autocomplete">
                            <input name="clock-editor-locale" id="clock-editor-locale" type="text" onKeyUp={onKeyUpLocale} onBlur={handleFormChange} value={getClockLocale(editSelection.clock())}></input>
                        </div>
                        <For each={localeAutocompleteList()}>{(locale) =>
                            <div class="locale-autocomplete-item autocomplete-item" onClick={onclickLocaleAutocompleteItem(locale)}>{locale}</div>
                        }</For>
                    </div>
                    <div class="clock-editor-field">
                        <label for="clock-editor-timezone">Timezone</label>
                        <div class="timezone-autocomplete autocomplete">
                            <input name="clock-editor-timezone" id="clock-editor-timezone" type="text" onKeyUp={onKeyUpTimezone} onBlur={handleFormChange} value={getClockTimezone(editSelection.clock())}></input>
                        </div>
                        <For each={timezoneAutocompleteList()}>{(tz) =>
                            <div class="timezone-autocomplete-item autocomplete-item" onClick={onclickTzAutocompleteItem(tz)}>{tz["Tz"]}</div>
                        }</For>
                    </div>
                    <div id="saved-wrapper"/>
                </form>
            </div>
        </Show>
    </div>
}