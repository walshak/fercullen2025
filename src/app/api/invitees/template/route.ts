import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // CSV template with headers
    const csvTemplate = `name,email,title,company,phone,notes,email_invite_flag
John Doe,john.doe@example.com,CEO,Example Corp,+234 123 456 7890,VIP guest,true
Jane Smith,jane.smith@example.com,Marketing Director,Sample Inc,+234 987 654 3210,Industry partner,true
Note: The SN (Serial Number) will be auto-generated as FQ-001 FQ-002 etc.`;

    return new NextResponse(csvTemplate, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="invitees_template.csv"'
      }
    });
  } catch (error) {
    console.error('Error generating CSV template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
