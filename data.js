/* =====================================================================
   PORTFOLIO CONTENT  —  edit this file to change anything.
   ---------------------------------------------------------------------
   Two kinds of houses are generated:
     * galleries[]  -> your real works from denizkaanf.myportfolio.com
                       (images + videos, downloaded into /assets/media)
     * projects[]   -> your games (kept as you asked)
   Town layout: About -> galleries -> games -> Contact.
   ===================================================================== */

// ---- UI strings (EN / TR) — used by the 🌐 language toggle ----------
const STR = {
  en: {
    hint: 'WASD / Arrows &nbsp;·&nbsp; <b>E</b> interact', hire: '▸ HIRE ME',
    enter: 'Enter', talk: 'Talk', board: 'Board train', toCity: 'to the city', outTown: 'out of town', skip: 'skip ride',
    experience: 'Experience', education: 'Education', software: 'Software', languages: 'Languages', role: 'Role', client: 'Client',
    contactTitle: "Let's work together", available: 'Available for freelance', emailMe: '✉️ Email me',
    cvEN: '⤓ Download CV (EN)', cvTR: 'CV (TR)', cvENshort: 'CV (EN)',
    vidNote: '⏳ Heads up — the embedded videos may take a little longer to load than expected. Give them a moment.'
  },
  tr: {
    hint: 'WASD / Oklar &nbsp;·&nbsp; <b>E</b> etkileşim', hire: '▸ BENİ İŞE AL',
    enter: 'Gir', talk: 'Konuş', board: 'Trene bin', toCity: 'şehre', outTown: 'şehir dışına', skip: 'yolculuğu geç',
    experience: 'Deneyim', education: 'Eğitim', software: 'Programlar', languages: 'Diller', role: 'Görev', client: 'Müşteri',
    contactTitle: 'Birlikte çalışalım', available: 'Freelance için müsait', emailMe: '✉️ Bana e-posta gönder',
    cvEN: '⤓ CV indir (EN)', cvTR: 'CV (TR)', cvENshort: 'CV (EN)',
    vidNote: '⏳ Not — gömülü videolar beklenenden biraz daha uzun yüklenebilir. Lütfen birkaç saniye bekleyin.'
  }
};
const LABELS_TR = {
  "About Me": "Hakkımda", "Contact": "İletişim", "Cinematography": "Sinematografi",
  "Video / Post": "Video / Post-Prodüksiyon", "Photography": "Fotoğrafçılık", "Graphic Design": "Grafik Tasarım"
};

const PORTFOLIO = {
  name: "Deniz Kaan Fener",
  role: "Cinematographer · Videographer · Editor · Photographer",
  roleTR: "Görüntü Yönetmeni · Videograf · Kurgu · Fotoğrafçı",
  tagline: "Versatile visual storyteller — İzmir, Türkiye",
  taglineTR: "Çok yönlü görsel anlatıcı — İzmir, Türkiye",
  bio:
    "Third-year Cinema & Digital Media student at İzmir University of Economics. " +
    "I take my passion for cameras and filmmaking beyond the set — blending it " +
    "with social-media direction, content creation and editing to grow as a " +
    "versatile visual storyteller. Available for freelance.",
  bioTR:
    "İzmir Ekonomi Üniversitesi Sinema ve Dijital Medya 3. sınıf öğrencisiyim. " +
    "Kameraya ve filmmaking'e olan ilgimi yalnızca sinema setiyle sınırlı tutmuyor; " +
    "sosyal medya yöneticiliği, içerik üretimi ve kurgu işleriyle harmanlayarak " +
    "çok yönlü bir görsel anlatıcı olarak gelişiyorum. Freelance için müsaitim.",

  skills: [
    "Camera Operation (DSLR/Mirrorless)", "Lighting & Set", "Color Grading",
    "Storytelling & Editing", "Post-Production", "Content (Reels/TikTok)"
  ],

  experience: [
    { role: "Director of Media Department", org: "Çanakkale Koleji · Troy MUN", period: "Nov 2024 — Present",
      desc: "Lead the media department of the annual Troy Model UN — sourcing gear, recruiting & directing the crew, and producing four films shot + edited within one week, screened live to the assembly." },
    { role: "Videographer · Photographer · Editor", org: "Vtopia Agency × Lagertha Coffee", period: "Mar 2026",
      desc: "Promo videos plus menu & venue photography for a new coffee shop; edits tailored to social media and printed menu." },
    { role: "Videographer · Post-Production", org: "Cesimar Antika", period: "Dec 2025 — Feb 2026",
      desc: "Weekly promotional films for an antique-watch auction house to strengthen brand perception and reach." },
    { role: "Photographer", org: "Cesimar Antika", period: "Dec 2025 — Feb 2026",
      desc: "Weekly catalogue photography of incoming antique pieces ahead of each auction." },
    { role: "3rd Camera Assistant", org: '"İnci Taneleri" TV Series · İstanbul', period: "Jan — Feb 2025",
      desc: "Internship on a professional TV set — equipment prep and camera-department workflow." }
  ],
  education: "B.A. Cinema & Digital Media — İzmir University of Economics (2022 — present)",
  software: [
    { n: "DaVinci Resolve", l: "Expert" }, { n: "CapCut", l: "Expert" }, { n: "Canva", l: "Expert" },
    { n: "Photoshop", l: "Advanced" }, { n: "Premiere Pro", l: "Intermediate" },
    { n: "Lightroom", l: "Intermediate" }, { n: "Audition", l: "Beginner–Int." }
  ],
  languages: [
    { n: "Turkish", l: "Native" }, { n: "English", l: "C1" }, { n: "Spanish", l: "A1" }
  ],

  contact: {
    email: "denizkaanyt2@gmail.com",
    phone: "+90 542 135 42 28",
    portfolio: "https://denizkaanf.myportfolio.com",
    instagram: "https://instagram.com/denizkaanf",
    linkedin: "https://www.linkedin.com/in/deniz-kaan-8163b0336",
    location: "İzmir, Türkiye",
    cvEN: "assets/cv_en.pdf",
    cvTR: "assets/cv_tr.pdf"
  },

  // ---- per-project credits (keyed "Category|Group name") ------------
  credits: {
    "Cinematography|Hush Payment / Sus Payi (2026)": { role: "Cinematographer · Director · Color", year: "2026" },
    "Video / Post|Cesimar Antika": { role: "Videographer · Post-Production", client: "Cesimar Antika · İzmir", year: "2025–2026", note: "Weekly promotional films for an antique-watch auction house — built to strengthen brand perception and reach." },
    "Video / Post|Lagertha Coffee": { role: "Videographer · Photographer · Editor", client: "Vtopia Agency × Lagertha Coffee · İzmir", year: "2026", note: "Promo videos for a newly opened coffee shop, cut for social and print." },
    "Video / Post|Canakkale College": { role: "Director of Media", client: "Çanakkale Koleji · Troy MUN", year: "2024–present", note: "Four films shot & edited within one week, screened live to the assembly." },
    "Photography|Lagertha Coffee": { role: "Photographer", client: "Vtopia Agency × Lagertha Coffee", year: "2026", note: "Menu & venue photography." },
    "Photography|Cesimar Antika": { role: "Photographer", client: "Cesimar Antika · İzmir", year: "2025–2026", note: "Weekly catalogue photography of incoming antique pieces." },
    "Graphic Design|Canakkale Collage": { role: "Graphic Design", year: "2026", note: "Çanakkale collage / poster work." }
  },

  // ---- REAL WORKS FROM YOUR SITE ---------------------------------
  // The full gallery list (44 images + 2 video reels) is auto-generated
  // into galleries.js from denizkaanf.myportfolio.com. Each entry there
  // = one house, with per-project sub-groups. Edit galleries.js to tweak.
  galleries: (typeof GALLERIES !== "undefined") ? GALLERIES : [],

  // ---- GAMES (procedural "key art" figures stand in for screenshots) --
  projects: [
    {
      title: "Deal n Drop",
      role: "Solo Developer",
      year: "Soft-launch Q3 2026",
      figure: "dealndrop",
      oneLiner: "Hide a coin, name the stake — and the loser actually buys lunch.",
      summary: "A 2-player asynchronous hide-and-seek party game: one player buries a virtual coin in a customizable bedroom and stakes a real-life dare on it. The other has to crack the hiding spot through tactile micro-puzzles before the timer dies — and the loser pays up for real.",
      description: `Deal n Drop turns hide-and-seek into a social wager you can feel in the real world. Player A tucks a coin somewhere inside their own hand-built bedroom, drops freeform clues and sneaky decoys, then sets the terms — "loser buys lunch" — while Player B hunts under fog-of-war with only a hotter/colder rattle to guide them, solving eight kinds of tactile micro-puzzles to pry open each hiding spot. Whether it plays out in a frantic Quick Play round or a slow-burn 72-hour Long Deal, the loser actually has to make good on the dare, which turns every match into a story you share with friends via result cards. Under the hood it's a polished, working free-to-play product — Unity 6 and a Firebase backend powering live session sync, a custom Map Builder, XP progression, cosmetics, and a Deal Pass season pass, with no pay-to-win. The full hide/seek loop with role alternation is already in the build, with a soft launch targeted across Turkey, the USA, UK, Brazil, and Germany.`,
      details: [
        { label: "Genre", value: "2-player asynchronous hide-and-seek / social party game" },
        { label: "Platform", value: "iOS & Android (mobile)" },
        { label: "Engine", value: "Unity 6 (URP 2D) · Firebase backend (realtime sync, auth, push)" },
        { label: "Studio / Role", value: "Solo developer — Deniz Kaan Fener" },
        { label: "Mechanics", value: "8 tactile micro-puzzles, decoy time penalties, freeform clues, proximity 'rattle', fog-of-war search" },
        { label: "Modes", value: "Quick Play (10–60s, 3 rounds) · Long Deal (24/48/72h async)" },
        { label: "Multiplayer", value: "6-character room codes, deep-link invites, shareable result cards" },
        { label: "Business", value: "Free-to-play, cosmetics-only · Deal Pass season pass" },
        { label: "Markets", value: "Turkey, USA, UK, Brazil, Germany" },
        { label: "Status", value: "Deep working build · soft-launch target Q3 2026" }
      ],
      tags: ["Mobile", "Async Multiplayer", "Hide-and-Seek", "Social Party", "Unity 6", "Firebase", "Free-to-Play", "Real-Life Stakes", "Map Builder"],
      link: ""
    },
    {
      title: "DEAD/LINE",
      role: "Developer · BNB — Beats and Breaks",
      year: "Pre-production 2026",
      figure: "deadline",
      oneLiner: "Communications school, but every deadline is a comedy waiting to go wrong.",
      summary: "A narrative comedy that fuses a visual novel with quests and mini-games, following communications students whose ordinary academic tasks spiral into absurdity. You play Pim, an amber-hooded camera kid with a talent for blurting exactly the wrong thing at the worst moment.",
      description: `DEAD/LINE turns the chaos of a communications faculty into a playable sitcom, where instructors hand out quests and seven distinct mini-games stand between you and the next deadline — wrangling lights, actors, and battery on Shoot Day, racing the clock to order clips on Edit Race, threading layers with no undo in Layer Rescue, or sneaking past faculty in the Stealth Hallway. Underneath the jokes sits a quietly sincere core: the wide-eyed emotional pull of 'Journey' colliding with a meta narrator in the mischievous spirit of 'The Stanley Parable', so the game knows it's a game and lets you in on the joke. Five interlocking stats — GPA, Social Power, Energy, Motivation, and Battery — keep every choice meaningful, while Pim's signature tactlessness means a careless 15–25% chance of saying the unsayable can derail any scene. There's a single ending, but your dialogue choices reshape its texture and flavour, rewarding replays of a tight 8–10 minute main flow that stretches to roughly 20 minutes for full completion. It's a polished, fully Turkish-voiced showcase of faculty life — proof a portfolio piece can be a warm, sharp little game rather than a brochure.`,
      details: [
        { label: "Genre", value: "Narrative comedy — visual novel + quests + mini-games" },
        { label: "Setting", value: "A communications faculty (3rd- & 4th-year students)" },
        { label: "Platform", value: "PC · itch.io (free, pay-what-you-want)" },
        { label: "Engine", value: "Unity 6 (URP 2D)" },
        { label: "Studio", value: "BNB — Beats and Breaks" },
        { label: "Status", value: "Pre-production (May 2026)" },
        { label: "Art Style", value: "2D pixel art (32×32 characters, 256×144 locations), 'Boondocks' feel" },
        { label: "Voice Acting", value: "Fully Turkish" },
        { label: "Length", value: "8–10 min main flow · ~20 min full completion" },
        { label: "Systems", value: "5 stats (GPA, Social, Energy, Motivation, Battery) · 7 mini-games" }
      ],
      tags: ["Visual Novel", "Comedy", "Mini-Games", "Pixel Art", "Narrative", "Student Life", "Meta Narrator", "Unity 6", "Turkish VA"],
      link: ""
    }
  ]
};
