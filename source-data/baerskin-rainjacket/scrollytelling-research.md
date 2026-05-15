# Scrollytelling Research Notes

Capture date: 2026-05-14

## What I Verified

Direct X pages are mostly login-gated, so some post-level claims could not be verified on X itself. The strongest public confirmations are through newsletters, LinkedIn reposts, X mirror pages, and official tool documentation.

### AI Scrollytelling Workflow Pattern

The recurring creator workflow is:

1. Generate a clean start frame and a clean end frame for the product.
2. Use an image-to-video or first/last-frame video model to interpolate motion.
3. Convert the resulting video into a frame sequence.
4. Build a sticky scroll section that maps scroll progress to frame index.
5. Add annotations, copy, and conversion UI around the scroll-driven product reveal.

Prajwal Tomar documented this exact pattern in a January 2026 newsletter: Google Whisk for start/end frames, Google Flow for interpolation, EzGIF for video-to-JPG extraction, then a Next.js sticky scroll component driven by frame index. His public LinkedIn repost makes the same distinction: this is frame-by-frame scroll animation, not a normal video dropped into a hero.

For our Baerskin page, this suggests the highest-value motion is not a looping video. It is a controlled scroll sequence: jacket closed -> seams/zip/hood/pockets revealed -> packed pouch -> hoodie integration -> proof/offer.

### Verified / Partly Verified Creator Claims

- Prajwal Tomar: verified through his AI MVP Builders newsletter, LinkedIn repost, and X mirror pages. The specific "Stop saying AI can't design" keyboard scrollytelling post is visible on X mirrors and LinkedIn, but not independently accessible on X without login.
- The Chai Coder: exact May 14, 2026 post was not discoverable through public web search during this pass. The described process is consistent with the Prajwal workflow, but I am not treating it as independently verified.
- Fabian Stelzer / Glif scroll agent: exact post was not found in public search, but Glif's official pages confirm the underlying premise: a chat-based creative agent that routes across image, video, audio, text, and code tools. Glif also lists video models such as Veo variants.
- MotionSites: official site confirms a prompt/template library for AI-generated animated hero and landing page sections. Public pages show a broad template catalog and paid access to prompt/template libraries.

## Technical Stack Implications

### Motion / Framer Motion

Motion's `useScroll` gives scroll position and normalized progress values. `useTransform` maps progress into output values. `useSpring` smooths motion values. This is a good fit for:

- Sticky progress bars.
- Chapter-linked opacity/translate/scale.
- Text and annotation reveals.
- Image-layer parallax.
- Lightweight frame-sequence index updates.

Use Motion when we want React-friendly animation with modest complexity.

### GSAP ScrollTrigger

GSAP ScrollTrigger supports scroll triggers, scrubbing, pinning, snapping, and pinned timelines. It is the safer choice if the page needs:

- Multiple overlapping pinned sequences.
- A long product-explosion timeline.
- Complex text/asset choreography.
- Scroll snapping between chapters.

Use GSAP if Motion becomes awkward for timeline orchestration.

### Native CSS Scroll-Driven Animations

Modern CSS supports scroll and view progress timelines through `animation-timeline`, `scroll()`, and `view()`. This is useful for progressive enhancement:

- Simple reveal animations.
- Chapter progress meters.
- Decorative parallax.

Do not rely on it as the only mechanism for a conversion-critical scrollytelling sequence without fallback testing, because browser support and edge cases still need verification.

### Pretext

Pretext measures and lays out multiline text with Canvas text measurement instead of DOM geometry reads. Its official GitHub docs frame it as useful for measuring paragraph height and line breaks before mounting, avoiding `getBoundingClientRect`, `offsetHeight`, and related reflow-heavy measurement.

For our Baerskin scrollytelling page, Pretext is not needed for normal marketing copy. It becomes useful if we build:

- Dynamic callout labels around the jacket.
- Responsive annotation bubbles that must never overflow.
- Generated review cards or variable-length FAQ snippets inside a pinned viewport.
- A canvas/SVG annotation layer where text positions are calculated before render.

Practical rule: use CSS for ordinary text flow; consider Pretext only for measured labels or dense animated copy where DOM reads would add jank.

## Performance Rules

- Animate `transform` and `opacity` whenever possible.
- Avoid animating layout properties such as width, height, top, and left in scroll-linked sections.
- Preload only the image frames needed soon; do not dump hundreds of large frames into first paint.
- Use responsive frame budgets: fewer frames on mobile and reduced-motion mode.
- Prefer canvas or a single `<img>` swap for frame sequences rather than hundreds of mounted images.
- Respect `prefers-reduced-motion`: show static chapter images and let the page remain readable.
- Keep CTA access visible. Scrollytelling is a narrative layer, not a barrier to purchase.

## Baerskin Scrollytelling Direction

### Recommended Narrative

1. **Sudden Weather**
   Start with the visitor's pain: sudden rain cancels outdoor plans, so readiness matters.

2. **Sealed System**
   Use scroll to reveal 20,000mm waterproof rating, taped seams, silicone-sealed zips, storm flap, and BÆR-Tex coating.

3. **Packable Utility**
   Show the jacket folding into its pouch. This should be a strong motion moment.

4. **Adaptive Fit**
   Animate callouts for hood, cuffs, waist toggles, five waterproof pockets, and layering space.

5. **3-in-1 Integration**
   Reveal the hoodie zip-in mechanism as a second product-system moment.

6. **Proof + Offer**
   Use reviews, Trustpilot proof, colors/sizes, 60-day returns, and the sale offer. Keep sweepstakes/legal as support copy, not the main story.

### Best Asset Candidates From The Scrape

- `assets/baerskin-rain-jacket-summer-2026-carousel-01-v2-d0c6ed07.jpg`
- `assets/baerskin-rain-jacket-summer-2026-infographic-01-da91345b.jpg`
- `assets/baerskin-rain-jacket-summer-2026-content-image-01-e7e3e5cf.jpg`
- `assets/baerskin-rain-jacket-summer-2026-content-image-02-98f1c2bf.jpg`
- `assets/baerskin-rain-jacket-summer-2026-content-image-03v2-6f4df156.jpg`
- `assets/baerskin-rain-jacket-summer-2026-content-image-04-3a68e6c8.jpg`
- `assets/bs-rain-jacket-ugc-01-11ef1150.jpg` through `assets/bs-rain-jacket-ugc-04-c00301f5.jpg`

## Source Links

- HackerNoon: https://hackernoon.com/pretext-does-what-css-cant-measuring-text-before-the-dom-even-exists
- Pretext GitHub: https://github.com/chenglou/pretext
- Pretext community docs: https://pretext.wiki/
- Motion `useScroll`: https://motion.dev/docs/react-use-scroll
- Motion `useTransform`: https://motion.dev/docs/react-use-transform
- Motion `useSpring`: https://motion.dev/docs/react-use-spring
- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- MDN scroll-driven animations: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timelines
- web.dev animation performance: https://web.dev/animations-and-performance/
- Google Flow: https://blog.google/technology/ai/google-flow-veo-ai-filmmaking-tool/
- Google Whisk: https://blog.google/technology/google-labs/whisk/
- Glif: https://glif.app/
- Glif 2.0 changelog: https://glif.app/changelog
- MotionSites: https://motionsites.ai/
- Prajwal newsletter: https://newsletter.aimvpbuilders.com/p/i-rebuilt-a-5k-scroll-animation-in-10-minutes-with-ai
- Prajwal LinkedIn repost: https://www.linkedin.com/posts/prajwal-tomar-9472081a5_i-replicated-a-5k-scroll-animation-using-activity-7414704192520462338-8bTM
