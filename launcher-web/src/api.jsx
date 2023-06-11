import { BffBaseURL, APIBaseURL } from "./env";
import { loginRedirect } from "./redirect";

export async function login(username, password) {
    const options = cookieRequestOptions();
    options["method"] = "POST";
    const tokenRequest = {
        "PrincipalSerial": username,
        "PrincipalSecret": password,
        "TokenPolicy": "refresh",
        "Scopes": ["token:auth-code-create"],
    }
    options["body"] = JSON.stringify(tokenRequest);
    const url = `${BffBaseURL}/www/auth/login`;
    return await fetch(url, options)
}

export async function createAuthCode() {
    const options = cookieRequestOptions();
    options["method"] = "POST";
    const csrfToken = {
        "CSRFToken": getCsrfToken()
    };
    options["body"] = JSON.stringify(csrfToken);
    const url = `${BffBaseURL}/www/api/token/auth-code`;
    return await fetch(url, options).then(returnJsonOnOk);
}

export async function getGoogleAuthURL() {
    const options = cookieRequestOptions();
    options["method"] = "POST";
    const csrfToken = {     
        "CSRFToken": getCsrfToken()
    };
    options["body"] = JSON.stringify(csrfToken);
    const url = `${BffBaseURL}/www/api/google-oauth/url`;
    return await fetch(url, options).then(returnJsonOnOk);
}

export async function logout() {
    const options = cookieRequestOptions();
    options["method"] = "POST";
    const csrfToken = {
        "CSRFToken": getCsrfToken()
    };
    options["body"] = JSON.stringify(csrfToken);
    const url = `${BffBaseURL}/www/api/token/logout`;
    return await fetch(url, options).then(resp => {
        if (resp.status != 204) {
            throw new Error("logout failed");
        }
    });
}

export async function exchangeAuthCodeForAccessToken(authCode) {
    const options = baseRequestOptions();
    options["method"] = "POST";
    const tokenRequest = {
        "AuthCode": authCode,
    }
    options["body"] = JSON.stringify(tokenRequest);
    const url = `${APIBaseURL}/authn/token`;
    return await fetch(url, options).then(returnJsonOnOk);
}

export async function linkAccount(pairingCode) {
    const url = `${APIBaseURL}/api/pairing/${encodeURIComponent(pairingCode)}`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        options["method"] = "PUT";
        return fetch(url, options);
    });
}

export async function getPairingStatus(pairingCode) {
    const url = `${APIBaseURL}/api/pairing/${encodeURIComponent(pairingCode)}`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options).then(returnJsonOnOk);
    });
}

export async function listLocales() {
    const url = `${APIBaseURL}/api/world/locale`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options)
    }).then(returnJsonOnOk);
}

export async function autocompleteLocales(term) {
    const url = `${APIBaseURL}/api/world/locale/search?term=${encodeURIComponent(term)}`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options)
    }).then(returnJsonOnOk);
}

export async function listTimezones() {
    const url = `${APIBaseURL}/api/world/tz`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options)
    }).then(returnJsonOnOk);
}

export async function autocompleteTimezones(term) {
    const url = `${APIBaseURL}/api/world/tz/search?term=${encodeURIComponent(term)}`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options)
    }).then(returnJsonOnOk);
}

export async function geocode(geocodeOptions) {
    var url = "";
    if ("lat" in geocodeOptions && "lng" in geocodeOptions) {
        url = `${APIBaseURL}/api/world/geocode?lat=${encodeURIComponent(geocodeOptions["lat"])}&lng=${encodeURIComponent(geocodeOptions["lng"])}`;
    } else {
        url = `${APIBaseURL}/api/world/geocode?term=${encodeURIComponent(geocodeOptions["term"])}`;
    }
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options)
    }).then(returnJsonOnOk);
}

export async function updateClock(clock) {
    const url = `${APIBaseURL}/api/clock-principal/clock/${clock["DeviceSerial"]}`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        options["method"] = "PUT";
        options["body"] = JSON.stringify(clock);
        return fetch(url, options)
    }).then(resp => {
        if (resp.status != 204) {
            throw new Error("update clock failed");
        }
    });
}

export async function getAccounts() {
    const url = `${APIBaseURL}/api/clock-principal/accounts`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options)
    }).then(returnJsonOnOk);
}

export async function getClock(deviceSerial) {
    const url = `${APIBaseURL}/api/clock-principal/clock/${encodeURIComponent(deviceSerial)}`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options)
    }).then(returnJsonOnOk);
}

export async function getClockPage() {
    const url = `${APIBaseURL}/api/clock-principal/clock`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options)
    }).then(returnJsonOnOk);
}

export async function ping() {
    const url = `${APIBaseURL}/api/ping`;
    return await withToken(() => {
        const options = authenticatedRequestOptions();
        return fetch(url, options)
    }).then(resp => {
        if (resp.status != 204) {
            throw new Error("ping failed");
        }
    });
}

async function withToken(apiCall) {
    const resp = await apiCall();
    // TODO what about throws?
    if (!isAuthError(resp)) {
        return resp;
    } else {
        await refreshWebSession();
        return await apiCall();
    } 
}

async function refreshWebSession() {
    removeWebSessionJwt();
    var ok = true;
    const authCode = await createAuthCode().catch(() => {
        loginRedirect();
        ok = false;
    });
    if (!ok) {
        throw new Error("authentication error, redirecting to login");
    }
    if (!("AuthCode" in authCode)) {
        throw new Error("expected AuthCode");
    }
    const token = await exchangeAuthCodeForAccessToken(authCode["AuthCode"]);
    if (!("JWT" in token)) {
        throw new Error("expected JWT in token");
    }
    setWebSessionJwt(token["JWT"]);
}

function isAuthError(resp) {
    return resp.status == 401 || resp.status == 403;
}

function returnJsonOnOk(resp) {
    if (resp.status == 200) {
        return resp.json();
    } else {
        throw new Error("expected 200 status");
    }
}

const jwtStorageKey = "webSessionJwt";

export function setWebSessionJwt(jwt) {
    localStorage.setItem(jwtStorageKey, jwt);
}

export function removeWebSessionJwt() {
    localStorage.removeItem(jwtStorageKey)
}

export function getWebSessionJwt() {
    return localStorage.getItem(jwtStorageKey);
}

const csrfTokenKey = "csrfToken";

export function setCsrfToken(csrfToken) {
    localStorage.setItem(csrfTokenKey, csrfToken);
}

export function removeCsrfToken() {
    localStorage.removeItem(csrfTokenKey)
}

export function getCsrfToken() {
    return localStorage.getItem(csrfTokenKey);
}

export function hasWebSession() {
    return new Boolean(localStorage.getItem(jwtStorageKey));
}

function baseRequestOptions() {
    const uuid = crypto.randomUUID();
    return {
        'headers': {
            'X-Fish-Tag': uuid
        }
    };
}

function cookieRequestOptions() {
    const options = baseRequestOptions()
    options['credentials'] = 'same-origin';
    return options;
}

function authenticatedRequestOptions() {
    const options = baseRequestOptions()
    options['headers']['Authorization'] = `Bearer ${getWebSessionJwt()}`;
    return options;
}