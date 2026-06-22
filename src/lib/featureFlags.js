import { supabase } from './supabase';

export async function checkFeature(officeId, feature) {
  try {
    if (!officeId) return false;

    // Fetch the active subscription for the tenant office branch
    const { data: sub, error } = await supabase
      .from('tenant_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('office_id', officeId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !sub || !sub.subscription_plans) {
      // Default basic fallback: if no subscription plan found, allow default basic free features
      const defaultFeatures = {
        human_document_review: true,
        events: true,
        cctv: false,
        ai_document_analysis: false
      };
      return defaultFeatures[feature] === true;
    }

    const planFeatures = sub.subscription_plans.features;

    // Check boolean feature toggles or numeric limits
    if (typeof planFeatures[feature] === 'boolean') {
      return planFeatures[feature] === true;
    }

    if (typeof planFeatures[feature] === 'number' || typeof planFeatures[feature] === 'string') {
      return planFeatures[feature];
    }

    return false;
  } catch (err) {
    console.error('[Feature Flag Helper Error]', err);
    return false;
  }
}

export async function getPlanQuota(officeId, quotaKey) {
  try {
    if (!officeId) return 0;

    const { data: sub, error } = await supabase
      .from('tenant_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('office_id', officeId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !sub || !sub.subscription_plans) {
      // Fallback quotas (e.g. GO plan defaults)
      const defaultQuotas = {
        student_quota: 7,
        staff_quota: 2,
        cctv_max_cameras: 0,
        ai_document_analysis_quota: 0
      };
      return defaultQuotas[quotaKey] || 0;
    }

    const plan = sub.subscription_plans;
    
    if (quotaKey === 'student_quota') return plan.student_quota_max;
    if (quotaKey === 'staff_quota') return plan.staff_accounts;
    if (quotaKey === 'cctv_max_cameras') return plan.features?.cctv_max_cameras || 0;
    if (quotaKey === 'ai_document_analysis_quota') return plan.features?.ai_document_analysis_quota || 0;

    return 0;
  } catch (err) {
    console.error('[Plan Quota Helper Error]', err);
    return 0;
  }
}
