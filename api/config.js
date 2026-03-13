/**
 * /api/config — returns public app configuration for the frontend.
 * APP_SECRET_TOKEN is a Vercel env var (not NEXT_PUBLIC_, never exposed in HTML).
 * The frontend fetches it once on load and stores in memory only.
 */
export default function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).end();
    }

    // Only return the token if it exists — don't block the app if not set yet
    const token = process.env.APP_SECRET_TOKEN || '';

    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).json({ appToken: token });
}
