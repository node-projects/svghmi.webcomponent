import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { evalWithContext } from "./EvalWithContext.js";

export class SvgHmi extends BaseCustomWebComponentConstructorAppend {

    public static override readonly style = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }
        svg {
            width: 100%;
            height: 100%;
        }`;

    public static override readonly template = html``;

    public static readonly properties = {
        src: String
    };

    private _mutationObserver: MutationObserver;

    public _svgHmiProperties: Map<string, { name: string, type: string, default: string }> = new Map();
    public _svgHmiLocalDefs: Map<string, { name: string, type: string, value: string }> = new Map();
    private _boundAttributes: { element: Element, elementParent?: Element, attribute: string, value: string }[] = [];

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
            for (let m of mutations) {
                if (m.type == 'attributes') {
                    if (m.attributeName == 'src')
                        this.src = this.getAttribute('src');
                    else {
                        const prp = this._svgHmiProperties.get(m.attributeName);
                        if (prp != null) {
                            this['__' + prp.name] = this.getAttribute(m.attributeName);
                        }
                    }
                }
            }
            this._evaluateSvgBindings();
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

            for (const n of propertiesNode[0].children) {
                if (n.localName != "paramDef")
                    continue;

                let name = n.getAttribute('name');
                let nm = SvgHmi.camelToDashCase(name);
                let tp = n.getAttribute('type');
                let d = n.getAttribute('default');
                this._svgHmiProperties.set(nm, { name: name, type: tp, default: d });

                let val = this.getAttribute(nm);
                this['__' + name] = val ?? d;

                if (this[name]) {
                    this['__' + name] = this[name];
                    delete this[name];
                }
                
                Object.defineProperty(this, name, {
                    get() {
                        return this['__' + name];
                    },
                    set(newValue) {
                        if (this['__' + name] !== newValue) {
                            this['__' + name] = newValue;
                            this._evaluateSvgBindings();
                        }
                    },
                    enumerable: true,
                    configurable: true,
                });
            }

            const localDefsNode = doc.getElementsByTagNameNS("http://svg.siemens.com/hmi/", "localDef");
            for (const n of localDefsNode) {
                let name = n.getAttribute('name');
                let tp = n.getAttribute('type');
                let v = n.getAttribute('value');
                this._svgHmiLocalDefs.set(name, { name: name, type: tp, value: v });
            }

            const allElements = doc.getElementsByTagName("*");
            for (const element of allElements) {
                for (const attr of element.attributes) {
                    if (attr.namespaceURI === "http://svg.siemens.com/hmi/bind/") {
                        //if (element.localName == 'localDef')
                        //    continue;
                        let val = attr.value;
                        if (val.startsWith("{{"))
                            val = val.substring(2, val.length - 2)
                        this._boundAttributes.push({
                            element: element,
                            attribute: attr.localName,
                            value: val
                        });
                    }
                }
            }


            this._evaluateSvgBindings();
            this.shadowRoot.appendChild(svgNode);
        }
    }

    public static camelToDashCase(text: string) {
        return text[0].toLowerCase() + text.substring(1).replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
    }

    /*private parseValue(value: string, type: string) {
        switch (type) {
            case "HmiColor": {

            }
        }

        return value;
    }*/

    protected override _parseAttributesToProperties(noBindings?: boolean): void {
        super._parseAttributesToProperties();
    }

    _evaluateSvgBindings() {
        for (let b of this._boundAttributes) {
            if (b.element.localName == "localDef") {
                this._svgHmiLocalDefs.get(b.element.getAttribute('name')).value = evalWithContext(this, b.value);
            } else if (b.element.localName == "text" && b.element.namespaceURI == "http://svg.siemens.com/hmi/") {
                const par = b.elementParent ?? b.element.parentNode;
                b.elementParent = <Element>par;
                par.textContent = evalWithContext(this, b.value);
                //this._svgHmiLocalDefs.get(b.element.getAttribute('name')).value = evalWithContext(this, b.value);
            } else {
                const val = evalWithContext(this, b.value);
                b.element.setAttribute(b.attribute, val);
                //if (b.element instanceof SVGElement)
                //    b.element.style[b.attribute] = val;
            }
        }
    }
}
customElements.define("node-projects-svghmi", SvgHmi);