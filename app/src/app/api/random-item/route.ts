import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'items.json');
  try {
    const file = await fs.readFile(filePath, 'utf-8');
    const items = JSON.parse(file);
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items found' }, { status: 404 });
    }
    const randomItem = items[Math.floor(Math.random() * items.length)];
    return NextResponse.json(randomItem);
  } catch {
    return NextResponse.json({ error: 'Failed to load items' }, { status: 500 });
  }
}
