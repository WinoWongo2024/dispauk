# DispaUK – Dispatch Headquarters

Static website for **DispaUK** — independent UK emergency dispatch HQ presence, integrated with MissionChief data.

**Live site:** https://dispauk.co.uk

## Stack

- GitHub Pages (static HTML/CSS/JS)
- Custom domain: `dispauk.co.uk`
- MissionChief data sync via GitHub Actions → `data/stats.json`
- No frontend secrets (session cookie lives only in Actions secrets)

## GitHub Actions sync

Workflow: `.github/workflows/sync-missionchief.yml`

- Uses `actions/checkout@v6` (Node 24)
- Secret required: `MISSIONCHIEF_SESSION`
  - Format: `_session_id=YOUR_VALUE`
- Runs every 6 hours + manual `workflow_dispatch`
- Writes public `data/stats.json` (no cookie in repo)

If the sync fails with HTTP 401/403, refresh the MissionChief session cookie and update the secret.

## Local structure

```
/
  index.html          Homepage
  styles.css
  script.js           Nav, cookie banner, loads /data/stats.json
  404.html
  data/stats.json     Public station/unit summary (Action-updated)
  privacy/ cookies/ terms/ legal/ accessibility/
```

## Notes

- Nav links to `/about/`, `/operations/`, etc. need dedicated pages (currently 404 except legal pages).
- Homepage operations table fills from `data/stats.json` when the Action succeeds.
- Not affiliated with SHPlay GmbH or MissionChief.
