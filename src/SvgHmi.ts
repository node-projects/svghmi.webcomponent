import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { evalWithContext } from "./EvalWithContext.js";

export class SvgHmi extends BaseCustomWebComponentConstructorAppend {

    public static override readonly style = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }`;

    public static override readonly template = html``;

    public static readonly properties = {
        src: String
    };

    private _mutationObserver: MutationObserver;

    #src: string;
    set src(value: string) {
        if (this.#src !== value) {
            this.#src = value;
            this._reloadSvg();
        }
    }
    get src() {
        return this.#src;
    }

    public constructor() {
        super();
        this._restoreCachedInititalValues();

        this._mutationObserver = new MutationObserver(mutations => {
            this._parseAttributesToProperties();
        });
    }

    public ready(): void {
        this._parseAttributesToProperties();
        this._mutationObserver.observe(this, { attributes: true, subtree: false });
    }

    private async _reloadSvg() {
        this.shadowRoot.innerHTML = "";
        const data = await (await fetch(this.#src)).text()
        this._parseSvg(data);
    }

    private _parseSvg(xml: string) {
        this.shadowRoot.innerHTML = "";

        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");
        const errorNode = doc.querySelector("parsererror");
        if (errorNode) {
            console.log("error while parsing SvgHmi");
        } else {
            const svgNode = doc.children[0];
            const propertiesNode = doc.getElementsByTagNameNS("http://svg.siemens.com/hmi/", "self");

            for (const n of propertiesNode) {
                let nm = n.getAttribute('name').toLocaleLowerCase();
                Object.defineProperty(this, nm, {
                    get() {
                        return this['_' + nm];
                    },
                    set(newValue) {
                        if (this['__' + nm] !== newValue) {
                            this['__' + nm] = newValue;
                            this._parseSvgBindings();
                        }
                    },
                    enumerable: true,
                    configurable: true,
                });
            }


            const allElements = doc.getElementsByTagName("*");
            let boundAttributes = [];
            for (const element of allElements) {
                for (const attr of element.attributes) {
                    if (attr.namespaceURI === "http://svg.siemens.com/hmi/bind/") {
                        boundAttributes.push({
                            element: element.tagName,
                            attribute: attr.localName,
                            value: attr.value
                        });
                    }
                }
            }

            this.shadowRoot.appendChild(svgNode);


            evalWithContext("and(true, false)")
            this._parseAttributesToProperties();
            debugger;
        }
    }

    protected override _parseAttributesToProperties(noBindings?: boolean): void {
        super._parseAttributesToProperties();
    }

    _parseSvgBindings() {

    }
}
customElements.define("node-projects-svghmi", SvgHmi);