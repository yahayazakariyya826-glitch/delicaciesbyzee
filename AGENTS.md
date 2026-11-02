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
