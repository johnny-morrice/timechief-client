// callbackName is a function that returns a unique callback name given a base name.
export function callbackName(baseName) {
    const randomText = Math.random().toString(36).substring(2, 15);
    return baseName + "-" + randomText;
}