class CalendarEvent {

    constructor(data) {
        this.data = data;
    }

    eventShortText() {
        return this.data.ShortText;
    }

    startTime() {
        if (this._startTime) {
            return this._startTime;
        }
        this._startTime = new Date(data.Start * 1000);
        return this._startTime;
    }

    endTime() {
        if (this._endTime) {
            return this._endTime;
        }
        this._endTime = new Date(data.Start * 1000);
        this._endTime;
    }

    formatStartTime(locale) {
        return this.formatTime(this.startTime(), locale);
    }

    formatEndTime(locale) {
        return this.formatTime(this.endTime(), locale);
    }

    formatTime(time, locale) {
        const opts = {dateStyle: 'short', 'timeStyle': short};
        return time.toLocaleString(locale, opts)
    }

    isSoon() {
        const diff = 24 * 60 * 60 * 1000;
        const target = new Date();
        target.setTime(target.getTime() + diff);
        return this.startTime() <= target;
    }

    isHightlight() {
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