export class CalendarEvent {

    constructor(data) {
        this.data = data;
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

    formatStartTime(locale) {
        return this.formatTime(this.startTime(), locale);
    }

    formatEndTime(locale) {
        return this.formatTime(this.endTime(), locale);
    }

    formatTime(time, locale) {
        return time.toLocaleTimeString(locale, {'timeStyle': 'short'}) + " " + time.toLocaleDateString(locale, {dateStyle: 'short', });
    }

    isSoon() {
        const diff = 24 * 60 * 60 * 1000;
        const target = new Date();
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