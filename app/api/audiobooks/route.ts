import { NextResponse } from 'next/server';

interface BunnyFile {
  ObjectName: string;
  Length: number;
  IsDirectory: boolean;
  DateCreated: string;
}

export interface AudiobookItem {
  title: string;
  author: string;
  filename: string;
  sizeBytes: number;
}

function parseFilename(objectName: string): { title: string; author: string } {
  // Pattern: "Title By Author (Audiobook) [id].mp3"
  const clean = objectName.replace(/\.mp3$/i, '').replace(/\s*\(Audiobook\)\s*\[.*?\]\s*$/, '');
  const byMatch = clean.match(/^(.+?)\s+By\s+(.+)$/i);
  if (byMatch) {
    return { title: byMatch[1].trim(), author: byMatch[2].trim() };
  }
  return { title: clean, author: 'Unknown' };
}

export async function GET() {
  const apiKey = process.env.BUNNY_STORAGE_API_KEY;
  const zoneName = process.env.BUNNY_STORAGE_ZONE_NAME;

  if (!apiKey || !zoneName) {
    return NextResponse.json({ error: 'Bunny CDN not configured' }, { status: 500 });
  }

  const res = await fetch(`https://storage.bunnycdn.com/${zoneName}/`, {
    headers: { AccessKey: apiKey },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch from Bunny CDN' }, { status: res.status });
  }

  const files: BunnyFile[] = await res.json();

  const audiobooks: AudiobookItem[] = files
    .filter((f) => !f.IsDirectory && f.ObjectName.toLowerCase().endsWith('.mp3'))
    .map((f) => {
      const { title, author } = parseFilename(f.ObjectName);
      return {
        title,
        author,
        filename: f.ObjectName,
        sizeBytes: f.Length,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json(audiobooks);
}
