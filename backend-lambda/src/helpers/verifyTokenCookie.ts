import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { parseCookies } from './parseCookies';
import { ResultP, failure, isFailure } from './result';
import { verifyToken } from './verifyToken';
import { DecodedJWT } from '../types';

export const verifyTokenCookie = async (
  event: APIGatewayProxyEventV2,
  forceRefreshTokenKey = false,
): ResultP<Error, DecodedJWT> => {
  const ndvCookie = parseCookies(event.cookies).NDV_AUD;
  if (ndvCookie == null) {
    console.log(`(requestId=${event.requestContext.requestId}) Access denied because there was no token in NDV_AUD.`);
    return failure(new Error('Server error'));
  }

  const maybeToken = await verifyToken(ndvCookie, forceRefreshTokenKey);

  if (isFailure(maybeToken)) {
    console.log(
      `(requestId=${event.requestContext.requestId}) Access denied because the token in NDV_AUD did not verify.`,
    );
    return failure(new Error('Access denied'));
  }

  return maybeToken;
};
