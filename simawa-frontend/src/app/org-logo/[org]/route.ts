import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LOGO_DIR = path.join(process.cwd(), '..', 'logo-organisasi')
const FALLBACK_FILE = 'blank-logo.png'

const ORG_LOGO_MAP: Record<string, string> = {
  himtif: 'Logo-Himtif.png',
  komasi: 'Logo-Komasi.JPG',
  himasikom: 'Logo-Himasikom.png',
  immi: 'Logo-Immi.jpeg',
  ripala: 'Logo-Ripala.png',
  fummri: 'Logo-Fummri.jpeg',
  apsi: 'Logo-Apsi.png',
  maranatha: 'Logo-Maranatha.jpeg',
  raharjafc: 'Logo-FcRaharja.png',
  fcraharja: 'Logo-FcRaharja.png',
}

const normalizeOrgName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const contentTypeFromExt = (fileName: string) => {
  const ext = path.extname(fileName).toLowerCase()
  switch (ext) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBA6o8W5kAAAAASUVORK5CYII=',
  'base64',
)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> },
): Promise<Response> {
  const { org } = await params
  const normalized = normalizeOrgName(org || '')

  const requested = ORG_LOGO_MAP[normalized] ?? FALLBACK_FILE
  const safeFileName = path.basename(requested)
  const filePath = path.join(LOGO_DIR, safeFileName)

  let bytes: Buffer
  try {
    bytes = await fs.readFile(filePath)
  } catch {
    const fallbackPath = path.join(LOGO_DIR, FALLBACK_FILE)
    try {
      bytes = await fs.readFile(fallbackPath)
    } catch {
      return new NextResponse(transparentPng, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300',
        },
      })
    }
  }

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': contentTypeFromExt(safeFileName),
      'Cache-Control':
        'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
