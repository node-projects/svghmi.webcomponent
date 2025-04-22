import { Converter as ConverterImp } from "./Converter.js";
import { gt as gtImp, ge as geImp, lt as ltImp, le as leImp, eq as eqImp, ne as neImp, has as hasImp } from "./Comparison.js";
import { and as andImp, or as orImp, not as notImp } from "./Logic.js";
import { SvgHmi } from "./SvgHmi.js";

export function evalWithContext(svgHmi: SvgHmi, code: string) {
    try {
        //@ts-ignore
        var Converter = ConverterImp;

        var ParamProps = {};
        for (let p of svgHmi._svgHmiProperties.entries()) {
            ParamProps[p[1].name] = svgHmi[p[1].name] ?? p[1].default;
        }

        var LocalProps = {};
        for (let p of svgHmi._svgHmiLocalDefs.entries()) {
            LocalProps[p[1].name] = p[1].value;
        }

        //@ts-ignore
        var gt = gtImp;
        //@ts-ignore
        var ge = geImp;
        //@ts-ignore
        var lt = ltImp;
        //@ts-ignore
        var le = leImp;
        //@ts-ignore
        var eq = eqImp;
        //@ts-ignore
        var ne = neImp;
        //@ts-ignore
        var has = hasImp;

        //@ts-ignore
        var and = andImp;
        //@ts-ignore
        var or = orImp
        //@ts-ignore
        var not = notImp

        //@ts-ignore
        var abs = Math.abs;
        //@ts-ignore
        var round = Math.round;
        //@ts-ignore
        var floor = Math.floor;
        //@ts-ignore
        var ceil = Math.ceil;
        //@ts-ignore
        var sin = Math.sin;
        //@ts-ignore
        var asin = Math.asin;
        //@ts-ignore
        var cos = Math.cos;
        //@ts-ignore
        var acos = Math.acos;
        //@ts-ignore
        var tan = Math.tan;
        //@ts-ignore
        var atan = Math.atan;
        //@ts-ignore
        var atan2 = Math.atan2;
        //@ts-ignore
        var log = Math.log;
        //@ts-ignore
        var log10 = Math.log10;
        //@ts-ignore
        var sqrt = Math.sqrt;
        //@ts-ignore
        var pow = Math.pow;
        //@ts-ignore
        var ceil = Math.ceil;
        //@ts-ignore
        var rad2deg = x => x * 180 / Math.PI;
        //@ts-ignore
        var deg2rad = x => x * Math.PI / 180;


        return eval(code);
    }
    catch (err) {
        console.warn(err);
    }
}