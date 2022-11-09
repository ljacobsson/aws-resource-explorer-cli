const AWS = require("aws-sdk");
require("@mhlabs/aws-sdk-sso");

function initAuth(cmd) {
    process.env.AWS_PROFILE = cmd.profile || process.env.AWS_PROFILE || "private";
    process.env.AWS_REGION = cmd.region || process.env.AWS_REGION || AWS.config.region
    AWS.config.credentialProvider.providers.unshift(
      new AWS.SingleSignOnCredentials()
    );
  }

  module.exports = {
      initAuth
  }

  
