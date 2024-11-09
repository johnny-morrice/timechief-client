export function makeCanonicalDateText(date, timezone) {
    return `${getLocalYear(date, timezone)}-${getLocalMonth(date, timezone)}-${getLocalDay(date, timezone)}`;
}

export function sortCalendarEvents(arr, timezone) {
    arr.sort((a, b) => {
        return compareCalendarEvents(a, b, timezone);
    });
}

var _yearFormatter;
var _monthFormatter;
var _dayFormatter;

// TODO use real locale on these...

function getLocalYear(date, timezone) {
    if (!_yearFormatter) {
        _yearFormatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric" })
    }
    return parseInt(_yearFormatter.format(date));
}

function getLocalMonth(date, timezone) {
    if (!_monthFormatter) {
        _monthFormatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "numeric" })
    }
    return parseInt(_monthFormatter.format(date))
}

function getLocalDay(date, timezone) {
    if (!_dayFormatter) {
        _dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, day: "numeric" })
    }
    return parseInt(_dayFormatter.format(date));
}





export function compareCalendarEvents(a, b, timezone) {
    // Comparing events on different days.
    const aDate = a.startTime();
    const bDate = b.startTime();
    const yearA = getLocalYear(aDate, timezone);
    const yearB = getLocalYear(bDate, timezone);

    if (yearA < yearB) {
        return -1;
    }
    if (yearA > yearB) {
        return 1;
    }

    const monthA = getLocalMonth(aDate, timezone);
    const monthB = getLocalMonth(bDate, timezone);

    if (monthA < monthB) {
        return -1;
    }
    if (monthA > monthB) {
        return 1;
    }

    const dayA = getLocalDay(aDate, timezone);
    const dayB = getLocalDay(bDate, timezone);

    if (dayA < dayB) {
        return -1;
    }
    if (dayA > dayB) {
        return 1;
    }

    // Comparing events on the same day.
    if (a.isAllDay() && b.isAllDay()) {
        return 0;
      } else if (a.isAllDay() && !b.isAllDay()) {
        return 1;
      } else if (!a.isAllDay() && b.isAllDay()) {
        return -1;
      } else {
        return cmpDate(aDate, bDate);
      }
}

function cmpDate(a, b) {
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      return 0;
    }
  }

export class CalendarEvent {

    constructor(data) {
        this.data = data;
    }

    canonicalStartDateText(timezone) {
        return makeCanonicalDateText(this.startTime(), timezone);
    }

    eventShortText() {
        // Truncate to 20 unicode characters.
        // TODO use configured locale.
        const segmenter = new Intl.Segmenter("en", {granularity: 'grapheme'});
        const segItr = segmenter.segment(this.data.short_text);
        const segArr = Array.from(segItr, ({segment}) => segment);
        const maxLen = 12;
        if (segArr.length <= maxLen) {
            return this.data.short_text;
        }
        return segArr.slice(0, maxLen).join('') + "...";
    }

    startTime() {
        if (this._startTime) {
            return this._startTime;
        }
        this._startTime = new Date(this.data.start * 1000);
        this._startTime.getFullYear();
        return this._startTime;
    }

    endTime() {
        if (this._endTime) {
            return this._endTime;
        }
        if (this.data.end != 0) {
            this._endTime = new Date(this.data.end * 1000);
        }
        return this._endTime;
    }

    formatStartTime(locale, timeZone) {
        if (this.isAllDay()) {
            let dateOpts = {dateStyle: 'short', timeZone: timeZone};
            return "All day " + this.startTime().toLocaleDateString(locale, dateOpts); 
        }
        return this.formatTime(this.startTime(), locale, timeZone);
    }

    isAllDay() {
        return this.data["all_day"];
    }

    formatEndTime(locale, timeZone) {
        return this.formatTime(this.endTime(), locale, timeZone);
    }

    formatTime(time, locale, timeZone) {
        let timeOpts = {timeStyle: 'short', timeZone: timeZone};
        let dateOpts = {dateStyle: 'short', timeZone: timeZone};
        return time.toLocaleTimeString(locale, timeOpts) + " " + time.toLocaleDateString(locale, dateOpts);
    }

    isSoon() {
        const diff = 24 * 60 * 60 * 1000;
        const target = new Date();
        if (this.startTime() <= target) {
            return false;
        }
        target.setTime(target.getTime() + diff);
        return this.startTime() <= target;
    }

    isHighlight(timezone) {
        return this.isHappeningNow(timezone) || this.isSoon();
    }

    isHappeningNow(timezone) {
        const now = new Date(); 
        if (this.data.AllDay) {
            const startYear = getLocalYear(this.startTime(), timezone);
            const nowYear = getLocalYear(now, timezone);
            const isThisYear = startYear == nowYear;
            const startMonth = getLocalYear(this.startTime(), timezone);
            const nowMonth = getLocalYear(now, timezone);
            const isThisMonth = startMonth == nowMonth;
            const startDay = getLocalDay(this.startTime(), timezone)
            const nowDay = getLocalDay(now, timezone);
            const isToday = startDay == nowDay;
            return isThisYear && isThisMonth && isToday;
        }
        return this.startTime() <= now && this.endTime() >= now;
    }
}