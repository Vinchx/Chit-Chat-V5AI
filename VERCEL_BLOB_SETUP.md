# Vercel Blob Storage Setup Guide

## 1. Create Blob Store

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project: `chit-chat-v5-ai`
3. Navigate to **Storage** tab
4. Click **Create Database** → **Blob**
5. Name: `chitchat-avatars` (atau custom name)
6. Click **Create**

## 2. Get Token

After creating Blob store:

1. Click on the newly created store
2. Go to **Settings** or **.env.local** tab
3. Copy the **BLOB_READ_WRITE_TOKEN**

Example:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_aBcDeFgH123456_xYz789WqRsTuVwXyZ
```

## 3. Add to Vercel Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: (paste token from step 2)
   - **Environments**: Production, Preview, Development (check all)
3. Add another variable:
   - **Name**: `USE_BLOB_STORAGE`
   - **Value**: `true`
   - **Environments**: Production, Preview
4. Click **Save**

## 4. Redeploy

After adding variables, redeploy your project:

- Go to **Deployments**
- Click **⋯** on latest deployment → **Redeploy**

## 5. Local Development (Optional)

To use Blob storage in local development:

Add to `.env.local`:

```env
BLOB_READ_WRITE_TOKEN=your_token_here
USE_BLOB_STORAGE=true
```

Otherwise, local dev will use file system (current behavior).

## Usage in Code

The upload API will automatically detect environment and use:

- **Production**: Vercel Blob Storage
- **Local**: File system (`public/uploads/`)

No code changes needed after env vars are set!
