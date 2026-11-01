import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { SITE } from '../seo.js';

export { SchemaType };

// The model the rest of the site uses (app/api/ai/*); GEMINI_MODEL switches it without a deploy of new code
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

export const aiConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return !!key && key !== 'your_actual_gemini_api_key_here';
};

/** An error the admin should read, with the HTTP status to answer with. */
export class AiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

/**
 * Asks Gemini for JSON in the shape of `schema` (SchemaType objects).
 * `image` ({ data: base64, mimeType }) is shown to the model with the prompt.
 */
export async function generateJson({ prompt, schema, image, temperature = 0.4 }) {
  if (!aiConfigured()) throw new AiError('AI suggestions need a Gemini API key. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables.', 503);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel(
    { model: GEMINI_MODEL, generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature } },
    { timeout: 30_000 },
  );
  let text;
  try {
    const result = await model.generateContent(image ? [{ inlineData: image }, { text: prompt }] : [{ text: prompt }]);
    text = result.response.text();
  } catch (error) {
    console.error('Gemini request failed:', error);
    throw new AiError(/429|quota|rate/i.test(error.message || '')
      ? 'The AI service is busy (usage limit reached). Wait a minute and try again.'
      : 'The AI service did not answer. Please try again.');
  }
  try {
    return JSON.parse(text.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim());
  } catch {
    throw new AiError('The AI answer could not be read. Please try again.');
  }
}

// Images the AI may look at: this store's Cloudinary account, or a file the site serves itself (/home/…)
export function aiImageUrl(url) {
  if (typeof url !== 'string' || !url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return new URL(url, process.env.NEXTAUTH_URL || SITE).toString();
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (cloud && !parsed.pathname.startsWith(`/${cloud}/`)) return null;
  // A 768 px JPEG is plenty to describe, and quick to send
  if (parsed.pathname.includes('/image/upload/')) {
    parsed.pathname = parsed.pathname.replace('/image/upload/', '/image/upload/c_limit,w_768,f_jpg,q_70/');
  }
  return parsed.toString();
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

/** The image as { data, mimeType } for generateJson, or null when it can't be fetched (the AI then works from the text). */
export async function fetchImageForAi(url) {
  const target = aiImageUrl(url);
  if (!target) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(target, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return null;
    const mimeType = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/.test(mimeType)) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null;
    return { data: bytes.toString('base64'), mimeType };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
