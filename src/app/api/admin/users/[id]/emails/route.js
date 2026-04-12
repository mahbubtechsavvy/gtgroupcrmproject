/**
 * Email Management API
 * Routes: GET /api/admin/users/[id]/emails - Get all email accounts
 *         POST /api/admin/users/[id]/emails - Add email account
 *         DELETE /api/admin/users/[id]/emails/[accountId] - Remove email account
 *         PUT /api/admin/users/[id]/emails/[accountId] - Update email account
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/admin/users/[id]/emails
 * Get all email accounts for a user
 */
export async function GET(request, { params }) {
  try {
    const { id: userId } = params;

    // Get email accounts
    const { data: accounts, error } = await supabase
      .from('user_email_accounts')
      .select('id, email, email_type, is_primary, is_verified, verified_at, oauth_token')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email accounts:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      accounts: accounts || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/[id]/emails
 * Add a new email account (CRM or Gmail)
 */
export async function POST(request, { params }) {
  try {
    const { id: userId } = params;
    const { email, emailType, oauthToken, oauthRefreshToken, oauthExpiresAt } =
      await request.json();

    if (!email || !emailType) {
      return NextResponse.json(
        { error: 'Missing required fields: email, emailType' },
        { status: 400 }
      );
    }

    if (!['crm', 'gmail'].includes(emailType)) {
      return NextResponse.json(
        { error: 'Invalid emailType. Must be "crm" or "gmail"' },
        { status: 400 }
      );
    }

    // For CRM emails, must be unique per user
    if (emailType === 'crm') {
      const { data: existing } = await supabase
        .from('user_email_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('account_type', 'crm')
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'User already has a CRM email address' },
          { status: 400 }
        );
      }
    }

    // Add email account
    const { data: newAccount, error } = await supabase
      .from('user_email_accounts')
      .insert({
        user_id: userId,
        email,
        account_type: emailType,
        oauth_token: emailType === 'gmail' ? oauthToken : null,
        oauth_refresh_token: emailType === 'gmail' ? oauthRefreshToken : null,
        oauth_expires_at: emailType === 'gmail' ? oauthExpiresAt : null,
        is_verified: emailType === 'crm' ? false : true, // Gmail auto-verified by OAuth
        is_primary: emailType === 'crm', // CRM Email is primary by default
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding email account:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Email account added for user ${userId}: ${email}`);
    return NextResponse.json({
      success: true,
      accountId: newAccount.id,
      account: newAccount,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/emails/[accountId]
 * Remove an email account
 */
export async function DELETE(request, { params }) {
  try {
    const { id: userId } = params;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId parameter' },
        { status: 400 }
      );
    }

    // Verify the account belongs to the user
    const { data: account } = await supabase
      .from('user_email_accounts')
      .select('email_type')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

    // Cannot delete CRM email (primary)
    if (account.email_type === 'crm') {
      return NextResponse.json(
        { error: 'Cannot delete CRM email (primary). Admin must create a new one.' },
        { status: 400 }
      );
    }

    // Delete the account
    const { error } = await supabase
      .from('user_email_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      console.error('Error deleting email account:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Email account deleted for user ${userId}: ${accountId}`);
    return NextResponse.json({
      success: true,
      message: 'Email account removed',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]/emails/[accountId]/primary
 * Set email account as primary
 */
export async function PUT(request, { params }) {
  try {
    const { id: userId } = params;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const isPrimary = searchParams.get('isPrimary') === 'true';

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId parameter' },
        { status: 400 }
      );
    }

    // Verify the account belongs to the user
    const { data: account } = await supabase
      .from('user_email_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

    if (isPrimary) {
      // Remove primary from all other emails
      await supabase
        .from('user_email_accounts')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Set this as primary
      const { error } = await supabase
        .from('user_email_accounts')
        .update({ is_primary: true })
        .eq('id', accountId);

      if (error) throw error;
    } else {
      // Can't unset primary - at least one must be primary
      const { data: primaryCount } = await supabase
        .from('user_email_accounts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_primary', true);

      if (primaryCount?.length === 1) {
        return NextResponse.json(
          { error: 'User must have at least one primary email' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('user_email_accounts')
        .update({ is_primary: false })
        .eq('id', accountId);

      if (error) throw error;
    }

    console.log(`✅ Email account primary status updated for user ${userId}: ${accountId}`);
    return NextResponse.json({
      success: true,
      message: isPrimary ? 'Email set as primary' : 'Email removed as primary',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
