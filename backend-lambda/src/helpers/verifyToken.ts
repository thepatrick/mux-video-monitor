import { verify } from 'jsonwebtoken';
import { isDecodedJWT } from '../types.guard';
import { ResultP, failure, isFailure, success, successValue } from './result';
import { getCachedSecret } from './getCachedSecret';
import { DecodedJWT } from '../types';

const ATTEND_JWT_PRIVATE_KEY = process.env.ATTEND_JWT_PRIVATE_KEY;
const ATTEND_JWT_AUDIENCE = process.env.ATTEND_JWT_AUDIENCE;
const ATTEND_JWT_ISSUER = process.env.ATTEND_JWT_ISSUER;

export const verifyToken = async (token: string, forceRefreshKey = false): ResultP<Error, DecodedJWT> => {
  if (!ATTEND_JWT_PRIVATE_KEY) {
    console.log('ATTEND_JWT_PRIVATE_KEY not set');
    return failure(new Error('ATTEND_JWT_PRIVATE_KEY not set'));
  }
  if (!ATTEND_JWT_AUDIENCE) {
    console.log('ATTEND_JWT_AUDIENCE not set');
    return failure(new Error('ATTEND_JWT_AUDIENCE not set'));
  }
  if (!ATTEND_JWT_ISSUER) {
    console.log('ATTEND_JWT_ISSUER not set');
    return failure(new Error('ATTEND_JWT_ISSUER not set'));
  }

  const maybePrivateKey = await getCachedSecret(ATTEND_JWT_PRIVATE_KEY, forceRefreshKey);

  if (isFailure(maybePrivateKey)) {
    console.log(`Unable to get ${ATTEND_JWT_PRIVATE_KEY}`, maybePrivateKey.value);
    return failure(new Error('Server error'));
  }
  const jwtPrivateKey = successValue(maybePrivateKey);

  let decodedToken;
  try {
    decodedToken = verify(token, jwtPrivateKey, { algorithms: ['HS256'] });
  } catch (err) {
    console.log(`Error decoding JWT: ${(err as Error).message} for ${token}`);
    return failure(new Error('JWT Invalid'));
  }

  if (!isDecodedJWT(decodedToken)) {
    return failure(new Error('JWT Invalid'));
  }

  if (decodedToken.iss !== ATTEND_JWT_ISSUER || decodedToken.aud !== ATTEND_JWT_AUDIENCE) {
    console.log(`Unexpected iss ${decodedToken.iss} or aud ${decodedToken.aud}`);
    return failure(new Error('JWT Invalid'));
  }

  return success(decodedToken);
};
