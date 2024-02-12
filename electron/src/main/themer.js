import { getMainWindow } from "./window";

class Themer {
    constructor() {
        this.lastThemeCssKey = null;
        this.lastThemeCSS = getDefaultThemeCSS();
    }

    setThemeFromData(data) {
        if (data && data.theme_css) {
            this.setTheme(data.theme_css);
        }
    }

    setDefaultTheme() {
        this.setTheme(getDefaultThemeCSS());
    }

    setTheme(theme) {
        if (theme !== this.lastThemeCSS) {
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
    font-family: Titillium Web;
}

div.home-time {
    font-family: Seven Segment;
}

div.ui-box {
    background-color: black;
}

div.border {
    border-radius: 0;
    border-width: 1px;
    border-color: green;
}`;
}