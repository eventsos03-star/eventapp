# EventOS Assistant Knowledge

Curated reference for the EventOS Helper assistant. Every answer below reflects how the EventOS application actually behaves.

## About EventOS

EventOS is an event platform where organizations can register, discover and book venues, and run events. Venue owners publish venues and approve booking requests; platform admins approve organizations, venues, and oversee everything at the platform level. If a question is not covered in this document, the assistant should say it does not know and point the user to the platform's support contact.

## Accounts and sign-in

- You can register with an email and password or sign in with Google. Google sign-in is the one-tap option on the login page.
- Local (email/password) accounts must verify their email before their account is fully active. The verification link is one-time and expires after 24 hours. Google accounts are considered verified automatically.
- After signing in you receive an access token and a refresh token stored in secure cookies.
- If an account is blocked, the user cannot sign in until a platform admin restores it.
- Forgot-password reset links are also time-limited; requests to reset or change a password must use a valid, unexpired link.

## Roles

- **User** – base account type. Users can belong to an organization.
- **Organization owner / member** – roles inside an organization. Organization owners manage the organization, its members, and its events.
- **Venue owner** – manages venues and approves or rejects venue booking requests.
- **Admin** – platform-level role. Admins manage users, organizations, venues, and events, and perform approvals and deletions.

## Organizations

- Any user can create an organization. A new organization starts in a **pending** state.
- A platform admin must approve the organization before it can be used. Organizations have a lifecycle: **pending**, **approved**, **rejected**, or **blocked**.
- If an organization is rejected, the rejection reason is shown so the details can be fixed and re-submitted.
- Organization owners and members must belong to an approved organization to book venues and create events.

## Venues

- Venue owners register venues from their dashboard. A new venue starts in a **pending** state.
- A venue must be approved by a platform admin before it can be booked. Venue statuses are **pending**, **approved**, **rejected**, or **blocked**.
- Once approved, the venue appears in the public venue list and in the venue-owner dashboard. If rejected, the venue owner sees the status and can fix the details.
- Venues can be searched by location.

## Bookings

- An organization requests a venue for a specific date or date range. The request creates a **pending** booking.
- The venue owner approves or rejects the request. When approved or rejected, the booking and its linked event update accordingly.
- Pending and approved bookings block those dates from being double-booked, so overlapping requests are automatically rejected. This is why a date can show as unavailable.

## Events

- An event is created as a **draft**.
- Creating an event also creates a venue booking request for the chosen venue and dates.
- When the venue owner approves the booking, the event becomes **published**.
- Events move through the states **draft**, **published**, **ongoing**, and **completed**, and can also be **cancelled**.
- Events can span multiple days by setting a start date and an end date.

## Delete and restore

- Two deletion types exist: **soft-delete** and **permanent-delete**.
- **Soft-delete** hides the resource (user, organization, or venue owner) while keeping its data, so it can be restored later.
- **Permanent-delete** removes the data forever and cannot be undone. It requires the admin to type the exact confirmation name.
- Permanent-delete is not allowed for the admin's own account or for admin-role users.
- A deleted organization can be restored by a platform admin, and the organization owner also sees a restore banner on the organization page. Restoring brings the organization back along with its members and events.

## Contacting support

If the assistant cannot find the answer in this document, advise the user to contact the EventOS support team for help with their specific account or organization.