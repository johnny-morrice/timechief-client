export function isCalendarExists(data) {
    let calendar = data["Calendar"];
    return "Calendar" in calendar && calendar["Calendar"] != null;
}