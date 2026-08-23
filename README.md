# DispaUK – Dispatch Headquarters

Static website for **DispaUK**, a MissionChief-focused dispatch HQ / business presence.

Built for **GitHub Pages**.

## Live Site

Once GitHub Pages is enabled: **https://winowongo2024.github.io/dispauk/**

## Setup (already done)

Repository created and files pushed. To enable GitHub Pages:

1. Go to https://github.com/WinoWongo2024/dispauk/settings/pages
2. Under **Source**, select Branch: `main`, Folder: `/ (root)`
3. Click Save

The site will be live at https://winowongo2024.github.io/dispauk/ within a minute or two.

## Customising

- **Branding** – Edit the logo text, hero title, and colours in `styles.css` (`--accent`, etc.).
- **Stations & Fleet** – Replace the placeholder tables and lists in `index.html` with your real MissionChief data.
- **Contact** – Add Discord, email, or Alliance links in the Contact section.
- **Live stats** – Later you can add a `data/stats.json` and load it from `script.js`, or use a small backend proxy for the unofficial MissionChief API endpoints.

## MissionChief Data Tips

While logged into MissionChief you can access:
- `https://www.missionchief.co.uk/api/buildings`
- `https://www.missionchief.co.uk/api/vehicles`

(Use the correct domain for your server.) These require a valid session. For a public static site the safest approach is to export the data occasionally and keep the HTML/JSON updated, or run a private proxy.

## Licence / Disclaimer

This site is an independent project. Not affiliated with SHPlay GmbH or the official MissionChief game.
