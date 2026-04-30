// 16-result archetype lookup table.
// Each entry: name (the reveal headline), tagline (1-line vibe),
// description (2 sentences for the result card),
// strengths (3 bullets, used downstream by AI strategy generation).

export type ArchetypeKey =
  // Sage family ── teaches, explains, guides through ideas
  | "visionary" | "mentor" | "edutainer" | "sage"
  // Ruler family ── leads, sets the tone, builds authority
  | "champion" | "guide" | "maverick" | "visionary_lead"
  // Rebel family ── challenges, says the unsaid, breaks rules
  | "activist" | "truth_teller" | "provocateur" | "disruptor"
  // Caregiver family ── relates, supports, makes people feel seen
  | "encourager" | "confidant" | "best_friend" | "healer";

export interface Archetype {
  key: ArchetypeKey;
  name: string;
  tagline: string;
  description: string;
  strengths: [string, string, string];
  // Hex pair used for the result-card gradient
  gradient: [string, string];
}

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  // ── Sage family ────────────────────────────────────────────────────────────
  visionary: {
    key: "visionary",
    name: "The Visionary",
    tagline: "You teach what's coming next.",
    description:
      "You don't just explain things — you point people toward what they should be paying attention to. Your audience trusts you to be early.",
    strengths: ["Frames trends before others see them", "Makes complex ideas feel obvious", "Earns trust through clarity"],
    gradient: ["#7C3AED", "#FB7185"],
  },
  mentor: {
    key: "mentor",
    name: "The Mentor",
    tagline: "You meet people where they are.",
    description:
      "Your content lands because you remember what it's like to not know yet. People feel guided, not lectured.",
    strengths: ["Empathy first, expertise second", "Patient, structured teaching", "Audience grows with you"],
    gradient: ["#5B21B6", "#FBA68A"],
  },
  edutainer: {
    key: "edutainer",
    name: "The Edutainer",
    tagline: "You make people learn while they laugh.",
    description:
      "You wrap real lessons inside stuff that's actually fun to watch. Your audience binge-watches and somehow comes out smarter.",
    strengths: ["Hook, then teach", "Memorable through humor", "Reach beyond your niche"],
    gradient: ["#7C3AED", "#FACC15"],
  },
  sage: {
    key: "sage",
    name: "The Sage",
    tagline: "You change how people see the world.",
    description:
      "Your content reframes things people thought they already understood. Followers leave thinking differently than they came in.",
    strengths: ["Deep, distilled insights", "Reframes the obvious", "Builds long-term authority"],
    gradient: ["#312E81", "#FB7185"],
  },

  // ── Ruler family ───────────────────────────────────────────────────────────
  champion: {
    key: "champion",
    name: "The Champion",
    tagline: "You set the bar and rally people to it.",
    description:
      "You lead with conviction. Your audience follows because you raise the standard and prove it's reachable.",
    strengths: ["Sets ambitious standards", "Proves it works on yourself first", "Inspires action, not just admiration"],
    gradient: ["#5B21B6", "#FB923C"],
  },
  guide: {
    key: "guide",
    name: "The Guide",
    tagline: "You lead with empathy.",
    description:
      "You take your audience by the hand and walk them through the steps. They follow because you've built trust.",
    strengths: ["Trustworthy authority", "Step-by-step clarity", "High follow-through rates"],
    gradient: ["#5B21B6", "#FCA5A5"],
  },
  maverick: {
    key: "maverick",
    name: "The Maverick",
    tagline: "You command the room with confidence and humor.",
    description:
      "You lead but you're not stiff about it. People follow because being around your content feels good.",
    strengths: ["Authority without ego", "Charisma that scales", "Loyal audience"],
    gradient: ["#7C3AED", "#FB7185"],
  },
  visionary_lead: {
    key: "visionary_lead",
    name: "The Vanguard",
    tagline: "You don't just lead — you reshape what's possible.",
    description:
      "Your audience didn't know they wanted what you're showing them until you showed them. You're early on purpose.",
    strengths: ["Defines new categories", "Bold positioning", "Cult-like audience loyalty"],
    gradient: ["#312E81", "#FBA68A"],
  },

  // ── Rebel family ───────────────────────────────────────────────────────────
  activist: {
    key: "activist",
    name: "The Activist",
    tagline: "You call out what's broken.",
    description:
      "You name the thing nobody else will. People rally because you're saying what they've been thinking.",
    strengths: ["Strong point of view", "Polarizing on purpose", "Movement-building energy"],
    gradient: ["#BE185D", "#FB923C"],
  },
  truth_teller: {
    key: "truth_teller",
    name: "The Truth Teller",
    tagline: "You say the quiet things out loud.",
    description:
      "Your audience feels seen because you put words on the things they didn't know how to say. You're brave for them.",
    strengths: ["Validates lived experience", "Fearless honesty", "Comments are full of 'this is me'"],
    gradient: ["#7C3AED", "#FCA5A5"],
  },
  provocateur: {
    key: "provocateur",
    name: "The Provocateur",
    tagline: "You poke at conventions until they break.",
    description:
      "You turn the obvious upside down and make it funny on the way. Your content gets shared because it's just too good not to.",
    strengths: ["Viral by design", "Sharp wit", "Cultural relevance"],
    gradient: ["#BE185D", "#FACC15"],
  },
  disruptor: {
    key: "disruptor",
    name: "The Disruptor",
    tagline: "You shake up the rules and rebuild the playbook.",
    description:
      "You're not here to fit in. You're here to flip the table — and show people what's possible after.",
    strengths: ["Defines the counter-narrative", "Magnetic conviction", "Attracts the bold"],
    gradient: ["#312E81", "#FB7185"],
  },

  // ── Caregiver family ──────────────────────────────────────────────────────
  encourager: {
    key: "encourager",
    name: "The Encourager",
    tagline: "You make people believe they can actually do this.",
    description:
      "Your content lifts people. They leave feeling capable, not overwhelmed.",
    strengths: ["High emotional resonance", "Conversion through belief", "Fierce loyalty"],
    gradient: ["#FB7185", "#FACC15"],
  },
  confidant: {
    key: "confidant",
    name: "The Confidant",
    tagline: "You're the friend they didn't know they needed.",
    description:
      "Your audience shows up because being in your world feels safe. They tell their real stuff in your DMs.",
    strengths: ["Deep parasocial trust", "Long viewer retention", "Strong DM-to-customer flow"],
    gradient: ["#FB7185", "#FBA68A"],
  },
  best_friend: {
    key: "best_friend",
    name: "The Best Friend",
    tagline: "You make everything feel doable.",
    description:
      "You're relatable on purpose. Your audience feels like they're hanging out with you, not consuming content.",
    strengths: ["Effortless authenticity", "High share rate within friend groups", "Sticky community"],
    gradient: ["#FB7185", "#FCA5A5"],
  },
  healer: {
    key: "healer",
    name: "The Healer",
    tagline: "You help people transform from the inside out.",
    description:
      "Your audience comes to you in pain and leaves with a path forward. Your work goes deep.",
    strengths: ["Trust at the highest tier", "Transformation-tier offers", "Audience commits long-term"],
    gradient: ["#5B21B6", "#FB7185"],
  },
};
