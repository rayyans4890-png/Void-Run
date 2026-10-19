## Void run 
This is a 2D shooting browser game made for the stardance event, this project was made by Rayyan Shahid. I am proud of this project honestly though making a browser game is easier then i thought, for this game i have chosen the theme of the player being in a space ship and he has to shoot at aliens coming at him.

## Bullet points

# HTML (index.html)

- Semantic single-page layout: Header (brand, sound/fullscreen) → Main game section (canvas + HUD + 3 menus) → Footer (enemy guide)
- Four menu states via [hidden]: Start (#menu), Game Over (#result-menu), Pause (#pause-menu), running (none visible)
- HUD split left/right: Score + 5-segment hull meter left; best score, wave, pause button right
- Full ARIA: Canvas labeled, health meter uses role="meter", live region for announcements, touch fire button labeled

# CSS (style.css)

- CSS custom properties for theming: --bg, --panel, --line, --text, --muted, --orange, --blue — dark space palette
- State-driven visibility via .game-shell classes: .running hides menus, .paused/.over dims canvas, .running .fire shows mobile button
- Fluid responsive layout: .page max 1180px, .game-shell 16:9 desktop / 5:7 mobile, HUD absolute overlay with clamp() gaps
- Reduced motion support: prefers-reduced-motion disables all transitions instantly

# JavaScript (game.js)

- IIFE + state machine: menu → running ↔ paused → over → menu; single game object holds all runtime state
- Fixed 960×540 logical resolution: Scaled via setTransform; delta-time physics capped at 35ms/frame
- Three procedural enemy types: Drifter (base), Stinger (wave 2+, sine drift), Brute (wave 4+, 7 HP); spawn rate ↑ every 25s wave
- Unified input → update → render loop: Keys Set + touchTarget + fireHeld drive player; bullets/enemies filtered each frame; localStorage persists best 

# Gameplay pics 
  
  <img width="1885" height="897" alt="image" src="https://github.com/user-attachments/assets/fdee310e-5e1a-4edb-9f5c-ede262cb0b47" />

  <img width="1896" height="892" alt="image" src="https://github.com/user-attachments/assets/4fcb6348-07b6-4b50-8211-86b1b62c0d3f" />

  <img width="1907" height="912" alt="image" src="https://github.com/user-attachments/assets/ad161286-503a-4279-84b0-2ad0b60302b0" />
