/**
 * Email Account Detail Routes
 * Routes: DELETE /api/admin/users/[id]/emails/[accountId] - Remove email
 *         PUT /api/admin/users/[id]/emails/[accountId]/primary - Set as primary
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * DELETE /api/admin/users/[id]/emails/[accountId]
 * Remove an email account from a user
 */
export async function DELETE(request, { params }) {
  try {
    const { id: userId, accountId } = params;

    // Verify email account exists and belongs to user
    const { data: account, error: fetchError } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !account) {
      return NextResponse.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

    // Cannot delete if it's the only email (CRM Email)
    if (account.account_type === 'crm') {
      return NextResponse.json(
        { error: 'Cannot delete CRM email. Every user must have a CRM email address.' },
        { status: 400 }
      );
    }

    // Delete the email account
    const { error: deleteError } = await supabase
      .from('user_email_accounts')
      .delete()
      .eq('id', accountId);

    if (deleteError) {
      console.error('Error deleting email account:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Email account removed: ${account.email}`);
    return NextResponse.json({
      success: true,
      message: `Email account ${account.email} has been removed`,
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
 * PUT /api/admin/users/[id]/emails/[accountId]
 * Update email account settings (used for setting primary)
 */
export async function PUT(request, { params }) {
  try {
    const { id: userId, accountId } = params;
    const { isPrimary } = await request.json();

    // Verify email account exists and belongs to user
    const { data: account, error: fetchError } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !account) {
      return NextResponse.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

    if (typeof isPrimary === 'boolean') {
      if (isPrimary) {
        // Set this as primary: unset all others for this user
        await supabase
          .from('user_email_accounts')
          .update({ is_primary: false })
          .eq('user_id', userId);

        // Set this one as primary
        const { error: updateError } = await supabase
          .from('user_email_accounts')
          .update({ is_primary: true })
          .eq('id', accountId);

        if (updateError) {
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }

        console.log(`✅ Primary email updated to: ${account.email}`);
        return NextResponse.json({
          success: true,
          message: `${account.email} is now the primary email`,
        });
      } else {
        // Trying to unset primary - not allowed
        return NextResponse.json(
          { error: 'At least one email must be marked as primary' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'No updates requested' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
