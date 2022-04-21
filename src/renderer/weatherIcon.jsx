export function weatherIconStyleClass(weatherDescription) {
    console.log("weather description is: " + weatherDescription);
    switch (weatherDescription.toLowerCase()) {
        case "clear sky":
            return "fa-sun";
        case "thunderstorm with light rain":
            return "fa-cloud-bolt";
        case "thunderstorm with rain":
            return "fa-cloud-bolt";
        case "thunderstorm with heavy rain":
            return "fa-cloud-bolt";
        case "light thunderstorm":
            return "fa-cloud-bolt";
        case "thunderstorm":
            return "fa-cloud-bolt";
        case "heavy thunderstorm":
            return "fa-cloud-bolt";
        case "ragged thunderstorm":
            return "fa-cloud-bolt";
        case "thunderstorm with light drizzle":
            return "fa-cloud-bolt";
        case "thunderstorm with drizzle":
            return "fa-cloud-bolt";
        case "thunderstorm with heavy drizzle":
            return "fa-cloud-bolt";
        case "light intensity drizzle":
            return "fa-cloud-rain";
        case "drizzle":
            return "fa-cloud-rain";
        case "heavy intensity drizzle":
            return "fa-cloud-showers-heavy";
        case "light intensity drizzle rain":
            return "fa-cloud-rain";
        case "drizzle rain":
            return "fa-cloud-rain";
        case "heavy intensity drizzle rain":
            return "fa-cloud-showers-heavy";
        case "shower rain and drizzle":
            return "fa-cloud-rain";
        case "heavy shower rain and drizzle":
            return "fa-cloud-showers-heavy";
        case "rain":
            return "fa-cloud-rain";
        case "shower drizzle":
            return "fa-cloud-rain";
        case "light rain":
            return "fa-cloud-rain";
        case "moderate rain":
            return "fa-cloud-rain";
        case "heavy intensity rain":
            return "fa-cloud-showers-heavy";
        case "very heavy rain":
            return "fa-cloud-showers-heavy";
        case "extreme rain":
            return "fa-cloud-showers-water";
        case "freezing rain":
            return "fa-cloud-showers-heavy";
        case "light intensity shower rain":
            return "fa-cloud-rain";
        case "shower rain":
            return "fa-cloud-rain";
        case "heavy intensity shower rain":
            return "fa-cloud-showers-heavy";
        case "ragged shower rain":
            return "fa-cloud-showers-heavy";
        case "light snow":
            return "fa-snowflake";
        case "snow":
            return "fa-snowflake";
        case "heavy snow":
            return "fa-snowflake";
        case "sleet":
            return "fa-snowflake";
        case "light shower sleet":
            return "fa-snowflake";
        case "shower sleet":
            return "fa-snowflake";
        case "light rain and snow":
            return "fa-snowflake";
        case "rain and snow":
            return "fa-snowflake";
        case "light shower snow":
            return "fa-snowflake";
        case "shower snow":
            return "fa-snowflake";
        case "heavy shower snow":
            return "fa-snowflake";
        case "mist":
            return "fa-smog";
        case "smoke":
            return "fa-smog";
        case "haze":
            return "fa-smog";
        case "sand/ dust whirls":
            return "fa-tornado";
        case "fog":
            return "fa-smog";
        case "sand":
            return "fa-smog";
        case "dust":
            return "fa-smog";
        case "volcanic ash":
            return "fa-volcano";
        case "squalls":
            return "fa-wind";
        case "tornado":
            return "fa-tornado";
        case "few clouds":
            return "fa-cloud-sun";
        case "scattered clouds":
            return "fa-cloud-sun";
        case "broken clouds":
            return "fa-cloud-sun";
        case "overcast clouds":
            return "fa-cloud";
        default:
            return null;
    }
}