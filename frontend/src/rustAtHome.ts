export type Ordering = -1 | 0 | 1;

type Ord = string | number | bigint;
type CmpFn<T extends Ord> = (a: T, b: T) => Ordering;

export function cmp(a: number, b: number): Ordering;
export function cmp(a: bigint, b: bigint): Ordering;
export function cmp(a: string, b: string): Ordering;

export function cmp<T extends Ord>(a: T, b: T): Ordering {
	if (a > b) return 1;
	if (b > a) return -1;
	return 0;
}

export function reverse(o: Ordering): Ordering {
	// add 0 because neg on 0 becomes float -0
	return (-o + 0) as Ordering;
}

export function reversed<T extends number>(f: CmpFn<T>): CmpFn<T>;
export function reversed<T extends bigint>(f: CmpFn<T>): CmpFn<T>;
export function reversed<T extends string>(f: CmpFn<T>): CmpFn<T>;

export function reversed<T extends Ord>(f: CmpFn<T>): CmpFn<T> {
	return (a, b) => reverse(f(a, b));
}

interface HasDefaultPrevention {
	preventDefault(): void;
}

export function preventDefault<E extends HasDefaultPrevention, T>(
	f: (e: E) => T,
): (e: E) => T {
	return (e) => {
		e.preventDefault();
		return f(e);
	};
}
