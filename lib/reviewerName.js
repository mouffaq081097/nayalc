/**
 * How a reviewer is shown: "Sara M." — first name and last initial from the
 * account. Never the email or the login handle, which for code and Google
 * sign-ins is a generated id (u_google_…) and for older accounts can be an
 * email. Isomorphic: the reviews API and the homepage use it on the server.
 */
const cap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : '');

export function reviewerName({ first_name: firstName, last_name: lastName, username } = {}) {
  const first = String(firstName || '').trim().split(/\s+/)[0];
  const last = String(lastName || '').trim();
  if (first) return last ? `${cap(first)} ${last.charAt(0).toUpperCase()}.` : cap(first);

  // Older accounts without names: a readable handle ("sara.mansour" → "Sara M."), never a generated one
  const handle = String(username || '').split('@')[0];
  if (!handle || /^u_/.test(handle)) return 'Customer';
  const [one, two] = handle.replace(/[._-]+/g, ' ').replace(/\d+/g, ' ').trim().split(/\s+/);
  if (!one) return 'Customer';
  return two ? `${cap(one)} ${two.charAt(0).toUpperCase()}.` : cap(one);
}
