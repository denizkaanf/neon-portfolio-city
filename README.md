# Portfolio Town 🏘️

A 2D top-down walkable portfolio. Walk a character around a cozy town and
step into houses to view each project. Pure HTML/Canvas — **no build step,
no dependencies.** Just open `index.html`.

## Controls
- **Move:** WASD / Arrow keys (on-screen D-pad on touch devices)
- **Interact:** walk up to a house, press **E** (Space / Enter / tap also work)
- **Close panel:** Esc, ✕, or click outside

## How to make it yours
Edit **`data.js`** — it's the only file you need to touch:
- `name`, `role`, `tagline`, `bio`, `skills`, `contact`
- `galleries[]` — your real works (pulled from your myportfolio site).
  **Each gallery becomes a house.** Items are `{type:"image"|"video", src, caption}`.
  Media lives in `/assets/media/`.
- `projects[]` — your **games** (Deal n Drop, DEAD/LINE). Each becomes a house too.
  - `image`: drop a screenshot in `/assets`, then set `"image": "assets/foo.png"`
  - `link`: store page / itch.io / GitHub / live demo

Houses are generated automatically, in this order:
**About Me → galleries → games → Contact.**

### The media (downloaded from your site)
| file | section |
|------|---------|
| `reel_1.mp4`, `reel_2.mp4` | Cinematography (Power Relations, Hush Payment) |
| `cine_1..4.png` | Cinematography stills |
| `video_1..3.png` | Video/Post (Lagertha, Çanakkale College, Cesimar) |
| `photo_1..3` | Photography |
| `design_1.jpg` | Graphic Design (Çanakkale Collage) |

> Videos were downloaded at 1280px (~18 MB each). If you want higher quality,
> they're available up to 5K on the source — just ask.

## Deploy to GitHub Pages
1. Create a repo, push this folder.
2. Settings → Pages → Source: `main` / root.
3. Share the `username.github.io/repo` link.

(Also works as-is on itch.io: zip the folder, upload as an HTML5 game with
`index.html` as the entry point.)

## Files
| file | what it is |
|------|------------|
| `data.js`  | **your content** (edit this) |
| `index.html` / `style.css` | page shell + UI |
| `art.js`   | procedural sprites/tiles (swap for a real tileset later) |
| `game.js`  | engine: movement, camera, collision, interaction |
