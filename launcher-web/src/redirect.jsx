import { WwwAppURL, WwwLoginURL } from "./env";

export function loginRedirect() {
    window.location.replace(WwwLoginURL);
}

export function appRedirect() {
    window.location.replace(WwwAppURL);
}