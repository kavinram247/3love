import 'server-only'

import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = 'BAD_REQUEST',
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export async function readJsonBody(request: Request, maxBytes = 24_000): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) {
    throw new AppError('Content-Type must be application/json.', 415, 'UNSUPPORTED_MEDIA_TYPE')
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new AppError('Request body is too large.', 413, 'PAYLOAD_TOO_LARGE')
  }

  const raw = await request.text()
  if (!raw || Buffer.byteLength(raw, 'utf8') > maxBytes) {
    throw new AppError(raw ? 'Request body is too large.' : 'Request body is required.', raw ? 413 : 400)
  }

  try {
    return JSON.parse(raw) as unknown
  } catch {
    throw new AppError('Request body must contain valid JSON.', 400, 'INVALID_JSON')
  }
}

export function errorResponse(error: unknown, fallbackMessage: string, fallbackStatus = 500) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }

  const requestId = randomUUID()
  console.error(`[${requestId}] ${fallbackMessage}`, error)
  return NextResponse.json(
    { error: fallbackMessage, code: 'INTERNAL_ERROR', requestId },
    { status: fallbackStatus },
  )
}

export function getRequestIdentity(request: Request) {
  const direct = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip')
  if (direct) return direct.trim().slice(0, 128)

  const forwarded = request.headers.get('x-forwarded-for')
  return (forwarded?.split(',')[0]?.trim() || 'unknown').slice(0, 128)
}
