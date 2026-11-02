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
- [ ] Provide a protected admin_users compatibility list and authorize the three requested emails.
- [ ] Replace admin OTP with password login, visibility toggle, and verified super-admin access.
- [ ] Clear protected state on logout and verify login, product access, and sign-out.
- [ ] Report account/password provisioning limitations without embedding credentials.