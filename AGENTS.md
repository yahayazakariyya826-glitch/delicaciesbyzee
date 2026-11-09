<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Audit product mutations and order updates with database triggers, not browser inserts, so committed changes cannot bypass logging.
- Audit sign-ins through an authenticated RPC deduplicated by verified session ID; never accept actor identity from client input.
- Keep audit history append-only for app users and readable only through the existing database admin authorization.
- Password recovery uses Cloud Auth email links and a public recovery page unlocked by PASSWORD_RECOVERY, never by an ordinary session alone.
- Keep admin_users a read-only, trigger-synchronized projection of admins; the existing protected admins authority remains the single source of roles to prevent privilege escalation.
- Verify admin routes before rendering using Cloud Auth getUser and protected membership reads; cancel and clear cached data before sign-out so protected state cannot survive logout.
- Never provision accounts or embed credentials in app startup; account creation and password recovery use Cloud Auth's secure flows.
- Customer signup creates private profiles through an Auth lifecycle trigger; profile metadata must never assign admin roles.
- Product creation reuses the products editor at an un-nested new-product route so the existing list stays unchanged.
- Installation offers use browser installation when available and platform-specific home-screen instructions otherwise; never assume every mobile browser fires beforeinstallprompt.
- Bind the existing admins authority to verified Auth UUIDs; app-owned Auth lifecycle triggers synchronize confirmed email changes into admins and its read-only admin_users projection, never copy roles from browser input.
- Signed-in profile changes require the current password; password updates send current_password to Cloud Auth, and email changes reauthenticate before requesting Auth-managed confirmation. Keep recovery separate.
