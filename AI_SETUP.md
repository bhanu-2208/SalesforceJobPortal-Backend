# AI JD Parser — Setup Steps

## 1. Install packages (Backend)
```powershell
cd Backend
npm install openai zod
```

## 2. Add to Backend/.env
```dotenv
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```
Get your key from https://platform.openai.com/api-keys

## 3. File placement

### Backend
```
Backend/src/
├── services/
│   ├── openai.service.ts          ← new
│   └── aiJobParser.service.ts     ← new
├── validators/
│   └── generatedJob.schema.ts     ← new
├── controllers/
│   └── aiJob.controller.ts        ← new
└── routes/
    └── jobs.routes.ts             ← REPLACE with updated version
```

### Frontend
```
Frontend/app/
└── admin/
    └── jobs/
        └── new/
            └── page.tsx           ← rename AdminNewJobPage.tsx here
Frontend/app/globals.css           ← paste ai-globals.css at the bottom
```

## 4. Add a link to the new admin page

In your Jobs page, next to the existing "Post a Job" button, add a second button:

```tsx
<a href="/admin/jobs/new" className="btn btn--ghost jobs-hero__post-btn" style={{marginLeft:"0.5rem"}}>
  ✨ Generate with AI
</a>
```

## 5. Test it

1. Start backend: `npm run dev`
2. Visit `http://localhost:3000/admin/jobs/new`
3. Paste any Salesforce job description (at least 50 characters)
4. Click "Generate with AI"
5. Review the auto-filled fields, edit anything wrong
6. Click "Publish Job"
7. Check `/jobs` — your new job should appear

## Cost note
`gpt-4o-mini` costs approximately $0.15 per 1M input tokens — a typical JD (500-1000 words) costs a fraction of a cent per generation. Very cheap to run even at scale.

## Troubleshooting

**"OPENAI_API_KEY is not defined"** → restart your backend after adding the env variable.

**"AI response validation failed"** → the model returned a field type that didn't match the schema (rare with `gpt-4o-mini` + `response_format: json_object`). Just click Generate again — it's usually a one-off.

**Route not found on /api/jobs/generate** → confirm `router.post("/generate", ...)` appears BEFORE `router.get("/:slug", ...)` in jobs.routes.ts, otherwise Express treats "generate" as a slug value.