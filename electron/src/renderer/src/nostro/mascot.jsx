import * as fabric from 'fabric'
import { isEcoMode } from './ipc';
import { ecoRefreshInterval } from "../timing";

export function manageMascotCanvas(canvasId, emoteSignal, heightSignal) {
    var canvas = null;
    var lastManaged = new Date();
    setInterval(() => {
        function setCanvas(myCanvas) {
            canvas = myCanvas;
        }
        function getCanvas() {
            return canvas;
        }
        if (isEcoMode()) {
            const now = new Date();
            const timeout = ecoRefreshInterval;
            const diff = now.getTime() - lastManaged.getTime();
            if (diff < timeout) {
                return;
            }
        }
        mascotCanvasUpdate(setCanvas, getCanvas, canvasId, emoteSignal, heightSignal);
        lastManaged = new Date();
    }, 1000);
}

// heightText in format "123px"
function parseHeight(heightText) {
    const height = parseInt(heightText.replace("px", ""));
    if (isNaN(height)) {
        throw new Error(`invalid height: ${heightText}`);
    }
    return height;
}

function mascotCanvasUpdate(setCanvas, getCanvas, canvasId, emoteSignal, heightSignal) {
    const canvasRef = document.getElementById(canvasId);
    if (!canvasRef) {
        return;
    }
    const foregroundColor = canvasRef.getAttribute("data-sig-fg-color");
    const boxBackgroundColor = canvasRef.getAttribute("data-sig-bg-color");
    const emote = canvasRef.getAttribute("data-sig-emote");
    if (!foregroundColor || !boxBackgroundColor || !emote) {
        return;
    }

    const heightText = heightSignal();
    const height = parseHeight(heightText);

    var canvas = getCanvas();
    const initialised = canvasRef.getAttribute("data-initialised");
    if (!initialised) {
        if (canvas) {
            canvas.dispose();
        }
        console.log("creating canvas")
        canvas = new fabric.Canvas(canvasRef, {
            backgroundColor: boxBackgroundColor,
            selection: false,
            hoverCursor: "default",
            moveCursor: "default",
            // TODO: we may have to revisit this height.
            // The canvas is absolutely positioned, leading to strange behaviour when the height is too big.
            height: height,
        });
        setCanvas(canvas);
    }
    canvasRef.setAttribute("data-initialised", "true");

    const renderedForeground = canvasRef.getAttribute("data-foreground-color");
    const renderedBackground = canvasRef.getAttribute("data-background-color");
    const renderedEmote = canvasRef.getAttribute("data-emote");
    const renderedHeight = canvasRef.getAttribute("data-height");
    if (renderedForeground === foregroundColor && renderedBackground === boxBackgroundColor && emote === renderedEmote && renderedHeight === height) {
        // console.log("skipping canvas update");
        return;
    }
    canvas = getCanvas();
    if (!canvas) {
        console.log("no canvas, skipping mascot render")
        return;
    }
    // Remove all objects from the canvas
    canvas.clear();
    canvas.set("backgroundColor", boxBackgroundColor);
    console.log("adding canvas image fg: ", foregroundColor, " bg: ", boxBackgroundColor);
    fabric.FabricImage.fromURL(mascotPath(emoteSignal())).then((img) => {
        console.log("fromURL start");
        img.filters.push(replaceColorFilter({
            chromakeys: [{
                newColor: foregroundColor,
                chromakey: 0,
            },
            {
                newColor: boxBackgroundColor,
                chromakey: 2,
            },
            ]
        }));
        // img.filters.push(replaceColorFilter({
        //     newColor: boxBackgroundColor,
        //     chromakey: 0,
        // }));
        img.applyFilters();
        // Get canvas dimensions
        const canvasWidth = canvas.getWidth();
        const canvasHeight = height;

        // Calculate the scale factor to preserve aspect ratio and fit within the canvas
        const scaleFactor = Math.min(canvasWidth / img.width, canvasHeight / img.height);

        img.scale(scaleFactor);
        img.selectable = false;
        img.hoverCursor = "default";

        // Apply the scale factor to the image
        canvas.setWidth(img.width * scaleFactor);
        canvas.setHeight(img.height * scaleFactor);

        canvas.add(img);

        canvasRef.setAttribute("data-foreground-color", foregroundColor);
        canvasRef.setAttribute("data-background-color", boxBackgroundColor);
        canvasRef.setAttribute("data-emote", emote);
        canvasRef.setAttribute("data-height", heightText);
    }).catch((err) => {
        console.error("error adding canvas: ", err);
    });
};

function mascotPath(emote) {
    validateEmote(emote);
    return `assets/image/mascot/mascot-${emote}.png`;
}

const validEmotes = [
    "instruct",
    "neutral",
    "sigh",
    "spooky",
    "thumb"
];

function validateEmote(emote) {
    const isValid = validEmotes.filter(myEmote => myEmote === emote).length > 0;
    if (!isValid) {
        throw new Error(`invalid mascot nickname: ${emote}`);
    }
}

export function scoreEmote(text, isSpooky) {
    // Split the text into words, and remove anything other than ascii letters.
    const words = text.split(/\s+/).map(word => word.replace(/[^A-Za-z]/g, ""));
    const scores = {};
    for (const emote in emoteKeywordMap) {
        scores[emote] = 0;
    }
    for (const word of words) {
        for (const emote in emoteKeywordMap) {
            if (emoteKeywordMap[emote].includes(word)) {
                scores[emote]++;
            }
        }
    }
    const limit = 1;
    let fallback = "neutral";
    // Get the emotes as an array in descending order of score.  If the score is less than limit, do not include the emote.
    const emotes = Object.keys(scores).sort((a, b) => scores[b] - scores[a]).filter(emote => scores[emote] >= limit);
    if (emotes.length === 0) {
        return fallback;
    }
    // If the first emote is spooky, and spooky is not enabled, return the second emote if available otherwise return the fallback.
    if (emotes[0] === "spooky" && !isSpooky) {
        return emotes[1] || fallback;
    }
    return emotes[0];
}

function replaceColorFilter({ chromakeys }) {
    // Helper function to convert CSS color to RGB
    function cssColorToRgb(color) {
        let r, g, b, a;

        if (color.startsWith('#')) {
            // Handle hex color
            if (color.length === 4) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
                a = 255; // Default alpha value
            } else if (color.length === 5) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
                a = parseInt(color[4] + color[4], 16);
            } else if (color.length === 7) {
                r = parseInt(color[1] + color[2], 16);
                g = parseInt(color[3] + color[4], 16);
                b = parseInt(color[5] + color[6], 16);
                a = 255; // Default alpha value
            } else if (color.length === 9) {
                r = parseInt(color[1] + color[2], 16);
                g = parseInt(color[3] + color[4], 16);
                b = parseInt(color[5] + color[6], 16);
                a = parseInt(color[7] + color[8], 16);
            }
        }

        return [r, g, b, a];
    }

    const colorMatrix = [
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
    ];
    chromakeys.forEach(({ newColor, chromakey }) => {
        const [r, g, b, a] = cssColorToRgb(newColor);
        if (chromakey >= 0 && chromakey <= 2) {
            colorMatrix[chromakey] = r / 255;
            colorMatrix[chromakey + 5] = g / 255;
            colorMatrix[chromakey + 10] = b / 255;
            colorMatrix[chromakey + 15] = a / 255;
        } else {
            throw new Error(`invalid chromakey value: ${chromakey}`);
        }
    });

    // Apply the color matrix filter using fabric.js
    return new fabric.filters.ColorMatrix({
        matrix: colorMatrix
    });
}


const instructKeywords = [
    "lecture", "class", "course", "lesson", "seminar", "workshop", "meeting", "exam",
    "quiz", "test", "midterm", "final", "assignment", "project", "presentation", "homework",
    "lab", "laboratory", "experiment", "study", "review", "revision", "discussion", "research", "thesis",
    "dissertation", "paper", "essay", "report", "reading", "notes", "outline", "summary",
    "draft", "submission", "deadline", "study", "group", "group", "work", "teamwork", "collaboration",
    "practice", "prep", "preparation", "brainstorm", "idea", "concept", "theory", "problem",
    "solution", "case", "critique", "feedback", "peer", "review", "reflection", "session",
    "office", "hours", "consultation", "conference", "webinar", "teleconference", "skype", "zoom",
    "hangout", "call", "interview", "pitch", "proposal", "plan", "strategy", "briefing",
    "debrief", "orientation", "training", "onboarding", "work", "plan", "agenda", "schedule",
    "calendar", "itinerary", "timeline", "milestone", "goal", "objective", "target",
    "achievement", "completion", "deliverable", "checkpoint", "update", "followup",
    "analysis", "statistics", "result", "conclusion", "findings", "insight", "hypothesis",
    "validation", "model", "simulation", "drafting", "editing", "proofreading", "finalizing",
    "publishing", "approval", "acceptance", "rejection", "revisions", "corrections",
    "amendments", "resubmission", "reassessment", "mentorship", "coaching", "guidance",
    "advising", "counseling", "support", "tutoring", "peer", "mentoring", "facilitation",
    "leadership", "supervision", "oversight", "management", "coordination", "organization",
    "planning", "development", "design", "implementation", "execution", "operation",
    "monitoring", "tracking", "reporting", "assessment", "evaluation", "grading",
    "scoring", "ranking", "performance", "review", "audit", "inspection", "check",
    "verification", "validation", "certification", "licensing", "authorization",
    "consent", "endorsement", "contract", "agreement", "deal", "negotiation",
    "mediation", "settlement", "resolution", "decision", "recommendation", "consultation",
    "dialogue", "discussion", "debate", "argument", "persuasion", "convincing",
    "influence", "impact", "effect", "outcome", "result", "consequence", "implication",
    "awareness", "knowledge", "expertise", "skill", "curiosity", "exploration",
    "investigation", "examination", "scrutiny", "observation", "monitoring",
    "tracking", "data", "metrics", "measures", "indicators", "variables",
    "criteria", "standards", "benchmarks", "goals", "targets", "objectives",
    "milestones", "outcomes", "results", "impacts", "effects", "consequences",
    "lessons", "learning", "insights", "findings", "conclusions", "recommendations",
    "advice", "guidelines", "biology", "chemistry", "physics", "math", "algebra",
    "geometry", "calculus", "statistics", "economics", "finance", "accounting",
    "marketing", "management", "business", "strategy", "entrepreneurship",
    "innovation", "engineering", "mechanics", "electronics", "robotics", "architecture",
    "design", "planning", "construction", "computer", "software", "programming",
    "coding", "databases", "systems", "networks", "cybersecurity", "artificial", "intelligence",
    "machinelearning", "web", "development", "graphic", "design", "multimedia", "animation",
    "media", "journalism", "communication", "writing", "literature", "poetry",
    "history", "geography", "politics", "law", "legal", "philosophy", "ethics",
    "sociology", "psychology", "anthropology", "religion", "theology", "language",
    "linguistics", "translation", "interpretation", "education", "teaching",
    "pedagogy", "curriculum", "assessment", "evaluation", "feedback", "grading",
    "teaching", "classroom", "school", "university", "college", "institute",
    "academy", "training", "certification", "diploma", "degree", "graduation",
    "commencement", "workshop", "symposium", "colloquium", "forum",
    "panel", "webinar", "tutorial", "study", "research", "thesis", "dissertation",
    "proposal", "defense", "viva", "publication", "journal", "conference",
    "symposium", "presentation", "talk", "lecture", "keynote", "discussion",
    "debate", "table", "chair", "chairman", "chairwoman", "chairperson", "panel", "forum", "dialogue", "interview", "networking",
    "reception", "banquet", "dinner", "lunch", "breakfast", "brunch", "coffee",
    "tea", "break", "social", "gathering", "meeting", "appointment", "session",
    "workshop", "retreat", "boot", "camp", "training", "orientation", "onboarding",
    "coaching", "mentorship", "support", "supervision", "management", "leadership",
    "planning", "development", "strategy", "project", "proposal", "pitch",
    "briefing", "update", "review", "evaluation", "assessment", "report",
    "documentation", "agenda", "schedule", "timeline", "roadmap", "milestone",
    "goal", "objective", "target", "deliverable", "checkpoint", "meeting",
    "conference", "call", "teleconference", "video", "conference", "webinar",
    "hangout", "zoom", "skype", "teams", "presentation", "demonstration",
    "workshop", "tutorial", "training", "session", "consultation", "appointment",
    "discussion", "debate", "brainstorm", "ideation", "planning", "coordination",
    "management", "oversight", "supervision", "leadership", "guidance",
    "mentorship", "coaching", "support", "assistance", "advice", "feedback",
    "evaluation", "review", "assessment", "grading", "scoring", "ranking",
    "performance", "report", "documentation", "summary", "abstract", "notes",
    "draft", "revision", "editing", "proofreading", "finalizing", "submission",
    "publication", "presentation", "approval", "acceptance", "rejection",
    "correction", "amendment", "revision", "resubmission", "feedback",
    "reflection", "insight", "understanding", "analysis", "critique",
    "commentary", "review", "recommendation", "suggestion", "guideline",
    "procedure", "policy", "rule", "standard", "criteria", "guideline",
    "protocol", "directive", "instruction", "advice", "recommendation",
    "proposal", "suggestion", "request", "requirement", "demand", "expectation",
    "aspiration", "goal", "objective", "target", "milestone", "outcome",
    "result", "impact", "effect", "consequence", "repercussion", "ramification",
    "implication", "conclusion", "lesson", "learning", "insight", "finding",
    "realization", "discovery", "invention", "innovation", "idea",
    "concept", "theory", "model", "framework", "structure", "system",
    "method", "approach", "technique", "strategy", "tactic", "plan",
    "design", "blueprint", "prototype", "simulation", "experiment",
    "trial", "pilot", "testing", "evaluation", "assessment", "validation",
    "verification", "certification", "approval", "acceptance", "compliance",
    "conformance", "adherence", "conformity", "alignment", "integration",
    "coordination", "collaboration", "partnership", "alliance", "cooperation",
    "synergy", "teamwork", "communication", "dialogue", "discussion",
    "debate", "negotiation", "bargaining", "compromise", "mediation",
    "arbitration", "settlement", "resolution", "agreement", "contract",
    "deal", "arrangement", "understanding", "consensus", "harmony",
    "accord", "peace", "coexistence", "collaboration", "teamwork",
    "partnership", "synergy", "alliance", "coalition", "network",
    "association", "organization", "institute", "foundation", "company",
    "business", "enterprise", "firm", "corporation", "agency", "bureau",
    "department", "division", "branch", "office", "unit", "section",
    "team", "group", "committee", "panel", "board", "council", "assembly",
    "congress", "conference", "symposium", "seminar", "workshop",
    "webinar", "tutorial", "class", "course", "lesson", "module",
    "program", "curriculum", "syllabus", "schedule", "calendar",
    "timeline", "roadmap", "itinerary", "plan", "agenda", "outline",
    "summary", "abstract", "report", "documentation", "note",
    "memo", "letter", "email", "message", "announcement", "notification",
    "invitation", "request", "requirement", "demand", "expectation",
    "aspiration", "goal", "objective", "target", "milestone", "outcome",
    "result", "impact", "effect", "consequence", "repercussion",
    "ramification", "implication", "conclusion", "lesson", "learning",
    "insight", "finding", "realization", "discovery", "invention",
    "innovation", "idea", "concept", "theory", "model", "framework",
    "structure", "system", "method", "approach", "technique",
    "strategy", "tactic", "plan", "design", "blueprint", "prototype",
    "simulation", "experiment", "trial", "pilot", "test", "evaluation",
    "assessment", "validation", "verification", "certification",
    "approval", "acceptance", "compliance", "conformance", "adherence",
    "conformity", "alignment", "integration", "coordination",
    "collaboration", "partnership", "alliance", "synergy", "teamwork",
    "communication", "dialogue", "discussion", "debate", "negotiation",
    "bargaining", "compromise", "mediation", "arbitration", "settlement",
    "resolution", "agreement", "contract", "deal", "arrangement",
    "understanding", "consensus", "harmony", "accord", "peace",
    "coexistence", "collaboration", "teamwork", "partnership",
    "synergy", "alliance", "coalition", "network", "association",
    "organization", "institute", "foundation", "company", "business",
    "enterprise", "firm", "corporation", "agency", "bureau", "department",
    "division", "branch", "office", "unit", "section", "team", "group",
    "committee", "panel", "board", "council", "assembly", "congress",
    "conference", "symposium", "seminar", "workshop", "webinar",
    "tutorial", "class", "course", "lesson", "module", "program",
    "curriculum", "syllabus", "schedule", "calendar", "timeline",
    "roadmap", "itinerary", "plan", "agenda", "outline", "summary",
    "abstract", "report", "documentation", "note", "memo", "letter",
    "email", "message", "announcement", "notification", "invitation"
];

const thumbKeywords = [
    "party", "celebration", "birthday", "anniversary", "wedding", "reception", "graduation",
    "date", "night", "event", "outing", "gathering", "reunion", "dinner", "lunch",
    "breakfast", "brunch", "cocktails", "drinks", "happy", "hour", "festival", "concert",
    "show", "performance", "movie", "cinema", "theater", "play", "musical", "opera",
    "recital", "gig", "live", "music", "night", "nightclub", "clubbing", "dancing",
    "karaoke", "barbecue", "picnic", "cookout", "potluck", "bbq", "beach", "sunset",
    "roadtrip", "road", "trip", "travel", "vacation", "holiday", "trip", "adventure", "exploration",
    "tour", "getaway", "excursion", "journey", "hike", "camping", "backpacking",
    "trekking", "expedition", "safari", "cruise", "resort", "spa", "retreat",
    "weekend", "honeymoon", "valentines", "love", "romance", "engagement", "proposal",
    "marriage", "vows", "ceremony", "ring", "bride", "groom", "bridesmaids", "groomsmen",
    "toast", "banquet", "buffet", "cake", "champagne", "dance", "bouquet", "confetti",
    "joy", "happiness", "smile", "laughter", "fun", "excitement", "thrill", "delight",
    "pleasure", "bliss", "ecstasy", "contentment", "satisfaction", "gratitude", "thankful",
    "blessed", "lucky", "fortunate", "appreciation", "admiration", "cheer",
    "applause", "congratulations", "kudos", "wishes", "best", "success", "achievement",
    "milestone", "accomplishment", "win", "victory", "triumph", "award", "prize",
    "trophy", "medal", "honor", "recognition", "promotion", "raise", "bonus",
    "gift", "present", "surprise", "reward", "good", "news", "announcement", "baby",
    "birth", "newborn", "baptism", "christening", "naming", "adoption", "family",
    "time", "game", "night", "kids", "children", "play", "date", "slumber", "sleepover",
    "girls", "boys", "homecoming", "home", "housewarming", "open", "house", "holiday",
    "christmas", "thanksgiving", "easter", "halloween", "new", "year", "eve",
    "independence", "fireworks", "parade", "stockings", "ornaments", "caroling",
    "egg", "hunt", "jack", "pumpkin", "ghosts", "costumes",
    "hanukkah", "ramadan", "eid", "diwali", "mardigras", "carnival", "fiesta",
    "fete", "oktoberfest", "bachelorette", "bachelor", "shower", "farewell",
    "goodbye", "bon", "voyage", "end", "year", "convocation", "alumni", "jubilee",
    "centennial", "bicentennial", "triennial", "quinquennial", "decade", "century",
    "tradition", "heritage", "culture", "custom", "observance", "ritual",
    "practice", "games", "sports", "competition", "tournament", "league",
    "championship", "playoffs", "finals", "champions", "drive", "motivation",
    "inspiration", "focus", "determination", "perseverance", "resilience",
    "fortitude", "courage", "bravery", "valor", "fearlessness", "boldness",
    "audacity", "confidence", "self", "esteem", "pride", "dignity", "integrity",
    "truth", "honesty", "loyalty", "trust", "reliability", "dependability",
    "faithfulness", "dedication", "commitment", "devotion", "service",
    "cause", "purpose", "vision", "dream", "goals", "aspirations", "dreams",
    "focus", "achievement", "victory", "triumph", "win", "recognition",
    "milestone", "goal", "dream", "ambition", "aspiration", "drive",
    "motivation", "inspiration", "determination", "perseverance", "courage",
    "confidence", "pride", "success", "honor", "award", "medal",
    "trophy", "prize", "banquet", "gathering", "festivity", "occasion",
    "ceremony", "night", "event", "ball", "prom", "dance", "school",
    "year", "end", "end", "graduation", "reunion", "tradition", "heritage",
    "holiday", "festival", "observance", "ceremony", "games",
    "competition", "tournament", "league", "playoffs", "finals",
    "championship", "champions", "victory", "win", "achievement",
    "milestone", "triumph", "success", "honor", "recognition",
    "aspiration", "ambition", "goal", "dream", "motivation",
    "determination", "perseverance", "resilience", "courage",
    "confidence", "pride", "integrity", "truth", "honesty", "loyalty",
    "faith", "dedication", "commitment", "service", "volunteer",
    "charity", "donation", "fundraiser", "cause", "purpose",
    "vision", "aspirations", "goal", "success", "win", "triumph",
    "milestone", "recognition", "award", "prize", "honor", "event",
    "party", "celebration", "gathering", "reunion", "dinner",
    "lunch", "breakfast", "brunch", "cocktails", "drinks",
    "happy", "hour", "festival", "concert", "show", "performance",
    "movie", "cinema", "theater", "play", "musical", "opera",
    "recital", "gig", "music", "night", "out", "nightclub", "clubbing",
    "dancing", "karaoke", "barbecue", "picnic", "cookout", "potluck",
    "bbq", "beach", "sunset", "road", "trip", "travel", "vacation",
    "holiday", "trip", "adventure", "exploration", "tour",
    "getaway", "excursion", "journey", "hike", "camping", "backpacking",
    "trekking", "expedition", "safari", "cruise", "resort", "spa",
    "retreat", "weekend", "honeymoon", "valentines", "love", "romance",
    "engagement", "proposal", "wedding", "marriage", "vows",
    "ceremony", "ring", "bride", "groom", "bridesmaids", "groomsmen",
    "toast", "reception", "banquet", "buffet", "cake", "champagne",
    "dance", "first", "dance", "bouquet", "confetti", "celebrate", "joy",
    "happiness", "smile", "laughter", "fun", "excitement", "thrill",
    "delight", "pleasure", "bliss", "ecstasy", "contentment",
    "satisfaction", "gratitude", "thankful", "blessed", "lucky",
    "fortunate", "appreciation", "admiration", "cheer", "applause",
    "congratulations", "kudos", "well", "wishes", "best", "wishes",
    "success", "achievement", "milestone", "accomplishment",
    "win", "victory", "triumph", "award", "prize", "trophy",
    "medal", "honor", "recognition", "promotion", "raise", "bonus",
    "gift", "present", "surprise", "reward", "good", "announcement",
    "baby", "birth", "newborn", "baby", "shower", "baptism", "christening",
    "naming", "adoption", "family", "family", "time", "game", "night", "gaming",
    "movie", "film", "night", "birthday", "party", "kids", "children", "play", "date",
    "slumber", "party", "sleepover", "girls", "night", "boys", "night", "reunion",
    "homecoming", "housewarming", "open", "house", "holiday", "party",
    "christmas", "xmas", "mas", "thanks", "giving", "day", "easter", "sunday", "saturday", "friday", "halloween", "newyear",
    "new", "years", "eve", "independence", "day", "coronation", "royal", "fireworks", "parade",
    "gifts", "stockings", "ornaments", "caroling", "egg", "hunt",
    "jackolantern", "pumpkin", "ghosts", "costumes",
    "hanukkah", "ramadan", "eid", "diwali", "festival",
    "celebration", "mardigras", "carnival", "fiesta", "fete",
    "oktoberfest", "bachelorette", "bachelor", "bridal", "shower",
    "farewell", "goodbye", "bon", "voyage", "best", "wishes", "congratulations",
    "well", "wishes", "success", "achievement", "milestone", "victory",
    "triumph", "win", "award", "trophy", "medal", "honor",
    "recognition", "celebration", "appreciation", "thanks",
    "thankyou", "blessed", "gratitude", "bliss", "happiness",
    "joy", "delight", "excitement", "fun", "cheer", "smile",
    "laughter", "positive", "optimism", "enthusiasm", "encouragement",
    "support", "admiration", "respect", "love", "affection",
    "friendship", "companionship", "relationship", "bond",
    "partnership", "team", "teammates", "cooperation",
    "collaboration", "unity", "solidarity", "together", "connection",
    "network", "community", "group", "club", "society", "organization",
    "association", "committee", "volunteer", "charity",
    "donation", "fundraiser", "auction", "raffle", "benefit",
    "gala", "banquet", "ball", "prom", "homecoming", "school", "dance",
    "graduation", "convocation", "reunion", "anniversary",
    "jubilee", "centennial", "bicentennial", "triennial",
    "quinquennial", "decade", "century", "tradition",
    "heritage", "culture", "custom", "holiday", "festival",
    "celebration", "observance", "ceremony", "ritual", "practice",
    "recreation", "fun", "games", "sports", "competition",
    "tournament", "league", "championship", "playoffs",
    "finals", "victory", "win", "champions", "trophy",
    "medal", "award", "prize", "honor", "recognition",
    "achievement", "success", "victory", "triumph",
    "milestone", "accomplishment", "goal", "dream", "ambition",
    "aspiration", "drive", "motivation", "inspiration", "focus",
    "determination", "perseverance", "resilience", "fortitude",
    "courage", "bravery", "valor", "gallantry", "fearlessness",
    "boldness", "audacity", "confidence", "self", "esteem",
    "pride", "dignity", "respect", "honor", "integrity",
    "truth", "honesty", "loyalty", "trust", "reliability",
    "dependability", "faithfulness", "dedication", "commitment",
    "devotion", "service", "volunteer", "charity", "donation",
    "fundraiser", "cause", "mission", "purpose", "vision",
    "goals", "aspirations", "dreams", "inspiration",
    "motivation", "drive", "determination", "perseverance"
];

const spookyKeywords = [
    "halloween", "ghost", "fright", "night", "horror", "film", "movie", "spooky",
    "scary", "creepy", "haunted", "witch", "witches", "vampire", "vampires",
    "zombie", "zombies", "monster", "monsters", "skeleton", "skeletons",
    "pumpkin", "jackolantern", "bat", "bats", "spider", "spiders", "web",
    "webs", "cobweb", "cobwebs", "dark", "darkness", "shadow", "shadows",
    "grave", "graveyard", "cemetery", "tomb", "tombstone", "coffin",
    "coffins", "mummy", "mummies", "phantom", "phantoms", "specter",
    "specters", "poltergeist", "poltergeists", "wraith", "wraiths",
    "ghoul", "ghouls", "demon", "demons", "devil", "devils", "hell",
    "satan", "lucifer", "fiend", "fiends", "evil", "darkness", "curse",
    "curses", "hex", "hexes", "spell", "spells", "witchcraft",
    "sorcery", "magic", "blackmagic", "occult", "ritual", "rituals",
    "seance", "seances", "voodoo", "hoodoo", "grimoire", "potion",
    "potions", "cauldron", "cauldrons", "broomstick", "broomsticks",
    "cloak", "cloaks", "mask", "masks", "costume", "costumes",
    "disguise", "disguises", "trick", "treat", "trickortreat",
    "blood", "gore", "fangs", "claws", "howl", "howls", "scream",
    "screams", "shrieks", "cry", "cries", "moan", "moans", "whisper",
    "whispers", "footsteps", "creak", "creaks", "door", "doors",
    "window", "windows", "chains", "rattling", "storm", "storms",
    "lightning", "thunder", "rain", "fog", "mist", "eerie",
    "chill", "cold", "freezing", "freezes", "phantom", "ghostly",
    "spirit", "spirits", "apparition", "apparitions", "doppelganger",
    "doppelgangers", "haunt", "haunting", "specter", "spooky",
    "supernatural", "paranormal", "unseen", "unknown", "fear",
    "terror", "dread", "panic", "nightmare", "nightmares", "doom",
    "death", "dying", "undead", "afterlife", "grave", "tomb",
    "crypt", "catacombs", "skull", "skulls", "bones", "bony",
    "cadaver", "cadavers", "morgue", "corpse", "corpses", "rotting",
    "decompose", "decay", "decaying", "flesh", "rotting", "skeleton",
    "skeletons", "ghost", "ghosts", "wraith", "wraiths", "phantom",
    "phantoms", "spirit", "spirits", "poltergeist", "poltergeists",
    "demon", "demons", "monster", "monsters", "creature", "creatures",
    "goblin", "goblins", "troll", "trolls", "ogre", "ogres", "fiend",
    "fiends", "beast", "beasts", "entity", "entities", "possession",
    "possessed", "possession", "possession", "exorcism", "exorcisms",
    "curse", "curses", "hex", "hexes", "spell", "spells", "witch",
    "witches", "witchcraft", "sorcery", "enchantment", "enchantments",
    "magic", "blackmagic", "occult", "ritual", "rituals", "ceremony",
    "ceremonies", "sacrifice", "sacrifices", "offering", "offerings",
    "blood", "altar", "sanctum", "temple", "ritual", "rituals",
    "shrine", "shrines", "coven", "covens", "cult", "cults",
    "voodoo", "voodoo", "shaman", "shamans", "necromancy", "necromancer",
    "necromancers", "seance", "seances", "ouija", "board", "ouijaboard",
    "dark", "darkness", "black", "pitchblack", "blackcat", "noir",
    "midnight", "night", "nightfall", "nightshade", "nightmare",
    "nightmares", "scream", "screams", "shriek", "shrieks",
    "cry", "cries", "moan", "moans", "groan", "groans", "whisper",
    "whispers", "chant", "chants", "howl", "howls", "echo",
    "echoes", "footsteps", "creak", "creaks", "clatter", "clatters",
    "rattle", "rattles", "bang", "bangs", "crash", "crashes",
    "slam", "slams", "thud", "thuds", "knock", "knocks", "door",
    "doors", "window", "windows", "curtain", "curtains", "shadow",
    "shadows", "shade", "shades", "mist", "mists", "fog", "fogs",
    "haze", "hazy", "smoke", "smokes", "blizzard", "storm",
    "stormy", "thunder", "lightning", "flash", "flashes",
    "downpour", "flood", "floods", "gale", "tempest", "winds",
    "howling", "breeze", "icy", "chill", "cold", "frost",
    "freezing", "snow", "snowstorm", "darkness", "dim",
    "shadows", "shade", "gloom", "gloomy", "murky", "bleak",
    "eerie", "grim", "gruesome", "grisly", "grotesque",
    "macabre", "morbid", "sinister", "evil", "ominous",
    "menacing", "foreboding", "haunt", "haunted", "haunting",
    "possession", "possessed", "cursed", "hexed", "bewitched",
    "charmed", "enchanted", "coven", "cult", "ritual", "sacrifice",
    "devil", "demon", "hell", "satan", "lucifer", "beelzebub",
    "fiend", "fiends", "specter", "ghost", "phantom",
    "spirit", "wraith", "revenant", "poltergeist", "zombie",
    "ghoul", "banshee", "shade", "nightmare", "shiver",
    "terror", "fright", "panic", "dread", "fear",
    "horror", "terror", "shock", "startle", "chill",
    "unsettling", "creepy", "unnerving", "disturbing",
    "alarming", "intimidating", "frightful", "fearful",
    "dismal", "horrific", "terrifying", "nightmarish",
    "bloodcurdling", "chilling", "frightening", "harrowing",
    "creepy", "eerie", "uncanny", "weird", "strange",
    "bizarre", "unusual", "peculiar", "mysterious",
    "mystery", "puzzle", "riddle", "enigma", "conundrum",
    "paradox", "anomaly", "weirdness", "strangeness",
    "peculiarity", "oddity", "eccentricity", "phantom",
    "ghost", "apparition", "spirit", "poltergeist",
    "wraith", "revenant", "specter", "haunt", "haunting",
    "haunted", "possession", "possessed", "curse",
    "hex", "spell", "magic", "witch", "witches",
    "warlock", "warlocks", "wizard", "sorcerer",
    "sorceress", "enchanter", "enchantress", "mage",
    "necromancer", "spell", "hex", "ritual",
    "incantation", "chant", "seance", "voodoo",
    "magic", "alchemy", "sorcery", "necromancy",
    "occult", "esoteric", "arcane", "witchcraft",
    "blackmagic", "devil", "demon", "hell",
    "damnation", "underworld", "netherworld",
    "afterlife", "purgatory", "limbo", "abyss",
    "hellfire", "inferno", "torment", "agony",
    "suffering", "misery", "pain", "anguish",
    "despair", "hopelessness", "doom", "gloom",
    "death", "decay", "decomposition", "rot",
    "rotting", "maggots", "worms", "decay",
    "graves", "graveyard", "tomb", "crypt",
    "catacomb", "mausoleum", "ossuary", "burial",
    "mummy", "coffin", "sarcophagus", "urn",
    "ashes", "ghostly", "apparition", "phantom",
    "spirit", "wraith", "specter", "shade",
    "shadow", "haunting", "poltergeist",
    "entity", "poltergeist", "ghoul",
    "revenant", "zombie", "mummy",
    "monster", "beast", "fiend",
    "demon", "devil", "vampire",
    "werewolf", "lycanthrope", "shape",
    "shapeshifter", "changeling",
    "bogeyman", "goblin", "goblins",
    "ogre", "ogres", "troll", "trolls",
    "hobgoblin", "gremlin", "orc",
    "ogre", "doppelganger", "banshee",
    "fey", "fairy", "fairies",
    "changeling", "elf", "elves",
    "troll", "gremlin", "gnome",
    "gnomes", "ogre", "goblin",
    "ghoul", "vampire", "werewolf",
    "monster", "creature", "beast",
    "fiend", "demon", "devil",
    "hellhound", "hellhounds",
    "shadow", "shade", "spirit",
    "wraith", "revenant", "poltergeist",
    "phantom", "ghost", "ghoul",
    "skeleton", "zombie", "mummy",
    "monster", "creature", "beast",
    "demon", "doppelganger", "nightmare",
    "shiver", "terror", "fright",
    "panic", "dread", "fear",
    "horror", "terror", "shock",
    "startle", "chill", "unsettling",
    "creepy", "unnerving", "disturbing",
    "alarming", "intimidating", "frightful",
    "fearful", "horrific", "terrifying",
    "nightmarish", "bloodcurdling",
    "chilling", "frightening", "harrowing",
    "uncanny", "weird", "strange",
    "bizarre", "peculiar", "mysterious",
    "eerie", "creepy", "ominous",
    "sinister", "menacing", "foreboding",
    "haunted", "supernatural", "ghostly",
    "phantom", "specter", "spirit",
    "wraith", "poltergeist", "doppelganger",
    "apparition", "shiver", "nightmare",
    "terror", "fright", "panic",
    "dread", "fear", "horror",
    "terror", "shock", "startle",
    "creepy", "unnerving", "disturbing",
    "alarming", "intimidating", "frightful",
    "fearful", "horrific", "terrifying",
    "nightmarish", "bloodcurdling",
    "chilling", "frightening", "eerie",
    "creepy", "sinister", "ominous",
    "menacing", "foreboding", "supernatural",
    "ghostly", "phantom", "spirit",
    "wraith", "poltergeist", "revenant",
    "apparition", "phantom", "ghost",
    "ghoul", "skeleton", "zombie",
    "mummy", "monster", "creature",
    "beast", "fiend", "demon",
    "devil", "vampire", "werewolf",
    "witch", "warlock", "wizard",
    "mage", "sorcerer", "sorceress",
    "necromancer", "shaman", "enchanter",
    "enchantress", "warlock", "spell",
    "hex", "ritual", "incantation",
    "chant", "seance", "voodoo",
    "magic", "alchemy", "sorcery",
    "necromancy", "occult", "esoteric",
    "arcane", "witchcraft", "blackmagic",
    "devil", "demon", "hell",
    "damnation", "underworld", "netherworld",
    "afterlife", "purgatory", "limbo",
    "abyss", "hellfire", "inferno",
    "torment", "agony", "suffering",
    "misery", "pain", "anguish",
    "despair", "hopelessness", "doom",
    "gloom", "death", "decay",
    "decomposition", "rot", "rotting",
    "maggots", "worms", "graves",
    "graveyard", "tomb", "crypt",
    "catacomb", "mausoleum", "ossuary",
    "burial", "mummy", "coffin",
    "sarcophagus", "urn", "ashes",
    "phantom", "ghost", "apparition",
    "spirit", "poltergeist", "wraith",
    "revenant", "specter", "haunt",
    "haunting", "haunted", "possession",
    "possessed", "curse", "hex",
    "spell", "magic", "witch",
    "witches", "warlock", "warlocks",
    "wizard", "sorcerer", "sorceress",
    "enchanter", "enchantress", "mage",
    "necromancer", "spell", "hex",
    "ritual", "incantation", "chant",
    "seance", "voodoo", "magic",
    "alchemy", "sorcery", "necromancy",
    "occult", "esoteric", "arcane",
    "witchcraft", "blackmagic", "devil",
    "demon", "hell", "damnation",
    "underworld", "netherworld",
    "afterlife", "purgatory", "limbo",
    "abyss", "hellfire", "inferno",
    "torment", "agony", "suffering",
    "misery", "pain", "anguish",
    "despair", "hopelessness", "doom",
    "gloom", "death", "decay",
    "decomposition", "rot", "rotting",
    "maggots", "worms", "graves",
    "graveyard", "tomb", "crypt",
    "catacomb", "mausoleum", "creepypasta", "slender", "slenderman", "jeff", "killer", "jeffthekiller",
    "smile", "smiledog", "smilejpeg", "eyeless", "eyelessjack", "jack",
    "ben", "bendrowned", "laughing", "laughingjack", "candle", "candles",
    "candlecove", "squidward", "suicide", "squidwardsuicide", "sonic",
    "sonicexe", "tictoc", "ticci", "ticcitoby", "toby", "puppet", "puppeteer",
    "puppetmaster", "zalgo", "jane", "janethekiller", "homicidal",
    "homicidalliu", "liu", "clockwork", "nina", "ninathekiller",
    "bloody", "bloodypainter", "painter", "abandoned", "abandonedbydisney",
    "disney", "lostepisode", "creepy", "creepydoll", "doll",
    "creepyman", "man", "strange", "unknown", "unseen", "shadow",
    "creep", "creeping", "stalker", "paranoia", "murder", "ghost",
    "spirit", "haunted", "sacrifice", "cult", "ritual", "ritualistic",
    "possession", "curse", "cursed", "demon", "demons", "hell",
    "fiend", "fiends", "revenant", "wraith", "poltergeist", "entity",
    "entities", "darkweb", "deepweb", "redroom", "disturbing",
    "disturbed", "creature", "creatures", "monster", "monsters",
    "inhuman", "abomination", "mutation", "mutant", "experiment",
    "experiments", "psychotic", "insane", "madness", "lunatic",
    "lunacy", "schizophrenic", "paranoid", "killer", "killers",
    "murderer", "murderers", "assassin", "assassins", "executioner",
    "executioners", "butcher", "butchers", "slaughter", "slaughterhouse",
    "cannibal", "cannibals", "cannibalism", "eater", "flesh", "skin",
    "skinning", "bones", "skull", "skulls", "decay", "decompose",
    "decomposing", "grave", "graveyard", "tomb", "crypt", "undead",
    "zombie", "zombies", "ghoul", "ghouls", "mummy", "mummies",
    "freak", "freaks", "oddity", "oddities", "mystery", "mysteries",
    "alien", "aliens", "x-files",
    "anomaly", "anomalies", "glitch", "glitches", "virus", "viruses",
    "malware", "hacked", "hacker", "hackers", "cyber", "cyberstalker",
    "cyberstalkers", "obsession", "obsessive", "stalker", "stalkers",
    "creep", "creeping", "creeper", "creepers", "lurker", "lurkers",
    "watcher", "watchers", "eye", "eyes", "faceless", "facelessman",
    "facelesswoman", "mask", "masked", "unmasked", "whisper",
    "whispers", "whispering", "voice", "voices", "screamer",
    "screaming", "horror", "terror", "fear", "dread", "nightmare",
    "nightmares", "insomnia", "sleepless", "distress", "anguish",
    "suffering", "torment", "agony", "pain", "blood", "bleeding",
    "gore", "gory", "violent", "violence", "attack", "attacker",
    "chase", "chased", "escape", "escaped", "flee", "fleeing",
    "run", "running", "hide", "hiding", "hidden", "alone",
    "isolation", "isolated", "lonely", "dark", "darkness",
    "black", "night", "shadow", "shadows", "void", "abyss",
    "endless", "endlessnight", "endlesshorror", "trapped",
    "nowayout", "noescape", "hopeless", "despair", "desperation",
    "helpless", "helplessness", "powerless", "paralyzed",
    "frozen", "immobile", "speechless", "silent", "silence",
    "scream", "screams", "cry", "cries", "wail", "wails",
    "moan", "moans", "groan", "groans", "breath", "breathing",
    "heartbeat", "heartbeats", "pulse", "pulses", "chill",
    "cold", "freezing", "shiver", "shivering", "tremble",
    "trembling", "twitch", "twitching", "paranoia", "delirium",
    "hallucination", "hallucinations", "delusion", "delusions",
    "insanity", "madness", "crazed", "psychopath", "psychopathy",
    "sociopath", "sociopathy", "murderer", "serialkiller",
    "homicide", "bloodlust", "bloodthirsty", "sacrifice",
    "ritualistic", "occult", "cult", "cultist", "cultists",
    "witch", "witches", "warlock", "warlocks", "necromancer",
    "necromancy", "summoning", "summon", "summoned", "entity",
    "entities", "darkritual", "satanic", "demonic", "possession",
    "possessed", "exorcism", "exorcist", "evil", "evilspirit",
    "curse", "curses", "hex", "hexes", "pact", "deal",
    "soul", "souls", "damned", "damnation", "hell",
    "underworld", "afterlife", "purgatory", "limbo",
    "netherworld", "inferno", "abyss", "void", "nothingness",
    "oblivion", "death", "dying", "grave", "graveyard",
    "tomb", "crypt", "coffin", "skull", "bones",
    "skeleton", "corpse", "cadaver", "mummy",
    "zombie", "undead", "ghoul", "phantom",
    "ghost", "spirit", "apparition", "poltergeist",
    "wraith", "revenant", "haunted", "haunting",
    "haunt", "specter", "phantom", "supernatural",
    "unseen", "unknown", "mystery", "mysterious",
    "creepy", "eerie", "unsettling", "disturbing",
    "weird", "strange", "odd", "bizarre",
    "peculiar", "freak", "freaky", "monster",
    "beast", "fiend", "demon", "creature",
    "abomination", "mutant", "mutation",
    "experiment", "experiments", "lab", "laboratory",
    "science", "mad", "science", "scientist",
    "obsession", "obsessive", "stalker",
    "stalkers", "creep", "creeping",
    "lurker", "lurkers", "voyeur", "spy",
    "watcher", "watching", "eye", "eyes",
    "gaze", "stare", "glare", "peeking",
    "peeper", "peephole", "hidden",
    "secrets", "secret", "unseen",
    "invisible", "concealed", "shadows",
    "darkness", "cloaked", "masked",
    "veil", "veiled", "disguised",
    "identity", "unknown", "nameless",
    "faceless", "shadow", "shrouded",
    "lovecraft"
]

class WordSet {
    constructor(words) {
        this.words = new Map(words.map(word => [word, true]));
    }

    includes(word) {
        return this.words.has(word);
    }
}

const emoteKeywordMap = {
    "instruct": new WordSet(instructKeywords),
    "neutral": [],
    "sigh": [],
    "spooky": new WordSet(spookyKeywords),
    "thumb": new WordSet(thumbKeywords),
};