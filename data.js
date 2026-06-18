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
    vidNote: '⏳ Heads up — the embedded videos may take a little longer to load than expected. Give them a moment.',
    firsthint: '◄ ► ▲ ▼ &nbsp;move &nbsp;·&nbsp; <b>E</b> &nbsp;interact',
    photoHint: 'PHOTO MODE &nbsp;·&nbsp; <b>S</b> save &nbsp;·&nbsp; <b>P</b> exit',
    loader: 'initializing grid…', openProject: 'Open project ↗', overdrive: 'OVERDRIVE',
    arcadeHint: 'Arrows / WASD · Space · click or tap · Esc to leave', arcadeNote: 'Scores save locally. Beat your best.',
    mgScore: 'SCORE', mgBest: 'BEST', mgCrash: 'SYSTEM CRASH', mgLost: 'CONNECTION LOST', mgRetry: 'SPACE / TAP to retry'
  },
  tr: {
    hint: 'WASD / Oklar &nbsp;·&nbsp; <b>E</b> etkileşim', hire: '▸ BENİ İŞE AL',
    enter: 'Gir', talk: 'Konuş', board: 'Trene bin', toCity: 'şehre', outTown: 'şehir dışına', skip: 'yolculuğu geç',
    experience: 'Deneyim', education: 'Eğitim', software: 'Programlar', languages: 'Diller', role: 'Görev', client: 'Müşteri',
    contactTitle: 'Birlikte çalışalım', available: 'Freelance için müsait', emailMe: '✉️ Bana e-posta gönder',
    cvEN: '⤓ CV indir (EN)', cvTR: 'CV (TR)', cvENshort: 'CV (EN)',
    vidNote: '⏳ Not — gömülü videolar beklenenden biraz daha uzun yüklenebilir. Lütfen birkaç saniye bekleyin.',
    firsthint: '◄ ► ▲ ▼ &nbsp;hareket &nbsp;·&nbsp; <b>E</b> &nbsp;etkileşim',
    photoHint: 'FOTOĞRAF MODU &nbsp;·&nbsp; <b>S</b> kaydet &nbsp;·&nbsp; <b>P</b> çık',
    loader: 'şebeke başlatılıyor…', openProject: 'Projeyi aç ↗', overdrive: 'AŞIRI YÜK',
    arcadeHint: 'Oklar / WASD · Boşluk · tıkla/dokun · Esc ile çık', arcadeNote: 'Skorlar cihazda saklanır. Rekorunu geç.',
    mgScore: 'SKOR', mgBest: 'REKOR', mgCrash: 'SİSTEM ÇÖKTÜ', mgLost: 'BAĞLANTI KOPTU', mgRetry: 'BOŞLUK / DOKUN ile tekrar'
  }
};
// content-translation maps (TR)
const LEVELS_TR = { "Expert": "Uzman", "Advanced": "İleri", "Intermediate": "Orta", "Beginner–Int.": "Başlangıç–Orta" };
const LANGNAME_TR = { "Turkish": "Türkçe", "English": "İngilizce", "Spanish": "İspanyolca" };
const LANGLVL_TR = { "Native": "Anadil", "C1": "C1", "A1": "A1" };
const BLURBS_TR = {
  "Cinematography": "Sinematik işler — çekim, yönetim & renk.",
  "Video / Post": "Müşteriler için videografi & post-prodüksiyon.",
  "Photography": "Seçilmiş fotoğraflar.", "Graphic Design": "Grafik tasarım & kolaj."
};
const LABELS_TR = {
  "About Me": "Hakkımda", "Contact": "İletişim", "Cinematography": "Sinematografi",
  "Video / Post": "Video / Post-Prodüksiyon", "Photography": "Fotoğrafçılık", "Graphic Design": "Grafik Tasarım",
  "ARCADE · NEON RUNNER": "OYUN SALONU · NEON RUNNER", "ARCADE · DATA SNAKE": "OYUN SALONU · DATA SNAKE"
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
  skillsTR: [
    "Kamera Operatörlüğü (DSLR/Aynasız)", "Işıklama & Set", "Renk Grading",
    "Hikâye Anlatımı & Kurgu", "Post-Prodüksiyon", "İçerik (Reels/TikTok)"
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
  experienceTR: [
    { role: "Medya Departmanı Direktörü", org: "Çanakkale Koleji · Troy MUN", period: "Kas 2024 — Güncel",
      desc: "Yıllık Troy Model BM konferansının medya departmanını yönetiyorum — ekipman temini, mülakatla ekip seçimi ve yönetimi, ve bir hafta içinde çekilip kurgulanan, salonda canlı izletilen dört filmin yönetimi." },
    { role: "Videograf · Fotoğrafçı · Kurgu", org: "Vtopia Agency × Lagertha Coffee", period: "Mart 2026",
      desc: "Yeni açılan bir kahve dükkânı için tanıtım videoları, menü ve mekân fotoğrafçılığı; sosyal medya ve baskı menüye göre kurgu." },
    { role: "Videograf · Post-Prodüksiyon", org: "Cesimar Antika", period: "Ara 2025 — Şub 2026",
      desc: "Bir antika saat müzayede evi için marka algısını ve erişimini güçlendiren haftalık tanıtım filmleri." },
    { role: "Fotoğrafçı", org: "Cesimar Antika", period: "Ara 2025 — Şub 2026",
      desc: "Her müzayede öncesi gelen antika parçaların haftalık katalog fotoğrafçılığı." },
    { role: "3. Kamera Asistanı", org: '"İnci Taneleri" Dizisi · İstanbul', period: "Oca — Şub 2025",
      desc: "Profesyonel bir TV setinde staj — ekipman hazırlığı ve kamera departmanı iş akışı." }
  ],
  education: "B.A. Cinema & Digital Media — İzmir University of Economics (2022 — present)",
  educationTR: "Sinema ve Dijital Medya, Lisans — İzmir Ekonomi Üniversitesi (2022 — günümüz)",
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
  creditsTR: {
    "Cinematography|Hush Payment / Sus Payi (2026)": { role: "Görüntü Yönetmeni · Yönetmen · Renk", year: "2026" },
    "Video / Post|Cesimar Antika": { role: "Videograf · Post-Prodüksiyon", client: "Cesimar Antika · İzmir", year: "2025–2026", note: "Bir antika saat müzayede evi için haftalık tanıtım filmleri — marka algısını ve erişimini güçlendirmek için." },
    "Video / Post|Lagertha Coffee": { role: "Videograf · Fotoğrafçı · Kurgu", client: "Vtopia Agency × Lagertha Coffee · İzmir", year: "2026", note: "Yeni açılan bir kahve dükkânı için sosyal ve baskı odaklı tanıtım videoları." },
    "Video / Post|Canakkale College": { role: "Medya Direktörü", client: "Çanakkale Koleji · Troy MUN", year: "2024–güncel", note: "Bir hafta içinde çekilip kurgulanan, salonda canlı izletilen dört film." },
    "Photography|Lagertha Coffee": { role: "Fotoğrafçı", client: "Vtopia Agency × Lagertha Coffee", year: "2026", note: "Menü ve mekân fotoğrafçılığı." },
    "Photography|Cesimar Antika": { role: "Fotoğrafçı", client: "Cesimar Antika · İzmir", year: "2025–2026", note: "Gelen antika parçaların haftalık katalog fotoğrafçılığı." },
    "Graphic Design|Canakkale Collage": { role: "Grafik Tasarım", year: "2026", note: "Çanakkale kolaj / poster çalışması." }
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
      roleTR: "Tek Geliştirici",
      yearTR: "Soft-launch 2026 3. çeyrek",
      oneLinerTR: "Bir parayı sakla, bahsi koy — ve kaybeden gerçekten yemek ısmarlasın.",
      summaryTR: "2 oyunculu asenkron bir saklambaç / sosyal parti oyunu: bir oyuncu özelleştirilebilir bir yatak odasına sanal bir para saklar ve buna gerçek hayattan bir bahis koyar. Diğeri, süre bitmeden dokunmatik mini-bulmacalarla saklandığı yeri bulmak zorundadır — ve kaybeden bahsi gerçekten öder.",
      descriptionTR: `Deal n Drop, saklambacı gerçek dünyada hissettiğin sosyal bir bahse çeviriyor. A oyuncusu kendi elleriyle kurduğu yatak odasına bir para saklar, serbest metin ipuçları ve sinsi tuzaklar bırakır, sonra şartı koyar — "kaybeden yemek ısmarlar" — B oyuncusu ise yalnızca sıcak/soğuk bir titreşimle yön bularak, sis altında, her saklanma noktasını açmak için sekiz çeşit dokunmatik mini-bulmacayı çözer. İster hızlı bir Quick Play turunda ister 72 saatlik yavaş bir Long Deal'de olsun, kaybeden bahsi gerçekten yerine getirir — ve bu, her maçı arkadaşlarınla paylaştığın bir hikâyeye dönüştürür. Arka planda cilalı, çalışan bir free-to-play ürün var: Unity 6 ve canlı oturum senkronizasyonunu, özel bir Harita Yapıcı'yı, XP ilerlemesini, kozmetikleri ve bir Deal Pass sezon geçişini çalıştıran bir Firebase altyapısı — pay-to-win yok. Rol değişimli tam saklambaç döngüsü zaten yapıldı; soft launch hedefi Türkiye, ABD, İngiltere, Brezilya ve Almanya.`,
      detailsTR: [
        { label: "Tür", value: "2 oyunculu asenkron saklambaç / sosyal parti oyunu" },
        { label: "Platform", value: "iOS & Android (mobil)" },
        { label: "Motor", value: "Unity 6 (URP 2D) · Firebase altyapısı (canlı senkron, kimlik, bildirim)" },
        { label: "Stüdyo / Rol", value: "Tek geliştirici — Deniz Kaan Fener" },
        { label: "Mekanikler", value: "8 dokunmatik mini-bulmaca, tuzak süre cezaları, serbest ipuçları, yakınlık 'titreşimi', sis-altı arama" },
        { label: "Modlar", value: "Quick Play (10–60sn, 3 tur) · Long Deal (24/48/72s asenkron)" },
        { label: "Çok Oyunculu", value: "6 karakterli oda kodları, deep-link davetler, paylaşılabilir sonuç kartları" },
        { label: "İş Modeli", value: "Free-to-play, yalnızca kozmetik · Deal Pass sezon geçişi" },
        { label: "Pazarlar", value: "Türkiye, ABD, İngiltere, Brezilya, Almanya" },
        { label: "Durum", value: "Derin çalışan build · soft launch hedefi 2026 3. çeyrek" }
      ],
      tagsTR: ["Mobil", "Asenkron Çok Oyunculu", "Saklambaç", "Sosyal Parti", "Unity 6", "Firebase", "Free-to-Play", "Gerçek Bahis", "Harita Yapıcı"],
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
      roleTR: "Geliştirici · BNB — Beats and Breaks",
      yearTR: "Ön-prodüksiyon 2026",
      oneLinerTR: "İletişim fakültesi, ama her deadline ters gitmeye hazır bir komedi.",
      summaryTR: "Bir görsel romanı görevler ve mini-oyunlarla harmanlayan, sıradan akademik işlerin absürtleştiği bir anlatı komedisi. Amber kapüşonlu, boynunda kamerayla dolaşan, en kötü anda en yanlış şeyi söyleme yeteneğine sahip Pim'i oynuyorsun.",
      descriptionTR: `DEAD/LINE, bir iletişim fakültesinin kaosunu oynanabilir bir sitcom'a çeviriyor: hocalar görevler veriyor ve seninle bir sonraki deadline arasında yedi ayrı mini-oyun duruyor — Shoot Day'de ışık, oyuncu ve batarya yönetmek, Edit Race'te klipleri saate karşı sıralamak, Layer Rescue'da geri al olmadan katmanları çözmek ya da Stealth Hallway'de hocaların yanından sıvışmak. Şakaların altında sessizce samimi bir çekirdek var: 'Journey'nin duygusal çekimiyle 'The Stanley Parable' ruhundaki meta bir anlatıcının çarpışması — yani oyun, oyun olduğunun farkında ve seni de espriye ortak ediyor. Beş iç içe geçmiş istatistik — Not Ortalaması, Sosyal Güç, Enerji, Motivasyon ve Batarya — her seçimi anlamlı kılarken, Pim'in imzası olan patavatsızlık %15–25 ihtimalle söylenmeyecek şeyi söyleyip herhangi bir sahneyi raydan çıkarabiliyor. Tek bir son var, ama diyalog seçimlerin onun dokusunu ve tadını değiştiriyor; bu da 8–10 dakikalık sıkı ana akışı (tam bitiş için ~20 dakika) tekrar oynamayı ödüllendiriyor. Tamamen Türkçe seslendirilmiş, cilalı bir fakülte hayatı vitrini — bir portfolyo işinin broşür değil, sıcak ve keskin küçük bir oyun olabileceğinin kanıtı.`,
      detailsTR: [
        { label: "Tür", value: "Anlatı komedisi — görsel roman + görevler + mini-oyunlar" },
        { label: "Mekân", value: "Bir iletişim fakültesi (3. ve 4. sınıf öğrencileri)" },
        { label: "Platform", value: "PC · itch.io (ücretsiz, dilediğin kadar öde)" },
        { label: "Motor", value: "Unity 6 (URP 2D)" },
        { label: "Stüdyo", value: "BNB — Beats and Breaks" },
        { label: "Durum", value: "Ön-prodüksiyon (Mayıs 2026)" },
        { label: "Sanat Tarzı", value: "2D piksel sanat (32×32 karakter, 256×144 mekân), 'Boondocks' havası" },
        { label: "Seslendirme", value: "Tamamen Türkçe" },
        { label: "Süre", value: "8–10 dk ana akış · ~20 dk tam bitiş" },
        { label: "Sistemler", value: "5 istatistik (Not, Sosyal, Enerji, Motivasyon, Batarya) · 7 mini-oyun" }
      ],
      tagsTR: ["Görsel Roman", "Komedi", "Mini-Oyunlar", "Piksel Sanat", "Anlatı", "Öğrenci Hayatı", "Meta Anlatıcı", "Unity 6", "Türkçe Seslendirme"],
      link: ""
    }
  ]
};
