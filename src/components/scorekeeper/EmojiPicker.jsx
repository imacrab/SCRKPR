import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import FluentEmoji from "./FluentEmoji";

// Each entry: [emoji, "space-separated keywords for fuzzy search"]
// Keywords include synonyms + related concepts so users can find "like-kind" matches.
export const PLAYER_EMOJI_LIBRARY = [
  // Smileys
  ["😀", "grin smile happy face joy"],
  ["😃", "smile happy face joy grin big eyes"],
  ["😄", "smile happy face joy laugh"],
  ["😁", "beam smile happy grin teeth"],
  ["😆", "laugh haha squint happy"],
  ["😅", "sweat smile nervous laugh"],
  ["🤣", "rofl rolling laugh haha funny"],
  ["😂", "joy tears laugh cry funny haha"],
  ["🙂", "smile slight happy"],
  ["🙃", "upside down silly goofy"],
  ["😉", "wink flirt cheeky"],
  ["😊", "smile blush happy nice"],
  ["😇", "angel halo innocent holy"],
  ["🥰", "love hearts smile crush adore"],
  ["😍", "love heart eyes crush adore"],
  ["🤩", "star struck wow excited cool"],
  ["😘", "kiss love heart"],
  ["😋", "yum tasty food delicious"],
  ["😎", "cool sunglasses shades chill swag boss"],
  ["🤓", "nerd geek smart glasses study"],
  ["🥳", "party celebrate birthday hat"],
  ["😏", "smirk sly mischievous"],
  ["😬", "grimace awkward yikes teeth"],
  ["🤔", "think hmm wonder ponder"],
  ["🤨", "raised eyebrow suspicious doubt"],
  ["🙄", "eye roll whatever annoyed"],
  ["😴", "sleep tired bed zzz"],
  ["🤯", "mind blown explode shocked"],
  ["🥶", "cold freeze ice"],
  ["🥵", "hot heat sweat fire"],
  ["😡", "angry mad rage furious"],
  ["🤬", "swear curse angry mad"],
  ["😈", "devil evil mischief naughty horns"],
  ["👿", "imp devil angry"],
  ["💀", "skull death dead bones"],
  ["☠️", "skull crossbones death pirate poison"],
  ["👻", "ghost spooky boo halloween"],
  ["👽", "alien ufo space ET"],
  ["👾", "alien invader game pixel arcade"],
  ["🤖", "robot bot mech ai tech"],
  ["🤡", "clown silly joker funny circus"],
  ["💩", "poop poo funny"],

  // People / hands
  ["👑", "crown king queen royal winner boss"],
  ["🎩", "hat top tophat magic gentleman"],
  ["🧙", "wizard mage magic spell"],
  ["🧛", "vampire dracula spooky halloween"],
  ["🧟", "zombie dead halloween"],
  ["🧞", "genie wish lamp"],
  ["🥷", "ninja stealth fight sneaky"],
  ["🦸", "hero superhero powerful cape"],
  ["🦹", "villain evil supervillain"],
  ["🤠", "cowboy hat western"],
  ["💪", "muscle strong flex gym power"],
  ["🙌", "hands praise yay celebrate"],
  ["🤝", "handshake deal partner agree"],
  ["✌️", "peace victory hand"],
  ["👍", "thumbs up like good yes ok"],
  ["👎", "thumbs down dislike bad no"],
  ["👊", "fist punch bump"],
  ["✊", "fist power solidarity"],
  ["🫶", "heart hands love"],

  // Animals
  ["🐶", "dog puppy pet animal"],
  ["🐱", "cat kitten kitty pet animal"],
  ["🐭", "mouse mice rodent"],
  ["🐹", "hamster rodent pet"],
  ["🐰", "rabbit bunny easter pet"],
  ["🦊", "fox sly clever orange"],
  ["🐻", "bear animal"],
  ["🐼", "panda bear cute"],
  ["🐻‍❄️", "polar bear ice cold"],
  ["🐨", "koala animal"],
  ["🐯", "tiger animal stripes wild"],
  ["🦁", "lion king wild animal mane"],
  ["🐮", "cow farm moo animal"],
  ["🐷", "pig farm animal oink"],
  ["🐸", "frog amphibian green hop"],
  ["🐵", "monkey ape animal"],
  ["🙈", "monkey see no evil"],
  ["🐔", "chicken bird farm"],
  ["🐧", "penguin bird cold antarctic"],
  ["🐦", "bird animal fly"],
  ["🦆", "duck bird pond quack"],
  ["🦅", "eagle bird hawk fly"],
  ["🦉", "owl bird wise night"],
  ["🦇", "bat fly night halloween"],
  ["🐺", "wolf animal wild howl"],
  ["🐗", "boar pig wild"],
  ["🐴", "horse animal"],
  ["🦄", "unicorn magic horn rainbow fantasy"],
  ["🐝", "bee buzz honey insect"],
  ["🦋", "butterfly insect wings pretty"],
  ["🐌", "snail slow shell"],
  ["🐞", "ladybug bug insect"],
  ["🐢", "turtle slow shell tortoise"],
  ["🐍", "snake reptile slither"],
  ["🦎", "lizard reptile gecko"],
  ["🦖", "trex dinosaur prehistoric"],
  ["🦕", "sauropod dinosaur prehistoric"],
  ["🐙", "octopus tentacle sea"],
  ["🦑", "squid sea ocean"],
  ["🦀", "crab sea ocean shell"],
  ["🦞", "lobster sea ocean"],
  ["🦐", "shrimp sea ocean"],
  ["🐠", "fish tropical sea ocean"],
  ["🐟", "fish sea ocean"],
  ["🐬", "dolphin sea ocean"],
  ["🐳", "whale sea ocean"],
  ["🦈", "shark sea ocean teeth"],
  ["🐊", "crocodile alligator reptile"],
  ["🐅", "tiger animal wild"],
  ["🐆", "leopard cheetah animal wild fast"],
  ["🦓", "zebra animal stripes"],
  ["🦒", "giraffe animal tall"],
  ["🦌", "deer animal antlers"],
  ["🐘", "elephant animal big"],
  ["🦛", "hippo hippopotamus animal"],
  ["🦏", "rhino animal horn"],
  ["🐫", "camel desert animal"],
  ["🐎", "horse race animal"],
  ["🐩", "poodle dog animal"],

  // Nature / plants
  ["🌵", "cactus desert plant"],
  ["🌲", "tree evergreen forest pine"],
  ["🌴", "palm tree tropical beach"],
  ["🌳", "tree forest leaves"],
  ["🌱", "seedling plant grow"],
  ["🍀", "clover lucky shamrock four leaf"],
  ["🌸", "blossom flower pink sakura"],
  ["🌺", "flower hibiscus tropical"],
  ["🌻", "sunflower flower yellow"],
  ["🌷", "tulip flower"],
  ["🌹", "rose flower love romance"],
  ["💐", "bouquet flowers"],
  ["🍄", "mushroom toadstool fungus"],

  // Sky / weather
  ["☀️", "sun sunny bright day"],
  ["🌙", "moon night crescent"],
  ["⭐", "star shine"],
  ["🌟", "sparkle star glowing magic"],
  ["✨", "sparkles magic shine"],
  ["💫", "dizzy star spin"],
  ["⚡", "lightning bolt flash zap fast"],
  ["🔥", "fire flame hot lit"],
  ["💥", "explosion boom collision"],
  ["☄️", "comet space meteor"],
  ["🌈", "rainbow pride colors"],
  ["❄️", "snowflake cold winter ice"],
  ["💧", "drop water tear"],
  ["🌊", "wave ocean sea water"],

  // Food
  ["🍕", "pizza food slice italian"],
  ["🍔", "burger hamburger food"],
  ["🍟", "fries chips food"],
  ["🌭", "hotdog food"],
  ["🌮", "taco food mexican"],
  ["🌯", "burrito food mexican wrap"],
  ["🥗", "salad food healthy"],
  ["🍣", "sushi food japanese"],
  ["🍜", "ramen noodles food japanese"],
  ["🍱", "bento food japanese"],
  ["🍩", "donut doughnut food sweet"],
  ["🍪", "cookie food sweet"],
  ["🍰", "cake slice food sweet birthday"],
  ["🎂", "birthday cake food sweet"],
  ["🍫", "chocolate food sweet"],
  ["🍦", "ice cream food sweet"],
  ["🍭", "lollipop candy sweet"],
  ["🍎", "apple fruit red"],
  ["🍊", "orange fruit citrus"],
  ["🍋", "lemon fruit citrus"],
  ["🍌", "banana fruit yellow"],
  ["🍉", "watermelon fruit"],
  ["🍇", "grapes fruit"],
  ["🍓", "strawberry fruit"],
  ["🥑", "avocado fruit food"],
  ["☕", "coffee drink hot caffeine"],
  ["🍵", "tea drink hot"],
  ["🍺", "beer drink alcohol"],
  ["🍷", "wine drink alcohol"],
  ["🥂", "champagne celebrate cheers"],
  ["🍾", "champagne bottle celebrate"],

  // Sports / games
  ["⚽", "soccer football ball sport"],
  ["🏀", "basketball ball sport"],
  ["🏈", "football american ball sport"],
  ["⚾", "baseball ball sport"],
  ["🎾", "tennis ball sport"],
  ["🏐", "volleyball ball sport"],
  ["🏓", "ping pong table tennis sport"],
  ["🏸", "badminton sport"],
  ["🥊", "boxing glove fight sport"],
  ["🎯", "dart bullseye target aim"],
  ["🎲", "dice game roll"],
  ["🃏", "joker card game playing"],
  ["♠️", "spade card suit"],
  ["♥️", "heart card suit love"],
  ["♦️", "diamond card suit"],
  ["♣️", "club card suit clover"],
  ["🎮", "controller game video gaming"],
  ["🕹️", "joystick arcade game"],
  ["🎳", "bowling sport"],
  ["♟️", "chess pawn game strategy"],
  ["🧩", "puzzle jigsaw"],
  ["🏆", "trophy winner champion award gold"],
  ["🥇", "gold medal first winner"],
  ["🥈", "silver medal second"],
  ["🥉", "bronze medal third"],
  ["🏅", "medal award winner"],

  // Vehicles / travel
  ["🚀", "rocket space launch fast"],
  ["✈️", "airplane plane travel fly"],
  ["🚗", "car drive"],
  ["🚙", "suv car drive"],
  ["🏎️", "race car fast"],
  ["🚓", "police car cop"],
  ["🚑", "ambulance medical"],
  ["🚒", "fire truck"],
  ["🚕", "taxi cab"],
  ["🚌", "bus"],
  ["🏍️", "motorcycle bike"],
  ["🚲", "bicycle bike"],
  ["🛵", "scooter moped"],
  ["⛵", "sailboat boat sail sea"],
  ["🚤", "speedboat boat"],
  ["🛶", "canoe boat paddle"],
  ["⚓", "anchor boat navy sea"],
  ["🛸", "ufo flying saucer alien"],
  ["🚁", "helicopter fly"],

  // Symbols / objects
  ["💎", "diamond gem jewel rich"],
  ["⚔️", "swords fight battle cross"],
  ["🛡️", "shield defense protect"],
  ["🗡️", "dagger sword weapon"],
  ["🏹", "bow arrow archery"],
  ["🔫", "water gun pistol"],
  ["💣", "bomb explode"],
  ["🧨", "dynamite explosive boom"],
  ["🔮", "crystal ball magic fortune"],
  ["🎨", "art palette paint creative"],
  ["🎸", "guitar music rock"],
  ["🎹", "piano music keys"],
  ["🎺", "trumpet music brass"],
  ["🎤", "microphone mic sing music"],
  ["🎧", "headphones music audio"],
  ["🎵", "music note song"],
  ["🎶", "music notes song"],
  ["📚", "books read study learn"],
  ["💼", "briefcase work business job"],
  ["💰", "money bag rich cash"],
  ["💵", "money cash dollar"],
  ["💸", "money flying spend"],
  ["💯", "hundred perfect score"],
  ["✅", "check mark yes correct done"],
  ["❌", "cross x no wrong"],
  ["⛔", "no entry stop forbidden"],
  ["💯", "perfect hundred score"],
  ["❤️", "heart love red"],
  ["🧡", "heart love orange"],
  ["💛", "heart love yellow"],
  ["💚", "heart love green"],
  ["💙", "heart love blue"],
  ["💜", "heart love purple"],
  ["🖤", "heart love black"],
  ["🤍", "heart love white"],
  ["🤎", "heart love brown"],
  ["💖", "sparkle heart love"],
  ["💔", "broken heart sad"],
  ["🎁", "gift present box birthday"],
  ["🎈", "balloon party celebrate"],
  ["🎉", "party popper celebrate confetti"],
  ["🎊", "confetti ball celebrate party"],
];

// Build the simple emoji list for back-compat callers.
export const PLAYER_EMOJIS = PLAYER_EMOJI_LIBRARY.map(([e]) => e);

function matchesQuery(keywords, q) {
  if (!q) return true;
  const haystack = keywords.toLowerCase();
  // tokenize query; every token must be found as a substring in the keywords
  const tokens = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

export default function EmojiPicker({ selected, onChange }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return PLAYER_EMOJI_LIBRARY;
    return PLAYER_EMOJI_LIBRARY.filter(([, kws]) => matchesQuery(kws, query));
  }, [query]);

  return (
    <div className="flex flex-col">
      {/* Search */}
      <div className="relative px-3 pt-1 pb-2">
        <Search
          size={16}
          strokeWidth={2}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emojis"
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          style={{ fontSize: "16px" }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2 p-3 justify-items-center">
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onChange(""); }}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-muted-foreground text-xs font-medium transition-transform active:scale-90"
          style={{ outline: !selected ? "2px solid white" : "none", outlineOffset: "2px" }}
          aria-label="No emoji"
        >
          None
        </button>
        {filtered.map(([emoji]) => (
          <button
            key={emoji}
            type="button"
            onPointerDown={(e) => { e.preventDefault(); onChange(emoji); }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ outline: selected === emoji ? "2px solid white" : "none", outlineOffset: "2px" }}
          >
            <motion.span
              animate={selected === emoji ? { scale: [1, 1.35, 1], rotate: [0, -10, 10, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="flex"
            >
              <FluentEmoji emoji={emoji} size={28} />
            </motion.span>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-7 py-6 text-center text-sm text-muted-foreground">
            No emojis match "{query}"
          </div>
        )}
      </div>
    </div>
  );
}