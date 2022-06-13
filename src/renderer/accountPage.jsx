import { createSignal } from 'solid-js';
import { addClockDataCallback } from './ipc';

class AccountPageSignals {
  constructor() {
      [this.principalSerial, this.setPrincipalSerial] = createSignal("");
  }
}

function updateAccountPageSignals(signals, data) {
    let principal = data["LinkedPrincipal"];
    if ("PrincipalSerial" in principal) {
        signals.setPrincipalSerial(principal["PrincipalSerial"]);
    }
}



var initialised = false;
let accountSignals = new AccountPageSignals();
export const AccountPage = () => {
  
  if (!initialised) {
    addClockDataCallback((data) => updateAccountPageSignals(accountSignals, data));
    initialised = true;
  }

  function hasPrincipalSerial(serial) {
    return serial.length > 0;
  }

  return <div id="account-screen">
        <Show when={hasPrincipalSerial(accountSignals.principalSerial())}>
        <div class="column-flex">
            <div class="flex-element section-name underline">Your account</div>
            <div class='row-flex flex-element'>
                <div class="flex-element data-name">Principal serial</div>
                <div class="flex-element data-value">{accountSignals.principalSerial}</div>
            </div>
            <div class="flex-element">
                <button>Link your account <i class="fa-solid fa-user-plus"></i></button>
            </div>
        </div>
        </Show>
        <Show when={!hasPrincipalSerial(accountSignals.principalSerial())}>
        <div class="column-flex">
            <div class="flex-element section-name underline">Link your account</div>
            <div class='row-flex flex-element'>
                <div class="flex-element">
                    <button>Link your account <i class="fa-solid fa-user-plus"></i></button>
                </div>
            </div>
        </div>
        </Show>
  </div>;
};