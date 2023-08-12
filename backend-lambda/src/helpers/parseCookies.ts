import setCookieParser from 'set-cookie-parser';

export const parseCookies = (cookies: string[] | undefined): Record<string, string> => {
  if (cookies == null) {
    return {};
  }
  const parsedCookies: Record<string, string> = {};
  for (const cookie of cookies) {
    const parsedCookie = setCookieParser.parseString(cookie);
    parsedCookies[parsedCookie.name] = parsedCookie.value;
  }

  return parsedCookies;
};
