function hexToHSL(hex) {
    let r = parseInt(hex.substr(1, 2), 16) / 255;
    let g = parseInt(hex.substr(3, 2), 16) / 255;
    let b = parseInt(hex.substr(5, 2), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

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

function hslToHex(h, s, l) {
    function f(p, q, t) {
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

export class Converter {
    static IsString(txt) {
        return typeof txt == "string";
    }

    static IsNumber(txt) {
        return typeof txt == "number";
    }

    static IsBoolean(txt) {
        return typeof txt == "boolean";
    }

    static CountItems(arr: []) {
        return arr.length;
    }

    static RGB(col: string) {
        return '#' + col.substring(4);
    }

    static RGBA(col: string) {
        return '#' + col.substring(4) + col.substring(2, 4);
    }

    static Alpha(col: string) {
        return col.substring(2,2);
    }

    static Iluminate(input: string, deviation: number, low = '#FFFFFF', high = '#000000') {
        deviation = Math.max(-1, Math.min(1, deviation)); // Clamp deviation to [-1, 1]

        let inputHSL = hexToHSL(input);
        let lowHSL = hexToHSL(low);
        let highHSL = hexToHSL(high);

        let lowFactor = lowHSL.l;
        let highFactor = highHSL.l;

        if (lowFactor === highFactor) {
            lowFactor = 1.0; // Assume white background
            highFactor = 0.0; // Assume black foreground
        }

        let adjustedL = inputHSL.l + deviation * (highFactor - lowFactor);
        adjustedL = Math.max(0, Math.min(1, adjustedL)); // Clamp L between 0 and 1

        return hslToHex(inputHSL.h, inputHSL.s, adjustedL);
    }

    static Darker(input, deviation: number) {
        return this.Iluminate(input, deviation);
    }

    static Lighter(input, deviation: number) {
        return this.Iluminate(input, -1 * deviation);
    }

    static Bounds(input: number, min: number, max: number) {
        return Math.min(Math.max(input, min), max);
    }

    static Min(input: number, min: number) {
        return Math.min(input, min);
    }

    static Max(input: number, max: number) {
        return Math.min(input, max);
    }

    static FormatPattern(value: string, patter: string) {
        //TODO...
        return value;
    }
}
