import { createResource, createSignal, onMount } from "solid-js";
import { getNavSignals } from "./navigation";
import { MyClocks } from "./myclocks";
import { ClockEditorLocation } from "./clockeditor_location";
import { ClockEditorAdvancedLocation } from "./clockeditor_advancedlocation";
import { getClockPage, ping, logout } from "./api";
import { getEditSelection } from "./clockeditselection";
import { loginRedirect } from "./redirect";
import { ClockHome } from "./clockhome";
import { GoogleAccountEditor } from "./googleAccountEditor";

function getClocksList(page) {
    if (page && "Clocks" in page) {
        return page["Clocks"];
    }
    return [];
  }
  
  export const AppMain = () => {
    const [clockPage, { _m, _r }] = createResource(getClockPage);
    const editSelection = getEditSelection();
    const navSignals = getNavSignals();
  
    function displayHomePage() {
      getClockPage().then(page => {
        const clockList = getClocksList(page);
        if (clockList.length == 1) {
          editSelection.setClock(clockList[0]);
          navSignals.showScreen('clockHome');
        } else {
          navSignals.showScreen('myClocks');
        }
      })
    }

    function onClickLogout() {
      logout();
      loginRedirect();
    }

    function onClickShowDevices() {
      navSignals.showScreen("myClocks");
    }

    let [isLoggedIn, setLoggedIn] = createSignal(false);
    onMount(() => {
      ping().then(() => setLoggedIn(true));
      displayHomePage();
    });
    return <Show when={isLoggedIn()} fallback={<div id="loading-message">Loading...</div>}>
        <div id="app-root">
          <div class="site-nav-bar">
            <div class="main-links">
              <div class="site-name-home" onClick={displayHomePage}>Timechief</div>
              <div class="bar-devices-wrapper">
                <div class="bar-devices-button" onClick={onClickShowDevices}>
                  MY DEVICES
                </div>
              </div>
            </div>
            <div class="bar-account-wrapper">
              <div class="user-button">
                <i class="fa-solid fa-user"></i>
              </div>
              <div class="logout-button" onClick={onClickLogout}>LOGOUT</div>
            </div>
          </div>
          <div class="root-wrapper">
            <div class="main-content">
              <Show when={navSignals.isShowClockHome()}>
                <ClockHome/>
              </Show>
              <Show when={navSignals.isShowMyClocks()}>
                <MyClocks/>
              </Show>
              <Show when={navSignals.isEditClockLocation()}>
                <ClockEditorLocation/>
              </Show>
              <Show when={navSignals.isEditClockAdvancedLocation()}>
                <ClockEditorAdvancedLocation/>
              </Show>
              <Show when={navSignals.isEditGoogleAccount()}>
                <GoogleAccountEditor/>
              </Show>
            </div>
          </div>
        </div>
      </Show>
  };