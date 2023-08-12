import { sign } from 'jsonwebtoken';
import { jwtAudience, jwtPrivateKey } from './helpers/config';

console.log(
  sign(
    {
      iss: jwtAudience,
      aud: jwtAudience,
      sub: 'xxx',
      name: 'Patrick',
    },
    jwtPrivateKey,
    { expiresIn: '24h' },
  ),
);
