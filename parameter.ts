import { CliDescriptor } from "./cli.ts"

export type valueType = "integer" | "string";
export type parameterDescriptor = {
    description?: string,
    type?: valueType,
    optional?: false
} | {
    description?: string,
    type?: valueType,
    optional: true,
    default?: string
}


export type CliParameters<D extends CliDescriptor> = D["parameters"] extends Record<string, parameterDescriptor> ? D["parameters"] : Record<string, parameterDescriptor>;


export class ParameterState<D extends CliDescriptor, P extends CliParameters<D> = CliParameters<D>, K extends keyof P = keyof P> {
    name: K;
    description: string;
    type: valueType;
    optional: boolean;
    found: boolean;
    value: string | undefined;

    constructor(name: K, descriptor: P[K]) {
        this.name = name;
        this.description = descriptor.description ?? "(no description)";
        this.type = descriptor.type ?? "string";
        this.optional = descriptor.optional ?? false;
        this.found = false;
        if (descriptor.optional == true) this.value = descriptor.default;
    }

    push_value(value: string) {
        this.found = true;
        if (this.type == "integer") {
            const float = parseFloat(value);
            const integer = parseInt(value);
            if (float != integer) throw `invalid parameter type, ${this.name} should be an integer`;
        }
        this.value = value;
    }

    is_assigned(): boolean {
        return this.value != undefined;
    }
}
