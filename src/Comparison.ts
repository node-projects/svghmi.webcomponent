export function gt(x: string | number, y: string | number) {
    return x > y;
}

export function ge(x: string | number, y: string | number) {
    return x >= y;
}

export function lt(x: string | number, y: string | number) {
    return x < y;
}

export function le(x: string | number, y: string | number) {
    return x <= y;
}

export function eq(x: unknown, y: unknown) {
    return x == y;
}

export function ne(x: unknown, y: unknown) {
    return x != y;
}

export function has(x: number, y: number) {
    return (x & y) == y;
}
