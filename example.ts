import { Cli } from "https://deno.land/x/clir/mod.ts"

// Takes a descriptor that is also used for type checking of parameter names.
const cli = new Cli({
    name: "example",
    description: "Example usage of the clir library.",

    flags: {         // Add flags as a hash map.
        "lorem": {}, // Every settings on a flag is optionnal.
        "verbose": {
            description: "level of verbosity", // Descriptions are used in the procedural help page.
            short: 'v'                         // Short flags allow the '-v' syntax.
        },
    },
    parameters: { // Add parameters.
        "input": {
            optional: false, // Required parameters will throw errors if not provided.
        },
        "output": {
            optional: true,  // Optional parameters can be assigned with the '--param=value', remaining arguments will be assigned to them.
            default: "out.md"
        }
    }
});

// you can test for the presence of flags this way
if (cli.has_flag("verbose"))
    console.log("found verbose flag");

// or read values given by the user that way
const value = cli.parameter_value("input");
console.log(`for parameter 'input' found: ${value}`)
