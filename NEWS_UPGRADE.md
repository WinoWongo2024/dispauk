# DispaUK News upgrade

BBC-style news system with operational detail, versioning, filters and homepage ticker.

## Files to deploy (overwrite on repo root)

| Path | Action |
|------|--------|
| `styles.css` | Replace (news styles appended) |
| `index.html` | Replace (adds Live ticker + News nav link if missing) |
| `news/index.html` | Replace — card grid listing + search/filters |
| `news/story.html` | **New** — full article page |
| `admin/index.html` | Replace — extended form + version history on edit |
| `data/news.json` | Replace — existing stories enriched with new fields |

## New story schema (backward compatible)

```json
{
  "id": "string",
  "incidentNumber": "DU-20260902-HALL",
  "date": "2026-09-02",
  "publishedAt": "2026-09-02T14:02:00Z",
  "updatedAt": "2026-09-02T15:10:00Z",
  "status": "breaking | developing | resolved",
  "title": "...",
  "type": "Fire",
  "severity": "high | medium | low",
  "agency": ["Fire", "Ambulance"],
  "county": "Leicestershire",
  "location": "Loughborough, Leicestershire",
  "lat": 52.7721,
  "lng": -1.2074,
  "image": "",
  "imageAlt": "",
  "summary": "",
  "body": "",
  "units": ["Pump", "Aerial"],
  "timeline": [
    { "time": "14:02", "event": "Call received" },
    { "time": "14:07", "event": "First appliance on scene" }
  ],
  "relatedIds": ["other-story-id"],
  "versions": [
    {
      "at": "ISO timestamp",
      "note": "What changed",
      "summary": "Previous summary",
      "body": "Previous body",
      "status": "developing",
      "author": "DispaUK Control"
    }
  ],
  "author": "DispaUK Control",
  "creditsNote": ""
}
```

Legacy stories without the new fields still render: status is inferred from severity, county from location, agencies from type, incident numbers auto-generated.

## UX

1. **Listing** (`/news/`) — photo + title cards; filters for status, county, type, agency; free-text search.
2. **Article** (`/news/story.html?id=…`) — full body, incident number, published/updated times, map panel (OSM when lat/lng present), units, timeline, related incidents, version history.
3. **Edit versioning** — saving an existing story archives the previous summary/body/status into `versions[]` and bumps `updatedAt`.
4. **Homepage ticker** — shows breaking / developing / high-severity stories under the header.

## Admin workflow (unchanged publish path)

1. Sign in at `/admin/`
2. File or edit story (new fields optional)
3. **Export news.json** → commit to `data/news.json` on GitHub Pages

## Notes

- Map embed uses OpenStreetMap (no API key). Add `lat` / `lng` in admin for the interactive panel.
- Incident numbers: `DU-YYYYMMDD-XXXX` (auto if left blank).
- Large base64 images in `news.json` still work but inflate the file; prefer hosting images under `assets/news/` later.
