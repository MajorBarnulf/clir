import { CliDescriptor } from "./cli.ts"

export type shortFlag = 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'g'
    | 'h'
    | 'i'
    | 'j'
    | 'k'
    | 'l'
    | 'm'
    | 'n'
    | 'o'
    | 'p'
    | 'q'
    | 'r'
    | 's'
    | 't'
    | 'u'
    | 'v'
    | 'w'
    | 'x'
    | 'y'
    | 'z'
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F'
    | 'G'
    | 'H'
    | 'I'
    | 'J'
    | 'K'
    | 'L'
    | 'M'
    | 'N'
    | 'O'
    | 'P'
    | 'Q'
    | 'R'
    | 'S'
    | 'T'
    | 'U'
    | 'V'
    | 'W'
    | 'X'
    | 'Y'
    | 'Z';

export type flagDescriptor = {
    description?: string,
    short?: shortFlag
}

export class FlagState<D extends CliDescriptor, F extends CliFlags<D>, K extends keyof F> {
    name: K;
    description: string;
    short: shortFlag | undefined;
    found: boolean;

    constructor(name: K, descriptor: F[K]) {
        this.name = name;
        this.description = descriptor.description ?? "(no description)";
        this.short = descriptor.short;
        this.found = false;
    }

    set_found() {
        this.found = true;
    }
}

export type CliFlags<D extends CliDescriptor> = D["flags"] extends Record<string, flagDescriptor> ? D["flags"] : Record<string, flagDescriptor>;
