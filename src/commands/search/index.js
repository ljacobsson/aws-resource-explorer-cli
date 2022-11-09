const program = require("commander");
const authHelper = require("../shared/auth-helper");
const inquirer = require("inquirer");
const arnParser = require("@aws-sdk/util-arn-parser");
const open = require("open");
inquirer.registerPrompt(
  "autocomplete",
  require("inquirer-autocomplete-prompt")
);
const AWS = require("aws-sdk");
const START_TYPING = "Start typing to search";
program
  .command("search")
  .alias("s")
  .option("-p, --profile [profile]", "AWS Profile")
  .description("Invokes the resource explorer search API with a search as you type interface")
  .action(async (cmd) => {
    authHelper.initAuth(cmd);
    const resourceExplorer = new AWS.ResourceExplorer2();    
    let source;
    do {
      source = await inquirer.prompt({
        name: "id",
        type: "autocomplete",
        message: "Search for resources",
        source: async (answersSoFar, input) => {
          try {
            if (!input) {
              return [START_TYPING];
            }
            const results = await resourceExplorer.search({ QueryString: input }).promise();
            return results.Resources.map(p => {
              const parsedArn = arnParser.parse(p.Arn);
              return {
                name: `${parsedArn.resource} (${parsedArn.service})`,
                value: p.Arn
              }
            }).sort((a, b) => a.name.localeCompare(b.name));
          } catch (e) {
            console.log(e);
          }
        }
      });
    } while (source.id === START_TYPING);    
    const url = `https://${AWS.config.region}.console.aws.amazon.com/go/view?arn=${source.id}&amp;source=aws-resource-explorer-cli`;
    console.log(`Opening ${url}`);
    open(url);
  });

