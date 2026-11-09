# Password-only customer login
- [ ] Show phone visitors an install offer with Android and iPhone support; verify dismissal and installed-app suppression.
- [x] Make New product picture selection prominent and verify authenticated upload and save.
- [x] Remove any remaining OTP login path and enforce strong passwords with a live signup checklist.
- [x] Verify new-account signup and password login, including hosted confirmation behavior.

# Admin audit log
 
# Customer authentication and product uploads
- [ ] Add private full-name and phone profiles, signup validation, and password-only login links.
- [ ] Verify UUID-based admin access without granting roles from signup or credentials.
- [ ] Add /admin/products/new and image preview, upload status, and save validation.
- [ ] Verify signup safety, authenticated image save, and iPhone 7 layout; report hosted limitations.
 
# App security hardening
- [ ] Audit browser credential exposure and sensitive logging.
- [ ] Validate forms and committed data; use UUID admin membership.
- [ ] Add thirty-minute admin inactivity sign-out and security headers.
- [ ] Verify protections and report hosted settings that cannot be changed automatically.

# Admin audit log
- [x] Record product changes and order updates securely in the database.
- [x] Record successful admin sessions without duplicate refresh entries.
- [x] Add searchable activity page with change details.
- [x] Verify authenticated activity, permissions, and tests.

# Admin password recovery
- [x] Add password sign-in and recovery form at /login.
- [x] Add secure reset-link destination and validation.
- [x] Request reset emails for the three named accounts and report unavailable accounts (828 has no auth account).
- [x] Verify the sign-in page and password validation; actual emailed-link completion requires the recipient's inbox.

# Password-only super-admin login
- [x] Provide a protected admin_users compatibility list and authorize the three requested emails.
- [x] Replace admin OTP with password login, visibility toggle, and verified super-admin access.
- [x] Clear protected state on logout and verify product save and sign-out with the requesting user's verified session.
- [x] Report limitations: supplied password rejected; no automatic credential provisioning; 828 still needs a sign-in account. No otp_codes table exists to remove.

# Admin profile
- [x] Add protected profile page with current-password verification and confirmed email changes.
- [x] Preserve admin membership after confirmed email changes without client role writes.
- [x] Verify validation, authorized page access, and failure handling; successful credential changes remain unverified without the current password and email confirmation.