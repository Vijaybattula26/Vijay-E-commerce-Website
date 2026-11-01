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

- Store data (products, categories, cart, wishlist, orders, customer, settings) lives in localStorage via the repositories in `src/lib/db.ts`; pure rules live in `src/lib/commerce.ts` (tested in `src/test/commerce.test.ts`). Why: the owner asked for a backend-free demo that can later swap to a real database without UI changes.
- Admin under `/admin` is a device-local demo passcode gate (`ssr: false`), not real security. Why: no backend auth exists yet; replace before launch.
