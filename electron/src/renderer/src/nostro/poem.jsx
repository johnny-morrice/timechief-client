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
var _spookyThemedPoemsCollection;
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
    const randomIndex = Math.floor(Math.random() * poemList.poems.length);
    return poemList.poems[randomIndex];
}

export function randomInstructionPoem() {
    return randomElem(instructPoems());
}

function themedPoemsCollection(isSpooky) {
    if (isLoading()) {
        return new PoemList([]);
    }

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
    if (isLoading()) {
        return new Poem("loading", "neutral", [])
    }
    // Compute theme index based day of the year modulo the number of themes
    const themes = themedPoemsCollection(isSpooky);
    const themeIndex = getDayOfYear(now) % themes.length;
    return randomElem(themes[themeIndex]); 
}

export function randomPoem(now, isSpooky) {
    if (isLoading()) {
        return new Poem("loading", "neutral", [])
    }
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

                // Collect non-empty tags into an array
                const tagsArray = Object.values(tags).filter(tag => tag);

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

const csvPoems = `text,emote,tags/0,tags/1,tags/2,tags/3
Let's get some eggs!,instruct,easter,startup,fun,
Follow the bunnies!,instruct,easter,nature,guide,
Where are the eggs?,spooky,easter,guide,mystery,
I've hidden the eggs...,spooky,easter,startup,surprise,
Let's enjoy Easter together!,instruct,easter,guide,happy,
"Ready for Easter, guys!",neutral,easter,startup,fun,
The eggs are waiting.,neutral,easter,guide,anticipation,
Bunny pals are nearby!,spooky,easter,nature,calm,
Chocolate is magic!,neutral,easter,startup,magic,
 Let's hunt some egg.,spooky,easter,guide,mystery,
The eggs are hidden well.,sigh,easter,mystery,anticipation,
Bunnies are hopping all around.,sigh,easter,nature,calm,
"Easter's here, so peaceful.",sigh,easter,calm,happy,
What a magical day!,sigh,easter,calm,magic,
The egg hunt is on!,sigh,easter,anticipation,fun,
Eggs are hiding from us.,spooky,easter,startup,mystery,
"Bunnies are hiding somewhere,",spooky,easter,nature,mystery,
Something's here... But it's got a fluffy tail!,spooky,easter,fun,mystery,
Easter makes my heart glow.,spooky,easter,startup,magic,
"I feel it, Easter magic is near.",spooky,easter,nature,magic,
We found the eggs!,thumb,easter,success,fun,
Let's get all the eggs,thumb,easter,guide,fun,
We've got this Easter thing!,thumb,easter,anticipation,happy,
Got all the eggs!,thumb,easter,success,fun,
Easter chocolate is great!,thumb,easter,success,happy,
Let's party this Easter!,instruct,inclusive-holiday,startup,joy,
I feel good vibes!,instruct,inclusive-holiday,guide,happy,
Let's all celebrate!,spooky,inclusive-holiday,celebration,happy,
Party mode on.,spooky,inclusive-holiday,startup,anticipation,
I'll show you a good time!,instruct,inclusive-holiday,guide,happy,
Ready to party.,neutral,inclusive-holiday,startup,joy,
Let's have fun today.,neutral,inclusive-holiday,celebration,happy,
Partying begins now.,spooky,inclusive-holiday,startup,joy,
Chill vibes detected.,neutral,inclusive-holiday,celebration,anticipation,
Let's have shenanigans!,spooky,inclusive-holiday,celebration,happy,
Let's hold hands together.,sigh,inclusive-holiday,calm,celebration,
Today's a good day.,sigh,inclusive-holiday,celebration,happy,
"It's quiet, let's change that.",sigh,inclusive-holiday,calm,joy,
Today's a good day.,sigh,inclusive-holiday,calm,happy,
Let's savour today.,sigh,inclusive-holiday,celebration,joy,
Party mode activated!,spooky,inclusive-holiday,startup,anticipation,
Weird vibes here.,spooky,inclusive-holiday,celebration,joy,
Something's here...Party vibes strong.,spooky,inclusive-holiday,celebration,anticipation,
Let's dance.,spooky,inclusive-holiday,startup,joy,
I feel it in my fingers...,spooky,inclusive-holiday,celebration,happy,
"Thumbs up, let's go!",thumb,inclusive-holiday,startup,joy,
"Nice one, buddy!",thumb,inclusive-holiday,celebration,happy,
Handing drinks all around!,thumb,inclusive-holiday,celebration,success,
Thumbs up great party!,thumb,inclusive-holiday,success,celebration,
Giving you a big thumbs up!,thumb,inclusive-holiday,joy,success,
Space raccoon time.,instruct,space,startup,anticipation,
Follow me into the stars!,instruct,space,nature,exploration,
What's in the stars?,spooky,space,exploration,mystery,
Receiving strange signals!,spooky,space,startup,mystery,
I'll help you through the stars,instruct,space,guide,exploration,
Get me my telescope!,neutral,space,startup,exploration,
Let's explore the stars.,neutral,space,exploration,anticipation,
Everything's fine... Cosmic silence prevails.,spooky,space,calm,exploration,
Star hands!,neutral,space,startup,calm,
Ready to listen!,spooky,space,exploration,mystery,
"Wow, the sky is big!",sigh,space,calm,exploration,
Do the stars have hands?,sigh,space,calm,mystery,
What's your favourite planet?,sigh,space,calm,exploration,
Infinite space for hands to touch.,sigh,space,calm,meditation,
Wheeeeeeee...,sigh,space,calm,exploration,
My tail is detecting something.,spooky,space,startup,mystery,
Do stars watch us back?,spooky,space,exploration,mystery,
Something's here...aliens? Raccoons?,spooky,space,mystery,exploration,
Mystery awaits us!,spooky,space,startup,exploration,
What's that UFO?,spooky,space,exploration,mystery,
My tail is twitching...,thumb,space,exploration,anticipation,
"Ooh, a cool star!",thumb,space,exploration,success,
Stars guide our way!,thumb,space,exploration,success,
Ready for stargazing!,thumb,space,calm,success,
Hands up... The universe awaits!,thumb,space,exploration,anticipation,
I've started... Let's debug together!,instruct,nerd,geek,startup,tech
Lemme get my hands on that keyboard!,instruct,nerd,geek,guide,tech
"Ooh, glitchy.",spooky,nerd,geek,tech,glitch
Variables acting strange.,spooky,nerd,geek,startup,tech
Into the hacker woods!,instruct,nerd,geek,guide,tech
Ready to code with these hands.,neutral,nerd,geek,tech,startup
"Let's go, nerds!",neutral,nerd,geek,anticipation,tech
"All is well, for now.",spooky,nerd,geek,tech,calm
Device is fully functioning!,neutral,nerd,geek,tech,success
No bugs detected.,spooky,nerd,geek,tech,success
Compiling impatiently.,sigh,nerd,geek,tech,waiting
Debugging bugs me.,sigh,nerd,geek,tech,glitch
Code's acting up again.,sigh,nerd,geek,tech,glitch
"Infinite loops, just another day.",sigh,nerd,geek,tech,glitch
Code's haunted. I'm on it.,sigh,nerd,geek,tech,spooky
Ghosts in the code. Again.,spooky,nerd,geek,tech,spooky
No errors. I think.,spooky,nerd,geek,tech,glitch
Code's possessed. Exorcist summoned!,spooky,nerd,geek,tech,spooky
Weird outputs detected.,spooky,nerd,geek,tech,glitch
I feel it... The algorithm's alive.,spooky,nerd,geek,tech,spooky
Code running smoothly!,thumb,nerd,geek,tech,success
Let's hack away!,thumb,nerd,geek,tech,success
"Code compiled, with these hands!",thumb,nerd,geek,tech,success
"No bugs here, chief!",thumb,nerd,geek,tech,success
Thumbs up... Debugging success!,thumb,nerd,geek,tech,success
Let's explore the woods together!,instruct,ranger,nature,guide,startup
Follow me... Nature path ahead.,instruct,ranger,nature,guide,
Stick close... The woods are deep.,spooky,ranger,nature,guide,mystery
Time for nature's secrets!,spooky,ranger,nature,startup,mystery
I'll guide us through the wilderness.,instruct,ranger,nature,guide,
I've got the directions in my hands!,neutral,ranger,nature,startup,guide
Let's go for a hike!,neutral,ranger,nature,anticipation,guide
Let's chill in nature!,spooky,ranger,nature,calm,guide
Let's climb a tree!,neutral,ranger,nature,startup,calm
I can feel nature watching...,spooky,ranger,nature,guide,mystery
The forest is peaceful.,sigh,ranger,nature,calm,
The birds are singing to me!,sigh,ranger,nature,calm,guide
The woods are quiet...too quiet...,sigh,ranger,nature,calm,
What a chilled out day!,sigh,ranger,nature,calm,guide
I can hear the forest moving.,sigh,ranger,nature,calm,guide
Something's stirring in the woods...,spooky,ranger,nature,startup,mystery
I'm sensing something  in the trees.,spooky,ranger,nature,mystery,
I can hear the forest whispering...,spooky,ranger,nature,mystery,
I'll get my hands on that mystery!,spooky,ranger,nature,startup,mystery
Something's watching!,spooky,ranger,nature,mystery,
Let's check out the trail ahead!,thumb,ranger,nature,guide,anticipation
Nature welcomes us with open hands!,thumb,ranger,nature,guide,success
We've got this!,thumb,ranger,nature,success,
Exploration successful!,thumb,ranger,nature,success,
We've made it!,thumb,ranger,nature,guide,success
Let's find peace together.,instruct,spiritual,startup,calm,
"Take my hand, peace.",instruct,spiritual,guide,calm,
Stick close and stay calm.,spooky,spiritual,guide,calm,
Listen to the quiet.,spooky,spiritual,startup,calm,
"Stay calm, take my hand.",instruct,spiritual,guide,calm,
Focus on my tail.,neutral,spiritual,calm,meditation,
Let's find balance.,neutral,spiritual,guide,calm,
Breathe with me now.,spooky,spiritual,calm,meditation,
Can you feel the chill vibes?,neutral,spiritual,calm,startup,
Inner peace activated.,spooky,spiritual,calm,meditation,
"Let's take a load off, pal!",sigh,spiritual,calm,meditation,
Nature chills me out!,sigh,spiritual,nature,calm,
"Finally, peace and quiet!",sigh,spiritual,calm,meditation,
Peaceful from my ears to my tail.,sigh,spiritual,calm,meditation,
Tranquillity takes us by the hand.,sigh,spiritual,calm,meditation,
I'm hearing inner peace.,spooky,spiritual,startup,calm,
My tail is calm.,spooky,spiritual,calm,meditation,
What do I hear? Seems peaceful.,spooky,spiritual,calm,meditation,
Spiritual journey underway.,spooky,spiritual,startup,meditation,
I feel it... Calm surrounds us.,spooky,spiritual,calm,meditation,
Chillness achieved!,thumb,spiritual,meditation,success,
Time for peace. And food!,thumb,spiritual,calm,success,
We're gonna take this hands-on!,thumb,spiritual,meditation,success,
Calmness achieved!,thumb,spiritual,meditation,success,
"Thumbs up, brain chill.",thumb,spiritual,calm,success,
Don't let your hands be idle!,instruct,hustle,money,startup,
Do the hustle with me!,instruct,hustle,money,guide,
Let's chase some money.,spooky,hustle,money,anticipation,
I think I sense some cash!,spooky,hustle,money,startup,anticipation
Let's make a deal!,instruct,hustle,money,guide,
Ready to hustle with these hands.,neutral,hustle,money,startup,
Let's make funky moves.,neutral,hustle,money,anticipation,
Everything's fine... Keep grinding.,spooky,hustle,money,calm,
I smell money ahead.,neutral,hustle,money,startup,
My tail is twitching...,spooky,hustle,money,anticipation,
Hard work pays off.,sigh,hustle,money,calm,
"Keep pushing, success comes.",sigh,hustle,money,calm,anticipation
Got some cash in hand!,sigh,hustle,money,calm,
The grind is kinda soothing...,sigh,hustle,money,calm,
"Power through, it'll pay off.",sigh,hustle,money,calm,
Big things ahead!,spooky,hustle,money,startup,anticipation
I'm sniffing... Wealth is in the air.,spooky,hustle,money,anticipation,
Opportunity's hands are knocking.,spooky,hustle,money,anticipation,
Money's within grabbing distance!,spooky,hustle,money,startup,
Success is approaching!,spooky,hustle,money,success,
Let's make it happen!,thumb,hustle,money,success,
Profit acquired!,thumb,hustle,money,success,
Victory is ours!,thumb,hustle,money,success,
Got our hands on profit!,thumb,hustle,money,success,
Hustle paid off!,thumb,hustle,money,success,
Spooky times ahead!,instruct,halloween,startup,spooky,
Follow me into the spoopy woods.,instruct,halloween,nature,spooky,
Did you see that shadow move?,spooky,halloween,spooky,mystery,
My computer is haunted...,spooky,halloween,tech,spooky,
"Halloween is near, listen up!",instruct,halloween,spooky,guide,
Boo!,neutral,halloween,startup,spooky,
Ghosts in the trees. Or raccoons.,neutral,halloween,spooky,nature,
Everything's fine... Or is it?,spooky,halloween,spooky,mystery,
Spooky mode activate.,neutral,halloween,spooky,startup,
Shadows and raccoons are lurking,spooky,halloween,spooky,mystery,
The critters are restless.,sigh,halloween,spooky,calm,
Night creeps some out...not me though!,sigh,halloween,spooky,calm,
Shadows are sticking to us.,sigh,halloween,spooky,mystery,
Halloween vibes everywhere.,sigh,halloween,spooky,calm,
Night's getting darker...excellent.,sigh,halloween,spooky,calm,
Is your PC fan whispering?,spooky,halloween,spooky,tech,
My friends are close.,spooky,halloween,spooky,nature,
Something's here... Ghouls creeping near.,spooky,halloween,spooky,mystery,
"Ooh, I think we're haunted!",spooky,halloween,spooky,startup,
I feel it. Creatures surround us.,spooky,halloween,spooky,mystery,
Ready for spoopy fun!,thumb,halloween,spooky,fun,
Trick or treat? Why not both!,thumb,halloween,spooky,fun,
Face your fears!,thumb,halloween,spooky,success,
Let's watch scary movies!,thumb,halloween,spooky,success,
"I love Halloween, it's my time.",thumb,halloween,spooky,fun,
"Festive time, lads!",instruct,christmas,startup,joy,
Get your sled ready!,instruct,christmas,nature,joy,
You'd better watch out...,spooky,christmas,joy,anticipation,
Santa Claus is coming...,spooky,christmas,startup,joy,
Let me guide your sleigh tonight!,instruct,christmas,nature,joy,
Holiday tunes on deck!,neutral,christmas,startup,joy,
Let's deck the halls!,neutral,christmas,joy,anticipation,
Snow is gently drifting...,spooky,christmas,calm,joy,
Christmas spirit activated!,neutral,christmas,startup,joy,
Can you hear sleigh bells?,spooky,christmas,joy,anticipation,
I love Christmas presents!,sigh,christmas,joy,calm,
I have snow in my whiskers!,sigh,christmas,calm,joy,
I'm sleepy and full of pud!,sigh,christmas,calm,joy,
Warming my tail by the fire.,sigh,christmas,calm,joy,
I love Christmas Eve...,sigh,christmas,calm,joy,
Holiday vibes in the air.,spooky,christmas,startup,joy,
I can feel Santa's presence...,spooky,christmas,joy,calm,
Something's here... But it's festive!,spooky,christmas,joy,anticipation,
I feel the festive glow!,spooky,christmas,startup,joy,
Nothing is stirring...except me!,spooky,christmas,joy,anticipation,
Let's have a Christmas party!,thumb,christmas,joy,success,
Lots of mince pies ahead!,thumb,christmas,joy,anticipation,
Hot chocolate all around!,thumb,christmas,joy,success,
Time for Christmas fun!,thumb,christmas,joy,success,
Ooooh yea it's Christmas time!,thumb,christmas,joy,success,
"Hi, I'm Hands! Let's start!",instruct,greeting,startup,tech,
"Hi there, I'm you're guide!",instruct,greeting,nature,guide,
"Hello, are you alone?",spooky,greeting,spooky,mystery,
I'm here...are you?,spooky,greeting,startup,spooky,
"Right, let me get you sorted.",instruct,greeting,guide,safety,
I've got everything ready!,neutral,greeting,startup,tech,
Ready when you are!,neutral,greeting,startup,calm,
"It's quiet, isn't it?",spooky,greeting,spooky,calm,
Let's explore together.,neutral,greeting,startup,tech,
"Hold my hand, it's dark.",spooky,greeting,spooky,mystery,
Slow start today.,sigh,greeting,startup,calm,
Takin' it sleezy.,sigh,greeting,calm,relaxation,
Hey pal.,sigh,greeting,calm,relaxation,
Is it morning already?,sigh,greeting,morning,startup,
What will today bring?,sigh,greeting,calm,mystery,
Something feels off today.,spooky,greeting,spooky,mystery,
The air smells different...,spooky,greeting,nature,spooky,
Do you feel different?,spooky,greeting,spooky,mystery,
What's that on your screen?,spooky,greeting,tech,spooky,
"Something's close, hold my hand!",spooky,greeting,spooky,mystery,
"OK, you ready?",thumb,greeting,startup,anticipation,
Let's have a great day!,thumb,greeting,day,anticipation,
Feeling brave today.,thumb,greeting,bravery,anticipation,
"All ready to explore, bud!",thumb,greeting,exploration,success,
"Thumbs up, let's do it!",thumb,greeting,startup,success,
Have an excellent day!,instruct,day,startup,encouragement,
Let's grab this day by the hands!,instruct,day,nature,encouragement,
"Stick close, we've got this.",spooky,day,encouragement,calm,
Today feels promising.,spooky,day,encouragement,startup,
Let's help each other enjoy today!,instruct,day,guide,encouragement,
Have an excellent day!,neutral,day,encouragement,startup,
"Just you and me, let's go!",neutral,day,encouragement,calm,
Hope you have a good one.,spooky,day,calm,encouragement,
Hi! Hope you're feeling pumped today!,neutral,day,encouragement,startup,
"Keep it up, or else!",spooky,day,encouragement,focus,
Let's take it slow today.,sigh,day,calm,encouragement,
Remember to take a moment to breathe.,sigh,day,calm,encouragement,
Today will be fine.,sigh,day,calm,encouragement,
Let's take a breath and continue.,sigh,day,calm,encouragement,
You've got this today.,sigh,day,calm,encouragement,
Something's odd... But have a good day.,spooky,day,spooky,encouragement,
"Today will be different, but good.",spooky,day,spooky,encouragement,
"Stay alert, today could surprise you!",spooky,day,spooky,encouragement,
What's your PC doing? You got this.,spooky,day,spooky,encouragement,
Make today count...,spooky,day,spooky,encouragement,
"Thumbs up, let's have a good day!",thumb,day,startup,encouragement,
Make today awesome!,thumb,day,encouragement,success,
We've got this! Enjoy your day!,thumb,day,encouragement,success,
Be excellent today!,thumb,day,encouragement,success,
All set for a good day!,thumb,day,encouragement,success,
"I've glitched, what do I do?",instruct,robot,startup,glitch,
Error...where's my tail?,instruct,robot,guide,glitch,
System malfunction detected?,spooky,robot,glitch,mystery,
Something's wrong... a glitch?,spooky,robot,startup,glitch,
"Processing error, follow me.",instruct,robot,guide,glitch,
"Hi, I'm Ha-ERROR.",neutral,robot,startup,glitch,
"There's a glitch, but where?",neutral,robot,glitch,mystery,
"System overloaded, but how?",spooky,robot,glitch,mystery,
"I need a nap, reboot please!",neutral,robot,startup,glitch,
I'm am error?,spooky,robot,glitch,mystery,
I smell a glitch.,sigh,robot,glitch,startup,
"My system failed, reboot please!",sigh,robot,glitch,failure,
Eek! An unexpected glitch!,sigh,robot,glitch,mystery,
"I'm feeling over whelmed, reboot please!",sigh,robot,glitch,mystery,
"Better reboot, just to be safe!",sigh,robot,glitch,safety,
Is that a ghost or a glitch?,spooky,robot,startup,glitch,
Ghost in the machine!,spooky,robot,glitch,mystery,
A glitch lurks in the shadows!,spooky,robot,glitch,mystery,
Cast the reboot spell!,spooky,robot,startup,glitch,
My whiskers are twitching... a glitch?,spooky,robot,glitch,mystery,
We defeated the glitch!,thumb,robot,glitch,success,
Sorted that pesky glitch!,thumb,robot,glitch,success,
We've sorted that malfunction!,thumb,robot,glitch,success,
"Fixed it for you, boss!",thumb,robot,glitch,success,
No sign of the glitch!,thumb,robot,glitch,success,
The shadows are flickering...,instruct,poe,startup,spooky,
Follow me through the fog.,instruct,poe,nature,spooky,
Whispers in the dark...,spooky,poe,spooky,mystery,
I feel the ghosts stirring...,spooky,poe,startup,spooky,
Don't stray from the path.,instruct,poe,nature,spooky,
Echoes from the past call to me...,neutral,poe,spooky,calm,
I wander through the woods sometimes.,neutral,poe,nature,spooky,
My whiskers are twitching...something there?,spooky,poe,spooky,mystery,
Haunted by food long gone.,neutral,poe,spooky,startup,
Tread lightly...,spooky,poe,spooky,mystery,
This place is old...,sigh,poe,spooky,calm,
"Woah, these trees are ancient.",sigh,poe,spooky,nature,
Those are some dark shadows!,sigh,poe,spooky,mystery,
Ghostly whispers call out.,sigh,poe,spooky,mystery,
I can barely see in this dark.,sigh,poe,spooky,calm,
Ghosts haunt the circuits.,spooky,poe,startup,spooky,
Those aren't my pawsteps...,spooky,poe,spooky,mystery,
Eyes gleaming in the dark...,spooky,poe,spooky,mystery,
We're haunted by the past...,spooky,poe,startup,spooky,
My tail is twitching...who's there?,spooky,poe,spooky,mystery,
The night is ours.,thumb,poe,night,success,
"Ah, darkness...my faithful accomplice.",thumb,poe,night,success,
Let's wave these shadows away!,thumb,poe,spooky,success,
"Hold my hand, let's face the night.",thumb,poe,night,success,
"Thumbs up, we've got tonight!",thumb,poe,night,success,
"Twiddle the knob, reverse the polarity!",instruct,nonsense,tech,startup,
Let's wobble those woods away!,instruct,nonsense,nature,guide,
Don't get ahead of yourself!,spooky,nonsense,guide,mystery,
Beep boop I'm an AI!,spooky,nonsense,startup,tech,
"Go on, pull my tail!",instruct,nonsense,guide,tech,
Grab the flux capacitor for me!,neutral,nonsense,tech,calm,
Do the trees mind when I climb them?,neutral,nonsense,nature,mystery,
Do ghosts need to use the toilet?,spooky,nonsense,mystery,spooky,
I find a keyboard indispensable!,neutral,nonsense,startup,tech,
Should I get an electronic tail?,spooky,nonsense,tech,mystery,
Whiskers are like cute satellites!,sigh,nonsense,tech,calm,
The other animals are morons!,sigh,nonsense,nature,calm,
"Bubble bubble, toil and GRUB.",sigh,nonsense,calm,spooky,
My computer is on holiday.,sigh,nonsense,calm,tech,
I'm going fishing for burgers!,sigh,nonsense,calm,nature,
Boo! I'm a computer ghost!,spooky,nonsense,startup,tech,
My tail is twitching...or are you pulling it?,spooky,nonsense,spooky,mystery,
"Something's here. Wait, that's just my own tail!",spooky,nonsense,spooky,mystery,
Starting now... Frizzle-frazzle floop!,spooky,nonsense,startup,spooky,
What are my little ears hearing?,spooky,nonsense,mystery,spooky,
We're ready to ascend into the Cloud!,thumb,nonsense,tech,success,
Let's get this bread bin!,thumb,nonsense,success,encouragement,
"You did it, buderino!",thumb,nonsense,success,encouragement,
"Wahoo, yippee!",thumb,nonsense,success,encouragement,
"Bip bop, let's hop!",thumb,nonsense,success,encouragement,
Let's do some experiments.,instruct,science,startup,exploration,
For science!,instruct,science,guide,exploration,
Strange phenomena ahead.,spooky,science,exploration,mystery,
Into the unknown!,spooky,science,startup,mystery,
Let's do science together!,instruct,science,guide,exploration,
"Now, watch carefully...",neutral,science,startup,exploration,
I can't wait to explore!,neutral,science,exploration,anticipation,
This data is strange!,spooky,science,calm,exploration,
Experimentation in progress...,neutral,science,startup,exploration,
Strange readings detected.,spooky,science,exploration,mystery,
Let's check out these results!,sigh,science,exploration,anticipation,
The data's looking good.,sigh,science,calm,anticipation,
This experiment is taking ages!,sigh,science,calm,exploration,
Science is slow sometimes.,sigh,science,calm,anticipation,
These findings are... odd.,sigh,science,mystery,exploration,
Anomalies detected.,spooky,science,startup,mystery,
I'm detecting some unusual activity.,spooky,science,exploration,mystery,
Something's off with this data...,spooky,science,exploration,mystery,
Let's get experimental.,spooky,science,startup,mystery,
"Ooh, this data is eerie...",spooky,science,exploration,mystery,
"Experiment safely, friend!",thumb,science,exploration,success,
"Hell yeah, science!",thumb,science,exploration,success,
"Got the data, chief!",thumb,science,exploration,success,
"Analysis complete, boss!",thumb,science,exploration,success,
"All the forest's a stage, and all the raccoons merely players.",thumb,science,exploration,success,
All the forest's a stage,instruct,Shakespeare,nature,theater,pun
To sniff or not to sniff...,neutral,Shakespeare,tech,startup,pun
Is this a squirrel I see before me?,spooky,Shakespeare,nature,spooky,pun
"Cry havoc, and let slip the squirrels of war!",spooky,Shakespeare,nature,mystery,pun
A skunk by any other name would still stink.,thumb,Shakespeare,nature,fun,pun
Logic will get you from ear to tail!,instruct,Einstein,nature,imagination,pun
I have many special talents!,neutral,Einstein,nature,curiosity,pun
Two things are infinite: the universe and my appetite,spooky,Einstein,nature,humor,pun
"E=mc..., the energy of a chipmunk in motion.",spooky,Einstein,science,nature,pun
You can't blame me for loving trash!,thumb,Einstein,nature,love,pun
"A little less conversation, a lot more food!",instruct,Elvis,nature,action,pun
You ain't nothing but a hedgehog.,neutral,Elvis,nature,fun,pun
I can't help falling in love with food.,spooky,Elvis,nature,love,pun
Don't be cruel to a heart that's true... or a raccoon.,spooky,Elvis,nature,kindness,pun
Viva Las Vegas... and the squirrels!,thumb,Elvis,nature,fun,pun
I walk the line... between the trees.,neutral,Johnny Cash,nature,journey,pun
I fell into a burning ring of squirrels.,spooky,Johnny Cash,nature,spooky,pun
The beast in me... is a raccoon.,spooky,Johnny Cash,nature,mystery,pun
"Get rhythm, buddy!",thumb,Johnny Cash,nature,fun,pun
Let's steal the squirrel's nuts!,instruct,Mark Twain,nature,motivation,pun
Let people think you are a wise raccoon.,spooky,Mark Twain,nature,wisdom,pun
"Tell the truth, or you might get caught!",thumb,Mark Twain,nature,wisdom,pun
Standing on the shoulders of bears.,instruct,Isaac Newton,nature,wisdom,pun
Who really controls the movements of foxes?,neutral,Isaac Newton,nature,science,pun
A beaver in motion tends to stay in motion.,spooky,Isaac Newton,nature,science,pun
Fear of bears is the biggest feeling.,instruct,HP Lovecraft,nature,fear,pun
I am Providence... but also a raccoon.,neutral,HP Lovecraft,nature,identity,pun
Is that a beaver in the dark?,spooky,HP Lovecraft,nature,fear,pun
I fear the world beyond the forest...,thumb,HP Lovecraft,nature,exploration,pun
"Quoth the raccoon, 'Nevermore.'",instruct,Edgar Allen Poe,nature,spooky,pun
"Once upon a midnight dreary, I am weary.",neutral,Edgar Allen Poe,nature,spooky,pun
The tell-tale heart... of a worried squirrel.,spooky,Edgar Allen Poe,nature,spooky,pun
This is but a dream within a beaver's stream.,spooky,Edgar Allen Poe,nature,mystery,pun
"Please, sir, I want some more...garbage.",neutral,Charles Dickens,nature,humor,pun
I expect my breakfast!,spooky,Charles Dickens,nature,wisdom,pun
Beware the beaver with one shoe off.,spooky,Charles Dickens,nature,mystery,pun
I know why the caged raccoon sings.,instruct,Maya Angelou,nature,wisdom,pun
Please don't shoot me with your words.,neutral,Maya Angelou,nature,resilience,pun
I wish my trash digging was acknowledged.,spooky,Maya Angelou,nature,transformation,pun`;

var _allPoems;
parseCSVToJSON(csvPoems, result => {
    _allPoems = buildPoemList(result);
})