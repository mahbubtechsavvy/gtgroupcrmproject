/**
 * Email Policies API Route
 * POST /api/policies/create - Create new policy
 * PUT /api/policies/update - Update policy
 * GET /api/policies/list - List all policies
 * POST /api/policies/deactivate - Deactivate policy
 * GET /api/policies/audit - Get audit log
 */

import {
  createEmailPolicy,
  updatePolicyRules,
  getActivePolicies,
  deactivatePolicy,
  getPolicyAuditLog,
} from '@/lib/emailPolicies';

export async function POST(request) {
  try {
    const { action, ...data } = await request.json();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return Response.json(
        { success: false, error: 'Missing user ID' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'create':
        const createResult = await createEmailPolicy(data.policyData, userId);
        return Response.json(createResult);

      case 'update':
        const updateResult = await updatePolicyRules(
          data.policyId,
          data.newRules,
          userId
        );
        return Response.json(updateResult);

      case 'deactivate':
        const deactivateResult = await deactivatePolicy(data.policyId, userId);
        return Response.json(deactivateResult);

      case 'list':
        const policies = await getActivePolicies(userId);
        return Response.json({ success: true, policies });

      case 'audit':
        const auditLog = await getPolicyAuditLog(data.policyId);
        return Response.json({ success: true, auditLog });

      default:
        return Response.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] Policies error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return Response.json(
        { success: false, error: 'Missing user ID' },
        { status: 401 }
      );
    }

    const policies = await getActivePolicies(userId);
    return Response.json({ success: true, policies });
  } catch (error) {
    console.error('[API] Get policies error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
