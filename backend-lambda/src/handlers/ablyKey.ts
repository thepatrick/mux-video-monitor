import { SSM } from '@aws-sdk/client-ssm';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { catchErrors } from '../helpers/catchErrors';
import { credentialProvider } from '../helpers/credentialProvider';
import { maybeGetSecret } from '../helpers/maybeGetSecret';
import { accessDenied, notFound, response } from '../helpers/response';
import { isFailure, successValue } from '../helpers/result';
import { verifyTokenCookie } from '../helpers/verifyTokenCookie';

const ABLY_CLIENT_KEY = process.env.ABLY_CLIENT_KEY;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ablyKey: APIGatewayProxyHandlerV2 = catchErrors(async (event, context) => {
  if (!ABLY_CLIENT_KEY) {
    console.log('ABLY_CLIENT_KEY not set');
    return notFound();
  }
  const ssm = new SSM({ credentials: credentialProvider });

  if (!(await verifyTokenCookie(ssm, event))) {
    return accessDenied();
  }

  const maybeKey = await maybeGetSecret(ssm, ABLY_CLIENT_KEY);
  if (isFailure(maybeKey)) {
    console.log(`Unable to get ${ABLY_CLIENT_KEY}`, maybeKey.value);
    return notFound();
  }

  const key = successValue(maybeKey);

  return response({ ok: true, key }, 200, {
    'Cache-Control': 'no-cache',
  });
});
