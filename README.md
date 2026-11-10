This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Automatic data refresh safeguards

GitHub Actions refreshes the dataset on the schedules in `.github/workflows/auto-deploy.yml`, on manual dispatch, and when the refresh script/tests or workflow change on `main`. Data-only commits do not retrigger this workflow.
Run `node --test scripts/fetch-macro-data.test.mjs` to verify the refresh safeguards without network access or changes to the checked-in dataset.

- All 41 FRED series must contain valid, finite observations in date order. HTTP errors, timeouts, empty responses, malformed CSV, and invalid values fail the refresh.
- If a required series fails, the entire existing `src/data/macroData.json` (including `updatedAt`) is left unchanged. The script exits nonzero, so Actions skips committing and builds stop rather than publishing an incomplete snapshot. Healthy indicators are also held until a complete refresh succeeds.
- News failures keep the previous items from the affected source and emit warnings, including GitHub Actions warning annotations. FX supplementation is optional; failure keeps the FRED values and emits a warning. A successful run means the required indicators refreshed; warnings may still indicate older news or unavailable FX supplementation.
- A completed dataset is written to a temporary file and renamed to avoid truncating the existing file if writing fails. Each network request has a timeout. Actions runs refreshes sequentially and enforces a job timeout.
- Inspect the Actions run's logs and warnings after a failure. GitHub notification delivery depends on each user's notification settings; this change does not configure email or other external notifications.

## Detailed chart history

Daily refresh also writes compact per-series full history to `public/history/`. Dashboard data remains capped at its previous size; a history file is requested only when its detail chart opens. Current dashboard/FX observations override matching history dates. Periods without sufficient coverage are disabled. ALL means all observations available from the source, not an assurance that every market has unlimited history. Long charts retain endpoint/bucket extrema while limiting rendered points to 800; displayed statistics use every observation in the selected period.
