# Deployment Instructions

## Prerequisites
- Node.js installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged into Firebase (`firebase login`)

## Deploy to Production

**IMPORTANT: Always build before deploying!**

```bash
# 1. Build the app (creates optimized dist/ folder)
npm run build

# 2. Deploy everything (hosting + functions + firestore rules)
firebase deploy

# OR deploy only specific parts:
firebase deploy --only hosting        # Just the website
firebase deploy --only functions      # Just Cloud Functions
firebase deploy --only firestore:rules # Just Firestore rules
```

## Local Development

```bash
npm run dev
```

Runs on http://localhost:5173

> **Note:** The deploy command will output a "Hosting URL" (e.g., `https://data-journaling.web.app`). You can click this to view your live app!

## 3. Connect Custom Domain (datajournaling.com)
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project: **data-journaling**.
3.  In the left sidebar, click **Hosting**.
4.  Click **Add Custom Domain**.
5.  Enter `datajournaling.com` and click **Continue**.
6.  **DNS Setup:** You have existing records (likely from Cloudflare) that conflict. You must **REMOVE** the old ones and **ADD** the new ones.

    **Step A: DELETE these existing records:**
    | Type | Host | Value |
    | :--- | :--- | :--- |
    | **A** | `@` | `104.21.31.212` |
    | **A** | `@` | `172.67.179.250` |
    | **AAAA**| `@` | `2606:4700:3031::ac43:b3fa` |
    | **AAAA**| `@` | `2606:4700:3033::6815:1fd4` |

    **Step B: ADD these new records:**
    | Type | Host | Value |
    | :--- | :--- | :--- |
    | **A** | `@` | `199.36.158.100` |
    | **TXT** | `@` | `hosting-site=data-journaling` |

    *   *Note: If your provider asks for a "Name" or "Host", use `@` (which represents the root domain).*
    *   *Wait up to 24 hours for propagation (usually takes ~1 hour).*

## 4. Enable Scaling (Blaze Plan)
To ensure your app scales for millions of users and to use external APIs (like OpenAI/Gemini) in Cloud Functions (if you add them later), upgrade to the Blaze plan.

1.  In the [Firebase Console](https://console.firebase.google.com/), click the **Gear icon** > **Usage and Billing**.
2.  Click the **Details & Settings** tab.
3.  Under "Modify plan", select **Blaze (Pay as you go)**.
4.  Set up a budget alert (e.g., $20/month) to monitor costs.

---

## ✅ Quick Re-deploy
For future updates, just run:

```bash
npm run build && firebase deploy --only hosting
```
