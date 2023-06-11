import { getEditSelection, refreshClock } from "./clockeditselection";
import { onMount} from "solid-js";
import { geocode, updateClock} from './api';
import { showSavedFader } from './clockeditor_helper';
import { getNavSignals } from "./navigation";

function getClockCoords(clock) {
    if ("Latitude" in clock && "Longitude" in clock) {
        return {
            lat: parseFloat(clock["Latitude"]),
            lng: parseFloat(clock["Longitude"])
        }
    }
    return {
        lat: 55.948612,
        lng: -3.200833
    }
}

class GoogleMap {

    constructor(clock) {
        this.initializePlacesAutocomplete();
        this.initializeGoogleMap(clock);
    }

    initializePlacesAutocomplete() {
        const input = document.getElementById("clockedit-places-autocomplete");
        const options = {
            fields: ["address_components", "geometry", "icon", "name"],
        };
        const autocomplete = new google.maps.places.Autocomplete(input, options);
        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                const location = place.geometry.location;
                this.map.setCenter(location);
                this.geocode({ "lat": location.lat(), "lng": location.lng() });
            } else {
                const errorElem = document.getElementById("map-error");
                errorElem.innerText = "Error handling autocomplete place";
            }
        })
    }

    initializeGoogleMap(clock) {
        const self = this;
        self.clock = clock;
        const initialCoords = getClockCoords(clock);
        self.geocoder = new google.maps.Geocoder();
        self.map = new google.maps.Map(
            document.getElementById("clock-editor-location-map"),
            {
                zoom: 8,
                center: initialCoords,
                mapTypeControl: false,
            }
        );
        const map = self.map;

        const searchInputWrapper = document.getElementById("autocomplete-input-initial-wrapper");
        const searchTextInput = document.getElementById("clockedit-places-autocomplete");
        const submitButton = <input type="button" class="google-map-button" value="Search"/>

        searchInputWrapper.removeChild(searchTextInput);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchTextInput);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(submitButton);

        self.infoWindow = new google.maps.InfoWindow();
        
        const centerMarker = new google.maps.Marker({
            map,
            position: map.getCenter(),
        });


        submitButton.addEventListener("click", () =>
            this.geocode({ address: inputText.value })
        );
        map.addListener("center_changed", () => {
            centerMarker.setPosition(map.getCenter());
            const doCenterGeocode = () => self.geocode({ "lat": map.getCenter().lat(), "lng": map.getCenter().lng() });
            self.infoWindow.setContent(<button class="google-maps-info-button" onClick={doCenterGeocode}>Select this location</button>);
            self.infoWindow.open(map, centerMarker);
        });
    }

    // This function is called when the user clicks the UI button requesting
    // a geocode of a place ID.
    geocode(options) {
        const self = this;
        clearMapError();
        geocode(options)
            .then(resp => {
                console.log(resp);
                const map = self.map;
                const latLng = { lat: parseFloat(resp["Lat"]), lng: parseFloat(resp["Lng"]) };
                map.setZoom(11);
                map.setCenter(latLng);
                const marker = new google.maps.Marker({
                    map,
                    position: latLng,
                });

                self.infoWindow.setContent(resp["Address"]);
                self.infoWindow.open(map, marker);
                syncGeocodeResults(self.clock, resp);
            })
            .catch((e) => setMapError("geocoder failed: " + e));
    }
}

function syncGeocodeResults(clock, result) {
    console.log(result);
    const lat = result["Lat"];
    const lng = result["Lng"];
    const tz = result["Timezone"]["Tz"];
    const locale = result["Culture"]["DefaultLocale"];
    var mapResult = {
        "Location": result["Location"],
        "Latitude": lat,
        "Longitude": lng,
    };

    if (locale) {
        mapResult["Locale"] = locale;
    }

    if (tz) {
        mapResult["Timezone"] = tz;
    }

    for (const [key, value] of Object.entries(mapResult)) {
        clock[key] = value;
    }
    clearSearch();
    updateClock(clock)
    .then(() => {
        showSavedFader();
        refreshClock(clock);
    })
    .catch(error =>
        setMapError(error.toString())
    );
}

function clearSearch() {
    const searchElem = document.getElementById("clockedit-places-autocomplete");
    searchElem.value = "";
}

function clearMapError() {
    setMapError("");
}

function setMapError(errorText) {
    const errorElem = document.getElementById("map-error");
    errorElem.innerText = errorText;
}

export const ClockEditorLocation = () => {
    const editSelection = getEditSelection();
    const navSignals = getNavSignals();
    var map = null;
    function initMapIfReady() {
        if (map) {
            return true;
        }
        const elem = document.getElementById('clock-editor-location-map');
        if (elem) {
            let clock = editSelection.clock();
            if ("DeviceSerial" in clock) {
                map = new GoogleMap(clock);
                console.log("created map");
                return true;
            }
        }
        return false;
    }
    function pollUntilMapReady() {
        var interval = setInterval(() => {
            console.log("polling for map readiness");
            var mapReady = initMapIfReady();
            if (mapReady) {
                console.log("clear map poll")
                clearInterval(interval);
            }
        }, 50);
    }
    onMount(() => {
        pollUntilMapReady();
    });
    function onClickReturn() {
        navSignals.showScreen("clockHome");
    }
    return <div class="clock-editor-location">
        <div class="clock-edit-back-button" onClick={onClickReturn}>
            <i class="fa-solid fa-circle-chevron-left"></i> Return to clock settings 
        </div>
        <Show when={"DeviceSerial" in editSelection.clock()}>
            <div class="clock-editor-location-wrapper">
                <div id="autocomplete-input-initial-wrapper">
                    <input id="clockedit-places-autocomplete" type="text"></input>
                </div>
                <div class="clock-editor-form-wapper">
                    <div id="clock-editor-location-map"></div>
                    <div id="map-error"></div>
                    <div id="saved-wrapper"/>
                </div>
            </div>
        </Show>
    </div>
}