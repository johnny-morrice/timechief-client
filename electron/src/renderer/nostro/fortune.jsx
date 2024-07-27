import { onCleanup, createSignal } from "solid-js";
import { second } from "../timing";
import { textTransitionSignal } from "./textGlitch";
import { random } from './fakeRandom';

class Message {
    constructor(text, mascotNickname) {
        this.text = text;
        this.mascotNickname = mascotNickname;
    }

    element() {
        const [text, setText] = textTransitionSignal("");
        var timeout = setTimeout(() => {
            setText(this.text);
        }, 100);
        onCleanup(() => {
            clearTimeout(timeout);
        });
        this.validateNickname();
        return <div class="fortune-message">
            <div class="fortune-message-text">{text}</div>
            <div class="fortune-message-mascot-wrapper">
                <img class="fortune-mascot image-fg-recolor" src={this.mascotPath()} alt={"Mascot with expression: " + this.mascotNickname}></img>
            </div>
        </div>;
    }

    mascotPath() {
        this.validateNickname();
        return `assets/image/mascot/mascot-${this.mascotNickname}.png`;
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

function msg(text, mascotNickname) {
    return new Message(text, mascotNickname);
}

export const Fortune = () => {
    const poems = [
        msg("Blinking cursor waits patiently.", "neutral"),
    ];
    const [fortune, setFortune] = createSignal(poems[0]);
    const updatePoem = () => {
        setFortune(poems[Math.floor(random() * poems.length)]);
    };

    updatePoem();
    const interval = setInterval(updatePoem, 60 * second);
    onCleanup(() => {
        clearInterval(interval);
    });
    return fortune().element();
}