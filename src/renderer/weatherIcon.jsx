export function weatherIconStyleClass(weatherCode) {
    switch (weatherCode.toLowerCase()) {
        case "Sun":
            return "fa-sun"
        case "CloudSunRain":
            return"fa-cloud-sun-rain"
        case "CloudSun":
            return "fa-cloud-sun"
        case "Cloud":
            return "fa-cloud"
        case "Rain":
            return "fa-cloud-showers-heavy"
        case "HeavyRain":
            return "fa-cloud-showers-water"
        case "Lightning":
            return "fa-cloud-bolt"
        case "Mist":
            return "fa-smog"
        case "Tornado":
            return "fa-tornado"
        case "Wind":
            return "fa-wind"
        case "Snow":
            return "fa-snowflake"
        case "Volcano":
            return "fa-volcano"
    }
}