import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const certificateArn = config.requireSecret("certificateArn");
export const githubActionRoleArn = config.requireSecret("githubActionRoleArn");
export const githubToken = config.requireSecret("githubToken");
export const githubUsername = config.requireSecret("githubUsername");
export const subDomain = config.require("subDomain");
export const domain = config.require("domain");
export const apiDeploymentUrl = config.require("apiDeploymentUrl");

export const nodeEnv = config.require("nodeEnv");
export const port = config.require("port");
export const clientDeploymentUrl = config.require("clientDeploymentUrl");
export const accessTokenDuration = config.require("accessTokenDuration");
export const refreshTokenDuration = config.require("refreshTokenDuration");
export const sendgridFromAddress = config.require("sendgridFromAddress");
export const cookieDomain = config.require("cookieDomain");

export const sessionSecret = config.requireSecret("sessionSecret");
export const jwtSecret = config.requireSecret("jwtSecret");
export const mongodbUri = config.requireSecret("mongodbUri");
export const mfaEncryptionKey = config.requireSecret("mfaEncryptionKey");
export const sendgridApiKey = config.requireSecret("sendgridApiKey");
export const ghClientId = config.requireSecret("ghClientId");
export const ghClientSecret = config.requireSecret("ghClientSecret");
