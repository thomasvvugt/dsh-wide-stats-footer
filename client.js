/**
 * dsh-wide-stats-footer, browser half.
 *
 * Un-clamps the composer stats footer — the line under the input card:
 * "1 turns · 85 steps | LLM 11m45s · Tool call 23.5s | TTFT avg 3.4s ·
 * 87 tok/s | Cache hit 98% | Input 6.2M tok · Output 37.7K tok".
 *
 * Stock rule (hashed CSS module in @deepseek-ai/dsh-client-ui-conversation):
 *
 *   .{hash}_root { text-align:center;
 *     max-width: var(--dsh-chat-content-width);        <- the 748px clamp
 *     padding: 4px calc(var(--dsh-composer-side-clearance) + 16px) 0;
 *     white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
 *     margin:0 auto; width:100%; }
 *
 * Two independent fix paths, either of which is sufficient:
 *
 *  1. STYLESHEET: inject `.{hash}_root.{hash}_root{max-width:none;
 *     padding-left:0; padding-right:0}` (doubled class = specificity (0,2,0)
 *     over the base (0,1,0), order-independent). Covers elements rendered
 *     later; survives React re-renders.
 *
 *  2. INLINE: find the footer element itself in the DOM and set
 *     el.style.maxWidth/paddingLeft/paddingRight directly. Inline style
 *     outranks every stylesheet — third-party theme CSS included.
 *
 * The hash is NEVER hardcoded (it changes on every rebuild of the
 * conversation package). It is discovered from two independent sources:
 *   - stylesheets: the unique separator rule `.{hash}_sep` carrying the
 *     stats-line separator color (var(--dsw-alias-separator-primary)) — its
 *     margin values are host-version-dependent (0.1.1: 0 10px, 0.1.5:
 *     0 6px) and are deliberately NOT matched — verified against the
 *     sibling `.{hash}_root` width clamp;
 *   - the DOM: <span class="{hash}_sep">|</span> — the only *_sep element
 *     in the app whose text content is a literal pipe — whose ancestor
 *     carries the matching `{hash}_root` class.
 *
 * A MutationObserver on <head> re-runs stylesheet discovery as style tags
 * arrive (boot order, HMR rebuilds, theme swaps); one on <body> (rAF
 * coalesced) catches the footer element when the session view mounts it,
 * and re-applies the inline fix if React ever remounts it.
 *
 * Diagnostics: window.__WIDE_STATS_FOOTER__ reports what happened —
 * hashes discovered from each source, override tag length, number of
 * inline-fixed elements, timestamps. One console.info line per boot.
 */
window.__ModuleLoader__.load({
	id: "dsh-wide-stats-footer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		/** Owner id for the injected <style> tag (HMR bookkeeping). */
		var PLUGIN_ID = "dsh-wide-stats-footer";

		/** Required client services (same activation seat as other client UI plugins). */
		var inject = ["slots"];

		/** Diagnostics surface — read this from the DevTools console. */
		var state = {
			appliedAt: null,
			styleHash: null,
			domHash: null,
			overrideChars: 0,
			inlineFixed: 0,
			lastSyncAt: null,
		};
		try {
			window.__WIDE_STATS_FOOTER__ = state;
		} catch (error) {
			/* non-fatal */
		}

		/** Stats-line separator rule signature: `.{hash}_sep`, single class selector. */
		var SEPARATOR_RULE = /^\.([A-Za-z0-9_-]+)_sep$/;

		/** The separator's rendered text — unique among *_sep elements. */
		var SEPARATOR_TEXT = "|";

		/**
		 * Visit every CSSStyleRule across every readable stylesheet.
		 * Returning false from the visitor stops the walk.
		 */
		function eachStyleRule(visit) {
			var sheets = document.styleSheets;
			for (var i = 0; i < sheets.length; i++) {
				var rules;
				try {
					rules = sheets[i].cssRules;
				} catch (error) {
					continue;
				}
				if (rules === null) continue;
				for (var j = 0; j < rules.length; j++) {
					var rule = rules[j];
					if (rule === undefined || rule.type !== 1) continue;
					if (visit(rule) === false) return;
				}
			}
		}

		/**
		 * Discover the stats footer hash from the stylesheets: the unique
		 * `.{hash}_sep` separator rule carrying the separator color, verified
		 * against the sibling `.{hash}_root` rule's width clamp. Only the
		 * color and the clamp are matched — the separator's margins changed
		 * between host releases (0.1.1 `0 10px`, 0.1.5 `0 6px`) and must not
		 * gate discovery.
		 * @returns the hash, or null when not (yet) present.
		 */
		function hashFromStylesheets() {
			var hash = null;
			eachStyleRule(function (rule) {
				var selector = rule.selectorText || "";
				var match = selector.length === 0 ? null : selector.match(SEPARATOR_RULE);
				if (match === null) return;
				if ((rule.style.color || "").indexOf("--dsw-alias-separator-primary") === -1) return;
				hash = match[1];
				return false;
			});
			if (hash === null) return null;
			var rootSelector = "." + hash + "_root";
			var verified = false;
			eachStyleRule(function (rule) {
				if (rule.selectorText !== rootSelector) return;
				if ((rule.style.maxWidth || "").indexOf("--dsh-chat-content-width") === -1) return;
				verified = true;
				return false;
			});
			return verified ? hash : null;
		}

		/**
		 * Whether an element's class list contains `{prefix}_root`.
		 */
		function hasRootClass(el, prefix) {
			var classes = el.classList;
			if (classes === undefined || classes === null) return false;
			return classes.contains(prefix + "_root");
		}

		/**
		 * Discover the footer from the DOM: the *_sep span whose text is a
		 * literal pipe, walked up to the ancestor carrying the matching
		 * `{hash}_root` class.
		 * @returns { hash, root } or null.
		 */
		function footerFromDom() {
			if (!document.body) return null;
			var spans = document.body.querySelectorAll('span[class$="_sep"]');
			for (var i = 0; i < spans.length; i++) {
				var span = spans[i];
				if ((span.textContent || "").trim() !== SEPARATOR_TEXT) continue;
				var classes = span.classList;
				var prefix = null;
				for (var c = 0; c < classes.length; c++) {
					var name = classes.item(c);
					if (name.length > 4 && name.slice(-4) === "_sep") {
						prefix = name.slice(0, -4);
						break;
					}
				}
				if (prefix === null) continue;
				var node = span.parentElement;
				while (node !== null && node.nodeType === 1) {
					if (hasRootClass(node, prefix)) return { hash: prefix, root: node };
					node = node.parentElement;
				}
			}
			return null;
		}

		/** All footer root elements currently in the DOM (one per mounted session view). */
		function footerRoots(prefix) {
			if (!document.body) return [];
			var roots = [];
			var candidates = document.body.querySelectorAll('[class$="_root"]');
			for (var i = 0; i < candidates.length; i++) {
				if (hasRootClass(candidates[i], prefix)) roots.push(candidates[i]);
			}
			return roots;
		}

		/** The override stylesheet text for a discovered hash. */
		function overrideCss(hash) {
			return "." + hash + "_root." + hash + "_root{max-width:none;padding-left:0;padding-right:0}";
		}

		/** Apply the inline fix to one footer element (idempotent). */
		function widenElement(el) {
			if (el.style.maxWidth !== "none") el.style.maxWidth = "none";
			if (el.style.paddingLeft !== "0px") el.style.paddingLeft = "0px";
			if (el.style.paddingRight !== "0px") el.style.paddingRight = "0px";
		}

		/**
		 * Plugin body: install the override tag and both observers, run both
		 * discovery paths immediately, report once.
		 */
		function apply(ctx) {
			ctx.effect(function () {
				var style = document.createElement("style");
				style.dataset.plugin = PLUGIN_ID;
				document.head.append(style);

				var installed = null;
				var sync = function () {
					state.lastSyncAt = new Date().toISOString();

					var sheetHash = hashFromStylesheets();
					if (sheetHash !== null) state.styleHash = sheetHash;
					var dom = footerFromDom();
					if (dom !== null) state.domHash = dom.hash;

					var hash = sheetHash;
					if (hash === null && dom !== null) hash = dom.hash;
					if (hash !== null && hash !== installed) {
						installed = hash;
						style.textContent = overrideCss(hash);
						state.overrideChars = style.textContent.length;
					}

					if (dom !== null) {
						var roots = footerRoots(dom.hash);
						for (var i = 0; i < roots.length; i++) widenElement(roots[i]);
						state.inlineFixed = roots.length;
					}
				};
				sync();

				var headObserver = new MutationObserver(function () {
					sync();
				});
				headObserver.observe(document.head, { childList: true });

				var queued = false;
				var bodyObserver = new MutationObserver(function () {
					if (queued) return;
					queued = true;
					requestAnimationFrame(function () {
						queued = false;
						sync();
					});
				});
				bodyObserver.observe(document.body, { childList: true, subtree: true });

				state.appliedAt = new Date().toISOString();
				try {
					console.info("[dsh-wide-stats-footer] active", JSON.parse(JSON.stringify(state)));
				} catch (error) {
					/* non-fatal */
				}

				return function () {
					headObserver.disconnect();
					bodyObserver.disconnect();
					style.remove();
				};
			}, "wide-stats-footer: stats footer width override");
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
