type ParsedHmiColor = {
    alpha: string;
    red: string;
    green: string;
    blue: string;
    format: "hmi" | "css";
};

export class HmiColorValue extends String {
}

type HmiColorInput = string | String;

function parseHmiColor(col: HmiColorInput): ParsedHmiColor | undefined {
    const value = col.toString().trim();
    const hmiMatch = /^0x([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
    if (hmiMatch != null) {
        return {
            alpha: hmiMatch[1],
            red: hmiMatch[2],
            green: hmiMatch[3],
            blue: hmiMatch[4],
            format: "hmi"
        };
    }

    const cssMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i.exec(value);
    if (cssMatch != null) {
        return {
            alpha: cssMatch[4] ?? "FF",
            red: cssMatch[1],
            green: cssMatch[2],
            blue: cssMatch[3],
            format: "css"
        };
    }

    return undefined;
}

function hmiColorToCssColor(col: HmiColorInput) {
    const parsedColor = parseHmiColor(col);
    if (parsedColor == null)
        return col;
    return `rgba(${parseInt(parsedColor.red, 16)}, ${parseInt(parsedColor.green, 16)}, ${parseInt(parsedColor.blue, 16)}, ${parseInt(parsedColor.alpha, 16) / 255})`;
}

function hmiColorToRgbColor(col: HmiColorInput) {
    const parsedColor = parseHmiColor(col);
    if (parsedColor == null)
        return col;
    return `#${parsedColor.red}${parsedColor.green}${parsedColor.blue}`;
}

function hmiColorToAlpha(col: HmiColorInput) {
    const parsedColor = parseHmiColor(col);
    if (parsedColor == null)
        return "";
    return parsedColor.alpha;
}

function colorToHSL(hex: HmiColorInput) {
    const parsedColor = parseHmiColor(hex);
    const value = hex.toString().replace(/^#/, "");
    const r = parseInt(parsedColor?.red ?? value.substring(0, 2), 16) / 255;
    const g = parseInt(parsedColor?.green ?? value.substring(2, 4), 16) / 255;
    const b = parseInt(parsedColor?.blue ?? value.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h, s, l };
}

function hslToRgbHex(h: number, s: number, l: number) {
    function f(p: number, q: number, t: number) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    let r = Math.round(f(p, q, h + 1 / 3) * 255);
    let g = Math.round(f(p, q, h) * 255);
    let b = Math.round(f(p, q, h - 1 / 3) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function formatIlluminatedColor(input: HmiColorInput, rgbHex: string) {
    const parsedColor = parseHmiColor(input);
    if (parsedColor == null)
        return rgbHex;

    const rgb = rgbHex.substring(1);
    if (parsedColor.format == "hmi")
        return new HmiColorValue(`0x${parsedColor.alpha}${rgb}`);

    return `#${rgb}${parsedColor.alpha}`;
}

export class Converter {
    static IsString(txt: unknown) {
        return typeof txt == "string";
    }

    static IsNumber(txt: unknown) {
        return typeof txt == "number";
    }

    static IsBoolean(txt: unknown) {
        return typeof txt == "boolean";
    }

    static CountItems(arr: unknown[]) {
        return arr.length;
    }

    static RGB(col: HmiColorInput) {
        return hmiColorToRgbColor(col);
    }

    static RGBA(col: HmiColorInput) {
        return hmiColorToCssColor(col);
    }

    static Alpha(col: HmiColorInput) {
        return hmiColorToAlpha(col);
    }

    static Illuminate(input: HmiColorInput, deviation: number, low: HmiColorInput = '#FFFFFF', high: HmiColorInput = '#000000') {
        deviation = Math.max(-1, Math.min(1, deviation)); // Clamp deviation to [-1, 1]

        let inputHSL = colorToHSL(input);
        let lowHSL = colorToHSL(low);
        let highHSL = colorToHSL(high);

        let lowFactor = lowHSL.l;
        let highFactor = highHSL.l;

        if (lowFactor === highFactor) {
            lowFactor = 1.0; // Assume white background
            highFactor = 0.0; // Assume black foreground
        }

        const targetFactor = deviation < 0 ? lowFactor : highFactor;
        let adjustedL = inputHSL.l + Math.abs(deviation) * (targetFactor - inputHSL.l);
        adjustedL = Math.max(0, Math.min(1, adjustedL)); // Clamp L between 0 and 1

        return formatIlluminatedColor(input, hslToRgbHex(inputHSL.h, inputHSL.s, adjustedL));
    }

    static Darker(input: HmiColorInput, deviation: number) {
        return this.Illuminate(input, deviation);
    }

    static Lighter(input: HmiColorInput, deviation: number) {
        return this.Illuminate(input, -1 * deviation);
    }

    static Bounds(input: number, min: number, max: number) {
        return Math.min(Math.max(input, min), max);
    }

    static Min(input: number, min: number) {
        return Math.min(input, min);
    }

    static Max(input: number, max: number) {
        return Math.max(input, max);
    }

    static FormatPattern(value: string, pattern: string) {
        //TODO...
        return value;
    }
}
