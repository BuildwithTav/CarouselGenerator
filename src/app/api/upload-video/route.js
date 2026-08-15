import { handleUpload } from '@vercel/blob/client';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

// Client-upload token endpoint: the browser PUTs the video file directly to
// Blob storage using a token from here, bypassing the serverless function's
// request body size limit (unlike /api/upload-photo, which reads the whole
// file through the function body — fine for photos, too small a ceiling for
// a 30s video).
export async function POST(req) {
  const body = await req.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
        maximumSizeInBytes: 100 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });

    return Response.json(jsonResponse);
  } catch (e) {
    console.error('Upload video error:', e);
    return Response.json({ error: e.message }, { status: 400 });
  }
}
