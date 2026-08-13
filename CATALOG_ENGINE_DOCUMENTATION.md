# Jamkudi Catalog & Discovery Engine - Production Architecture Document

The **Jamkudi Catalog & Discovery Engine** (`src/services/catalog/*`) serves as the modular, deterministic normalization, deduplication, multi-entity retrieval, intent classification, and surface-ranking facade between raw JioSaavn API responses and Jamkudi's user interfaces.

---

## 1. Modular Architecture Overview

```mermaid
graph TD
    A[Screen Request: Home / Search / Artist / Album] --> B[CatalogEngine Facade index.ts]
    B --> C{Cache Hit or In-Flight Promise?}
    C -->|Yes| D[Return Instant Cached Entities]
    C -->|No| E[1. Query Normalizer]
    E --> F[2. Query Intent Classifier]
    F --> G[3. Parallel Multi-Entity JioSaavn Retrieval]
    G --> H[4. 2-Level Canonical Deduplication Engine]
    H --> I[5. Metadata Quality Selection & Context Preservation]
    I --> J[6. Surface Ranking Profiles: Search | Popular | Fresh | Mood]
    J --> K[7. Sectioned Output: Artists | Songs | Albums | Playlists]
    K --> L[Cache Entry + Render UI]
```

---

## 2. Key System Capabilities

### 2.1 Multi-Module Code Structure
- **`src/services/catalog/normalizer.ts`**: Query sanitization, version tag extraction (*Remix*, *Acoustic*, *Live*, *Lofi*), canonical fingerprinting, metadata quality scoring.
- **`src/services/catalog/deduplicator.ts`**: 2-level canonical identity resolution (Level 1: Provider ID, Level 2: Fingerprint).
- **`src/services/catalog/ranker.ts`**: Query intent classification with confidence metrics and multi-profile surface rankers (`SEARCH`, `POPULAR`, `FRESH`, `MOOD`).
- **`src/services/catalog/cache.ts`**: Surface-specific TTL caching (`SEARCH`: 10m, `ARTIST`: 30m, `ALBUM`: 30m, `POPULAR`: 5m, `FRESH`: 5m) and in-flight Promise sharing for duplicate network calls.
- **`src/services/catalog/index.ts`**: Facade module exposing `fetchSearchCatalog`, `fetchHomeCatalog`, `fetchArtistCatalog`, `fetchAlbumCatalog`.

---

### 2.2 Entity Retrieval & Playlists Support
Executes parallel API retrieval across 4 entity types:
1. **Artists Section**: Profile avatar card linking to `/artist/[id]`.
2. **Songs Section**: Ranked, deduplicated tracks with non-intrusive playback and subordinate "Play Next".
3. **Albums Section**: Distinct album cards linking to `/album/[id]`.
4. **Playlists Section**: Curated playlist cards linking to `/album/[id]`.

---

### 2.3 Stale-Response Protection & In-Flight Sharing
- **Stale-Response Protection**: `requestSeqRef` in `search.tsx` guarantees that older network responses never overwrite newer typed queries.
- **In-Flight Promise Sharing**: Simultaneous identical queries share the active network `Promise` rather than triggering duplicate network requests.

---

## 3. Summary Component Matrix

| Module | Location | Primary Responsibility |
| :--- | :--- | :--- |
| **Normalizer** | `catalog/normalizer.ts` | Query sanitization, version detection, quality scoring |
| **Deduplicator** | `catalog/deduplicator.ts` | 2-level ID and fingerprint deduplication |
| **Ranker** | `catalog/ranker.ts` | Intent classification & multi-profile surface ranker |
| **Cache** | `catalog/cache.ts` | Per-surface TTLs & in-flight network promise sharing |
| **Facade** | `catalog/index.ts` | Universal screen facade methods |
