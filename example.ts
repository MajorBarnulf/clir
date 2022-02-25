import { Cli } from "./mod.ts"

const cli = new Cli({
    name: "example", // name your CLI for the help page
    description: "Example usage of the clir library.",

    flags: {         // add flags as a hash table
        "lorem": {}, // every settings on a flag is optionnal
        "verbose": {
            description: "level of verbosity", // descriptions for the help pages
            short: 'v'                         // add short flags for '-v' syntax
        },
    },
    parameters: { // add parameters
        "input": {
            optional: false, // required parameters will throw errors if not provided
        },
        "output": {
            optional: true,  // optional paramters should be assigned with the '--param=value', but remaining arguments will be assigned if not
            default: "out.md"
        }
    }
});

// you can test for the presence of flags this way
if (cli.has_flag("verbose"))
    console.log("found is verbose");

// or read values given by the user that way
const value = cli.parameter_value("input");
console.log(`found value: ${value}`)
