export function makeCanonicalDateText(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function sortCalendarEvents(arr) {
    arr.sort((a, b) => {
        return compareCalendarEvents(a, b);
    });
}

export function compareCalendarEvents(a, b) {
    if (a.isAllDay() && b.isAllDay()) {
        return 0;
      } else if (a.isAllDay() && !b.isAllDay()) {
        return 1;
      } else if (!a.isAllDay() && b.isAllDay()) {
        return -1;
      } else {
        return cmpDate(a.startTime(), b.startTime());
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

    canonicalStartDateText() {
        return makeCanonicalDateText(this.startTime());
    }

    eventShortText() {
        if (this.data.ShortText.length > 30) {
            return this.data.ShortText.slice(0, 30) + "...";
        }
        return this.data.ShortText;
    }

    startTime() {
        if (this._startTime) {
            return this._startTime;
        }
        this._startTime = new Date(this.data.Start * 1000);
        return this._startTime;
    }

    endTime() {
        if (this._endTime) {
            return this._endTime;
        }
        if (this.data.End != 0) {
            this._endTime = new Date(this.data.End * 1000);
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
        return this.data["AllDay"];
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

    isHighlight() {
        return this.isHappeningNow() || this.isSoon();
    }

    isHappeningNow() {
        const now = new Date(); 
        if (this.data.AllDay) {
            const isThisYear = this.startTime().getYear() == now.getYear();
            const isThisMonth = this.startTime().getMonth() == now.getMonth();
            const isToday = this.startTime().getDate() == now.getDate();
            return isThisYear && isThisMonth && isToday;
        }
        return this.startTime() <= now && this.endTime() >= now;
    }
}