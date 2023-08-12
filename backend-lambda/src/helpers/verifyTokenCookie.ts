import { SSM } from '@aws-sdk/client-ssm';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { verifyToken } from './verifyToken';
import { parseCookies } from './parseCookies';

export const verifyTokenCookie = async (ssm: SSM, event: APIGatewayProxyEventV2) => {
  const ndvCookie = parseCookies(event.cookies).NDV_AUD;
  if (ndvCookie == null) {
    console.log(`(requestId=${event.requestContext.requestId}) Access denied because there was no token in NDV_AUD.`);
    return false;
  }

  if (!(await verifyToken(ssm, ndvCookie))) {
    console.log(
      `(requestId=${event.requestContext.requestId}) Access denied because the token in NDV_AUD did not verify.`,
    );
    return false;
  }

  return true;
};
