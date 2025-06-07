import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
export const githubActionRoleArn = config.requireSecret("githubActionRoleArn");

export const cluster = new eks.Cluster("speedscore-cluster-adv", {
  version: "1.29",
  instanceType: "t3.medium",
  desiredCapacity: 1,
  minSize: 1,
  maxSize: 1,
  roleMappings: [
    {
      roleArn: githubActionRoleArn,
      username: "github",
      groups: ["system:masters"],
    },
  ],
  createOidcProvider: true,
});
