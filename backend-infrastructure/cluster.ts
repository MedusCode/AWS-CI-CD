import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import { githubActionRoleArn } from "./config";

export const awsProvider = new aws.Provider("aws-provider", {
  region: "us-west-2",
});

export const cluster = new eks.Cluster("speedscore-cluster", {
  version: "1.29",
  instanceType: "t3.medium",
  desiredCapacity: 2,
  minSize: 1,
  maxSize: 3,
  roleMappings: [
    {
      roleArn: githubActionRoleArn,
      username: "github",
      groups: ["system:masters"],
    },
  ],
  createOidcProvider: true,
}, { provider: awsProvider });

export const k8sProvider = new k8s.Provider("k8sProvider", {
  kubeconfig: cluster.kubeconfig,
  enableServerSideApply: true,
}, { dependsOn: [cluster] });
