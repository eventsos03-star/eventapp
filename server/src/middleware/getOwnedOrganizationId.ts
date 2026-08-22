import Organization from "../modules/organization/organization.model.js"; // adjust path to match your structure
// import Event from "../modules/event/event.model.js";

export async function getOwnedOrganizationId(userId: string): Promise<string | null> {
  const org = await Organization.findOne({
    ownerId: userId,
    status: 'approved', // pending/rejected/blocked all resolve to null — same as "no org"
  }).select('_id');
  return org ? org._id.toString() : null;
}

