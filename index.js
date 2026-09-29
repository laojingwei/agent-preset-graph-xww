/**
 * Host half of the preset node-graph bundle. The graph is derived entirely on
 * the Client from the Host plugin inventory (`remote.pluginInventory`) plus the
 * locale service, so the Host side owns nothing and exists only to give the
 * bundle a Loader row and a Settings section registration point.
 */

/** Host plugin body — no host-side behavior for this surface plugin. */
export function apply() {}
