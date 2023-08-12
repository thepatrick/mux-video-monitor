import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { catchErrors } from '../helpers/catchErrors';
import { accessDenied, notFound, response } from '../helpers/response';
import { verify } from 'jsonwebtoken';
import { isDecodedJWT } from '../types.guard';
import { SSM } from '@aws-sdk/client-ssm';
import { credentialProvider } from '../helpers/credentialProvider';
import { maybeGetSecret } from '../helpers/maybeGetSecret';
import { isFailure, successValue } from '../helpers/result';

const ATTEND_JWT_PRIVATE_KEY = process.env.ATTEND_JWT_PRIVATE_KEY;
const ATTEND_JWT_AUDIENCE = process.env.ATTEND_JWT_AUDIENCE;
const ATTEND_JWT_ISSUER = process.env.ATTEND_JWT_ISSUER;

const verifyToken = async (token: string): Promise<boolean> => {
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

  const ssm = new SSM({ credentials: credentialProvider });

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const attend: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  const token = event.pathParameters?.token;
  if (token === undefined || token.length === 0) {
    return notFound();
  }

  const ourHost = event.headers['x-ndv-distribution'] ?? event.requestContext.domainName;

  let destination = `https://${ourHost}/`;
  const where = event.pathParameters?.where;
  if (where !== undefined && where.length > 0) {
    destination = `https://${ourHost}/play.html?where=${encodeURIComponent(where)}`;
  }

  if (!(await verifyToken(token))) {
    return accessDenied();
  }

  return response('Redirecting...', 302, {
    Location: destination,
    'Set-Cookie': `NDV_AUD=${encodeURIComponent(token)}`,
    'Cache-Control': 'no-cache="Set-Cookie"',
  });
});
