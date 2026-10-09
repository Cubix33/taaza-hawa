# Deploying Taaza Hawa: what goes live when you push, and what doesn't

Read this before you change anything. **`git push` does not deploy everything.** Taaza Hawa has two halves, and each half goes live by a different route.

## The two deploy paths

| Half | What lives there | How it goes live | Automatic on `git push`? |
|---|---|---|---|
| **Website** | `web/` (pages, copy in `i18n.js`, CSS, Air Lens map) and `amplify.yml` | **AWS Amplify Hosting** watches `main` on GitHub. It runs `npm ci && npm run build` in `web/` and serves `web/dist` | **Yes**, a few minutes after the push |
| **Backend** | `backend/` (the Lambdas: poller, API, check steps) and `infra/` (`template.yaml`: DynamoDB, schedules, Step Functions, permissions, environment variables) | **AWS SAM** (CloudFormation): someone runs `sam build` and `sam deploy` on a machine that has AWS credentials | **No.** Nothing deploys it until someone runs SAM |

### Why one updates on its own and the other doesn't

Amplify was connected to the GitHub repo, so it gets a webhook on every push to `main` and rebuilds the website. `amplify.yml` only builds `web/`. Amplify never touches the Lambdas.

The backend was deployed once with `sam deploy`. Nothing links it to GitHub: there is no GitHub Actions workflow (no `.github/workflows/`) and no CodePipeline. The Lambdas keep running whatever code was in the last `sam deploy`, however many times you push.

**So:**
- Changes to how the site looks and reads (copy, layout, Air Lens) show up on their own.
- Changes to what the numbers are (scale, clock, grading, verdicts, record fields, emails, schedules) only go live after `sam deploy`.

## What to do for each kind of change

| You changed… | Do this |
|---|---|
| Only files in `web/` | Commit, `git pull`, `git push`. Amplify builds it. Check the site after about 5 minutes |
| Anything in `backend/` or `infra/` | Commit, `git pull`, `git push`, **then run SAM** (below) from the up-to-date `main` |
| Both | **Deploy the backend first**, then push the website. The website must also still work against the old backend for the few minutes in between (see "Write the website so it survives either order") |
| Only `docs/`, `README.md`, `blog/`, `.scratch/` | Commit and push. Nothing to deploy (Amplify rebuilds the site anyway, which is harmless) |

### Running SAM (backend and infra)

Run this from the repo root, on a machine with AWS credentials for the account that owns the stack (region `ap-south-1`):

```bash
git pull                               # deploy exactly what is on main
sam build -t infra/template.yaml
sam deploy                             # uses samconfig.toml from the first --guided run
```

- **First time on a new machine:** `samconfig.toml` is git-ignored, so it only exists where `sam deploy --guided` has already been run. On any other laptop, run `sam deploy --guided --region ap-south-1`. Use the **same stack name** as the existing stack, or you'll create a second copy. It will ask for the parameters in the README's table: `WaqiToken`, `FirmsMapKey`, `SesSender` and the rest. Secrets are NoEcho and never go in git.
- `sam deploy` prints a changeset. Lambda code changes appear as `Modify` on the functions. If it says "No changes to deploy", you are deploying the same code that is already live: check `git log` and that you pulled.
- If `infra/template.yaml` changed (new environment variable, schedule or permission), the changeset shows that too. Read it before you confirm.

## How to check each half actually went live

**Website (Amplify):**
- The Amplify console shows the build for the latest commit as succeeded.
- Hard-refresh the site and look for the change. For example, the estimate button now reads "Hold me to this".

**Backend (SAM):** use the API URL (`ApiUrl` stack output, also baked into the site as `VITE_API_URL`):

```bash
API=https://ktmdmcvoyilf7pfl5npdigkyaq0uucbi.lambda-url.ap-south-1.on.aws
curl -s "$API/health"                       # ok, last_poll time, poll_age_min (should be < 20)
curl -s "$API/card?uid=10119"               # compare "reading_ts" with "now"
curl -s "$API/scoreboard" | grep -o '"warming[^,]*'
```

- `reading_ts` must be **earlier** than `now`, and `age_min` must be a real number of minutes (not always 0). If `reading_ts` is a few hours *after* `now`, the old clock code is still running: the backend was not deployed.
- `/scoreboard` should include `"warming"` and `"mean_width"` inside `accuracy`. If they're missing, the old code is still running.
- After deploy, wait for the next 15-minute poll before judging the data. CloudWatch logs for the poller function show what it did.

## Write the website so it survives either order

The two halves can be out of step for minutes, or days if nobody runs SAM. So:
- New API fields are additive. The website checks for them (`acc.warming && acc.mean_width != null`, for example) and renders the old way when they're missing.
- Never remove or rename an API field the live website uses in the same change. Add the new one, ship both halves, then remove the old one later.
- Never assume the backend changed just because the website did.

## Pending right now (9 Oct 2026)

These commits are on `main` and the website half is live. **The backend half is not live until someone runs SAM:**

| Commit | What changes when the backend is deployed |
|---|---|
| `e5398d5` fix(data): CPCB scale and real UTC time | WAQI's US-EPA numbers are converted to India's CPCB scale, so 5 of 24 live verdicts change. Reading ages become real instead of "0 min". A reading from before a "Hold me to this" check can no longer grade it |
| `c287120`, `1f3bf43` fix(record) | `/scoreboard` gains `warming` and `mean_width`, so the record page shows its warming-up note |
| `8d5936d` fix(copy) | The spoken answer (Polly) gets the Wait pointer and the healthy-adults line |

**The first poll after this deploy runs a one-time data migration** (`service.migrate_v2`):
- Stored readings move to the correct time and the CPCB scale.
- Past estimates are converted and re-graded by the first reading after them.
- Calibration restarts, so ranges are honestly wide ("warming up") for about a day.
- It runs once, is safe to re-run, and is recorded under `KV / migration` in DynamoDB.

Check it with the curl commands above about 15 minutes after the deploy.
