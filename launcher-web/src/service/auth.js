import { WwwLoginURL } from "../env";
import { TimechiefClient } from "./timechiefclient";

class AuthService {

    checkAuthentication() {
        return TimechiefClient.default.getCurrentPrincipal();
    }
    
    clearQueryParams() {
        // Only change the history state if there are actually query params.
        if (window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
     loginRedirect() {
        window.location.replace(WwwLoginURL);
    }
}

export const Service = new AuthService();