import { put } from '@vercel/blob';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let imageData, filename;

    if (contentType.includes('multipart/form-data')) {
      // FormData path — no body size limit from Next.js
      const formData = await req.formData();
      const file = formData.get('file');
      filename = formData.get('filename') || `upload-${Date.now()}.jpg`;
      if (!file) return Response.json({ error: "No file provided" }, { status: 400 });
      const buffer = Buffer.from(await file.arrayBuffer());
      const { url } = await put(filename, buffer, { access: 'public', contentType: file.type || 'image/jpeg' });
      return Response.json({ url });
    } else {
      // JSON path (small payloads only)
      const body = await req.text();
      const parsed = JSON.parse(body);
      imageData = parsed.imageData;
      filename = parsed.filename;
      if (!imageData) return Response.json({ error: "No image data provided" }, { status: 400 });
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
      const contentTypeMime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const ext = contentTypeMime.split('/')[1];
      const name = filename || `upload-${Date.now()}.${ext}`;
      const { url } = await put(name, buffer, { access: 'public', contentType: contentTypeMime });
      return Response.json({ url });
    }
  } catch (e) {
    console.error('Upload error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
