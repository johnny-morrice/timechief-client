import { parse as papaParse } from 'papaparse';

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
var _spookyPoems;
var _instructPoems;
var _nonSpookyPoems;
var _plainPoems;

function standardDayPoems() {
    if (isLoading()) {
        return new PoemList([]);
    }
    if (!_plainPoems) {
        _plainPoems = allPoems().removeTag("inclusive-holiday");
        _plainPoems = _plainPoems.removeTag("easter");
        _plainPoems = _plainPoems.removeTag("christmas");
        _plainPoems = _plainPoems.removeTag("halloween");
        _plainPoems = _plainPoems.removeTag("glitch");
    }
    return _plainPoems;
}

function christmasPoems() {
    if (isLoading()) {
        return new PoemList([]);
    }

    if (!_christmasPoems) {
        _christmasPoems = allPoems().findByTag("christmas");
    }
    return _christmasPoems;
}

function halloweenPoems() {
    if (isLoading()) {
        return new PoemList([]);
    }

    if (!_halloweenPoems) {
        _halloweenPoems = allPoems().findByTag("halloween");
    }
    return _halloweenPoems;
}

export function instructPoems() {
    if (isLoading()) {
        return new PoemList([]);
    }

    if (!_instructPoems) {
        _instructPoems = allPoems().findByEmote("instruct");
    }
    return _instructPoems;
}

function spookyPoems() {
    if (isLoading()) {
        return new PoemList([]);
    }

    if (!_spookyPoems) {
        _spookyPoems = standardDayPoems().findByTag("spooky");
    }
    return _spookyPoems;
}

function nonSpookyPoems() {
    if (isLoading()) {
        return new PoemList([]);
    }

    if (!_nonSpookyPoems) {
        _nonSpookyPoems = standardDayPoems().removeTag("spooky");
        _nonSpookyPoems = _nonSpookyPoems.removeEmote("spooky");
    }
    return _nonSpookyPoems;
}

function randomElem(poemList) {
    if (poemList.poems.length === 0) {
        return new Poem("Hi, I'm hands!", "neutral", []);
    }
    const randomIndex = Math.floor(Math.random() * poemList.poems.length);
    return poemList.poems[randomIndex];
}

export function randomInstructionPoem() {
    return randomElem(instructPoems());
}

function themedPoemsCollection() {
    if (isLoading()) {
        return new PoemList([]);
    }

    const minTagSize = 8;
    if (!_themedPoemsCollection) {
        _themedPoemsCollection = nonSpookyPoems().findByMinTagPopulationSize(minTagSize).map(collection => collection.removeTag("glitch"));
    }
    return _themedPoemsCollection;
}

function getDayOfYear(now) {
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function randomThemedPoem(now) {
    if (isLoading()) {
        return new Poem("Hi, I'm hands!", "neutral", [])
    }
    // Compute theme index based day of the year modulo the number of themes
    const themes = themedPoemsCollection();
    const themeIndex = getDayOfYear(now) % themes.length;
    return randomElem(themes[themeIndex]); 
}

export function randomPoem(now, isSpooky) {
    if (isLoading()) {
        return new Poem("Hi, I'm hands!", "neutral", [])
    }

    if (isSpooky && Math.random() < 0.05) {
        return randomElem(spookyPoems());
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
    return randomThemedPoem(now);
}

function isLoading() {
    return !_allPoems;
}

function allPoems() {
    return _allPoems;
}

function buildPoemList(poems) {
    return new PoemList(poems.map(poem => new Poem(poem.text, poem.emote, poem.tags)));
}

function parseCSVToJSON(csvString, callback) {
    const results = [];

    papaParse(csvString, {
        header: true, // Use first row as headers
        skipEmptyLines: true, // Skip any empty rows
        complete: function(parsedData) {
            parsedData.data.forEach(row => {
                // Destructure the row into text, emote, and the tag columns
                const { text, emote, ...tags } = row;

                const validEmotes = [
                    "instruct",
                    "neutral",
                    "sigh",
                    "spooky",
                    "thumb"
                ];

                if (!text) {
                    throw new Error("missing text");
                }

                if (!validEmotes.includes(emote)) {
                    throw new Error(`invalid mascot emote: ${emote}`);
                }

                // Collect non-empty tags into an array
                const tagsArray = Object.values(tags).filter(tag => tag);

                if (tagsArray.length != 1) {
                    throw new Error(`expected 1 tag for poem text ${text} but got ${tagsArray}`);
                }
                if (tagsArray[0] === "" || !tagsArray[0]) {
                    throw new Error("empty tag");
                }

                // Push formatted object into results array
                results.push({
                    text,
                    emote,
                    tags: tagsArray
                });
            });

            callback(results);
        }
    });
}

const csvPoems = `text,emote,tags/0
The eggs are waiting.,neutral,easter
Bunny pals are nearby!,thumb,easter
Chocolate is magic!,neutral,easter
"Ooh, mushrooms in the woods!",spooky,spooky
The eggs are hidden well.,sigh,easter
What a chocolaty day!,sigh,easter
The eggs are hiding...,sigh,easter
"Bunnies are hiding somewhere,",neutral,easter
Easter makes my heart happy.,thumb,easter
Easter magic is round the corner.,instruct,easter
Let's hunt some egg.,thumb,easter
Ready for Easter partying!,thumb,easter
We got all the chocolate!,thumb,easter
Gimme more Easter chocolate!,thumb,easter
Feeling good vibes today!,instruct,raccoon
My whiskers are quivering!,thumb,raccoon
"Hey, it's my masked pal!",spooky,spooky
Let's have fun today.,neutral,raccoon
Chill vibes detected.,neutral,raccoon
Shenanigans time.,thumb,raccoon
Today's a good day.,sigh,raccoon
I found some great trash today.,sigh,raccoon
Feeling full and happy.,sigh,raccoon
Dumpster party time!,thumb,raccoon
Weird vibes here.,spooky,spooky
Something's here…or someone?,spooky,spooky
I can dance with my hands!,thumb,raccoon
I feel it in my fingers...,thumb,raccoon
"Thumbs up, let's go!",thumb,raccoon
"Nice one, buddy!",thumb,raccoon
Handing high fives all around!,thumb,raccoon
Giving you a big thumbs up!,thumb,raccoon
Space raccoon time.,instruct,space
What's in the stars?,neutral,space
Receiving strange signals!,neutral,space
I'll help you through the stars!,instruct,space
Hand me my telescope!,neutral,space
Let's explore the universe.,neutral,space
Star hands!,neutral,space
Ready to listen to the stars!,thumb,space
"Wow, the sky is big!",sigh,space
Do the stars have hands?,sigh,space
What's your favourite planet?,sigh,space
Infinite planets to sniff!,sigh,space
Wheeeeeeee...,sigh,space
My tail is detecting something.,neutral,space
Do stars gaze back at us?,neutral,space
Mystery awaits us!,neutral,space
What's that UFO?,neutral,space
My tail is twitching...,thumb,space
"Ooh, a cool star!",thumb,space
Stars guide our way!,thumb,space
Ready for stargazing with snacks!,thumb,space
Hands up… The universe awaits!,thumb,space
Lemme get my hands on that keyboard!,instruct,nerd
Let's hack into the woods!,instruct,nerd
Ready to code with these hands.,neutral,nerd
"Let's go, nerds!",neutral,nerd
"All is well, for now.",spooky,spooky
Compiling impatiently.,sigh,nerd
"Infinite loops, just another day.",sigh,nerd
Code's haunted. I'm on it.,sigh,nerd
Ghosts in the code. Again.,sigh,nerd
Let's explore the woods together!,instruct,nature
Follow me… Nature path ahead.,instruct,nature
Time for nature's secrets!,neutral,nature
I'll guide us through the wilderness.,instruct,nature
I've got the directions in my hands!,neutral,nature
Let's climb a tree!,neutral,nature
The forest is peaceful.,sigh,nature
The birds are singing just for me!,sigh,nature
What a chilled out day!,sigh,nature
Something's stirring in the woods...,spooky,spooky
I'm sensing something  in the trees.,spooky,spooky
I can hear the forest whispering...,spooky,nature
Lemme get my hands on that mystery!,thumb,nature
Something's watching...!,spooky,spooky
Let's check out the trail ahead!,thumb,nature
Nature welcomes us with open hands!,thumb,nature
Exploration successful!,thumb,nature
Let's find peace together. Or food.,instruct,spiritual
Stick close and stay calm.,spooky,spooky
Do you hear the fungus growing?,spooky,spooky
Focus on my tail.,neutral,spiritual
Breathe with me now.,sigh,spiritual
Can you feel the chill vibes?,neutral,spiritual
Inner peace activated.,neutral,spiritual
Nature chills me out!,sigh,spiritual
Peaceful from my ears to my tail.,sigh,spiritual
Tranquillity takes us by the hand.,sigh,spiritual
I'm hearing inner peace.,neutral,spiritual
My tail is calm.,neutral,spiritual
Spiritual journey underway.,sigh,spiritual
Chill vibes surround us.,sigh,spiritual
Time for peace. And food!,thumb,spiritual
We're gonna take this hands-on!,thumb,spiritual
"Feed the body, feed the soul.",thumb,spiritual
"Thumbs up, brain chill.",thumb,spiritual
Don't let your hands be idle!,instruct,hustle
Do the hustle with me!,instruct,hustle
Ready to hustle with these hands.,neutral,hustle
Let's make funky moves.,neutral,hustle
Everything's fine… Keep grinding.,neutral,hustle
My tail is twitching...,neutral,hustle
Hard work pays off.,sigh,hustle
The grind is kinda soothing...,sigh,hustle
Big things ahead!,neutral,hustle
Opportunity's hands are knocking.,thumb,hustle
Success is approaching!,thumb,hustle
Profit acquired!,thumb,hustle
Spooky times ahead!,instruct,halloween
Follow me into the spoopy woods.,spooky,spooky
Did you see that shadow move?,spooky,spooky
My computer is haunted...,spooky,spooky
"Halloween is near, listen up!",instruct,halloween
Boo!,neutral,halloween
Ghosts in the trees. Or raccoons.,neutral,halloween
Everything's fine… Or is it?,spooky,spooky
Spooky mode activate.,neutral,halloween
Shadows and raccoons are lurking,spooky,spooky
The critters are restless.,sigh,halloween
Night creeps some raccoons out...not me though!,sigh,halloween
Shadows are sticking to us.,sigh,halloween
Halloween vibes everywhere.,sigh,halloween
Night's getting darker...excellent.,sigh,halloween
My masked friend is close.,spooky,spooky
Something's here…it's creeping near.,spooky,spooky
"Ooh, I think we're haunted!",thumb,halloween
I feel it. Creatures surround us.,spooky,spooky
Ready for spoopy fun!,thumb,halloween
Trick or treat? Why not both!,thumb,halloween
Let's watch scary movies!,thumb,halloween
"I love Halloween, it's my time.",thumb,halloween
"Festive time, lads!",instruct,christmas
Get your sled ready!,instruct,christmas
You'd better watch out...,sigh,christmas
Santa Claus is coming...,sigh,christmas
Let me guide your sleigh tonight!,instruct,christmas
Let's deck the halls!,neutral,christmas
Snow is gently drifting...,sigh,christmas
Christmas spirit activated!,neutral,christmas
Can you hear sleigh bells?,sigh,christmas
I love Christmas presents!,sigh,christmas
I have snow in my whiskers!,sigh,christmas
I'm sleepy and full of pud!,sigh,christmas
Warming my tail by the fire.,sigh,christmas
I can feel Santa's presence...,sigh,christmas
I feel the festive glow!,sigh,christmas
Nothing is stirring...except me!,thumb,christmas
Lots of mince pies ahead!,thumb,christmas
Hot chocolate all around!,thumb,christmas
"Hello, are you alone in the forest?",spooky,spooky
"It's quiet, isn't it?",spooky,spooky
Let's explore together.,neutral,greeting
"Hold my hand, it's dark.",spooky,spooky
Slow start today.,sigh,greeting
Takin' it sleazy,sigh,greeting
Hey pal.,sigh,greeting
Is it morning already?,sigh,greeting
What will today bring?,sigh,greeting
Something feels off today.,spooky,spooky
The air smells different...fungal.,spooky,spooky
Do you feel different?,spooky,spooky
What's that on your screen?,spooky,spooky
"Something's close, hold my hand!",spooky,spooky
Let's have a great day!,thumb,greeting
Feeling brave today.,thumb,greeting
"All ready to explore, bud!",thumb,greeting
"Thumbs up, let's do it!",thumb,greeting
Have an excellent day!,instruct,day
Let's grab this day by the hands!,instruct,day
"Stick close, we can't lose each other.",spooky,spooky
Today feels promising.,sigh,day
Let's help each other enjoy today!,instruct,day
"Just you and me, let's go!",neutral,day
"Keep it up, or else they'll get you!",spooky,spooky
Let's take it slow today.,sigh,day
Remember to take a moment to breathe.,sigh,day
Let's take a breath and continue.,sigh,day
You've got this today.,sigh,day
Something's odd… But have a good day!,spooky,spooky
"Today will be different, but good.",neutral,day
"Stay alert, today could surprise you!",neutral,day
"Thumbs up, let's have a good day!",thumb,day
Make today awesome!,thumb,day
All set for a good day!,thumb,day
Masked ghost in the machine!,spooky,spooky
The shadows are flickering...,spooky,spooky
Follow me through the fog.,spooky,spooky
Whispers in the dark...,spooky,spooky
I feel something stirring...,spooky,spooky
Don't stray from the path.,spooky,spooky
My whiskers are twitching...something there?,spooky,spooky
Haunted by food long gone.,neutral,raccoon
Tread lightly...,spooky,spooky
Those are some dark shadows!,spooky,spooky
I can barely see in this dark.,spooky,spooky
Those aren't my pawsteps...,spooky,spooky
Eyes gleaming in the dark...,spooky,spooky
My tail is twitching...who's there?,spooky,spooky
"Ah, darkness...my faithful accomplice.",spooky,spooky
"Hold my hand, let's face the night.",spooky,spooky
Let's wobble those woods away!,instruct,nonsense
"Go on, pull my tail!",instruct,raccoon
Do the trees mind when I climb them?,neutral,nonsense
Do ghosts need to use the toilet?,sigh,nonsense
I find a keyboard indispensable!,neutral,nonsense
Should I get an electronic tail?,sigh,nonsense
Whiskers are like cute satellites!,sigh,nonsense
The other animals are morons!,sigh,nonsense
I'm going fishing for burgers!,sigh,nonsense
My tail is twitching...or are you pulling it?,neutral,nonsense
"Something's here. Wait, that's just my own tail!",thumb,nonsense
What are my little ears hearing?,sigh,nonsense
Let's get this bread bin!,thumb,nonsense
"You did it, buderino!",thumb,nonsense
"Bip bop, let's hop!",thumb,nonsense
Strange phenomena ahead.,spooky,spooky
"Now, watch my hands carefully...",neutral,science
Let's check out these results!,sigh,science
Science is slow sometimes.,sigh,science
All the forest's a stage,instruct,literature
To sniff or not to sniff...,neutral,literature
Is this a squirrel I see before me?,sigh,literature
"Cry havoc, and let slip the squirrels of war!",thumb,literature
A skunk by any other name would still stink.,thumb,literature
Logic will get you from ear to tail!,instruct,science
I have many special talents!,neutral,science
Two things are infinite: the universe and my appetite,thumb,science
"E=mc², the energy of a chipmunk in motion.",thumb,science
You can't blame me for loving trash!,thumb,raccoon
"A little less conversation, a lot more food!",instruct,music
You ain't nothing but a hedgehog.,neutral,music
I can't help falling in love with food.,sigh,music
Don't be cruel to a heart that's true… or a raccoon.,thumb,music
I walk the line… between the trees.,neutral,music
I fell into a burning ring of mushrooms.,neutral,music
The beast in me… is a raccoon.,sigh,music
"Get rhythm, buddy!",thumb,music
Let's steal the squirrel's nuts!,instruct,literature
Let people think you are a wise raccoon.,sigh,literature
"Tell the truth, or you might get caught!",thumb,literature
Standing on the shoulders of bears.,instruct,science
Who really controls the movements of foxes?,neutral,science
A beaver in motion tends to stay in motion.,instruct,science
Fear of bears is the biggest feeling.,instruct,literature
I am Providence… but also a raccoon.,neutral,literature
Is that a beaver in the dark?,sigh,literature
I fear the world beyond the forest...,thumb,literature
"Quoth the raccoon, 'Nevermore.'",instruct,literature
"Once upon a midnight dreary, I am weary.",neutral,literature
The tell-tale heart… of a worried squirrel.,sigh,literature
This is but a dream within a beaver's stream.,sigh,literature
"Please, sir, I want some more…garbage.",neutral,literature
I expect my breakfast!,thumb,literature
Beware the beaver with one shoe off.,neutral,literature
I know why the caged raccoon sings.,instruct,literature
Please don't shoot me with your words.,neutral,literature
I wish my trash digging was acknowledged.,sigh,literature
I'm a fun-guy!,spooky,spooky
"Ooh, spores floating around...",spooky,spooky
"The woods are spooky, dark and deep...",spooky,spooky

`;

var _allPoems;
parseCSVToJSON(csvPoems, result => {
    _allPoems = buildPoemList(result);
})