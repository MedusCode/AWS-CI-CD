import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import {
  nodeEnv, port, clientDeploymentUrl, accessTokenDuration, refreshTokenDuration,
  sendgridFromAddress, cookieDomain, jwtSecret, mongodbUri, sessionSecret,
  mfaEncryptionKey, sendgridApiKey, ghClientId, ghClientSecret, githubUsername, apiDeploymentUrl
} from "./config";

export function createApiResources(args: {
  namespace: k8s.core.v1.Namespace,
  registrySecret: k8s.core.v1.Secret,
  k8sProvider: k8s.Provider
}) {
  const { namespace, registrySecret, k8sProvider } = args;

  const apiSecrets = new k8s.core.v1.Secret("api-secrets-adv", {
    metadata: {
      name: "api-secrets-adv",
      namespace: namespace.metadata.name,
    },
    stringData: {
      jwtSecret,
      mongodbUri,
      sessionSecret,
      mfaEncryptionKey,
      sendgridApiKey,
      ghClientId,
      ghClientSecret,
    },
  }, { provider: k8sProvider });

  const apiEnvVars = [
    { name: "NODE_ENV", value: nodeEnv },
    { name: "PORT", value: port },
    { name: "API_DEPLOYMENT_URL", value: apiDeploymentUrl },
    { name: "CLIENT_DEPLOYMENT_URL", value: clientDeploymentUrl },
    { name: "ACCESS_TOKEN_DURATION", value: accessTokenDuration },
    { name: "REFRESH_TOKEN_DURATION", value: refreshTokenDuration },
    { name: "SENDGRID_FROM_ADDRESS", value: sendgridFromAddress },
    { name: "COOKIE_DOMAIN", value: cookieDomain },
    { name: "JWT_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets-adv", key: "jwtSecret" } } },
    { name: "MONGODB_URI", valueFrom: { secretKeyRef: { name: "api-secrets-adv", key: "mongodbUri" } } },
    { name: "SESSION_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets-adv", key: "sessionSecret" } } },
    { name: "MFA_ENCRYPTION_KEY", valueFrom: { secretKeyRef: { name: "api-secrets-adv", key: "mfaEncryptionKey" } } },
    { name: "SENDGRID_API_KEY", valueFrom: { secretKeyRef: { name: "api-secrets-adv", key: "sendgridApiKey" } } },
    { name: "GH_CLIENT_ID", valueFrom: { secretKeyRef: { name: "api-secrets-adv", key: "ghClientId" } } },
    { name: "GH_CLIENT_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets-adv", key: "ghClientSecret" } } },
  ];

  const apiDeployment = new k8s.apps.v1.Deployment("api-deployment-adv", {
    metadata: {
      name: "api-adv",
      namespace: namespace.metadata.name,
    },
    spec: {
      replicas: 2,
      selector: { matchLabels: { app: "api-adv" } },
      template: {
        metadata: { labels: { app: "api-adv" } },
        spec: {
          containers: [
            {
              name: "api",
              image: pulumi.interpolate`ghcr.io/${githubUsername}/speedscore-api:latest`,
              ports: [{ containerPort: 4000 }],
              env: apiEnvVars,
              imagePullPolicy: "Always",
            },
          ],
          imagePullSecrets: [{ name: registrySecret.metadata.name }],
        },
      },
    },
  }, { provider: k8sProvider });

  const apiService = new k8s.core.v1.Service("api-service-adv", {
    metadata: {
      name: "api-service-adv",
      namespace: namespace.metadata.name,
    },
    spec: {
      selector: { app: "api-adv" },
      ports: [{ port: Number(port), targetPort: Number(port) }],
      type: "NodePort",
    },
  }, { provider: k8sProvider });

  return { apiService };
}
