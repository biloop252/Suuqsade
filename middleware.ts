import { NextRequest, NextResponse } from 'next/server'

function normalizeOrigin(value: string): string {
	try {
		return new URL(value).origin
	} catch {
		return value.replace(/\/$/, '')
	}
}

function getAllowedOrigin(request: NextRequest): { originHeader: string; allowCredentials: boolean } {
	const requestOriginHeader = request.headers.get('origin') || ''
	const requestOrigin = requestOriginHeader ? normalizeOrigin(requestOriginHeader) : ''

	const envOrigins = [
		process.env.CORS_ALLOW_ORIGINS,
		process.env.NEXT_PUBLIC_ALLOW_ORIGINS,
		process.env.NEXT_PUBLIC_SITE_URL,
		process.env.NEXT_PUBLIC_ADMIN_URL
	]
		.filter(Boolean)
		.join(',')
		.split(',')
		.map(s => s.trim())
		.filter(Boolean)
		.map(normalizeOrigin)

	const defaultOrigins = [
		'http://localhost:3000',
		'http://localhost:3001',
		'http://127.0.0.1:3000',
		'http://127.0.0.1:3001',
		'http://localhost:5000',
		'http://127.0.0.1:5000'
	]

	const allowedOrigins = new Set<string>([...envOrigins, ...defaultOrigins])

	if (requestOrigin && allowedOrigins.has(requestOrigin)) {
		return { originHeader: requestOrigin, allowCredentials: true }
	}

	// Fallback to wildcard when origin is not in allowlist (no credentials allowed with *)
	return { originHeader: '*', allowCredentials: false }
}

function buildCorsHeaders(request: NextRequest): Headers {
	const { originHeader, allowCredentials } = getAllowedOrigin(request)
	const requestHeaders = request.headers.get('access-control-request-headers') || 'Content-Type, Authorization'

	const headers = new Headers()
	headers.set('Access-Control-Allow-Origin', originHeader)
	headers.set('Vary', 'Origin')
	headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
	headers.set('Access-Control-Allow-Headers', requestHeaders)
	headers.set('Access-Control-Max-Age', '86400')
	if (allowCredentials) headers.set('Access-Control-Allow-Credentials', 'true')
	return headers
}

export function middleware(request: NextRequest) {
	// Only handle CORS for API routes via matcher below
	const corsHeaders = buildCorsHeaders(request)

	if (request.method === 'OPTIONS') {
		return new NextResponse(null, { status: 204, headers: corsHeaders })
	}

	const response = NextResponse.next()
	corsHeaders.forEach((value, key) => response.headers.set(key, value))
	return response
}

export const config = {
	matcher: ['/api/:path*']
}


