export function kelvinToCelsiusText(absTemp) {
    let celsius = absTemp - 273.15;
    let celsiusText = celsius.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1})
    return `${celsiusText}°c`
}