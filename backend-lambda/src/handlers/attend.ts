import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { catchErrors } from '../helpers/catchErrors';
import { accessDenied, notFound, response } from '../helpers/response';
import { ssm } from '../helpers/ssm';
import { verifyToken } from '../helpers/verifyToken';

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

  if (!(await verifyToken(ssm, token))) {
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
