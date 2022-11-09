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
  .command("stack-resources")
  .alias("sr")
  .option("-s, --stack-name [stackName]", "Stack name")
  .option("-p, --profile [profile]", "AWS profile")
  .option("-r, --region [region]", "AWS region")
  .description("Passes the physical IDs from a CloudFormation stack to the resource explorer API")
  .action(async (cmd) => {
    authHelper.initAuth(cmd);
    const resourceExplorer = new AWS.ResourceExplorer2();
    const cloudFormation = new AWS.CloudFormation();
    const stackResources = await cloudFormation.listStackResources({ StackName: cmd.stackName }).promise();
    const choices = stackResources.StackResourceSummaries.map(p => {
      return {
        name: `${p.LogicalResourceId} (${p.ResourceType})`,
        value: p.PhysicalResourceId
      }
    }).sort((a, b) => a.name.localeCompare(b.name));
    const resource = await inquirer.prompt({
      name: "id",
      type: "autocomplete",
      message: "Select resource",
      choices: choices,
      source: async (answersSoFar, input) => {
        if (!input) {
          return choices;
        }
        const results = choices.filter(p => p.name.toLowerCase().includes(input.toLowerCase()));
        return results;
      }
    });
    const results = await resourceExplorer.search({ QueryString: `"${resource.id}"` }).promise();
    if (results.Resources.length === 0) {
      console.log("No results found. Check if resource type is supported by the resource explorer API. https://docs.aws.amazon.com/resource-explorer/latest/userguide/supported-resource-types.html");
      return;
    } else if (results.Resources.length === 1) {
      const url = `https://${AWS.config.region}.console.aws.amazon.com/go/view?arn=${results.Resources[0].Arn}&amp;source=aws-resource-explorer-cli`;
      open(url);
    } else {
      const resource = await inquirer.prompt({
        name: "id",
        type: "list",
        message: "Multiple matches. Please select resource",
        choices: results.Resources.map(p => {
          const parsedArn = arnParser.parse(p.Arn);
          return {
            name: `${parsedArn.resource} (${parsedArn.service})`,
            value: p.Arn
          }
        }).sort((a, b) => a.name.localeCompare(b.name)),
      });
      const url = `https://${AWS.config.region}.console.aws.amazon.com/go/view?arn=${resource.id}&amp;source=aws-resource-explorer-cli`;
      open(url);
    }

  });

