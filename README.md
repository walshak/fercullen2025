# Fercullen Irish Whiskey RSVP App

A sophisticated RSVP management system for the Fercullen Irish Whiskey launch event in Nigeria. Built with Next.js, TypeScript, and SQLite.

## Event Details
- **Date**: October 18, 2025
- **Time**: 5:00 PM WAT
- **Venue**: Monarch Event Center, 138 Lekki - Epe Expressway, Lekki Peninsula II, Lekki 106104, Lagos, Nigeria

## Features

### Admin Dashboard
- **Invitee Management**: Add/edit invitees with unique SN, name, title, company, email, phone, and notes
- **Email Invitations**: Send HTML email invites via Nodemailer with QR codes
- **Bulk Operations**: CSV template download and bulk invitee upload
- **QR Code Generation**: Generate and download PNG QR codes for each invitee
- **RSVP Tracking**: View responses, stats, and check-in guests on event day
- **Invitation Tracking**: Monitor sent invitations

### Invitee Experience
- **RSVP Access**: Via QR code scan or direct link (/rsvp/{invitee_sn})
- **Response Form**: Fill preferences and notes
- **Email Integration**: Receive invitation emails with embedded QR codes

## Technology Stack
- **Frontend**: Next.js 15.5.0, React 19, TypeScript
- **Database**: SQLite
- **Email**: Nodemailer
- **QR Codes**: QR code generation library
- **Styling**: CSS with brand colors (#01315c, #bc9254, #f9d8a4)

## Brand
**Fercullen Irish Whiskey** - Premium Irish whiskey launching in Nigeria

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
