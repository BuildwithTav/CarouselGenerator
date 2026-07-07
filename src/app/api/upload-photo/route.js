import { put } from '@vercel/blob';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req) {
  try {
    const body = await req.text();
    const { imageData, filename } = JSON.parse(body);

    if (!imageData) {
      return Response.json({ error: "No image data provided" }, { status: 400 });
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Detect mime type
    const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = contentType.split('/')[1];
    const name = filename || `profile-${Date.now()}.${ext}`;

    // Upload to Vercel Blob
    const { url } = await put(name, buffer, {
      access: 'public',
      contentType,
    });

    return Response.json({ url });

  } catch (e) {
    console.error('Upload error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
