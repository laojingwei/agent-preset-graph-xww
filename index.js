/**
 * Host half of the preset node-graph bundle.
 *
 * DeepSeek Harness loads every plugin through `apply(ctx)`. This bundle does all
 * of its work on the Client — the graph is derived from Host services the Client
 * can already reach (`remote.pluginInventory`, `ctx.sessions`, `ctx.locale`) —
 * so the Host half registers nothing and exists to give the bundle a Loader row,
 * which is what makes the Client half activate at all.
 *
 * @param ctx - the Host plugin context. Intentionally unused: there is no
 *   host-side state to own, no service to provide, and no event to observe.
 */
export function apply(ctx) {
  // Keep the harness from warning about an unused binding while documenting that
  // the omission is deliberate rather than an oversight.
  void ctx;
}
