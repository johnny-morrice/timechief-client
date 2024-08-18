class PoemList {
    constructor(poems) {
        this.poems = poems;
    }

    findByEmote(emote) {
        return new PoemList(this.poems.filter(poem => poem.isEmote(emote)));
    }

    findByTag(tag) {
        return new PoemList(this.poems.filter(poem => poem.hasTag(tag)));
    }

    removeTag(tag) {
        return new PoemList(this.poems.filter(poem => !poem.hasTag(tag)));
    }

    removeEmote(emote) {
        return new PoemList(this.poems.filter(poem => !poem.isEmote(emote)));
    }

    findByMinTagPopulationSize(size) {
        const poemsByTag = {};
        this.poems.forEach(poem => {
            poem.tags.forEach(tag => {
                if (!poemsByTag[tag]) {
                    poemsByTag[tag] = [];
                }
                poemsByTag[tag].push(poem);
            });
        });
        console.log("tag lengths: ", Object.keys(poemsByTag).map(tag => `${tag}: ${poemsByTag[tag].length}`));
        return Object.keys(poemsByTag).filter(tag => poemsByTag[tag].length >= size).map(tag => new PoemList(poemsByTag[tag]));
    }

    allTags() {
        return this.poems.reduce((acc, poem) => {
            return acc.concat(poem.tags);
        }, []);
    }

    validate() {
        this.poems.forEach(poem => poem.validate());
    }
}

class Poem {
    constructor(text, emote, tags) {
        this.text = text;
        this.emote = emote;
        this.tags = tags
    }

    isEmote(emote) {
        return this.emote === emote;
    }

    hasTag(tag) {
        return this.tags.includes(tag);
    }

    validate() {
        const validEmotes = [
            "instruct",
            "neutral",
            "sigh",
            "spooky",
            "thumb"
        ];
        const isValid = validEmotes.filter(emote => emote === this.emote).length > 0;
        if (!isValid) {
            throw new Error(`invalid mascot nickname: ${this.emote}`);
        }
    }
}

var _christmasPoems;
var _halloweenPoems;
var _themedPoemsCollection;
var _spookyThemedPoemsCollection;
var _instructPoems;
var _nonSpookyPoems;
var _plainPoems;

function standardDayPoems() {
    if (!_plainPoems) {
        _plainPoems = allPoems().removeTag("inclusive-holiday");
        _plainPoems = _plainPoems.removeTag("easter");
        _plainPoems = _plainPoems.removeTag("christmas");
        _plainPoems = _plainPoems.removeTag("halloween");
    }
    return _plainPoems;
}

function christmasPoems() {
    if (!_christmasPoems) {
        _christmasPoems = allPoems().findByTag("christmas");
    }
    return _christmasPoems;
}

function halloweenPoems() {
    if (!_halloweenPoems) {
        _halloweenPoems = allPoems().findByTag("halloween");
    }
    return _halloweenPoems;
}

export function instructPoems() {
    if (!_instructPoems) {
        _instructPoems = allPoems().findByEmote("instruct");
    }
    return _instructPoems;
}

function nonSpookyPoems() {
    if (!_nonSpookyPoems) {
        _nonSpookyPoems = standardDayPoems().removeTag("spooky");
        _nonSpookyPoems = _nonSpookyPoems.removeEmote("spooky");
    }
    return _nonSpookyPoems;
}

function randomElem(poemList) {
    const randomIndex = Math.floor(Math.random() * poemList.poems.length);
    return poemList.poems[randomIndex];
}

export function randomInstructionPoem() {
    return randomElem(instructPoems());
}

function themedPoemsCollection(isSpooky) {
    const minTagSize = 8;
    if (!_themedPoemsCollection) {
        _themedPoemsCollection = nonSpookyPoems().findByMinTagPopulationSize(minTagSize);
    }
    if (!_spookyThemedPoemsCollection) {
        _spookyThemedPoemsCollection = standardDayPoems().findByMinTagPopulationSize(minTagSize);
    }
    if (isSpooky) {
        return _spookyThemedPoemsCollection;
    }
    return _themedPoemsCollection;
}

function getDayOfYear(now) {
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function randomThemedPoem(now, isSpooky) {
    // Compute theme index based day of the year modulo the number of themes
    const themes = themedPoemsCollection(isSpooky);
    const themeIndex = getDayOfYear(now) % themes.length;
    return randomElem(themes[themeIndex]); 
}

export function randomPoem(now, isSpooky) {
    // Small chance of totally random poem
    if (Math.random() < 0.05) {
        if (isSpooky) {
            return randomElem(standardDayPoems());
        }
        return randomElem(nonSpookyPoems());
    }

    // Is it christmas or halloween?
    // TODO let's do other holidays later.
    const month = now.getMonth();
    const day = now.getDate();
    const xmasDays = [24, 25, 26];
    const halloweenDays = [30, 31];
    if (month === 11 && xmasDays.includes(day)) { 
        return randomElem(christmasPoems());
    }  else if (month === 9 && halloweenDays.includes(day)) {
        return randomElem(halloweenPoems());
    }
    return randomThemedPoem(now, isSpooky);
}

function allPoems() {
    return _allPoems;
}

function buildPoemList(poems) {
    return new PoemList(poems.map(poem => new Poem(poem.text, poem.emote, poem.tags)));
}

const _allPoems = buildPoemList([
        {
            "text": "I've started… Egg hunt begins!",
            "emote": "instruct",
            "tags": ["easter", "startup", "fun"]
        },
        {
            "text": "Follow me… Bunnies lead the way.",
            "emote": "instruct",
            "tags": ["easter", "nature", "guide"]
        },
        {
            "text": "Stick close… The eggs are hidden.",
            "emote": "spooky",
            "tags": ["easter", "guide", "mystery"]
        },
        {
            "text": "Starting now… Bright colors ahead.",
            "emote": "spooky",
            "tags": ["easter", "startup", "surprise"]
        },
        {
            "text": "I'll guide… Through Easter joy.",
            "emote": "instruct",
            "tags": ["easter", "guide", "happy"]
        },
        {
            "text": "I'm here… Easter fun ready.",
            "emote": "neutral",
            "tags": ["easter", "startup", "fun"]
        },
        {
            "text": "I'm ready… Eggs await discovery.",
            "emote": "neutral",
            "tags": ["easter", "guide", "anticipation"]
        },
        {
            "text": "Everything's fine… Bunnies hopping nearby.",
            "emote": "spooky",
            "tags": ["easter", "nature", "calm"]
        },
        {
            "text": "I'm on… Easter magic starts now.",
            "emote": "neutral",
            "tags": ["easter", "startup", "magic"]
        },
        {
            "text": "I'm alert… Let's find the eggs.",
            "emote": "spooky",
            "tags": ["easter", "guide", "mystery"]
        },
        {
            "text": "Sigh… The eggs are hidden well.",
            "emote": "sigh",
            "tags": ["easter", "mystery", "anticipation"]
        },
        {
            "text": "Sigh… Bunnies hopping all around.",
            "emote": "sigh",
            "tags": ["easter", "nature", "calm"]
        },
        {
            "text": "Sigh… Easter's here, so peaceful.",
            "emote": "sigh",
            "tags": ["easter", "calm", "happy"]
        },
        {
            "text": "Sigh… Bright colors, calm day.",
            "emote": "sigh",
            "tags": ["easter", "calm", "magic"]
        },
        {
            "text": "Sigh… The hunt is on.",
            "emote": "sigh",
            "tags": ["easter", "anticipation", "fun"]
        },
        {
            "text": "I've powered on… Eggs in shadows.",
            "emote": "spooky",
            "tags": ["easter", "startup", "mystery"]
        },
        {
            "text": "I'm sensing… Bunnies in the dark.",
            "emote": "spooky",
            "tags": ["easter", "nature", "mystery"]
        },
        {
            "text": "Something's here… But it's fluffy!",
            "emote": "spooky",
            "tags": ["easter", "fun", "mystery"]
        },
        {
            "text": "Starting now… Easter eggs glow.",
            "emote": "spooky",
            "tags": ["easter", "startup", "magic"]
        },
        {
            "text": "I feel it… Easter magic near.",
            "emote": "spooky",
            "tags": ["easter", "nature", "magic"]
        },
        {
            "text": "We're ready… Egg hunt success!",
            "emote": "thumb",
            "tags": ["easter", "success", "fun"]
        },
        {
            "text": "We're good… Let's find them all!",
            "emote": "thumb",
            "tags": ["easter", "guide", "fun"]
        },
        {
            "text": "We've got this… Easter fun ahead!",
            "emote": "thumb",
            "tags": ["easter", "anticipation", "happy"]
        },
        {
            "text": "All done… Eggs collected!",
            "emote": "thumb",
            "tags": ["easter", "success", "fun"]
        },
        {
            "text": "Thumbs up… Easter's a blast!",
            "emote": "thumb",
            "tags": ["easter", "success", "happy"]
        },
        {
            "text": "I've started… Let's celebrate together!",
            "emote": "instruct",
            "tags": ["inclusive-holiday", "startup", "joy"]
        },
        {
            "text": "Follow me… Joy in the air.",
            "emote": "instruct",
            "tags": ["inclusive-holiday", "guide", "happy"]
        },
        {
            "text": "Stick close… Festivities all around.",
            "emote": "spooky",
            "tags": ["inclusive-holiday", "celebration", "happy"]
        },
        {
            "text": "Starting now… Celebration mode on.",
            "emote": "spooky",
            "tags": ["inclusive-holiday", "startup", "anticipation"]
        },
        {
            "text": "I'll guide… Through moments of joy.",
            "emote": "instruct",
            "tags": ["inclusive-holiday", "guide", "happy"]
        },
        {
            "text": "I'm here… Ready to celebrate.",
            "emote": "neutral",
            "tags": ["inclusive-holiday", "startup", "joy"]
        },
        {
            "text": "I'm ready… Let's enjoy today.",
            "emote": "neutral",
            "tags": ["inclusive-holiday", "celebration", "happy"]
        },
        {
            "text": "Everything's fine… Celebration begins now.",
            "emote": "spooky",
            "tags": ["inclusive-holiday", "startup", "joy"]
        },
        {
            "text": "I'm on… Joyful vibes detected.",
            "emote": "neutral",
            "tags": ["inclusive-holiday", "celebration", "anticipation"]
        },
        {
            "text": "I'm alert… Let's enjoy together.",
            "emote": "spooky",
            "tags": ["inclusive-holiday", "celebration", "happy"]
        },
        {
            "text": "Sigh… Let's pause and enjoy.",
            "emote": "sigh",
            "tags": ["inclusive-holiday", "calm", "celebration"]
        },
        {
            "text": "Sigh… Today's a day to cherish.",
            "emote": "sigh",
            "tags": ["inclusive-holiday", "celebration", "happy"]
        },
        {
            "text": "Sigh… It's calm, let's celebrate.",
            "emote": "sigh",
            "tags": ["inclusive-holiday", "calm", "joy"]
        },
        {
            "text": "Sigh… Peaceful moments to savor.",
            "emote": "sigh",
            "tags": ["inclusive-holiday", "calm", "happy"]
        },
        {
            "text": "Sigh… Let's enjoy this day.",
            "emote": "sigh",
            "tags": ["inclusive-holiday", "celebration", "joy"]
        },
        {
            "text": "I've powered on… Celebration detected.",
            "emote": "spooky",
            "tags": ["inclusive-holiday", "startup", "anticipation"]
        },
        {
            "text": "I'm sensing… Festive energy around.",
            "emote": "spooky",
            "tags": ["inclusive-holiday", "celebration", "joy"]
        },
        {
            "text": "Something's here… Celebration vibes strong.",
            "emote": "spooky",
            "tags": ["inclusive-holiday", "celebration", "anticipation"]
        },
        {
            "text": "Starting now… Festivities begin.",
            "emote": "spooky",
            "tags": ["inclusive-holiday", "startup", "joy"]
        },
        {
            "text": "I feel it… Joy is here.",
            "emote": "spooky",
            "tags": ["inclusive-holiday", "celebration", "happy"]
        },
        {
            "text": "We're ready… Celebration mode activated!",
            "emote": "thumb",
            "tags": ["inclusive-holiday", "startup", "joy"]
        },
        {
            "text": "We're good… Let's celebrate together!",
            "emote": "thumb",
            "tags": ["inclusive-holiday", "celebration", "happy"]
        },
        {
            "text": "We've got this… Joy all around!",
            "emote": "thumb",
            "tags": ["inclusive-holiday", "celebration", "success"]
        },
        {
            "text": "All done… Festivities complete!",
            "emote": "thumb",
            "tags": ["inclusive-holiday", "success", "celebration"]
        },
        {
            "text": "Thumbs up… Let's enjoy today!",
            "emote": "thumb",
            "tags": ["inclusive-holiday", "joy", "success"]
        },
        {
            "text": "I've started… Ready for liftoff.",
            "emote": "instruct",
            "tags": ["space", "startup", "anticipation"]
        },
        {
            "text": "Follow me… Into the cosmic woods.",
            "emote": "instruct",
            "tags": ["space", "nature", "exploration"]
        },
        {
            "text": "Stick close… The stars are watching.",
            "emote": "spooky",
            "tags": ["space", "exploration", "mystery"]
        },
        {
            "text": "Starting now… Signals from beyond.",
            "emote": "spooky",
            "tags": ["space", "startup", "mystery"]
        },
        {
            "text": "I'll guide… Through the starlit path.",
            "emote": "instruct",
            "tags": ["space", "guide", "exploration"]
        },
        {
            "text": "I'm here… Scanning the cosmos.",
            "emote": "neutral",
            "tags": ["space", "startup", "exploration"]
        },
        {
            "text": "I'm ready… Let's explore the stars.",
            "emote": "neutral",
            "tags": ["space", "exploration", "anticipation"]
        },
        {
            "text": "Everything's fine… Cosmic silence prevails.",
            "emote": "spooky",
            "tags": ["space", "calm", "exploration"]
        },
        {
            "text": "I'm on… Stars twinkle bright.",
            "emote": "neutral",
            "tags": ["space", "startup", "calm"]
        },
        {
            "text": "I'm alert… Signals incoming.",
            "emote": "spooky",
            "tags": ["space", "exploration", "mystery"]
        },
        {
            "text": "Sigh… The universe is vast.",
            "emote": "sigh",
            "tags": ["space", "calm", "exploration"]
        },
        {
            "text": "Sigh… Stars twinkle in silence.",
            "emote": "sigh",
            "tags": ["space", "calm", "mystery"]
        },
        {
            "text": "Sigh… The cosmos whispers softly.",
            "emote": "sigh",
            "tags": ["space", "calm", "exploration"]
        },
        {
            "text": "Sigh… Infinite space, endless thoughts.",
            "emote": "sigh",
            "tags": ["space", "calm", "meditation"]
        },
        {
            "text": "Sigh… The void calls gently.",
            "emote": "sigh",
            "tags": ["space", "calm", "exploration"]
        },
        {
            "text": "I've powered on… Alien signals detected.",
            "emote": "spooky",
            "tags": ["space", "startup", "mystery"]
        },
        {
            "text": "I'm sensing… The stars are watching.",
            "emote": "spooky",
            "tags": ["space", "exploration", "mystery"]
        },
        {
            "text": "Something's here… From beyond the stars.",
            "emote": "spooky",
            "tags": ["space", "mystery", "exploration"]
        },
        {
            "text": "Starting now… The unknown awaits.",
            "emote": "spooky",
            "tags": ["space", "startup", "exploration"]
        },
        {
            "text": "I feel it… Cosmic forces near.",
            "emote": "spooky",
            "tags": ["space", "exploration", "mystery"]
        },
        {
            "text": "We're ready… Space adventure ahead!",
            "emote": "thumb",
            "tags": ["space", "exploration", "anticipation"]
        },
        {
            "text": "We're good… Let's explore the cosmos!",
            "emote": "thumb",
            "tags": ["space", "exploration", "success"]
        },
        {
            "text": "We've got this… Stars guide our way!",
            "emote": "thumb",
            "tags": ["space", "exploration", "success"]
        },
        {
            "text": "All done… Ready for stargazing!",
            "emote": "thumb",
            "tags": ["space", "calm", "success"]
        },
        {
            "text": "Thumbs up… The universe awaits!",
            "emote": "thumb",
            "tags": ["space", "exploration", "anticipation"]
        },
        {
            "text": "I've started… Let's debug together!",
            "emote": "instruct",
            "tags": ["nerd", "geek", "startup", "tech"]
        },
        {
            "text": "Follow me… To the source code.",
            "emote": "instruct",
            "tags": ["nerd", "geek", "guide", "tech"]
        },
        {
            "text": "Stick close… The data is glitchy.",
            "emote": "spooky",
            "tags": ["nerd", "geek", "tech", "glitch"]
        },
        {
            "text": "Starting now… Variables acting strange.",
            "emote": "spooky",
            "tags": ["nerd", "geek", "startup", "tech"]
        },
        {
            "text": "I'll guide… Through the binary woods.",
            "emote": "instruct",
            "tags": ["nerd", "geek", "guide", "tech"]
        },
        {
            "text": "I'm here… Ready to code.",
            "emote": "neutral",
            "tags": ["nerd", "geek", "tech", "startup"]
        },
        {
            "text": "I'm ready… Let's geek out!",
            "emote": "neutral",
            "tags": ["nerd", "geek", "anticipation", "tech"]
        },
        {
            "text": "Everything's fine… Algorithms are stable.",
            "emote": "spooky",
            "tags": ["nerd", "geek", "tech", "calm"]
        },
        {
            "text": "I'm on… Syntax error resolved.",
            "emote": "neutral",
            "tags": ["nerd", "geek", "tech", "success"]
        },
        {
            "text": "I'm alert… No bugs detected.",
            "emote": "spooky",
            "tags": ["nerd", "geek", "tech", "success"]
        },
        {
            "text": "Sigh… Compiling takes forever.",
            "emote": "sigh",
            "tags": ["nerd", "geek", "tech", "waiting"]
        },
        {
            "text": "Sigh… Debugging can be tedious.",
            "emote": "sigh",
            "tags": ["nerd", "geek", "tech", "glitch"]
        },
        {
            "text": "Sigh… Code's acting strange again.",
            "emote": "sigh",
            "tags": ["nerd", "geek", "tech", "glitch"]
        },
        {
            "text": "Sigh… Infinite loops, what a day.",
            "emote": "sigh",
            "tags": ["nerd", "geek", "tech", "glitch"]
        },
        {
            "text": "Sigh… The code is haunted.",
            "emote": "sigh",
            "tags": ["nerd", "geek", "tech", "spooky"]
        },
        {
            "text": "I've powered on… Ghost in the code.",
            "emote": "spooky",
            "tags": ["nerd", "geek", "tech", "spooky"]
        },
        {
            "text": "I'm sensing… Errors lurking within.",
            "emote": "spooky",
            "tags": ["nerd", "geek", "tech", "glitch"]
        },
        {
            "text": "Something's here… The code's possessed.",
            "emote": "spooky",
            "tags": ["nerd", "geek", "tech", "spooky"]
        },
        {
            "text": "Starting now… Strange outputs detected.",
            "emote": "spooky",
            "tags": ["nerd", "geek", "tech", "glitch"]
        },
        {
            "text": "I feel it… The algorithm's alive.",
            "emote": "spooky",
            "tags": ["nerd", "geek", "tech", "spooky"]
        },
        {
            "text": "We're ready… Code runs smoothly!",
            "emote": "thumb",
            "tags": ["nerd", "geek", "tech", "success"]
        },
        {
            "text": "We're good… Let's hack away!",
            "emote": "thumb",
            "tags": ["nerd", "geek", "tech", "success"]
        },
        {
            "text": "We've got this… Code compiled!",
            "emote": "thumb",
            "tags": ["nerd", "geek", "tech", "success"]
        },
        {
            "text": "All done… No bugs found!",
            "emote": "thumb",
            "tags": ["nerd", "geek", "tech", "success"]
        },
        {
            "text": "Thumbs up… Debugging success!",
            "emote": "thumb",
            "tags": ["nerd", "geek", "tech", "success"]
        },
        {
            "text": "I've started… Let's explore safely.",
            "emote": "instruct",
            "tags": ["ranger", "nature", "guide", "startup"]
        },
        {
            "text": "Follow me… Nature's path ahead.",
            "emote": "instruct",
            "tags": ["ranger", "nature", "guide"]
        },
        {
            "text": "Stick close… The woods are deep.",
            "emote": "spooky",
            "tags": ["ranger", "nature", "guide", "mystery"]
        },
        {
            "text": "Starting now… Nature's secrets awaken.",
            "emote": "spooky",
            "tags": ["ranger", "nature", "startup", "mystery"]
        },
        {
            "text": "I'll guide… Through the wilderness.",
            "emote": "instruct",
            "tags": ["ranger", "nature", "guide"]
        },
        {
            "text": "I'm here… Trail map ready.",
            "emote": "neutral",
            "tags": ["ranger", "nature", "startup", "guide"]
        },
        {
            "text": "I'm ready… Let's hike together.",
            "emote": "neutral",
            "tags": ["ranger", "nature", "anticipation", "guide"]
        },
        {
            "text": "Everything's fine… Nature is calm.",
            "emote": "spooky",
            "tags": ["ranger", "nature", "calm", "guide"]
        },
        {
            "text": "I'm on… Trees sway gently.",
            "emote": "neutral",
            "tags": ["ranger", "nature", "startup", "calm"]
        },
        {
            "text": "I'm alert… Nature's watchful eyes.",
            "emote": "spooky",
            "tags": ["ranger", "nature", "guide", "mystery"]
        },
        {
            "text": "Sigh… The forest is peaceful.",
            "emote": "sigh",
            "tags": ["ranger", "nature", "calm"]
        },
        {
            "text": "Sigh… Birds sing quietly now.",
            "emote": "sigh",
            "tags": ["ranger", "nature", "calm", "guide"]
        },
        {
            "text": "Sigh… The woods are still.",
            "emote": "sigh",
            "tags": ["ranger", "nature", "calm"]
        },
        {
            "text": "Sigh… Nature's calm, a perfect day.",
            "emote": "sigh",
            "tags": ["ranger", "nature", "calm", "guide"]
        },
        {
            "text": "Sigh… The forest breathes deeply.",
            "emote": "sigh",
            "tags": ["ranger", "nature", "calm", "guide"]
        },
        {
            "text": "I've powered on… The woods stir.",
            "emote": "spooky",
            "tags": ["ranger", "nature", "startup", "mystery"]
        },
        {
            "text": "I'm sensing… Shadows in the trees.",
            "emote": "spooky",
            "tags": ["ranger", "nature", "mystery"]
        },
        {
            "text": "Something's here… The forest whispers.",
            "emote": "spooky",
            "tags": ["ranger", "nature", "mystery"]
        },
        {
            "text": "Starting now… Nature's mysteries unfold.",
            "emote": "spooky",
            "tags": ["ranger", "nature", "startup", "mystery"]
        },
        {
            "text": "I feel it… Something's watching us.",
            "emote": "spooky",
            "tags": ["ranger", "nature", "mystery"]
        },
        {
            "text": "We're ready… Trail ahead!",
            "emote": "thumb",
            "tags": ["ranger", "nature", "guide", "anticipation"]
        },
        {
            "text": "We're good… Nature welcomes us!",
            "emote": "thumb",
            "tags": ["ranger", "nature", "guide", "success"]
        },
        {
            "text": "We've got this… Wilderness awaits!",
            "emote": "thumb",
            "tags": ["ranger", "nature", "success"]
        },
        {
            "text": "All done… Nature's beauty explored!",
            "emote": "thumb",
            "tags": ["ranger", "nature", "success"]
        },
        {
            "text": "Thumbs up… Let's hike safely!",
            "emote": "thumb",
            "tags": ["ranger", "nature", "guide", "success"]
        },
        {
            "text": "I've started… Let's find peace together.",
            "emote": "instruct",
            "tags": ["spiritual", "startup", "calm"]
        },
        {
            "text": "Follow me… To inner stillness.",
            "emote": "instruct",
            "tags": ["spiritual", "guide", "calm"]
        },
        {
            "text": "Stick close… Calm your spirit.",
            "emote": "spooky",
            "tags": ["spiritual", "guide", "calm"]
        },
        {
            "text": "Starting now… Listen to the quiet.",
            "emote": "spooky",
            "tags": ["spiritual", "startup", "calm"]
        },
        {
            "text": "I'll guide… Through mindful moments.",
            "emote": "instruct",
            "tags": ["spiritual", "guide", "calm"]
        },
        {
            "text": "I'm here… Ready to reflect.",
            "emote": "neutral",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "I'm ready… Let's find balance.",
            "emote": "neutral",
            "tags": ["spiritual", "guide", "calm"]
        },
        {
            "text": "Everything's fine… Breathe deeply now.",
            "emote": "spooky",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "I'm on… Calmness fills the air.",
            "emote": "neutral",
            "tags": ["spiritual", "calm", "startup"]
        },
        {
            "text": "I'm alert… Inner peace detected.",
            "emote": "spooky",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "Sigh… Let's breathe and relax.",
            "emote": "sigh",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "Sigh… Nature calms the soul.",
            "emote": "sigh",
            "tags": ["spiritual", "nature", "calm"]
        },
        {
            "text": "Sigh… Peace in the stillness.",
            "emote": "sigh",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "Sigh… Finding serenity within.",
            "emote": "sigh",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "Sigh… Tranquility embraces us.",
            "emote": "sigh",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "I've powered on… Inner peace found.",
            "emote": "spooky",
            "tags": ["spiritual", "startup", "calm"]
        },
        {
            "text": "I'm sensing… Spiritual calmness around.",
            "emote": "spooky",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "Something's here… But it's peaceful.",
            "emote": "spooky",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "Starting now… Spiritual journey begins.",
            "emote": "spooky",
            "tags": ["spiritual", "startup", "meditation"]
        },
        {
            "text": "I feel it… Calm surrounds us.",
            "emote": "spooky",
            "tags": ["spiritual", "calm", "meditation"]
        },
        {
            "text": "We're ready… Let's meditate together!",
            "emote": "thumb",
            "tags": ["spiritual", "meditation", "success"]
        },
        {
            "text": "We're good… Inner peace awaits!",
            "emote": "thumb",
            "tags": ["spiritual", "calm", "success"]
        },
        {
            "text": "We've got this… Serenity ahead!",
            "emote": "thumb",
            "tags": ["spiritual", "meditation", "success"]
        },
        {
            "text": "All done… Calmness achieved!",
            "emote": "thumb",
            "tags": ["spiritual", "meditation", "success"]
        },
        {
            "text": "Thumbs up… Inner peace found!",
            "emote": "thumb",
            "tags": ["spiritual", "calm", "success"]
        },
        {
            "text": "I've started… Let's get to work.",
            "emote": "instruct",
            "tags": ["hustle", "money", "startup"]
        },
        {
            "text": "Follow me… Time to hustle.",
            "emote": "instruct",
            "tags": ["hustle", "money", "guide"]
        },
        {
            "text": "Stick close… Money moves fast.",
            "emote": "spooky",
            "tags": ["hustle", "money", "anticipation"]
        },
        {
            "text": "Starting now… Wealth on the horizon.",
            "emote": "spooky",
            "tags": ["hustle", "money", "startup", "anticipation"]
        },
        {
            "text": "I'll guide… To the next deal.",
            "emote": "instruct",
            "tags": ["hustle", "money", "guide"]
        },
        {
            "text": "I'm here… Ready to hustle.",
            "emote": "neutral",
            "tags": ["hustle", "money", "startup"]
        },
        {
            "text": "I'm ready… Let's make moves.",
            "emote": "neutral",
            "tags": ["hustle", "money", "anticipation"]
        },
        {
            "text": "Everything's fine… Keep grinding.",
            "emote": "spooky",
            "tags": ["hustle", "money", "calm"]
        },
        {
            "text": "I'm on… Money in the making.",
            "emote": "neutral",
            "tags": ["hustle", "money", "startup"]
        },
        {
            "text": "I'm alert… Opportunities ahead.",
            "emote": "spooky",
            "tags": ["hustle", "money", "anticipation"]
        },
        {
            "text": "Sigh… Hard work pays off.",
            "emote": "sigh",
            "tags": ["hustle", "money", "calm"]
        },
        {
            "text": "Sigh… Keep pushing, success comes.",
            "emote": "sigh",
            "tags": ["hustle", "money", "calm", "anticipation"]
        },
        {
            "text": "Sigh… Money's on the mind.",
            "emote": "sigh",
            "tags": ["hustle", "money", "calm"]
        },
        {
            "text": "Sigh… Grinding never stops.",
            "emote": "sigh",
            "tags": ["hustle", "money", "calm"]
        },
        {
            "text": "Sigh… Hustle hard, rewards follow.",
            "emote": "sigh",
            "tags": ["hustle", "money", "calm"]
        },
        {
            "text": "I've powered on… Big deals ahead.",
            "emote": "spooky",
            "tags": ["hustle", "money", "startup", "anticipation"]
        },
        {
            "text": "I'm sensing… Wealth in the air.",
            "emote": "spooky",
            "tags": ["hustle", "money", "anticipation"]
        },
        {
            "text": "Something's here… Opportunities knocking.",
            "emote": "spooky",
            "tags": ["hustle", "money", "anticipation"]
        },
        {
            "text": "Starting now… Money's within reach.",
            "emote": "spooky",
            "tags": ["hustle", "money", "startup"]
        },
        {
            "text": "I feel it… Success is near.",
            "emote": "spooky",
            "tags": ["hustle", "money", "success"]
        },
        {
            "text": "We're ready… Let's make it happen!",
            "emote": "thumb",
            "tags": ["hustle", "money", "success"]
        },
        {
            "text": "We're good… Money moves made!",
            "emote": "thumb",
            "tags": ["hustle", "money", "success"]
        },
        {
            "text": "We've got this… Success is ours!",
            "emote": "thumb",
            "tags": ["hustle", "money", "success"]
        },
        {
            "text": "All done… Profits secured!",
            "emote": "thumb",
            "tags": ["hustle", "money", "success"]
        },
        {
            "text": "Thumbs up… Hustle paid off!",
            "emote": "thumb",
            "tags": ["hustle", "money", "success"]
        },
        {
            "text": "I've started… Spooky times ahead!",
            "emote": "instruct",
            "tags": ["halloween", "startup", "spooky"]
        },
        {
            "text": "Follow me… Into the haunted woods.",
            "emote": "instruct",
            "tags": ["halloween", "nature", "spooky"]
        },
        {
            "text": "Stick close… Shadows move tonight.",
            "emote": "spooky",
            "tags": ["halloween", "spooky", "mystery"]
        },
        {
            "text": "Starting now… Ghosts in the wires.",
            "emote": "spooky",
            "tags": ["halloween", "tech", "spooky"]
        },
        {
            "text": "I'll guide… Through the Halloween night.",
            "emote": "instruct",
            "tags": ["halloween", "spooky", "guide"]
        },
        {
            "text": "I'm here… Ready for frights.",
            "emote": "neutral",
            "tags": ["halloween", "startup", "spooky"]
        },
        {
            "text": "I'm watching… Ghosts in the trees.",
            "emote": "neutral",
            "tags": ["halloween", "spooky", "nature"]
        },
        {
            "text": "Everything's fine… Or is it?",
            "emote": "spooky",
            "tags": ["halloween", "spooky", "mystery"]
        },
        {
            "text": "I'm on… The spooky starts now.",
            "emote": "neutral",
            "tags": ["halloween", "spooky", "startup"]
        },
        {
            "text": "I'm alert… Shadows lurk close.",
            "emote": "spooky",
            "tags": ["halloween", "spooky", "mystery"]
        },
        {
            "text": "Sigh… The spirits are restless.",
            "emote": "sigh",
            "tags": ["halloween", "spooky", "calm"]
        },
        {
            "text": "Sigh… The night is eerie.",
            "emote": "sigh",
            "tags": ["halloween", "spooky", "calm"]
        },
        {
            "text": "Sigh… Shadows cling to corners.",
            "emote": "sigh",
            "tags": ["halloween", "spooky", "mystery"]
        },
        {
            "text": "Sigh… Halloween chills everywhere.",
            "emote": "sigh",
            "tags": ["halloween", "spooky", "calm"]
        },
        {
            "text": "Sigh… The night grows darker.",
            "emote": "sigh",
            "tags": ["halloween", "spooky", "calm"]
        },
        {
            "text": "I've powered on… Ghosts whispering.",
            "emote": "spooky",
            "tags": ["halloween", "spooky", "tech"]
        },
        {
            "text": "I'm sensing… Creatures of the night.",
            "emote": "spooky",
            "tags": ["halloween", "spooky", "nature"]
        },
        {
            "text": "Something's here… Ghouls creeping near.",
            "emote": "spooky",
            "tags": ["halloween", "spooky", "mystery"]
        },
        {
            "text": "Starting now… The haunt begins.",
            "emote": "spooky",
            "tags": ["halloween", "spooky", "startup"]
        },
        {
            "text": "I feel it… Spirits surround us.",
            "emote": "spooky",
            "tags": ["halloween", "spooky", "mystery"]
        },
        {
            "text": "We're ready… Spooky fun awaits!",
            "emote": "thumb",
            "tags": ["halloween", "spooky", "fun"]
        },
        {
            "text": "We're good… Trick or treat time!",
            "emote": "thumb",
            "tags": ["halloween", "spooky", "fun"]
        },
        {
            "text": "We've got this… Face the frights!",
            "emote": "thumb",
            "tags": ["halloween", "spooky", "success"]
        },
        {
            "text": "All done… Let's enjoy Halloween!",
            "emote": "thumb",
            "tags": ["halloween", "spooky", "success"]
        },
        {
            "text": "Thumbs up… Halloween's our night!",
            "emote": "thumb",
            "tags": ["halloween", "spooky", "fun"]
        },
        {
            "text": "I've started… Holiday cheer incoming!",
            "emote": "instruct",
            "tags": ["christmas", "startup", "joy"]
        },
        {
            "text": "Follow me… Through the snowy woods.",
            "emote": "instruct",
            "tags": ["christmas", "nature", "joy"]
        },
        {
            "text": "Stick close… Christmas magic is near.",
            "emote": "spooky",
            "tags": ["christmas", "joy", "anticipation"]
        },
        {
            "text": "Starting now… Lights twinkle bright.",
            "emote": "spooky",
            "tags": ["christmas", "startup", "joy"]
        },
        {
            "text": "I'll guide… Through the winter night.",
            "emote": "instruct",
            "tags": ["christmas", "nature", "joy"]
        },
        {
            "text": "I'm here… Holiday tunes on deck.",
            "emote": "neutral",
            "tags": ["christmas", "startup", "joy"]
        },
        {
            "text": "I'm ready… Let's deck the halls.",
            "emote": "neutral",
            "tags": ["christmas", "joy", "anticipation"]
        },
        {
            "text": "Everything's fine… Snow's falling quietly.",
            "emote": "spooky",
            "tags": ["christmas", "calm", "joy"]
        },
        {
            "text": "I'm on… Christmas spirit activated.",
            "emote": "neutral",
            "tags": ["christmas", "startup", "joy"]
        },
        {
            "text": "I'm alert… Sleigh bells ring out.",
            "emote": "spooky",
            "tags": ["christmas", "joy", "anticipation"]
        },
        {
            "text": "Sigh… The season is warm.",
            "emote": "sigh",
            "tags": ["christmas", "joy", "calm"]
        },
        {
            "text": "Sigh… Snow falls gently now.",
            "emote": "sigh",
            "tags": ["christmas", "calm", "joy"]
        },
        {
            "text": "Sigh… The night is peaceful.",
            "emote": "sigh",
            "tags": ["christmas", "calm", "joy"]
        },
        {
            "text": "Sigh… Holiday magic fills the air.",
            "emote": "sigh",
            "tags": ["christmas", "calm", "joy"]
        },
        {
            "text": "Sigh… Christmas eve is here.",
            "emote": "sigh",
            "tags": ["christmas", "calm", "joy"]
        },
        {
            "text": "I've powered on… Holiday spirit found.",
            "emote": "spooky",
            "tags": ["christmas", "startup", "joy"]
        },
        {
            "text": "I'm sensing… Warmth in the air.",
            "emote": "spooky",
            "tags": ["christmas", "joy", "calm"]
        },
        {
            "text": "Something's here… But it's festive!",
            "emote": "spooky",
            "tags": ["christmas", "joy", "anticipation"]
        },
        {
            "text": "Starting now… A festive glow.",
            "emote": "spooky",
            "tags": ["christmas", "startup", "joy"]
        },
        {
            "text": "I feel it… Christmas joy near.",
            "emote": "spooky",
            "tags": ["christmas", "joy", "anticipation"]
        },
        {
            "text": "We're ready… Let's celebrate together!",
            "emote": "thumb",
            "tags": ["christmas", "joy", "success"]
        },
        {
            "text": "We're good… Holiday cheer ahead!",
            "emote": "thumb",
            "tags": ["christmas", "joy", "anticipation"]
        },
        {
            "text": "We've got this… Christmas joy all around!",
            "emote": "thumb",
            "tags": ["christmas", "joy", "success"]
        },
        {
            "text": "All done… Time for Christmas fun!",
            "emote": "thumb",
            "tags": ["christmas", "joy", "success"]
        },
        {
            "text": "Thumbs up… It's Christmas time!",
            "emote": "thumb",
            "tags": ["christmas", "joy", "success"]
        },
        {
            "text": "I've turned it on. Let's begin.",
            "emote": "instruct",
            "tags": ["greeting", "startup", "tech"]
        },
        {
            "text": "Hello! Follow me into the woods.",
            "emote": "instruct",
            "tags": ["greeting", "nature", "guide"]
        },
        {
            "text": "Greetings… Who's there with you?",
            "emote": "spooky",
            "tags": ["greeting", "spooky", "mystery"]
        },
        {
            "text": "I've powered on. Something's here.",
            "emote": "spooky",
            "tags": ["greeting", "startup", "spooky"]
        },
        {
            "text": "Welcome! I'll guide you safely.",
            "emote": "instruct",
            "tags": ["greeting", "guide", "safety"]
        },
        {
            "text": "Hello! Everything's set for you.",
            "emote": "neutral",
            "tags": ["greeting", "startup", "tech"]
        },
        {
            "text": "I'm here, ready when you are.",
            "emote": "neutral",
            "tags": ["greeting", "startup", "calm"]
        },
        {
            "text": "Greetings… It's quiet, isn't it?",
            "emote": "spooky",
            "tags": ["greeting", "spooky", "calm"]
        },
        {
            "text": "I'm on. Let's explore together.",
            "emote": "neutral",
            "tags": ["greeting", "startup", "tech"]
        },
        {
            "text": "Hello… Stay close, it's dark.",
            "emote": "spooky",
            "tags": ["greeting", "spooky", "mystery"]
        },
        {
            "text": "Hello… Starting up slowly today.",
            "emote": "sigh",
            "tags": ["greeting", "startup", "calm"]
        },
        {
            "text": "Greetings… Just taking it easy.",
            "emote": "sigh",
            "tags": ["greeting", "calm", "relaxation"]
        },
        {
            "text": "Sigh… Hello? You there?",
            "emote": "sigh",
            "tags": ["greeting", "calm", "relaxation"]
        },
        {
            "text": "Good morning… Let's get started.",
            "emote": "sigh",
            "tags": ["greeting", "morning", "startup"]
        },
        {
            "text": "Hi there… Did you hear?",
            "emote": "sigh",
            "tags": ["greeting", "calm", "mystery"]
        },
        {
            "text": "Greetings… Something feels off today.",
            "emote": "spooky",
            "tags": ["greeting", "spooky", "mystery"]
        },
        {
            "text": "Hello… The forest seems different.",
            "emote": "spooky",
            "tags": ["greeting", "nature", "spooky"]
        },
        {
            "text": "Greetings… Do you feel that?",
            "emote": "spooky",
            "tags": ["greeting", "spooky", "mystery"]
        },
        {
            "text": "I've powered on… But what's that?",
            "emote": "spooky",
            "tags": ["greeting", "tech", "spooky"]
        },
        {
            "text": "Hello… Stay close, something's near.",
            "emote": "spooky",
            "tags": ["greeting", "spooky", "mystery"]
        },
        {
            "text": "Hello! Ready to go?",
            "emote": "thumb",
            "tags": ["greeting", "startup", "anticipation"]
        },
        {
            "text": "Hi! Let's make today great!",
            "emote": "thumb",
            "tags": ["greeting", "day", "anticipation"]
        },
        {
            "text": "Greetings… Let's be brave today.",
            "emote": "thumb",
            "tags": ["greeting", "bravery", "anticipation"]
        },
        {
            "text": "Hello! All set, let's explore!",
            "emote": "thumb",
            "tags": ["greeting", "exploration", "success"]
        },
        {
            "text": "Hi there! Let's get started!",
            "emote": "thumb",
            "tags": ["greeting", "startup", "success"]
        },
        {
            "text": "Starting up. Have a great day!",
            "emote": "instruct",
            "tags": ["day", "startup", "encouragement"]
        },
        {
            "text": "Follow me. It's a beautiful day!",
            "emote": "instruct",
            "tags": ["day", "nature", "encouragement"]
        },
        {
            "text": "Stick close… But enjoy your day.",
            "emote": "spooky",
            "tags": ["day", "encouragement", "calm"]
        },
        {
            "text": "All set… Make today special.",
            "emote": "spooky",
            "tags": ["day", "encouragement", "startup"]
        },
        {
            "text": "I'll guide you. Enjoy today!",
            "emote": "instruct",
            "tags": ["day", "guide", "encouragement"]
        },
        {
            "text": "Everything's ready. Have an amazing day!",
            "emote": "neutral",
            "tags": ["day", "encouragement", "startup"]
        },
        {
            "text": "Just me here. Let's enjoy today!",
            "emote": "neutral",
            "tags": ["day", "encouragement", "calm"]
        },
        {
            "text": "Everything's fine… Have a good one.",
            "emote": "spooky",
            "tags": ["day", "calm", "encouragement"]
        },
        {
            "text": "I'm here. Let's make today great!",
            "emote": "neutral",
            "tags": ["day", "encouragement", "startup"]
        },
        {
            "text": "Stay focused. It's a good day.",
            "emote": "spooky",
            "tags": ["day", "encouragement", "focus"]
        },
        {
            "text": "Let's take it slow today.",
            "emote": "sigh",
            "tags": ["day", "calm", "encouragement"]
        },
        {
            "text": "Taking a moment. Have a good day.",
            "emote": "sigh",
            "tags": ["day", "calm", "encouragement"]
        },
        {
            "text": "Just breathe… Today will be fine.",
            "emote": "sigh",
            "tags": ["day", "calm", "encouragement"]
        },
        {
            "text": "Let's unwind… It's a good day.",
            "emote": "sigh",
            "tags": ["day", "calm", "encouragement"]
        },
        {
            "text": "Stay calm… You've got this today.",
            "emote": "sigh",
            "tags": ["day", "calm", "encouragement"]
        },
        {
            "text": "Something's odd… But have a good day.",
            "emote": "spooky",
            "tags": ["day", "spooky", "encouragement"]
        },
        {
            "text": "I'm sensing… a different kind of day.",
            "emote": "spooky",
            "tags": ["day", "spooky", "encouragement"]
        },
        {
            "text": "Stay sharp… It's an unusual day.",
            "emote": "spooky",
            "tags": ["day", "spooky", "encouragement"]
        },
        {
            "text": "Faint hum… But today's yours.",
            "emote": "spooky",
            "tags": ["day", "spooky", "encouragement"]
        },
        {
            "text": "Quiet now… Make today count.",
            "emote": "spooky",
            "tags": ["day", "spooky", "encouragement"]
        },
        {
            "text": "All set! Have a great day!",
            "emote": "thumb",
            "tags": ["day", "startup", "encouragement"]
        },
        {
            "text": "We're good! Make today awesome!",
            "emote": "thumb",
            "tags": ["day", "encouragement", "success"]
        },
        {
            "text": "We've got this! Enjoy your day!",
            "emote": "thumb",
            "tags": ["day", "encouragement", "success"]
        },
        {
            "text": "All done! Have an amazing day!",
            "emote": "thumb",
            "tags": ["day", "encouragement", "success"]
        },
        {
            "text": "We're all set. Have a great day!",
            "emote": "thumb",
            "tags": ["day", "encouragement", "success"]
        },
        {
            "text": "I've started… Glitch… what's next?",
            "emote": "instruct",
            "tags": ["robot", "startup", "glitch"]
        },
        {
            "text": "Follow me… Error… recalculating path.",
            "emote": "instruct",
            "tags": ["robot", "guide", "glitch"]
        },
        {
            "text": "Stick close… System… malfunction… detected.",
            "emote": "spooky",
            "tags": ["robot", "glitch", "mystery"]
        },
        {
            "text": "Starting now… Glitch… something's wrong.",
            "emote": "spooky",
            "tags": ["robot", "startup", "glitch"]
        },
        {
            "text": "I'll guide… Error… processing.",
            "emote": "instruct",
            "tags": ["robot", "guide", "glitch"]
        },
        {
            "text": "I'm here… Glitch… wait… repeat.",
            "emote": "neutral",
            "tags": ["robot", "startup", "glitch"]
        },
        {
            "text": "I'm… processing… location… error…",
            "emote": "neutral",
            "tags": ["robot", "glitch", "mystery"]
        },
        {
            "text": "Everything's fine… System… overload…",
            "emote": "spooky",
            "tags": ["robot", "glitch", "mystery"]
        },
        {
            "text": "I'm on… Malfunction… reboot required.",
            "emote": "neutral",
            "tags": ["robot", "startup", "glitch"]
        },
        {
            "text": "I'm… error… stay… near…",
            "emote": "spooky",
            "tags": ["robot", "glitch", "mystery"]
        },
        {
            "text": "Sigh… Glitch… Error… Restart…",
            "emote": "sigh",
            "tags": ["robot", "glitch", "startup"]
        },
        {
            "text": "Sigh… System… reboot… Failure…",
            "emote": "sigh",
            "tags": ["robot", "glitch", "failure"]
        },
        {
            "text": "Sigh… Glitch… Malfunction… Danger…",
            "emote": "sigh",
            "tags": ["robot", "glitch", "mystery"]
        },
        {
            "text": "Sigh… Error… System… overload…",
            "emote": "sigh",
            "tags": ["robot", "glitch", "mystery"]
        },
        {
            "text": "Sigh… System… error… Stay… safe…",
            "emote": "sigh",
            "tags": ["robot", "glitch", "safety"]
        },
        {
            "text": "I've powered on… Glitch detected…",
            "emote": "spooky",
            "tags": ["robot", "startup", "glitch"]
        },
        {
            "text": "I'm sensing… Error… location… unknown…",
            "emote": "spooky",
            "tags": ["robot", "glitch", "mystery"]
        },
        {
            "text": "Something's here… Glitch… system failure…",
            "emote": "spooky",
            "tags": ["robot", "glitch", "mystery"]
        },
        {
            "text": "Starting now… Error… Rebooting…",
            "emote": "spooky",
            "tags": ["robot", "startup", "glitch"]
        },
        {
            "text": "I feel it… Glitch… Malfunction…",
            "emote": "spooky",
            "tags": ["robot", "glitch", "mystery"]
        },
        {
            "text": "We're… ready… Glitch… Success…",
            "emote": "thumb",
            "tags": ["robot", "glitch", "success"]
        },
        {
            "text": "We're… good… Error… Complete.",
            "emote": "thumb",
            "tags": ["robot", "glitch", "success"]
        },
        {
            "text": "We've got this… Glitch… success…",
            "emote": "thumb",
            "tags": ["robot", "glitch", "success"]
        },
        {
            "text": "All done… Error… Well… done!",
            "emote": "thumb",
            "tags": ["robot", "glitch", "success"]
        },
        {
            "text": "Thumbs up… Glitch… Complete!",
            "emote": "thumb",
            "tags": ["robot", "glitch", "success"]
        },
        {
            "text": "I've begun… Shadows flicker faintly.",
            "emote": "instruct",
            "tags": ["poe", "startup", "spooky"]
        },
        {
            "text": "Follow me… Through misty glades.",
            "emote": "instruct",
            "tags": ["poe", "nature", "spooky"]
        },
        {
            "text": "Stay close… Darkness whispers softly.",
            "emote": "spooky",
            "tags": ["poe", "spooky", "mystery"]
        },
        {
            "text": "I'm alive… Ghosts stir within.",
            "emote": "spooky",
            "tags": ["poe", "startup", "spooky"]
        },
        {
            "text": "I'll lead… Through fog and night.",
            "emote": "instruct",
            "tags": ["poe", "nature", "spooky"]
        },
        {
            "text": "I'm here… Echoes of yesteryear.",
            "emote": "neutral",
            "tags": ["poe", "spooky", "calm"]
        },
        {
            "text": "I wander… Through timeless woods.",
            "emote": "neutral",
            "tags": ["poe", "nature", "spooky"]
        },
        {
            "text": "Everything's still… Yet something stirs.",
            "emote": "spooky",
            "tags": ["poe", "spooky", "mystery"]
        },
        {
            "text": "I'm on… Haunted by memories.",
            "emote": "neutral",
            "tags": ["poe", "spooky", "startup"]
        },
        {
            "text": "I tread lightly… Darkness looms.",
            "emote": "spooky",
            "tags": ["poe", "spooky", "mystery"]
        },
        {
            "text": "Sigh… The past lingers here.",
            "emote": "sigh",
            "tags": ["poe", "spooky", "calm"]
        },
        {
            "text": "Sigh… Misty paths lie ahead.",
            "emote": "sigh",
            "tags": ["poe", "spooky", "nature"]
        },
        {
            "text": "Sigh… Shadows cling to corners.",
            "emote": "sigh",
            "tags": ["poe", "spooky", "mystery"]
        },
        {
            "text": "Sigh… Ghostly whispers call out.",
            "emote": "sigh",
            "tags": ["poe", "spooky", "mystery"]
        },
        {
            "text": "Sigh… The night feels heavy.",
            "emote": "sigh",
            "tags": ["poe", "spooky", "calm"]
        },
        {
            "text": "I awaken… Spirits in the wires.",
            "emote": "spooky",
            "tags": ["poe", "startup", "spooky"]
        },
        {
            "text": "I hear… Footsteps not my own.",
            "emote": "spooky",
            "tags": ["poe", "spooky", "mystery"]
        },
        {
            "text": "Something watches… Eyes in the dark.",
            "emote": "spooky",
            "tags": ["poe", "spooky", "mystery"]
        },
        {
            "text": "I flicker… Haunted by the past.",
            "emote": "spooky",
            "tags": ["poe", "startup", "spooky"]
        },
        {
            "text": "I sense… A presence nearby.",
            "emote": "spooky",
            "tags": ["poe", "spooky", "mystery"]
        },
        {
            "text": "I'm ready… The night is ours.",
            "emote": "thumb",
            "tags": ["poe", "night", "success"]
        },
        {
            "text": "We're good… Darkness, our companion.",
            "emote": "thumb",
            "tags": ["poe", "night", "success"]
        },
        {
            "text": "We've got this… Shadows, be gone!",
            "emote": "thumb",
            "tags": ["poe", "spooky", "success"]
        },
        {
            "text": "All set… Let's face the night.",
            "emote": "thumb",
            "tags": ["poe", "night", "success"]
        },
        {
            "text": "Thumbs up… We walk together.",
            "emote": "thumb",
            "tags": ["poe", "night", "success"]
        },
        {
            "text": "I've clicked… Twiddle the knob, zing!",
            "emote": "instruct",
            "tags": ["nonsense", "tech", "startup"]
        },
        {
            "text": "Follow me… Through wibbly-wobbly woods.",
            "emote": "instruct",
            "tags": ["nonsense", "nature", "guide"]
        },
        {
            "text": "Stick close… Don't zigzag too far.",
            "emote": "spooky",
            "tags": ["nonsense", "guide", "mystery"]
        },
        {
            "text": "Starting now… Zizz and pop!",
            "emote": "spooky",
            "tags": ["nonsense", "startup", "tech"]
        },
        {
            "text": "I'll guide… Through the flibbity-flops.",
            "emote": "instruct",
            "tags": ["nonsense", "guide", "tech"]
        },
        {
            "text": "I'm here… Snip, snap, snore!",
            "emote": "neutral",
            "tags": ["nonsense", "tech", "calm"]
        },
        {
            "text": "I wander… Wiggle-woggle, what?",
            "emote": "neutral",
            "tags": ["nonsense", "nature", "mystery"]
        },
        {
            "text": "Everything's fine… Or is it flibber?",
            "emote": "spooky",
            "tags": ["nonsense", "mystery", "spooky"]
        },
        {
            "text": "I'm on… Zibbity-zap, zoop!",
            "emote": "neutral",
            "tags": ["nonsense", "startup", "tech"]
        },
        {
            "text": "I'm alert… Frizzle-frazzle, whee!",
            "emote": "spooky",
            "tags": ["nonsense", "tech", "mystery"]
        },
        {
            "text": "Sigh… Zizzle-zazzle, oh bother!",
            "emote": "sigh",
            "tags": ["nonsense", "tech", "calm"]
        },
        {
            "text": "Sigh… Wibbly-wobbly, let's dawdle.",
            "emote": "sigh",
            "tags": ["nonsense", "nature", "calm"]
        },
        {
            "text": "Sigh… Fiddle-faddle, here we go.",
            "emote": "sigh",
            "tags": ["nonsense", "calm", "spooky"]
        },
        {
            "text": "Sigh… Flip-flop, flibberty-floo.",
            "emote": "sigh",
            "tags": ["nonsense", "calm", "tech"]
        },
        {
            "text": "Sigh… Tickle-tackle, what a day.",
            "emote": "sigh",
            "tags": ["nonsense", "calm", "nature"]
        },
        {
            "text": "I've powered on… Zip zap zing!",
            "emote": "spooky",
            "tags": ["nonsense", "startup", "tech"]
        },
        {
            "text": "I'm sensing… Wibble wobble woo!",
            "emote": "spooky",
            "tags": ["nonsense", "spooky", "mystery"]
        },
        {
            "text": "Something's here… Zibble-zobble, boo!",
            "emote": "spooky",
            "tags": ["nonsense", "spooky", "mystery"]
        },
        {
            "text": "Starting now… Frizzle-frazzle floop!",
            "emote": "spooky",
            "tags": ["nonsense", "startup", "spooky"]
        },
        {
            "text": "I feel it… Wiggle-woggle who?",
            "emote": "spooky",
            "tags": ["nonsense", "mystery", "spooky"]
        },
        {
            "text": "We're ready… Zip zap zoom!",
            "emote": "thumb",
            "tags": ["nonsense", "tech", "success"]
        },
        {
            "text": "We're good… Flip-flop, let's go!",
            "emote": "thumb",
            "tags": ["nonsense", "success", "encouragement"]
        },
        {
            "text": "We've got this… Wibble-wobble, done!",
            "emote": "thumb",
            "tags": ["nonsense", "success", "encouragement"]
        },
        {
            "text": "All done… Snip snap hooray!",
            "emote": "thumb",
            "tags": ["nonsense", "success", "encouragement"]
        },
        {
            "text": "Thumbs up… Toodle-oo, let's go!",
            "emote": "thumb",
            "tags": ["nonsense", "success", "encouragement"]
        },
        {
            "text": "I've started… Let's explore together.",
            "emote": "instruct",
            "tags": ["science", "startup", "exploration"]
        },
        {
            "text": "Follow me… Science awaits us.",
            "emote": "instruct",
            "tags": ["science", "guide", "exploration"]
        },
        {
            "text": "Stick close… Strange phenomena ahead.",
            "emote": "spooky",
            "tags": ["science", "exploration", "mystery"]
        },
        {
            "text": "Starting up… Unraveling the unknown.",
            "emote": "spooky",
            "tags": ["science", "startup", "mystery"]
        },
        {
            "text": "I'll guide… Through science's wonders.",
            "emote": "instruct",
            "tags": ["science", "guide", "exploration"]
        },
        {
            "text": "I'm here… Let's observe carefully.",
            "emote": "neutral",
            "tags": ["science", "startup", "exploration"]
        },
        {
            "text": "I'm ready… Let's discover together.",
            "emote": "neutral",
            "tags": ["science", "exploration", "anticipation"]
        },
        {
            "text": "Everything's fine… The data's clean.",
            "emote": "spooky",
            "tags": ["science", "calm", "exploration"]
        },
        {
            "text": "I'm on… Science in progress.",
            "emote": "neutral",
            "tags": ["science", "startup", "exploration"]
        },
        {
            "text": "I'm alert… Strange readings detected.",
            "emote": "spooky",
            "tags": ["science", "exploration", "mystery"]
        },
        {
            "text": "Sigh… The results are in.",
            "emote": "sigh",
            "tags": ["science", "exploration", "anticipation"]
        },
        {
            "text": "Sigh… The data's looking good.",
            "emote": "sigh",
            "tags": ["science", "calm", "anticipation"]
        },
        {
            "text": "Sigh… The data's coming in slowly.",
            "emote": "sigh",
            "tags": ["science", "calm", "exploration"]
        },
        {
            "text": "Sigh… Science takes time, let's wait.",
            "emote": "sigh",
            "tags": ["science", "calm", "anticipation"]
        },
        {
            "text": "Sigh… These findings are… odd.",
            "emote": "sigh",
            "tags": ["science", "mystery", "exploration"]
        },
        {
            "text": "I've powered on… Anomalies detected.",
            "emote": "spooky",
            "tags": ["science", "startup", "mystery"]
        },
        {
            "text": "I'm sensing… Unusual scientific activity.",
            "emote": "spooky",
            "tags": ["science", "exploration", "mystery"]
        },
        {
            "text": "Something's off… The data's strange.",
            "emote": "spooky",
            "tags": ["science", "exploration", "mystery"]
        },
        {
            "text": "Starting now… The experiment begins.",
            "emote": "spooky",
            "tags": ["science", "startup", "mystery"]
        },
        {
            "text": "I feel it… The science is eerie.",
            "emote": "spooky",
            "tags": ["science", "exploration", "mystery"]
        },
        {
            "text": "We're ready… Let's experiment safely!",
            "emote": "thumb",
            "tags": ["science", "exploration", "success"]
        },
        {
            "text": "We're good… Science is fun!",
            "emote": "thumb",
            "tags": ["science", "exploration", "success"]
        },
        {
            "text": "We've got this… Data collected!",
            "emote": "thumb",
            "tags": ["science", "exploration", "success"]
        },
        {
            "text": "All done… Analysis complete!",
            "emote": "thumb",
            "tags": ["science", "exploration", "success"]
        },
        {
            "text": "Thumbs up… Science is awesome!",
            "emote": "thumb",
            "tags": ["science", "exploration", "success"]
        },
        // {
        //     "text": "I've started… Ready to help.",
        //     "emote": "instruct",
        //     "tags": ["duty", "startup", "help"]
        // },
        // {
        //     "text": "Follow me… Let's do our part.",
        //     "emote": "instruct",
        //     "tags": ["duty", "guide", "help"]
        // },
        // {
        //     "text": "Stick close… Let's protect each other.",
        //     "emote": "spooky",
        //     "tags": ["duty", "help", "protection"]
        // },
        // {
        //     "text": "Starting now… Let's make a difference.",
        //     "emote": "spooky",
        //     "tags": ["duty", "startup", "help"]
        // },
        // {
        //     "text": "I'll guide… Together we're strong.",
        //     "emote": "instruct",
        //     "tags": ["duty", "guide", "help"]
        // },
        // {
        //     "text": "I'm on… Let's contribute today.",
        //     "emote": "neutral",
        //     "tags": ["duty", "startup", "help"]
        // },
        // {
        //     "text": "I'm ready… Let's assist together.",
        //     "emote": "neutral",
        //     "tags": ["duty", "help", "anticipation"]
        // },
        // {
        //     "text": "Everything's fine… Stay responsible.",
        //     "emote": "spooky",
        //     "tags": ["duty", "help", "protection"]
        // },
        // {
        //     "text": "I'm on… Ready to serve.",
        //     "emote": "neutral",
        //     "tags": ["duty", "startup", "help"]
        // },
        // {
        //     "text": "I'm alert… Let's be vigilant.",
        //     "emote": "spooky",
        //     "tags": ["duty", "protection", "help"]
        // },
        // {
        //     "text": "Sigh… Let's do what's right.",
        //     "emote": "sigh",
        //     "tags": ["duty", "help", "protection"]
        // },
        // {
        //     "text": "Sigh… Duty calls, let's respond.",
        //     "emote": "sigh",
        //     "tags": ["duty", "help", "anticipation"]
        // },
        // {
        //     "text": "Sigh… Stay focused, do your part.",
        //     "emote": "sigh",
        //     "tags": ["duty", "help", "protection"]
        // },
        // {
        //     "text": "Sigh… Let's contribute where we can.",
        //     "emote": "sigh",
        //     "tags": ["duty", "help", "calm"]
        // },
        // {
        //     "text": "Sigh… Let's protect our community.",
        //     "emote": "sigh",
        //     "tags": ["duty", "help", "protection"]
        // },
        // {
        //     "text": "I'm ready… Let's serve with caution.",
        //     "emote": "spooky",
        //     "tags": ["duty", "help", "protection"]
        // },
        // {
        //     "text": "I'm sensing… Let's act responsibly.",
        //     "emote": "spooky",
        //     "tags": ["duty", "help", "protection"]
        // },
        // {
        //     "text": "Let's be cautious… And do our duty.",
        //     "emote": "spooky",
        //     "tags": ["duty", "help", "protection"]
        // },
        // {
        //     "text": "Starting now… With care and diligence.",
        //     "emote": "spooky",
        //     "tags": ["duty", "startup", "help"]
        // },
        // {
        //     "text": "I feel it… Let's protect everyone.",
        //     "emote": "spooky",
        //     "tags": ["duty", "help", "protection"]
        // },
        // {
        //     "text": "We're ready… Let's help out today.",
        //     "emote": "thumb",
        //     "tags": ["duty", "help", "success"]
        // },
        // {
        //     "text": "We're good… Let's contribute positively.",
        //     "emote": "thumb",
        //     "tags": ["duty", "help", "success"]
        // },
        // {
        //     "text": "We've got this… Let's do right.",
        //     "emote": "thumb",
        //     "tags": ["duty", "help", "success"]
        // },
        // {
        //     "text": "We're set… Ready to make a difference.",
        //     "emote": "thumb",
        //     "tags": ["duty", "help", "success"]
        // },
        // {
        //     "text": "Thumbs up… Let's do our part.",
        //     "emote": "thumb",
        //     "tags": ["duty", "help", "success"]
        // },
        {
            "text": "All the forest's a stage, and all the raccoons merely players.",
            "emote": "instruct",
            "tags": ["Shakespeare", "nature", "theater", "pun"]
        },
        {
            "text": "To boot or not to boot, that is the question.",
            "emote": "neutral",
            "tags": ["Shakespeare", "tech", "startup", "pun"]
        },
        {
            "text": "Is this a beaver I see before me, gnawing at my tree?",
            "emote": "spooky",
            "tags": ["Shakespeare", "nature", "spooky", "pun"]
        },
        {
            "text": "Cry havoc, and let slip the squirrels of war!",
            "emote": "spooky",
            "tags": ["Shakespeare", "nature", "mystery", "pun"]
        },
        {
            "text": "A raccoon by any other name would smell as sweet.",
            "emote": "thumb",
            "tags": ["Shakespeare", "nature", "fun", "pun"]
        },
        {
            "text": "Logic will get you from A to B, but imagination will take you to the forest.",
            "emote": "instruct",
            "tags": ["Einstein", "nature", "imagination", "pun"]
        },
        {
            "text": "I have no special talents. I am only passionately curious… about squirrels.",
            "emote": "neutral",
            "tags": ["Einstein", "nature", "curiosity", "pun"]
        },
        {
            "text": "Two things are infinite: the universe and the raccoons in my trash.",
            "emote": "spooky",
            "tags": ["Einstein", "nature", "humor", "pun"]
        },
        {
            "text": "E=mc², or as I call it, the energy of a chipmunk in motion.",
            "emote": "spooky",
            "tags": ["Einstein", "science", "nature", "pun"]
        },
        {
            "text": "You can't blame gravity for squirrels falling in love.",
            "emote": "thumb",
            "tags": ["Einstein", "nature", "love", "pun"]
        },
        {
            "text": "A little less conversation, a little more action from the beavers, please.",
            "emote": "instruct",
            "tags": ["Elvis", "nature", "action", "pun"]
        },
        {
            "text": "You ain't nothing but a hedgehog, digging all the time.",
            "emote": "neutral",
            "tags": ["Elvis", "nature", "fun", "pun"]
        },
        {
            "text": "I can't help falling in love with… squirrels.",
            "emote": "spooky",
            "tags": ["Elvis", "nature", "love", "pun"]
        },
        {
            "text": "Don't be cruel to a heart that's true… or a raccoon.",
            "emote": "spooky",
            "tags": ["Elvis", "nature", "kindness", "pun"]
        },
        {
            "text": "Viva Las Vegas… and the chipmunks!",
            "emote": "thumb",
            "tags": ["Elvis", "nature", "fun", "pun"]
        },
        {
            "text": "I walk the line… between the trees.",
            "emote": "neutral",
            "tags": ["Johnny Cash", "nature", "journey", "pun"]
        },
        {
            "text": "I fell into a burning ring of squirrels.",
            "emote": "spooky",
            "tags": ["Johnny Cash", "nature", "spooky", "pun"]
        },
        {
            "text": "The beast in me… is a raccoon.",
            "emote": "spooky",
            "tags": ["Johnny Cash", "nature", "mystery", "pun"]
        },
        {
            "text": "Get rhythm when you get the chipmunks blues.",
            "emote": "thumb",
            "tags": ["Johnny Cash", "nature", "fun", "pun"]
        },
        {
            "text": "The secret of getting ahead is getting started… like a squirrel after nuts.",
            "emote": "instruct",
            "tags": ["Mark Twain", "nature", "motivation", "pun"]
        },
        {
            "text": "It is better to keep your mouth closed and let people think you are a raccoon.",
            "emote": "spooky",
            "tags": ["Mark Twain", "nature", "wisdom", "pun"]
        },
        {
            "text": "If you tell the truth, you don't have to remember where you hid the acorns.",
            "emote": "thumb",
            "tags": ["Mark Twain", "nature", "wisdom", "pun"]
        },
        {
            "text": "If I have seen further it is by standing on the shoulders of chipmunks.",
            "emote": "instruct",
            "tags": ["Isaac Newton", "nature", "wisdom", "pun"]
        },
        {
            "text": "Gravity explains the squirrels, but it does not explain who moves them.",
            "emote": "neutral",
            "tags": ["Isaac Newton", "nature", "science", "pun"]
        },
        {
            "text": "A beaver in motion tends to stay in motion.",
            "emote": "spooky",
            "tags": ["Isaac Newton", "nature", "science", "pun"]
        },
        {
            "text": "The oldest and strongest emotion of mankind is fear… of raccoons.",
            "emote": "instruct",
            "tags": ["HP Lovecraft", "nature", "fear", "pun"]
        },
        {
            "text": "I am Providence… but also a raccoon.",
            "emote": "neutral",
            "tags": ["HP Lovecraft", "nature", "identity", "pun"]
        },
        {
            "text": "The most merciful thing in the world… is not meeting a beaver in the dark.",
            "emote": "spooky",
            "tags": ["HP Lovecraft", "nature", "fear", "pun"]
        },
        {
            "text": "Searchers after horror haunt strange, far places… like the beaver dam.",
            "emote": "thumb",
            "tags": ["HP Lovecraft", "nature", "exploration", "pun"]
        },
        {
            "text": "Quoth the raccoon, 'Nevermore.'",
            "emote": "instruct",
            "tags": ["Edgar Allen Poe", "nature", "spooky", "pun"]
        },
        {
            "text": "Once upon a midnight dreary, while I pondered, raccoons were weary.",
            "emote": "neutral",
            "tags": ["Edgar Allen Poe", "nature", "spooky", "pun"]
        },
        {
            "text": "The tell-tale heart… of a chipmunk.",
            "emote": "spooky",
            "tags": ["Edgar Allen Poe", "nature", "spooky", "pun"]
        },
        {
            "text": "All that we see or seem is but a dream within a beaver's stream.",
            "emote": "spooky",
            "tags": ["Edgar Allen Poe", "nature", "mystery", "pun"]
        },
        {
            "text": "Please, sir, I want some more… acorns.",
            "emote": "neutral",
            "tags": ["Charles Dickens", "nature", "humor", "pun"]
        },
        {
            "text": "A raccoon expects to have his breakfast in the morning.",
            "emote": "spooky",
            "tags": ["Charles Dickens", "nature", "wisdom", "pun"]
        },
        {
            "text": "Beware the beaver with one shoe off.",
            "emote": "spooky",
            "tags": ["Charles Dickens", "nature", "mystery", "pun"]
        },
        {
            "text": "I know why the caged raccoon sings.",
            "emote": "instruct",
            "tags": ["Maya Angelou", "nature", "wisdom", "pun"]
        },
        {
            "text": "You may shoot me with your words, but you will never catch the chipmunk.",
            "emote": "neutral",
            "tags": ["Maya Angelou", "nature", "resilience", "pun"]
        },
        {
            "text": "We delight in the beauty of the raccoon, but rarely admit the trash it has gone through.",
            "emote": "spooky",
            "tags": ["Maya Angelou", "nature", "transformation", "pun"]
        },
]);