import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { githubUsername, githubToken } from "./config";

export function createNamespaceResources(args: {
  k8sProvider: k8s.Provider
}) {
  const { k8sProvider } = args;

  const namespace = new k8s.core.v1.Namespace("speedscore-namespace-adv", {
    metadata: { name: "speedscore-adv" },
  }, { provider: k8sProvider });

  const registryAuth = pulumi
    .all([githubUsername, githubToken])
    .apply(([user, token]) => Buffer.from(`${user}:${token}`).toString("base64"));

  const registrySecret = new k8s.core.v1.Secret("ghcr-secret-adv", {
    metadata: {
      name: "ghcr-secret-adv",
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

  return { namespace, registrySecret };
}
