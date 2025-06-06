import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const domain = config.require("domain");
export const subDomain = config.require("subDomain");
export const certificateArn = config.require("certificateArn");
export const sshKeyName = config.require("sshKeyName");
