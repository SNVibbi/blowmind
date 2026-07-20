# Scaling Model

Target: a realistic path to **300,000+ registered users**. This is not a
claim that one deployment serves 300k simultaneous users — it's a
capacity model plus the ordered list of what breaks first.

## Working assumptions

| Metric | Assumption |
| --- | --- |
| Registered users | 300,000 |
| Monthly active (MAU) | ~30,000 (10%) |
| Daily active (DAU) | ~6,000 (20% of MAU) |
| Peak concurrent | ~300–600 |
| Reads/sec at peak | ~500–1,500 (paginated) |
| Writes/sec at peak | ~50–150 (posts/comments/reactions) |
| Media/user | ~1–3 MB after client compression |

Firestore comfortably handles this **provided reads are paginated and
listeners are scoped** — both done in Stage 5.

## Bottlenecks, in the order they bite

1. **Unbounded listeners (FIXED).** The old feed streamed the entire
   posts + users collections to every viewer: O(N×U). Replaced with
   cursor pagination (10/page) and single-doc status listeners.
2. **Hot-document contention (FIXED).** Interactions were whole-array
   rewrites on the post doc (lost writes, 1 MB ceiling). Now
   subcollections + `increment()` counters.
3. **Client-side search (OPEN).** Current search filters loaded posts in
   the browser — fine at low volume, useless at scale. The service layer
   is structured so a dedicated provider (Algolia/Typesense) can back a
   `searchPosts()` function without UI rewrites. Needed around ~50k MAU.
4. **Counter integrity / abuse (OPEN).** Client-written counters should
   move to Cloud Function triggers; that also enables rate limiting and
   spam heuristics.
5. **Notification fan-out (FUTURE).** Not built yet; will need a
   collection-per-user inbox written by Cloud Functions, not client
   fan-out.

## Cost levers

- Client-side image compression (Stage 5) cuts Storage + bandwidth.
- Pagination caps reads per session.
- Denormalized counters avoid `count()` aggregation reads on every view.
- Public posts can adopt ISR/CDN caching (not yet enabled) to serve
  popular content without hitting Firestore per request.

## When to revisit

Re-measure at 10k MAU and again at 50k MAU with real analytics. Introduce
Cloud Functions (counters, moderation, notifications) and a search
provider before crossing ~50k MAU. Load-test against a staging project
(k6/Artillery) simulating launch-day and viral-post traffic before any
major launch — this is not yet done and is the main remaining gap for the
300k claim.
