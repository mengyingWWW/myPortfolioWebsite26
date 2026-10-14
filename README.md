# myPortfolioWebsite26
my fully vibe coded personal website

## Matching a cover to its hero clip

A project can play a short clip on its cover's device screen: on the homepage card while hovered, and in the case-study hero. Two frontmatter fields in `src/content/work/<slug>.mdx` set this up:

```yaml
coverVideo: "/work/<slug>/clips/clip-hero.mp4" # a clip-hero.jpg next to it is the poster
coverScreen: { x: 20.844, y: 6.833, w: 58.313, h: 58.444 } # the screen, in % of the cover image
```

So the still cover and the clip show the same screen when the clip fades in, put the clip's first frame into the cover:

```sh
node scripts/make-cover.mjs <slug> <first-frame.png>
# e.g.
node scripts/make-cover.mjs idea-ai-wiki ../portfolio-recorder-main/output/idea-wiki/clips/clip-hero-first.png
```

- It reads `cover` and `coverScreen` from the frontmatter and fits the frame the way the clip is shown: scaled to cover the screen, cropped from the bottom, with rounded corners.
- On the first run it saves the untouched cover as `<name>-original.<ext>` (e.g. `cover-original.png`) next to it. Every run starts from that file, so you can re-run it whenever the clip is re-recorded.
- `--radius <px>` overrides the corner radius in cover pixels (default: 3px as shown in the hero).
- Afterwards, update `coverAlt` to describe the new screen.
