import { flagDescriptor, FlagState, CliFlags } from "./flag.ts"
import { parameterDescriptor, ParameterState, CliParameters } from "./parameter.ts"

export type CliDescriptor = {
    name?: string,
    version?: string,
    description?: string,
    flags?: Record<string, flagDescriptor>,
    parameters?: Record<string, parameterDescriptor>,
}

/**
 * Main class of the library.
 * An instance takes a descriptor to produce and provides type-sensitive methods to read parsed arguments.
 */
export class Cli<D extends CliDescriptor> {
    name?: string;
    version?: string;
    descriptor: D;
    flags: FlagState<D, CliFlags<D>, keyof CliFlags<D>>[];
    necessary_parameters: ParameterState<D, CliParameters<D>, keyof CliParameters<D>>[];
    optional_parameters: ParameterState<D, CliParameters<D>, keyof CliParameters<D>>[];

    constructor(descriptor: D) {
        this.name = descriptor.name;
        this.version = descriptor.version;
        this.descriptor = descriptor;
        this.flags = [];
        this.necessary_parameters = [];
        this.optional_parameters = [];

        if (descriptor.flags != undefined)
            for (const flag_name in descriptor.flags) {
                const flag_descriptor = descriptor.flags[flag_name];
                // flag_descriptor comes is a value from a hash table of strings to flag descriptor so the type must be valid
                // deno-lint-ignore no-explicit-any
                this.flags.push(new FlagState(flag_name, flag_descriptor as any));
            }

        if (descriptor.parameters != undefined)
            for (const param_name in descriptor.parameters) {
                const param_desc = descriptor.parameters[param_name];
                if (param_desc.optional ?? false)
                    // param_desc is a value from a hash table of strings to parameter descriptor so the type must be valid
                    // deno-lint-ignore no-explicit-any
                    this.optional_parameters.push(new ParameterState(param_name, param_desc as any));
                else
                    // param_desc is a value from a hash table of strings to parameter descriptor so the type must be valid
                    // deno-lint-ignore no-explicit-any
                    this.necessary_parameters.push(new ParameterState(param_name, param_desc as any));
            }

        this.try_help();
        this.parse();
    }

    private parse() {
        for (const arg of Deno.args) {

            if (this.is_collecting()) {
                this.parse_value(arg);
                continue;
            }

            if (is_flag(arg)) this.parse_flag(arg);
            else if (is_short(arg)) this.parse_short(arg);
            else this.parse_value(arg);
        }
        this.finalize_parsing();
    }

    private parse_flag(arg: string) {
        const { name, value } = split_flag(arg);
        const matching_flag = this.flags.find(e => e.name == name);
        if (matching_flag != undefined) {
            matching_flag.set_found();
            return;
        }

        const matching_parameter = this.optional_parameters.find(e => e.name == name);
        if (matching_parameter != undefined) {
            if (value != undefined) matching_parameter.push_value(value);
            else this.collector = matching_parameter;
        }

        // not found
    }

    private parse_short(arg: string) {
        const letters = arg.substring(1).split('');
        for (const letter of letters) {
            const flag = this.flags.find(e => e.short == letter);
            if (flag != undefined) {
                flag.set_found();
            } else {
                throw `Unknown flag: '${letter}'.\nTry with the '--help' flag.`;
            }
        }
    }

    collector: null | ParameterState<D, CliParameters<D>, keyof CliParameters<D>> = null;
    param_parsing_cursor = 0;
    private parse_value(arg: string) {
        if (this.is_collecting()) {
            this.collector!.push_value(arg);
            this.collector = null;
            return;
        }

        const parameter = this.next_param();
        if (parameter != undefined) {
            parameter.push_value(arg);
        }
    }

    private remaining_parameters(include_optional = false): ParameterState<D>[] {
        const result = [];
        const necessary_parameters = this.necessary_parameters.filter(p => !p.is_assigned());
        result.push(...necessary_parameters);
        if (!include_optional) {
            const optional_parameters = this.optional_parameters.filter(o => !o.is_assigned());
            result.push(...optional_parameters);
        }
        return result;
    }

    private next_param(): undefined | ParameterState<D> {
        const unassigned_parameters = this.remaining_parameters(true);
        return unassigned_parameters[0];
    }

    private is_collecting(): boolean {
        return this.collector != null;
    }

    private finalize_parsing() {
        if (this.remaining_parameters().length > 0)
        if (this.param_parsing_cursor < this.necessary_parameters.length) {
                throw "Not enough parameters provided.\nTry the '--help' flag.";
        }
    }

    private try_help() {
        let shound_print_help = false;
        for (const arg of Deno.args)
            if (["--help", "-h"].includes(arg)) shound_print_help = true;

        if (!shound_print_help) return;
        this.print_help();
        Deno.exit();
    }

    print_help() {

        const flag_descriptions = this.flags.map(flag => {
            let result = "    "
            if (flag.short != undefined) result += `-${flag.short}, `;
            else result += "    ";
            result += `--${flag.name}\n`;
            result += indent(flag.description, 12);
            return result;
        });

        const parameter_descriptions = this.necessary_parameters.map(parameter => {
            let result = "        ";
            result += `[${parameter.name}]\n`;
            result += indent(parameter.description, 12);
            return result;
        })

        const option_descriptions = this.optional_parameters.map(option => {
            let result = "        ";
            result += `--${option.name}=<value>\n`;
            result += indent(option.description, 12);
            return result;
        })

        let header = "";
        if (this.name != undefined)
            if (this.version != undefined) header = `${this.name} (${this.version}):\n`;
            else header = `${this.name}:\n`;

        let usage = this.name;
        if (flag_descriptions.length > 0) usage += " [FLAGS]";
        if (parameter_descriptions.length > 0) usage += " [PARAMETERS]";
        if (option_descriptions.length > 0) usage += " [OPTIONS]";

        console.log(`
${header}${this.descriptor.description ?? ""}

USAGE:
    ${usage}

${flag_descriptions.length > 0 ? `FLAGS:
${flag_descriptions.join('\n\n')}
` : ''}
${parameter_descriptions.length > 0 ? `PARAMETERS:
${parameter_descriptions.join('\n\n')}
` : ''}
${option_descriptions.length > 0 ? `OPTIONS:
${option_descriptions.join('\n\n')}
` : ''}
`
        );
    }

    has_flag(name: keyof CliFlags<D>): boolean {
        const flag = this.flags.find(f => f.name == name)!;
        return flag.found;
    }

    parameter_value(name: keyof CliParameters<D>): string {
        const matching_necessary_param = this.necessary_parameters.find(p => p.name == name);
        if (matching_necessary_param != undefined) {
            return matching_necessary_param.value!;
        }

        const matching_optional_param = this.optional_parameters.find(p => p.name == name);
        if (matching_optional_param != undefined) {
            return matching_optional_param.value ?? matching_optional_param.value!;
        }

        throw `TODO: find better error descriptions`;
    }
}

function is_flag(arg: string): boolean {
    const correct_length = arg.length >= 3;
    const correct_prefix = arg.substring(0, 2) == "--";
    const correct_continuation = arg[2] != '-';
    return correct_length && correct_prefix && correct_continuation;
}

function is_short(arg: string): boolean {
    const correct_length = arg.length >= 2;
    const correct_prefix = arg[0] == '-';
    const correct_continuation = arg[1] != '-';
    return correct_length && correct_prefix && correct_continuation;
}

function split_flag(arg: string): { name: string, value?: string } {
    const parts = arg.substring(2).split('=');
    const remainder = parts.filter((_, i) => i != 0);
    const value = remainder.length > 0 ? remainder.join('=') : undefined;
    return {
        name: parts[0],
        value: value
    };
}

function indent(text: string, steps: number, pad = ' '): string {
    const prefix = pad.repeat(steps);
    const lines = text.split('\n');
    const padded_lines = lines.map(line => prefix + line);
    const result = padded_lines.join('\n');
    return result;
}
