import { getGoogleAuthURL } from "./api";
import { getNavSignals } from "./navigation";
import { fetchAccountsHandler } from "./accountshandler";

export const GoogleAccountEditor = () => {
    const navSignals = getNavSignals();
    const [accounts, _] = fetchAccountsHandler();
    function onClickReturn() {
        navSignals.showScreen("clockHome");
    }
    function onClickLinkAccount() {
        getGoogleAuthURL().then(resp => {
            window.open(resp["URL"], '_blank').focus();
        });
    }
    function isGoogleAccountLinked(accounts) {
        if (accounts) {
            return accounts.isGoogleAccountLinked();
        }

        return false;
    }
    return <div class="google-account-editor">
        <div class="clock-edit-back-button" onClick={onClickReturn}>
            <i class="fa-solid fa-circle-chevron-left"></i> Return to clock settings 
        </div>
        <Show when={!isGoogleAccountLinked(accounts())}>
            <div class="google-account-edit-form">
                <button class="link-google-account-button" onClick={onClickLinkAccount}>Link your Google account <i class="fa-brands fa-google"></i></button>
            </div>
        </Show>
        <Show when={isGoogleAccountLinked(accounts())}>
            <div class="google-account-edit-form">
                <div class="google-account-edit-form-linked-email-header">Linked Google email:</div>
                <div class="google-account-edit-form-linked-email">{accounts().getGoogleEmail()}</div>
                <div class="google-account-edit-form-synced-header">Google profile last synced:</div>
                <div class="google-account-edit-form-synced">{accounts().getLastUpdatedText()}</div>
                <button class="link-google-account-button" onClick={onClickLinkAccount}>Re-link account <i class="fa-brands fa-google"></i></button>
            </div>
        </Show>
    </div>
};