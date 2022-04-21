import { createSignal } from 'solid-js';

class TaskBarSignals {
    constructor() {
        [this.homeDisplayStyle, this.setHomeDisplayStyle] = createSignal("block");
        [this.configDisplayStyle, this.setConfigDisplayStyle] = createSignal("none");
        this.signals = {
            "home": {"getter": this.homeDisplayStyle, "setter": this.setHomeDisplayStyle},
            "config": {"getter": this.configDisplayStyle, "setter": this.setConfigDisplayStyle},
        }
    }

    showScreen(screenName) {
        for (const [name, signals] of Object.entries(this.signals)) {
            if (name === screenName) {
                signals["setter"]("block");
            } else {
                signals["setter"]("none");
            }
          }
    }
}

const taskBarSignals = new TaskBarSignals()
export function getTaskBarSignals() {
    return taskBarSignals;
}