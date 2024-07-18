import { onCleanup } from "solid-js";
import { second } from "../timing";
import { textTransitionSignal } from "./textGlitch";
import { random } from './fakeRandom';

class Message {
    constructor(text, mascotNickname) {
        this.text = text;
        this.mascotNickname = mascotNickname;
    }

    element() {
        this.validateNickname();
        return <div class="fortune-message">
            <div class="fortune-message-text">{this.text}</div>
            <div class="fortune-message-mascot-wrapper">
                <img src={this.mascotPath()} alt={"Mascot with expression: " + this.mascotNickname}></img>
            </div>
        </div>;
    }

    mascotPath() {
        this.validateNickname();
        return `/assets/image/mascot/mascot-${this.mascotNickname}.png`;
    }

    validateNickname() {
        const validNicks = [
            "instruct",
            "neutral",
            "sigh",
            "spooky",
            "thumb"
        ];
        const isValid = validNicks.filter(nick => nick === this.mascotNickname).length > 0;
        if (!isValid) {
            throw new Error(`invalid mascot nickname: ${this.mascotNickname}`);
        }
    }
}

export const Fortune = () => {
    const poems = [
        "Blinking cursor waits patiently.",
        "Analog dials whisper nostalgia.",
        "Magnetic tape preserves memories.",
        "Cathode rays paint memories.",
        "Switches click, circuits connect.",
        "Tape rewinds forgotten stories.",
        "Rotary dial spins back time.",
        "Mechanical keys clack rhythmically.",
        "Tangled cords, twisted memories.",
        "Clicking keys compose forgotten symphonies.",
        "Dusty switches, relics reborn.",
        "Punch cards weave binary tales.",
        "Tubes illuminate forgotten futures.",
        "Vacuum tubes warm, signal travels.",
        "Vibrant pixels fade into oblivion.",
        "Flickering screen, digital portal.",
        "Tangled wires weave connections.",
        "Printed circuit boards hum silently.",
        "Toggle switches control ancient power.",
        "Monochrome pixels converse.",
        "Rusty cogs spin memories forward.",
        "Transistors pulse, circuits awaken.",
        "Monochrome glow, magic unfolds.",
        "Screeching modems connect distant worlds.",
        "Vintage charm, nostalgic allure.",
        "Bulky hardware, functional elegance.",
        "Screen flickers, time stands still.",
        "Teletype clatters, words unfold.",
        "Oscillating waves, invisible messages transmit.",
    ];
    const [fortune, setFortune] = textTransitionSignal("");
    const updatePoem = () => {
        setFortune(poems[Math.floor(random() * poems.length)]);
    };

    updatePoem();
    const interval = setInterval(updatePoem, 60 * second);
    onCleanup(() => {
        clearInterval(interval);
    });
    return <div class="fortune-wrapper flex-column flex-grow">
        <div class="fortune-text">{fortune}</div>
    </div>;
}