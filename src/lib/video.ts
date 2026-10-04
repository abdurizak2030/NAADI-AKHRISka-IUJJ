/** Turns whatever an admin pastes (YouTube link/ID or Facebook video link) into the fields the API stores. */
export function parseVideoLink(input: string): { youtubeId: string; videoUrl: string } {
  const v = input.trim();
  if (!v) return { youtubeId: '', videoUrl: '' };
  if (/(^|\.)facebook\.com\/|fb\.watch\//i.test(v)) return { youtubeId: '', videoUrl: v };
  const m = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i);
  if (m) return { youtubeId: m[1], videoUrl: '' };
  if (/^[\w-]{11}$/.test(v)) return { youtubeId: v, videoUrl: '' };
  return { youtubeId: '', videoUrl: v };
}
