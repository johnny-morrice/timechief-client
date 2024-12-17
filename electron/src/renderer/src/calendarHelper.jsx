export function isCalendarExists(data) {
    let calendar = data["google_calendar"];
    return "google_calendar" in calendar && calendar["google_calendar"] != null;
}