import { handle } from '@/lib/erp/access';

// The signed-in admin's purchasing roles, so pages show only what they can do
export async function GET() {
  return handle(async (access) => ({ access }));
}
