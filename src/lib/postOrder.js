// Which kind of X post an item is, for mixing the posting order.
export function postKind(item) {
  if (item?.template && item.template !== "x-post") return "carousel";
  return (item?.slide_paths?.length || 0) > 0 ? "image" : "text";
}

// Picks the next ready item to post. Tav makes posts in batches (ten images
// in one sitting, then some text), so oldest-first would post them back to
// back. Instead: pick a kind at random from the kinds waiting, avoiding the
// kind that went out last when anything else is waiting, then a random item
// of that kind.
export function pickNextPost(ready, lastKind = null, rand = Math.random) {
  if (!ready?.length) return null;
  const kinds = [...new Set(ready.map(postKind))];
  const fresh = kinds.filter((k) => k !== lastKind);
  const pool = fresh.length ? fresh : kinds;
  const kind = pool[Math.floor(rand() * pool.length)];
  const ofKind = ready.filter((i) => postKind(i) === kind);
  return ofKind[Math.floor(rand() * ofKind.length)];
}
