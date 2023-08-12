import { verify } from 'jsonwebtoken';
import { isDecodedJWT } from '../types.guard';
import { SSM } from '@aws-sdk/client-ssm';
import { maybeGetSecret } from './maybeGetSecret';
import { isFailure, successValue } from './result';

const ATTEND_JWT_PRIVATE_KEY = process.env.ATTEND_JWT_PRIVATE_KEY;
const ATTEND_JWT_AUDIENCE = process.env.ATTEND_JWT_AUDIENCE;
const ATTEND_JWT_ISSUER = process.env.ATTEND_JWT_ISSUER;

export const verifyToken = async (ssm: SSM, token: string): Promise<boolean> => {
  if (!ATTEND_JWT_PRIVATE_KEY) {
    console.log('ATTEND_JWT_PRIVATE_KEY not set');
    return false;
  }
  if (!ATTEND_JWT_AUDIENCE) {
    console.log('ATTEND_JWT_AUDIENCE not set');
    return false;
  }
  if (!ATTEND_JWT_ISSUER) {
    console.log('ATTEND_JWT_ISSUER not set');
    return false;
  }

  const maybePrivateKey = await maybeGetSecret(ssm, ATTEND_JWT_PRIVATE_KEY);

  if (isFailure(maybePrivateKey)) {
    console.log(`Unable to get ${ATTEND_JWT_PRIVATE_KEY}`, maybePrivateKey.value);
    return false;
  }
  const jwtPrivateKey = successValue(maybePrivateKey);

  let decodedToken;
  try {
    decodedToken = verify(token, jwtPrivateKey, { algorithms: ['HS256'] });
  } catch (err) {
    console.log(`Error decoding JWT: ${(err as Error).message} for ${token}`);
    return false;
  }

  if (!isDecodedJWT(decodedToken)) {
    return false;
  }

  if (decodedToken.iss !== ATTEND_JWT_ISSUER || decodedToken.aud !== ATTEND_JWT_AUDIENCE) {
    console.log(`Unexpected iss ${decodedToken.iss} or aud ${decodedToken.aud}`);
    return false;
  }

  return true;
};
