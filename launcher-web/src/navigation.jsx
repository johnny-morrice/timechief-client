import { createSignal } from 'solid-js';

class NavigationSignals {
    constructor() {
        [this.isShowMyClocks, this.setShowMyClocks] = createSignal(false);
        [this.isEditClockLocation, this.setEditClockLocation] = createSignal(false);
        [this.isEditClockAdvancedLocation, this.setEditClockAdvancedLocation] = createSignal(false);
        [this.isShowClockHome, this.setShowClockHome] = createSignal(false);
        [this.isShowNoClocks, this.setShowNoClocks] = createSignal(false);
        [this.isEditGoogleAccount, this.setEditGoogleAccount] = createSignal(false);
        this.signals = {
            "myClocks": {"getter": this.isShowMyClocks, "setter": this.setShowMyClocks},
            "editClockLocation": {"getter": this.isShowEditClockLocation, "setter": this.setEditClockLocation},
            "editClockAdvancedLocation": {"getter": this.isShowEditClockAdvancedLocation, "setter": this.setEditClockAdvancedLocation},
            "clockHome": {"getter": this.isShowClockHome, "setter": this.setShowClockHome},
            "editGoogleAccount": {"getter": this.isEditGoogleAccount, "setter": this.setEditGoogleAccount},
        }
    }

    showScreen(screenName) {
        const aliases = {
            'editClock': 'editClockLocation'
        }
        if (screenName in aliases) {
            this.showScreen(aliases[screenName]);
            return;
        }
        for (const [name, signals] of Object.entries(this.signals)) {
            if (name === screenName) {
                signals["setter"](true);
            } else {
                signals["setter"](false);
            }
          }
    }
}

const navSignals = new NavigationSignals();

export function getNavSignals() {
    return navSignals;
} 