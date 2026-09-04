# Venue Location & Discovery

## Overview

This feature upgrades venues into a production-grade **Location & Discovery** system:

- Venue owners provide a real-world address.
- The address is **geocoded** into geographic coordinates (`[longitude, latitude]` GeoJSON).
- Coordinates are stored in MongoDB and indexed with a **`2dsphere`** geospatial index.
- Users can **discover venues geographically** — search live on a map, filter, and get location-aware results returned **from the database**, not the browser.

## How location data is stored

Each venue's `location` field is a MongoDB GeoJSON `Point`:

```js
location: {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: [longitude, latitude],   // NOTE: GeoJSON order — lng first, lat second
  address: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  formattedAddress: String,
}
```

> **Important:** coordinates are `[longitude, latitude]`, NOT `[latitude, longitude]`. This is the GeoJSON standard MongoDB expects.

A `2dsphere` index is defined on the schema, enabling native geospatial queries:

```ts
venueSchema.index({ location: '2dsphere' });
```

### Backward compatibility

Existing venues may have an old `location` shape (`{ address, city, state }`) without coordinates. A MongoDB `2dsphere` index **cannot** be built over such documents ("unknown GeoJSON type").

This is resolved by a **one-time migration** script:

```bash
node scripts/migrate-venue-location.mjs   # run from server/
```

The migration (idempotent) rewrites legacy `location` objects into a valid GeoJSON `Point` at the **sentinel coordinate `[0, 0]`** (which lies in the ocean, so it never matches real geographic searches), preserving all address text, then builds the `2dsphere` index.

- **No fake coordinates are ever invented** — `[0, 0]` is an explicit sentinel meaning "no real location yet," not a guessed city position.
- The UI treats `[0, 0]` as "no location": it shows **"Map not available for this venue"** instead of a map.
- Legacy venues simply won't appear in geographic searches until the owner sets real coordinates via the edit page.
- The `2dsphere` index now builds successfully over the whole collection (verified: `location_2dsphere` v3 on the live cluster).

## Geocoding architecture (replaceable provider)

External geocoding logic is isolated in a dedicated module: `server/src/modules/location/`.

```
server/src/modules/location/
├── geocoding.interface.ts   # GeocodingProvider interface
├── geocoding.service.ts     # default provider + swappable accessor
├── location.types.ts        # GeocodingResult type
├── nominatim.provider.ts    # concrete Nominatim/OSM implementation
└── index.ts                 # public exports
```

The Venue module depends on the **abstraction**, not on Nominatim directly:

```ts
interface GeocodingProvider {
  geocode(address: string): Promise<GeocodingResult[]>;
  reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null>;
}
```

To swap in a production provider (Google Places, Mapbox, etc.) later, implement the interface and call `setGeocodingProvider(...)`:

```ts
import { setGeocodingProvider } from '../location/index.js';
setGeocodingProvider(new MyProductionProvider());
```

No changes to the Venue module are required.

## Map & tile provider

- **Leaflet** (`leaflet` + `react-leaflet`) is the interactive map library.
- **OpenStreetMap** provides the tile layer.
- Maps load client-side only (`next/dynamic`/lazy import) to avoid SSR issues.

## API changes

### Venue endpoints

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/venues` | ✓ | Create venue. `ownerId` is derived from the token — clients **cannot** set it. Location is required and validated. |
| GET | `/api/venues` | — | List **approved**, non-deleted venues. Optional `city` filter. |
| GET | `/api/venues?lat&lng&radius&minCapacity&maxCapacity&minPrice&maxPrice&page&limit` | — | **Geographic search.** Returns `{ venues, total, page, totalPages }` ordered by distance; each venue includes a `distance` field (meters). `radius` is in meters (default 25000). Geospatial filtering happens in the DB via a `$geoNear` aggregation (uses the `2dsphere` index). |
| GET | `/api/venues/my` | ✓ | Current user's venues (non-deleted). |
| GET | `/api/venues/:id` | — | Single venue detail. |
| PATCH | `/api/venues/:id` | ✓ | Update (owner only; vetted server-side). |
| DELETE | `/api/venues/:id` | ✓ | Soft-delete (owner or admin). |
| PATCH | `/api/venues/:id/approve` | admin | Approve. |
| PATCH | `/api/venues/:id/reject` | admin | Reject. |

### Geocoding endpoints (thin wrappers around the provider)

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/api/venues/geocode/search?q=...` | — | Forward geocode: returns candidate `GeocodingResult[]`. |
| GET | `/api/venues/geocode/reverse?lat&lng` | — | Reverse geocode: returns single `GeocodingResult`. |

These stay server-side — the client never calls Nominatim directly.

### Security notes

- All request bodies/queries are validated with **Zod** (`venue.validator.ts`).
- Coordinates are range-checked: longitude `-180..180`, latitude `-90..90`, and both must be present together.
- `ownerId` is never accepted from the client; the server sets it from the authenticated user.
- Ownership is always re-checked server-side on update/delete.
- Radius, page, limit, and all filters are validated.
- Public endpoints expose **only** `status: 'approved'` and non-deleted venues.

## Frontend changes

New routes:

- `/venues/discover` — discovery with search, filters, live map, and venue cards.
- `/venues/[id]/edit` — edit a venue including its location.

New components (`client/src/components/`):

- `maps/LocationPicker.tsx` — search address → pick result → drag marker → confirm location.
- `maps/VenueMap.tsx` — read-only venue map with Get Directions.
- `maps/VenueClusterMap.tsx` — discovery map with marker clustering.
- `venues/VenueCard.tsx` — venue result card.
- `venues/VenueFilters.tsx` — capacity/price filters.

Updated pages:

- `app/venues/new/page.tsx` — now uses the `LocationPicker` (no manual lat/lng entry).
- `app/venues/[id]/page.tsx` — adds the location map section.

### Rate-limit / caching behavior

- Address search is **debounced** (500ms) and requires ≥3 characters — no request per keystroke.
- **Reverse geocoding** only runs after the user finishes dragging the marker (not on every move).
- No client-side geographic calculations; all distance/radius filtering is server-side via a `$geoNear` aggregation, which also returns each result's `distance`.

## Environment variables

None required for the initial implementation. The default provider is Nominatim/OSM (no API key). A production provider may introduce env vars later — define them in `server/src/config/env.ts` when that happens.

## Local development

```bash
npm run dev        # server :5000 + client :3000
```

Open **`/venues/discover`** to test geographic discovery.

## Production considerations

- The public OSM **Nominatim** service has a **usage policy** (max 1 req/sec, no heavy use). For production, swap in a commercial provider via `setGeocodingProvider(...)` and add rate limiting/caching around the geocoding endpoints as needed.
- OpenStreetMap tiles are free but rate-limited; consider a tile provider (Mapbox, etc.) for high traffic.
- Existing clusters ran the one-time migration (`scripts/migrate-venue-location.mjs`) to backfill legacy locations to `[0, 0]` and build the `2dsphere` index. New databases build the index automatically via Mongoose on startup (`venueSchema.index({ location: '2dsphere' })`).
- For large datasets, keep pagination (`page`/`limit`) — it is mandatory (never returns thousands at once).
- Marker clustering is used on the discovery map so hundreds of markers render fine.
