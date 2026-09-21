# Split — frontend

Angular front end for the Split API: create a group, add its members, record expenses, and
read back who owes whom.

The interface ships in **French** (default) and **English**, switchable at runtime from the
header.

## Running it

The API is not started by this project. From the repository root:

```bash
./mvnw spring-boot:test-run     # starts Postgres via Testcontainers, listens on :8080
```

Then, from `frontend/`:

```bash
npm start                       # http://localhost:4200
npm test                        # unit tests (vitest)
npm run build                   # production build, prerenders the landing page
```

`npm start` proxies `/api/**` to `http://localhost:8080`, stripping the `/api` prefix
because the Spring controllers are mapped at `/groups` (see `proxy.conf.json`). To point a
deployment elsewhere, override the `API_BASE_URL` token from `src/app/core/api/split-api.ts`.

## Docker (production)

```bash
docker build -t split-frontend:latest .
docker run -p 4000:4000 -e NG_ALLOWED_HOSTS=split.example.com split-frontend:latest
```

Two stages: one builds the bundle, the final one carries nothing but Node and `dist/`.
The Angular builder inlines Express into `server.mjs` — only Node built-ins remain — so
there is no `node_modules`, no package manager and no build tooling in the runtime image
(~175 MB, almost all of it the Node base).

It runs rootless: `USER node` (uid 1000), application files owned by root and read-only to
that user, and no setuid binary anywhere in the image. It also runs under `--read-only`
and `--security-opt no-new-privileges` unchanged.

| Variable | | |
| --- | --- | --- |
| `NG_ALLOWED_HOSTS` | **required** | Comma-separated hostnames served. Angular's SSRF protection answers `400` to any `Host` it does not recognise, so without this every request is rejected. There is deliberately no default: the only convenient one would be `*`, which disables the check. |
| `NG_TRUST_PROXY_HEADERS` | behind a proxy | e.g. `x-forwarded-host,x-forwarded-proto`. Without it, `X-Forwarded-*` headers are stripped and the app sees the internal scheme and host. |
| `PORT` | optional | Defaults to `4000`. |

**The container serves the UI only.** The browser calls `/api/**` on its own origin, so
something in front — ingress, reverse proxy, service mesh — has to route `/api` to the
Spring service (stripping the prefix, as `proxy.conf.json` does in development). The
alternative is to point `API_BASE_URL` at an absolute URL, which brings CORS into play.

The `HEALTHCHECK` is a liveness probe: it treats any HTTP answer as success, because its
own request carries a `Host` of `127.0.0.1` that `NG_ALLOWED_HOSTS` rightly rejects.
Readiness probes, which know the real hostname, belong to the orchestrator.

## How it fits together

```
src/app/
  core/
    api/        models mirroring the API DTOs, the HTTP service, RFC 9457 error mapping
    i18n/       message catalogues, translation service, pipes, locale switcher
    recent-groups.ts   the group ids this browser has already opened
    notifications.ts   translated toasts
  features/
    home/       create a group, open one by id, recently opened list
    group/      the group page and its panels (expenses, members, balances, settlements)
```

State is signals throughout. Reads go through `httpResource`, keyed on the route's group
id, so changing groups refetches on its own; writes go through `HttpClient` and reload the
resources they invalidate.

Forms use **Signal Forms** (`@angular/forms/signals`).

Two places where Signal Forms and Optimus rub against each other, both worked around:

- The payer and participant controls are native elements rather than `p-select` /
  `p-multiselect`. Those extend Optimus's `BaseInput`, whose `pattern`, `min` and `max`
  inputs collide with what `[formField]` passes through to the host control — it is a
  compile error, not a preference.
- `[formField]` also passes a raw `invalid` state through, so Optimus would paint a
  required-but-empty field red before anyone typed in it. A template `[invalid]` binding
  cannot win, because the pass-through rewrites it every cycle. Instead `styles.css`
  suppresses `.p-inputtext.p-invalid` and re-enables it via `.is-invalid`, which the
  components set from the same touched-gated state as the error message.

## i18n

Translation is done at runtime rather than with `$localize`, so one deployed bundle can
switch language without a reload.

- `core/i18n/messages.fr.ts` is the reference catalogue. Every other locale is typed
  against its keys, so a missing or stray translation fails the build.
- `I18nService.translate(key, params)` interpolates `{placeholders}`. When `params.count`
  is present, the plural form is chosen with `Intl.PluralRules` (`key.one` / `key.other`),
  which is why French treats 0 and 1 alike and English does not.
- Amounts and dates are formatted with `Intl` against the active locale, so they follow
  the language picker rather than a `LOCALE_ID` fixed at bootstrap. Currency is EUR — the
  API carries no currency of its own.
- Templates read `{{ 'some.key' | t }}`. The pipe is impure on purpose: a pure pipe caches
  on its arguments and would keep showing the previous language.
- Optimus's own strings (empty lists, overlay ARIA labels) are set through
  `Optimus.setTranslation` from `core/i18n/optimus-translations.ts`.
- An HTTP interceptor sends `Accept-Language`, so bean-validation messages coming from the
  API arrive in the language on screen.

To add a locale: add the tag to `core/i18n/locale.ts`, add a catalogue typed as
`MessageCatalogue`, and register it in `I18nService` and `OPTIMUS_TRANSLATIONS`.

## Accessibility

Every form control has a bound label, errors are linked with `aria-describedby` and only
appear once a field is touched, and the page has a skip link. Balances spell out their
direction ("Doit …" / "On lui doit …") instead of relying on the tag colour, so they still
read correctly without colour perception.

## Rendering

SSR is on. The landing page prerenders; `groups/:groupId` is client-rendered, since it is
nothing but live API data keyed by an id the server cannot enumerate
(`src/app/app.routes.server.ts`).
