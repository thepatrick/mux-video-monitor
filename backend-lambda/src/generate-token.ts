import { sign } from 'jsonwebtoken';

const ATTEND_JWT_PRIVATE_KEY = process.env.ATTEND_JWT_PRIVATE_KEY;
const ATTEND_JWT_AUDIENCE = process.env.ATTEND_JWT_AUDIENCE;
const ATTEND_JWT_ISSUER = process.env.ATTEND_JWT_ISSUER;

if (!ATTEND_JWT_PRIVATE_KEY) {
  throw new Error('ATTEND_JWT_PRIVATE_KEY not set');
}
if (!ATTEND_JWT_AUDIENCE) {
  throw new Error('ATTEND_JWT_AUDIENCE not set');
}
if (!ATTEND_JWT_ISSUER) {
  throw new Error('ATTEND_JWT_ISSUER not set');
}

console.log(
  sign(
    {
      iss: ATTEND_JWT_AUDIENCE,
      aud: ATTEND_JWT_ISSUER,
      sub: 'generate-token.ts',
    },
    ATTEND_JWT_PRIVATE_KEY,
    { expiresIn: '7d', algorithm: 'HS256' },
  ),
);
