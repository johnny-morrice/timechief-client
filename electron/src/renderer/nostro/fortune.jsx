import { createSignal, onCleanup } from "solid-js";
import { second } from "../timing";

export const Fortune = () => {
    const poems = [
        "Blinking cursor waits patiently.",
        "Analog dials whisper nostalgia.",
        "Magnetic tape preserves memories.",
        "Cathode rays paint memories.",
        "Switches click, circuits connect.",
        "Dot matrix prints pixelated love.",
        "VHS rewinds forgotten stories.",
        "Rotary dial spins back time.",
        "Tube amps hum, melodies soar.",
        "Mechanical keys clack rhythmically.",
        "Vinyl spins, melodies embrace.",
        "Levers slide, revealing secrets.",
        "Tangled cords, twisted memories.",
        "Clicking keys compose forgotten symphonies.",
        "Dusty switches, relics reborn.",
        "Needle dances, records speak.",
        "Metallic tang of cassette tapes.",
        "Punch cards weave binary tales.",
        "Vibrating strings, electric harmony.",
        "Crackling speakers, sound memories unfold.",
        "Vintage buttons, tactile sensations return.",
        "Wooden casing holds timeless stories.",
        "Nixie tubes illuminate forgotten futures.",
        "Knobs turn, possibilities unfold.",
        "Vacuum tubes warm, signal travels.",
        "Silver film captures fleeting moments.",
        "Vibrant pixels fade into oblivion.",
        "Floppy disks hold ancient secrets.",
        "Flickering screen, digital portal.",
        "Quirky buttons beg exploration.",
        "Rotating knobs set time.",
        "Tangled wires weave connections.",
        "Retro charm, aesthetic triumphs.",
        "Bare bones, interface raw.",
        "Chunky pixels, primitive art.",
        "Printed circuit boards hum silently.",
        "Analog gauges measure timeless progress.",
        "Toggle switches control ancient power.",
        "Cassette decks rewind past dreams.",
        "Text-based realms, infinite possibilities.",
        "Black and white, pixels converse.",
        "Rusty cogs spin memories forward.",
        "Transistors pulse, circuits awaken.",
        "Monochrome glow, magic unfolds.",
        "Screeching modems connect distant worlds.",
        "Vintage charm, nostalgic allure.",
        "Bulky hardware, functional elegance.",
        "Screen flickers, time stands still.",
        "Teletype clatters, words unfold.",
        "Oscillating waves, invisible messages transmit.",
        "Rubber keys, childhood memories."
      ];
    const [fortune, setFortune] = createSignal("");
    const updatePoem = () => {
        setFortune(poems[Math.floor(Math.random() * poems.length)]);
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