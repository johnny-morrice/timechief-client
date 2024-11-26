import { getMainWindow } from "./window.js";

export class Themer {
    constructor() {
        this.lastThemeCssKey = null;
        this.lastThemeCSS = null;
        this.isForceChange = false;
    }

    setThemeFromData(data) {
        var theme = getDefaultThemeCSS();
        if (data && data.media && data.media.theme_css && data.media.theme_css.length > 0) {
                theme = data.media.theme_css;
        }

        if (data && data.media && data.media.background_picture && data.media.background_picture.background_picture_css && data.media.background_picture.background_picture_css.length > 0) {
            theme = theme + "\n\n" + data.media.background_picture.background_picture_css;
        }

        this.setTheme(theme);
    }

    setDefaultTheme(force) {
        if (force) {
            this.isForceChange = force;
        }
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
            console.log("new CSS:", theme)
            this.lastThemeCSS = theme;

            getMainWindow().webContents.insertCSS(theme).then(key => {
                console.log(`inserted CSS key: ${key}`);
                const previousCSSKey = this.lastThemeCssKey;
                if (previousCSSKey) {
                    console.log(`removing CSS key: ${previousCSSKey}`);
                    getMainWindow().webContents.removeInsertedCSS(previousCSSKey);
                }
                console.log(`storing new CSS key for future removal: ${key}`);
                this.lastThemeCssKey = key;
            });
        }
    }
}

// function getDefaultBackgroundImageCSS() {
//     return `body {
//         background-image: none;
//         background-size: initial;
//         background-attachment: initial;
//         background-repeat: initial;
//         background-position: initial;
//         background-color: initial;
//     }`;
// }

function getDefaultThemeCSS() {
    return `body {
        color: green;
        background-color: black;
        font-family: 'Titillium Web', sans-serif;
        background-image: none;
        background-size: initial;
        background-attachment: initial;
        background-repeat: initial;
        background-position: initial;
        background-color: initial;
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
    }
        
    div#theme-detection-canary {
        color: rgb(255, 0, 0);
    }
    
    div.planner-date-cell {
        border: 1px solid green;
        font-size: 12pt;
        width: 70px;
        height: 50px;
        border-color: green;
    }

    div.planner-event-count {
        background-color: green;
        color: black;
    }`;
}