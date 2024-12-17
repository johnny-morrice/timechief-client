import { createResource, createSignal } from "solid-js";

export function fetchOnce(fetcher) {
    const [result, setResult] = createSignal();
    const [isLoaded, setIsLoaded] = createSignal(false);
    const [isError, setIsError] = createSignal(false);
    fetcher().then((result) => {
        setResult(result);
        setIsLoaded(true);
    }).catch((error) => {
        console.error(error);
        setIsLoaded(true);
        setIsError(true);
    });
    return [result, isLoaded, isError];
}

export function fetchResource(fetcher) {
    const [requestID, setRequestID] = createSignal(0);
    const refetch = () => setRequestID(requestID() + 1);
    const [result] = createResource(requestID, fetcher);
    return [result, refetch];
}