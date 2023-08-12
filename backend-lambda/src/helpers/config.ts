const myabeJWTPrivateKey = process.env.ATTEND_JWT_PRIVATE_KEY;
const maybeJWTAudience = process.env.ATTEND_JWT_AUDIENCE;

if (myabeJWTPrivateKey === undefined) {
  throw new Error('ATTEND_JWT_PRIVATE_KEY not set');
}

if (maybeJWTAudience === undefined) {
  throw new Error('ATTEND_JWT_AUDIENCE not set');
}

export const jwtPrivateKey = myabeJWTPrivateKey;
export const jwtAudience = maybeJWTAudience;
