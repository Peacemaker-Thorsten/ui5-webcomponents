import { getTheme, getCompactSize } from "../Configuration";
import getEffectiveRTL from "../util/getEffectiveRTL";

import { injectWebComponentStyle } from "../theming/StyleInjection";
import { registerStyle } from "../theming/ThemeBundle";

import setupBrowser from "../util/setupBrowser";
import setupOS from "../util/setupOS";
import setupSystem from "../util/setupSystem";
import { getEffectiveStyle } from "../Theming";
import { createStyle } from "../CSS";

// shadow DOM templates per tag
const shadowDOMTemplates = new Map();

/**
 * Prepares the shadow DOM for a custom element, depending on the usage of the polyfill
 */
class ShadowDOM {
	constructor() {
		throw new Error("Static class");
	}

	static registerStyle(theme, styleName, styleContent) {
		registerStyle(theme, styleName, styleContent);
	}

	static async prepareShadowDOM(ElementClass) {
		const tag = ElementClass.getMetadata().getTag();
		const isRTL = getEffectiveRTL();
		const isCompact = getCompactSize();

		let shadowDOM,
			rootSpan;

		if (window.ShadyDOM) {
			// inject the styles in the <head>
			const cssContent = getEffectiveStyle(ElementClass);
			injectWebComponentStyle(tag, cssContent);

			// Create the shadow DOM root span
			rootSpan = document.createElement("span");
			rootSpan.setAttribute("data-sap-ui-wc-root", "");
			shadowDOM = rootSpan;
		} else {
			let template = this._getTemplateFor(tag);

			if (!template) {
				const style = createStyle(ElementClass);
				template = this._createTemplateFor(tag, style);
			}
			shadowDOM = template.content.cloneNode(true);

			rootSpan = shadowDOM.querySelector("span[data-sap-ui-wc-root]");
		}

		setupBrowser(rootSpan);
		setupOS(rootSpan);
		setupSystem(rootSpan);

		if (isCompact) {
			rootSpan.classList.add("sapUiSizeCompact");
		}

		if (isRTL) {
			rootSpan.setAttribute("dir", "rtl");
		}

		return shadowDOM;
	}

	static _getTemplateFor(tag) {
		const theme = getTheme();
		const themeMap = shadowDOMTemplates.get(theme);
		return themeMap && themeMap.get(tag);
	}

	static _createTemplateFor(tag, style) {
		const theme = getTheme();
		let themeMap = shadowDOMTemplates.get(theme);
		if (!themeMap) {
			themeMap = new Map();
			shadowDOMTemplates.set(theme, themeMap);
		}
		const template = document.createElement("template");

		if (style instanceof HTMLElement) {
			template.content.appendChild(style);
		}

		// Create a root span
		const root = document.createElement("span");
		root.setAttribute("data-sap-ui-wc-root", "");

		template.content.appendChild(root);

		themeMap.set(tag, template);
		return template;
	}
}

export default ShadowDOM;
