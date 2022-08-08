export function isCalendarExists(data) {
    let calendar = data["Calendar"];
    return "Calendar" in calendar && new Boolean(calendar["Calendar"])
}