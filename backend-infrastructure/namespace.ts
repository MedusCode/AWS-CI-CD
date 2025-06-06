import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { k8sProvider } from "./cluster";
import { githubUsername, githubToken } from "./config";

export const namespace = new k8s.core.v1.Namespace("speedscore-namespace", {
  metadata: { name: "speedscore" },
}, { provider: k8sProvider });

const registryAuth = pulumi
  .all([githubUsername, githubToken])
  .apply(([user, token]) => Buffer.from(`${user}:${token}`).toString("base64"));

export const registrySecret = new k8s.core.v1.Secret("ghcr-secret", {
  metadata: {
    name: "ghcr-secret",
    namespace: namespace.metadata.name,
  },
  type: "kubernetes.io/dockerconfigjson",
  stringData: {
    ".dockerconfigjson": registryAuth.apply(auth =>
      JSON.stringify({
        auths: {
          "ghcr.io": {
            auth,
          },
        },
      })
    ),
  },
}, { provider: k8sProvider });
