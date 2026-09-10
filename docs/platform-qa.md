# EventOS Platform Q&A

Quick answers to the most common questions about using EventOS. This file is indexed by the EventOS Helper assistant.

## How do I get my venue approved?

Venue owners register venues from their dashboard. The venue is created in a pending state and must be approved by a platform admin before it can be booked by organizations. You will see an approval status on your venue. Once approved, your venue appears in the public venue list and the venue-owner dashboard.

## How do I get my organization approved?

Create an organization and wait for a platform admin to approve it. Organizations go through a lifecycle: pending, approved, or rejected. If rejected, the rejection reason is shown and you can fix it. Organization owners and members must belong to an approved organization to book venues and create events.

## How does venue booking work?

Organizations request a venue for a specific date or date range. The request creates a pending booking. The venue owner approves or rejects the request. Pending and approved bookings block the same dates from being double-booked, so overlapping requests are automatically rejected. Example questions from users: "How do I book a venue?" and "Why is this date unavailable?"

## What is the difference between soft-delete and permanent-delete?

Soft-delete hides a resource (user, organization, or venue owner) while keeping the data, so it can be restored later. Permanent-delete removes the data forever and cannot be undone. Permanent-delete requires the admin to type the exact confirmation name, and it is not allowed for the admin's own account or for admin-role users.

## How do Google sign-in and email verification work?

You can register with email and password or sign in with Google. Local accounts must verify their email with a one-time link that expires after 24 hours. Google accounts are verified automatically. After login you receive an access token and a refresh token stored in a secure cookie.

## What roles exist on EventOS?

There are three user types: user, venue owner, and admin, alongside organization owner and organization member roles. Admins manage users, organizations, venues, and events at the platform level. Venue owners manage their venues and booking approvals. Organization owners manage their organization, its members, and its events.

## How does the event lifecycle work?

An event is created as a draft. Creating an event also creates a venue booking request. When the venue owner approves the booking, the event becomes published. Events move through draft, published, ongoing, and completed states, and can be cancelled. Events can span multiple days using a start date and an end date.

## Can I restore a deleted organization?

Yes. An organization deleted by an admin can be restored by the platform admin, and the organization owner also sees a restore banner on the organization page. Restoring brings back the organization and its cascaded members and events.