import { getMainWindow } from "./window.js";

export class Themer {
    constructor() {
        this.lastThemeCssKey = null;
        this.lastThemeCSS = null;
        this.isForceChange = false;
    }

    setThemeFromData(data) {
        if (data && data.media && data.media.theme_css && data.media.theme_css.length > 0) {
            this.setTheme(data.media.theme_css);
        }
    }

    setDefaultTheme() {
        this.setTheme(getDefaultThemeCSS());
    }

    setTheme(theme) {
        const self = this;
        if (theme !== this.lastThemeCSS || self.isForceChange) {

            setTimeout(() => {
                console.log("forcing theme change");
                self.isForceChange = true;
            }, 1000 * 60 * 67);

            if (self.isForceChange) {
                console.log("theme change was forced");
                self.isForceChange = false;
            }
            console.log("changing theme");
            console.log("previous CSS: ", this.lastThemeCSS);
            console.log("new CSS: ", theme)
            this.lastThemeCSS = theme;
            if (this.lastThemeCssKey) {
                getMainWindow().webContents.removeInsertedCSS(this.lastThemeCssKey);
            }
            getMainWindow().webContents.insertCSS(theme).then(key => {
                this.lastThemeCssKey = key;
            });
        }
    }
}

export class BackgroundImageThemer {
    constructor() {
        this.lastThemeCssKey = null;
        this.lastThemeCSS = null;
        this.isForceChange = false;
    }

    setThemeFromData(data) {
        if (data && data.media && data.media.background_picture && data.media.background_picture.background_picture_css && data.media.background_picture.background_picture_css.length > 0) {
            this.setTheme(data.media.background_picture.background_picture_css);
        } else {
            this.setTheme("");
        }
    }

    setTheme(theme) {
        if (theme !== this.lastThemeCSS || this.isForceChange) {
            console.log("changing background image CSS");
            this.lastThemeCSS = theme;
            if (this.lastThemeCssKey) {
                getMainWindow().webContents.removeInsertedCSS(this.lastThemeCssKey);
            }
            getMainWindow().webContents.insertCSS(theme).then(key => {
                this.lastThemeCssKey = key;
            });
        }
    }
}

function getDefaultThemeCSS() {
    return `body {
        color: green;
        background-color: black;
        font-family: 'Titillium Web', sans-serif;
    }

    div.home-time {
        font-family: 'Seven Segment';
        color: green;
    }

    .exposed {
        color: green;
    }

    div.home-date {
        color: green;
    }
    
    div.home-box {
        background-color: black;
    }
    
    div.border {
        border-radius: 0;
        border-width: 1px;
        border-color: green;
    }
    
    button.action-button {
        border-radius: 0;
        border-width: 1px;
        border-color: green;
        background-color: black;
        color: green;
    }
    
    button.forecast-control-button {
        border-radius: 0;
        border-width: 1px;
        border-color: green;
        background-color: black;
        color: green;
    }
    
    button.event-calendar-control-button {
        border-radius: 0;
        border-width: 1px;
        border-color: green;
        background-color: black;
        color: green;
    }
    
    div.inverted-color, span.inverted-color {
        color: black;
        background-color: green;
    }`;
}