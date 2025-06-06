import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { k8sProvider } from "./cluster";
import {
  nodeEnv, port, clientDeploymentUrl, accessTokenDuration, refreshTokenDuration,
  sendgridFromAddress, cookieDomain, jwtSecret, mongodbUri, sessionSecret,
  mfaEncryptionKey, sendgridApiKey, ghClientId, ghClientSecret, githubUsername, apiDeploymentUrl
} from "./config";
import { namespace, registrySecret } from "./namespace";

const apiSecrets = new k8s.core.v1.Secret("api-secrets", {
  metadata: {
    name: "api-secrets",
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
  { name: "JWT_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets", key: "jwtSecret" } } },
  { name: "MONGODB_URI", valueFrom: { secretKeyRef: { name: "api-secrets", key: "mongodbUri" } } },
  { name: "SESSION_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets", key: "sessionSecret" } } },
  { name: "MFA_ENCRYPTION_KEY", valueFrom: { secretKeyRef: { name: "api-secrets", key: "mfaEncryptionKey" } } },
  { name: "SENDGRID_API_KEY", valueFrom: { secretKeyRef: { name: "api-secrets", key: "sendgridApiKey" } } },
  { name: "GH_CLIENT_ID", valueFrom: { secretKeyRef: { name: "api-secrets", key: "ghClientId" } } },
  { name: "GH_CLIENT_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets", key: "ghClientSecret" } } },
];

export const apiDeployment = new k8s.apps.v1.Deployment("api-deployment", {
  metadata: {
    name: "api",
    namespace: namespace.metadata.name,
  },
  spec: {
    replicas: 2,
    selector: { matchLabels: { app: "api" } },
    template: {
      metadata: { labels: { app: "api" } },
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

export const apiService = new k8s.core.v1.Service("api-service", {
  metadata: {
    name: "api-service",
    namespace: namespace.metadata.name,
  },
  spec: {
    selector: { app: "api" },
    ports: [{ port: Number(port), targetPort: Number(port) }],
    type: "NodePort",
  },
}, { provider: k8sProvider });
