# 02: The track record shows its evidence, not just a percentage

**What to build:**

- On the record page, every percentage shows how many checks it is based on.
- When ranges are still warming up (fewer than 20 past errors at a station, so the ±45 placeholder band is in use), one plain line explains three things:
  - how many of the graded checks used warming-up ranges
  - how wide those ranges were on average
  - that the hit rate is expected to fall towards the 80% target as ranges narrow
- The home page's record teaser gets the same count.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The accuracy summary from the API includes the number of graded checks that used warming-up ranges and the mean range width of graded checks
- [ ] The ring/percentage on the record page shows "N checked" next to it
- [ ] A warming-up note appears when any graded check used a warming-up range, in hi and en
- [ ] The example (demo) board still renders, with the same fields
- [ ] Older API responses without the new fields still render (no crash, no note)
