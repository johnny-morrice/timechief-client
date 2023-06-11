import { createSignal, createResource } from 'solid-js';
import { getAccounts } from "./api";

var getAccountsNum = 0;
function getAccountsUniq() {
    return getAccountsNum++;
}

function fetchAccounts(options) {
    console.log(`getting accounts for count ${options}`);
    return getAccounts()
        .then(acc => new Accounts(acc))
        .catch(err => {
            console.log(err);
            return new Accounts({});
    });
}

export class Accounts {
    constructor(accounts) {
        this.accounts = accounts;
    }

    isGoogleAccountLinked() {
        const googleEmail = this.getGoogleEmail();
        return googleEmail.length > 0;
    }

    lastUpdated() {
        if (this.accounts) {
            const googleProfileWrapper = this.accounts["GoogleProfile"];
            if (googleProfileWrapper && "LastUpdated" in googleProfileWrapper) {
                return new Date(googleProfileWrapper["LastUpdated"] * 1000);
            }
        }
        return null;
    }

    getLastUpdatedText() {
        const lastUpdated = this.lastUpdated();
        if (!lastUpdated) {
            return "";
        }
        return lastUpdated.toLocaleDateString();
    }
    
    getGoogleEmail() {
        if (this.accounts) {
            const googleProfileWrapper = this.accounts["GoogleProfile"];
            if (googleProfileWrapper && "Profile" in googleProfileWrapper) {
                const googleProfile = googleProfileWrapper["Profile"];
                if (googleProfile && "RegisteredEmailAddress" in googleProfile) {
                    return googleProfile["RegisteredEmailAddress"];
                }
            }
        }
        return "";
    }
}

export function fetchAccountsHandler() {
    const [getAccountsArgs, triggerGetAccounts] = createSignal(getAccountsUniq());
    const [accounts, _] = createResource(getAccountsArgs, fetchAccounts);
    return [accounts, triggerGetAccounts];
}