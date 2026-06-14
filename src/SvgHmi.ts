import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { Converter, HmiColorValue } from "./Converter.js";
import { evalWithContext } from "./EvalWithContext.js";

type SvgHmiPropertyDefinition = { name: string, type: string, default: unknown };

export class SvgHmi extends BaseCustomWebComponentConstructorAppend {
    [key: string]: unknown;

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

    public _svgHmiProperties: Map<string, SvgHmiPropertyDefinition> = new Map();
    public _svgHmiLocalDefs: Map<string, { name: string, type: string, value: unknown }> = new Map();
    private _boundAttributes: { element: Element, elementParent?: Element, attribute: string, value: string }[] = [];

    #src = "";
    set src(value: string | null) {
        value ??= "";
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
                    const attributeName = m.attributeName;
                    if (attributeName == null)
                        continue;

                    if (attributeName == 'src')
                        this.src = this.getAttribute('src');
                    else {
                        const prp = this._svgHmiProperties.get(attributeName);
                        if (prp != null) {
                            this['__' + prp.name] = this._readPropertyAttribute(attributeName, prp.type, prp.default);
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
        if (!this.#src)
            return;
        this.shadowRoot!.innerHTML = "";
        const data = await (await fetch(this.#src)).text()
        this._parseSvg(data);
    }

    private _parseSvg(xml: string) {
        this.shadowRoot!.innerHTML = "";

        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");
        const errorNode = doc.querySelector("parsererror");
        if (errorNode) {
            console.log("error while parsing SvgHmi");
        } else {
            const svgNode = doc.children[0];
            const propertiesNode = doc.getElementsByTagNameNS("http://svg.siemens.com/hmi/", "self");

            const selfNode = propertiesNode[0];
            if (selfNode == null)
                return;

            for (const n of selfNode.children) {
                if (n.localName != "paramDef")
                    continue;

                let name = n.getAttribute('name');
                if (name == null)
                    continue;
                let nm = SvgHmi.camelToDashCase(name);
                let tp = n.getAttribute('type') ?? "";
                let d = SvgHmi.parseValue(n.getAttribute('default') ?? "", tp);
                this._svgHmiProperties.set(nm, { name: name, type: tp, default: d });

                this['__' + name] = this._readPropertyAttribute(nm, tp, d);

                if (Object.prototype.hasOwnProperty.call(this, name)) {
                    this['__' + name] = SvgHmi.parseValue(this[name], tp);
                    delete this[name];
                }
                
                Object.defineProperty(this, name, {
                    get() {
                        return this['__' + name];
                    },
                    set(newValue) {
                        const parsedValue = SvgHmi.parseValue(newValue, tp);
                        if (this['__' + name] !== parsedValue) {
                            this['__' + name] = parsedValue;
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
                if (name == null)
                    continue;
                let tp = n.getAttribute('type') ?? "";
                let v = SvgHmi.parseValue(n.getAttribute('value') ?? "", tp);
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
            this.shadowRoot!.appendChild(svgNode);
        }
    }

    private _readPropertyAttribute(attributeName: string, type: string, defaultValue: unknown) {
        if (this.hasAttribute(attributeName))
            return SvgHmi.parseValue(this.getAttribute(attributeName) ?? "", type);

        return defaultValue;
    }

    public static camelToDashCase(text: string) {
        return text[0].toLowerCase() + text.substring(1).replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
    }

    public static hmiColorToSvgColor(value: string) {
        return Converter.RGBA(value).toString();
    }

    private static parseValue(value: unknown, type: string) {
        if (value == null)
            return value;

        switch (type) {
            case "number":
                return typeof value == "number" ? value : Number(value);
            case "boolean":
                return typeof value == "boolean" ? value : value === "" || String(value).toLowerCase() == "true";
            case "string":
                return String(value);
            case "HmiColor":
                return value instanceof HmiColorValue ? value : new HmiColorValue(String(value));
        }

        return value;
    }

    private static formatBindingValue(value: unknown) {
        if (value instanceof HmiColorValue)
            return SvgHmi.hmiColorToSvgColor(value.toString());

        return String(value ?? "");
    }

    protected override _parseAttributesToProperties(noBindings?: boolean): void {
        super._parseAttributesToProperties();
    }

    _evaluateSvgBindings() {
        for (let b of this._boundAttributes) {
            if (b.element.localName == "localDef") {
                const name = b.element.getAttribute('name');
                const localDef = name == null ? undefined : this._svgHmiLocalDefs.get(name);
                if (localDef != null)
                    localDef.value = SvgHmi.parseValue(evalWithContext(this, b.value), localDef.type);
            } else if (b.element.localName == "text" && b.element.namespaceURI == "http://svg.siemens.com/hmi/") {
                const par = b.elementParent ?? b.element.parentNode;
                if (par instanceof Element) {
                    b.elementParent = par;
                    par.textContent = SvgHmi.formatBindingValue(evalWithContext(this, b.value));
                }
                //this._svgHmiLocalDefs.get(b.element.getAttribute('name')).value = evalWithContext(this, b.value);
            } else {
                const val = evalWithContext(this, b.value);
                b.element.setAttribute(b.attribute, SvgHmi.formatBindingValue(val));
                //if (b.element instanceof SVGElement)
                //    b.element.style[b.attribute] = val;
            }
        }
    }
}
customElements.define("node-projects-svghmi", SvgHmi);
