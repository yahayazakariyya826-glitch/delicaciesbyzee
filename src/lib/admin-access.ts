export function isSuperAdminMembership(membership: { role: string } | null | undefined) {
  return membership?.role === "super_admin";
}

export async function clearAdminSession(
  cache: { cancelQueries: () => Promise<void>; clear: () => void },
  signOut: () => Promise<{ error: { message: string } | null }>,
) {
  await cache.cancelQueries();
  cache.clear();
  const { error } = await signOut();
  if (error) throw new Error(error.message);
}