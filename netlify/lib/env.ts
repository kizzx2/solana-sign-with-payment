export const SOLANA_API_URL = process.env.SOLANA_API_URL ?? 'mainnet-beta';
export const PAYMENT_DESTINATION = process.env.PAYMENT_DESTINATION;
export const JWK_PRIVATE_KEY = process.env.JWK_PRIVATE_KEY;
export const JWT_ALGORITHM = (process.env.JWT_ALGORITHM ?? "ES256");
export const JWT_EXPIRY = +(process.env.JWT_EXPIRY ?? "600");
export const MIN_LAMPORTS = +(process.env.MIN_LAMPORTS ?? "100000")
export const MAX_LAMPORTS = +(process.env.MAX_LAMPORTS ?? "999999")