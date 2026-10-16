import { handle, jsonBody, PurchasingError } from '@/lib/erp/access';
import { listTeam, setTeamRoles } from '@/lib/erp/team';

export async function GET() {
  return handle(async (access) => {
    if (!access.full) throw new PurchasingError('Only an admin with full purchasing access can see the team.', 403);
    return { access, team: await listTeam() };
  });
}

// { userId, full: true } or { userId, roles: [...] }
export async function PUT(request) {
  const body = await jsonBody(request);
  return handle(async (access) => setTeamRoles(access, body), { failure: 'The roles could not be saved.' });
}
