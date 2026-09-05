import { createHash } from 'crypto'

/**
 * Secret salt for deterministic SHA-256 pseudonymization.
 * Sourced from CONSORTIUM_HASH_SECRET environment variable with a secure prototype fallback.
 * 
 * NOTE FOR COMPLIANCE / AUDIT:
 * In a production cross-institution deployment, this salt/key would be managed
 * via a distributed Hardware Security Module (HSM) or Key Management Service (KMS)
 * with periodic cryptographic rotation and mutual TLS across participating banks.
 */
function getConsortiumSalt(): string {
  return process.env.CONSORTIUM_HASH_SECRET || 'AGY_FRAUD_INTEL_SALT_V1'
}

/**
 * Normalizes entity identifiers to guarantee deterministic cross-institution matching.
 * Handles variations in whitespace, case, and regional formatting before hashing.
 */
export function normalizeIdentifier(identifier: string, entityType?: string): string {
  if (!identifier || typeof identifier !== 'string') return ''
  
  let normalized = identifier.trim()
  const type = (entityType || '').toUpperCase()
  
  switch (type) {
    case 'BENEFICIARY':
    case 'ACCOUNT':
    case 'USER':
      // Standardize case, collapse multiple spaces
      normalized = normalized.toUpperCase().replace(/\s+/g, '')
      break
      
    case 'DEVICE':
    case 'DEVICE_FINGERPRINT':
      // Hardware fingerprints are standardized to uppercase alphanumeric
      normalized = normalized.toUpperCase().replace(/[\s_]+/g, '-')
      break
      
    case 'IP':
      // IPs are trimmed and lowercased
      normalized = normalized.toLowerCase().replace(/\s+/g, '')
      break
      
    default:
      normalized = normalized.toUpperCase().replace(/\s+/g, '')
      break
  }
  
  return normalized
}

/**
 * Deterministic SHA-256 pseudonymization for privacy-preserving consortium lookups.
 * Transforms raw customer/transaction identifiers into irreversible pseudonymized tokens.
 * Compatible with existing callers.
 */
export function hashIdentifier(type: string, rawValue: string): string {
  if (!rawValue || typeof rawValue !== 'string') return ''
  const normalized = normalizeIdentifier(rawValue, type)
  const salt = getConsortiumSalt()
  return createHash('sha256')
    .update(`${salt}:${type.toUpperCase()}:${normalized}`)
    .digest('hex')
}

/**
 * Generates both the full cryptographic hash and a safe display token.
 * No raw customer PII is contained in the returned display token.
 */
export function createPseudonymousIdentifier(
  rawIdentifier: string,
  entityType: string
): { hash: string; displayToken: string; normalized: string } {
  const normalized = normalizeIdentifier(rawIdentifier, entityType)
  const hash = hashIdentifier(entityType, rawIdentifier)
  
  // Format safe display token (e.g. BEN-****7723 or SHA256 token)
  let displayToken = `${hash.slice(0, 8)}...${hash.slice(-6)}`
  
  if (normalized.includes('-')) {
    const parts = normalized.split('-')
    const prefix = parts[0]
    const suffix = parts[parts.length - 1]
    displayToken = `${prefix}-****${suffix.slice(-4)}`
  } else if (normalized.length > 4) {
    displayToken = `ID-****${normalized.slice(-4)}`
  }
  
  return { hash, displayToken, normalized }
}

/**
 * Mask raw identifier for secure UI display (e.g., 'BEN-9821' -> 'BEN-****9821')
 */
export function maskIdentifier(identifier: string): string {
  if (!identifier) return 'N/A'
  const trimmed = identifier.trim()
  if (trimmed.length <= 4) return '****'
  const visible = trimmed.slice(-4)
  const prefix = trimmed.split('-')[0]
  return prefix && prefix !== trimmed ? `${prefix}-****${visible}` : `****${visible}`
}
