# kChat

A Twitch chat overlay **and** OBS chat dock with 7TV, BTTV, and FrankerFaceZ emote support. Fully static — no server, no API keys, no build step. Open `index.html` from disk or any static host and it just works.

kChat is a maintained fork of [jChat](https://github.com/giambaJ/jChat) by giambaJ (GPL-3.0), modernized after several Twitch/7TV API shutdowns broke the original, and inspired by [ChatIS](https://chatis.is2511.com/) by IS2511.

## Why this fork exists

- **Original jChat broke**: it relied on Twitch's retired Kraken (v5) API, the retired `badges.twitch.tv` service, and 7TV's retired v2 API.
- **kChat needs zero credentials**: the channel ID comes from Twitch IRC's own `ROOMSTATE` tag, emotes come from the public 7TV v3 / BTTV / FFZ APIs, and Twitch badges come from the public [IVR API](https://api.ivr.fi/) — no client ID, no OAuth, nothing to configure.
- **Dock mode**: a `bg=` parameter gives the page a solid background, so it works as an OBS custom browser dock without blinding you (transparent overlays render on white in docks).

## Usage

Point a browser source (overlay) or custom browser dock (chat panel) at:

```
index.html?channel=YOURTWITCHNAME
```

As a local file that looks like:

```
file:///C:/path/to/kchat/index.html?channel=yourtwitchname&bg=dark&size=2&font=1&animate=true&bots=true
```

### URL parameters

| Parameter | Values | Default | Notes |
|---|---|---|---|
| `channel` | Twitch login name | *(required)* | Whose chat to show |
| `bg` | `dark`, `black`, `gray`, `light`, or hex like `18181b` | transparent | Solid background; use for OBS docks |
| `size` | 1–3 | 3 | Text size (small/medium/large) |
| `font` | 0–11 | 0 | 0 BalooTammudu, 1 SegoeUI, 2 Roboto, 3 Lato, 4 NotoSans, 5 SourceCodePro, 6 Impact, 7 Comfortaa, 8 DancingScript, 9 IndieFlower, 10 PressStart2P, 11 Wallpoet |
| `stroke` | 1–4 | off | Text outline (for overlay readability) |
| `shadow` | 1–3 | off | Text shadow |
| `animate` | `true`/`false` | `false` | Slide-in animation for new messages |
| `bots` | `true`/`false` | `false` | Show known bot messages (StreamElements, Nightbot, …) |
| `hide_commands` | `true`/`false` | `false` | Hide `!command` messages |
| `hide_badges` | `true`/`false` | `false` | Hide all badges |
| `fade` | seconds | off | Remove messages after N seconds |
| `small_caps` | `true`/`false` | `false` | Small caps text |
| `block` | comma-separated names | — | Hide specific users |

### OBS setup

- **Chat dock** (reading chat while streaming): Docks → Custom Browser Docks → add the URL with `&bg=dark`.
- **On-screen overlay**: Add a Browser source with the URL *without* `bg` (stays transparent), and `stroke`/`shadow` to taste.

Moderators or the broadcaster can type `!refreshoverlay` in chat to reload emotes after adding new ones.

## What works, what doesn't

| Feature | Status |
|---|---|
| 7TV / BTTV / FFZ emotes (global + channel), zero-width stacking | ✅ |
| Twitch native emotes and badges (sub, mod, VIP, …) | ✅ (badges via IVR, degrade gracefully) |
| FFZ custom mod/VIP badges, FFZ:AP / BTTV / Chatterino user badges | ✅ |
| Emoji (Twemoji) | ✅ |
| Message deletion / bans reflected live | ✅ |
| Cheermote images | ❌ shows as text (needed retired Kraken API) |
| 7TV animated badges & name paints | ❌ planned (needs 7TV EventAPI) |
| Live emote auto-refresh | ❌ use `!refreshoverlay` (needs 7TV EventAPI) |

## Hosting for friends

It's a static folder — host it anywhere:

- **GitHub Pages**: fork/push this folder, enable Pages, share `https://you.github.io/kchat/?channel=…`
- **Local**: send the folder; they use a `file:///` URL as above.

## License

GPL-3.0, same as jChat. See [LICENSE](LICENSE). Original work © giambaJ and jChat contributors; modernization changes © 2026 kChat contributors.
