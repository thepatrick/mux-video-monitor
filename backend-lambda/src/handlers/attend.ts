import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { catchErrors } from '../helpers/catchErrors';
import { accessDenied, notFound, response } from '../helpers/response';
import { verifyToken } from '../helpers/verifyToken';
import { isFailure } from '../helpers/result';

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

  const maybeToken = await verifyToken(token);

  if (isFailure(maybeToken)) {
    return accessDenied();
  }

  return response(
    'Redirecting...',
    302,
    {
      Location: destination,
      'Cache-Control': 'no-cache="Set-Cookie"',
    },
    [`NDV_AUD=${encodeURIComponent(token)}; path=/; secure; HttpOnly; SameSite=Strict`],
  );
});
