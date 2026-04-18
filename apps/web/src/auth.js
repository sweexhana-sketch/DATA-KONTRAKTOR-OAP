/**
 * Authentication configuration for Pendataan Kontraktor OAP.
 * This file is aliased and uses the JWT strategy for Vercel compatibility.
 */
import CreateAuth from "@auth/create"

export const { auth } = CreateAuth()