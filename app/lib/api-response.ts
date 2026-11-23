import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Standardised successful JSON response
 */
export function successResponse<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...((typeof data === "object" && data !== null && !Array.isArray(data)) ? data : { data }),
    },
    { status: 200, ...init }
  );
}

/**
 * Standardised error JSON response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      message,
      ...(details || {}),
    },
    { status }
  );
}
