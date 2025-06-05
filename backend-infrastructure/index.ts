import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

// Load config values
const config = new pulumi.Config();
const sessionSecret = config.requireSecret("sessionSecret");
const jwtSecret = config.requireSecret("jwtSecret");
const mongodbUri = config.requireSecret("mongodbUri");
const mfaEncryptionKey = config.requireSecret("mfaEncryptionKey");
const sendgridApiKey = config.requireSecret("sendgridApiKey");
const ghClientId = config.requireSecret("ghClientId");
const ghClientSecret = config.requireSecret("ghClientSecret");
const certificateArn = config.requireSecret("certificateArn");
const githubActionRoleArn = config.requireSecret("githubActionRoleArn");
const githubToken = config.requireSecret("githubToken");
const githubEmail = config.requireSecret("githubEmail");
const githubUsername = config.requireSecret("githubUsername");

// AWS provider (region us-west-2)
const awsProvider = new aws.Provider("aws-provider", {
  region: "us-west-2",
});

// EKS cluster
const cluster = new eks.Cluster("speedscore-cluster", {
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
}, { provider: awsProvider });

// Kubernetes provider
const k8sProvider = new k8s.Provider("k8sProvider", {
  kubeconfig: cluster.kubeconfig,
  enableServerSideApply: true,
}, { dependsOn: [cluster] });

// Namespace
const namespace = new k8s.core.v1.Namespace("speedscore-namespace", {
  metadata: { name: "speedscore" },
}, { provider: k8sProvider });


const registryAuth = pulumi
  .all([githubUsername, githubToken])
  .apply(([user, token]) => {
    return Buffer.from(`${user}:${token}`).toString("base64");
  });

const registrySecret = new k8s.core.v1.Secret("ghcr-secret", {
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
            auth: auth,
          },
        },
      })
    ),
  },
}, { provider: k8sProvider });

// Deployment environment variables
const apiEnvVars = [
  { name: "NODE_ENV", value: "production" },
  { name: "PORT", value: "4000" },
  { name: "API_DEPLOYMENT_URL", value: "https://api.medus.click" },
  { name: "CLIENT_DEPLOYMENT_URL", value: "http://speedscore.medus.click" },
  { name: "ACCESS_TOKEN_DURATION", value: "1d" },
  { name: "REFRESH_TOKEN_DURATION", value: "7d" },
  { name: "SENDGRID_FROM_ADDRESS", value: "cs14394go@gmail.com" },
  { name: "COOKIE_DOMAIN", value: "medus.click" },

  { name: "JWT_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets", key: "jwtSecret" } } },
  { name: "MONGODB_URI", valueFrom: { secretKeyRef: { name: "api-secrets", key: "mongodbUri" } } },
  { name: "SESSION_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets", key: "sessionSecret" } } },
  { name: "MFA_ENCRYPTION_KEY", valueFrom: { secretKeyRef: { name: "api-secrets", key: "mfaEncryptionKey" } } },
  { name: "SENDGRID_API_KEY", valueFrom: { secretKeyRef: { name: "api-secrets", key: "sendgridApiKey" } } },
  { name: "GH_CLIENT_ID", valueFrom: { secretKeyRef: { name: "api-secrets", key: "ghClientId" } } },
  { name: "GH_CLIENT_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets", key: "ghClientSecret" } } },
  { name: "certificateArn", valueFrom: { secretKeyRef: { name: "api-secrets", key: "certificateArn" } } },
  { name: "github_actions_role_arn", valueFrom: { secretKeyRef: { name: "api-secrets", key: "githubActionRoleArn" } } },
  { name: "github_token", valueFrom: { secretKeyRef: { name: "api-secrets", key: "githubToken" } } },
  { name: "github_email", valueFrom: { secretKeyRef: { name: "api-secrets", key: "githubEmail" } } },
  { name: "github_username", valueFrom: { secretKeyRef: { name: "api-secrets", key: "githubUsername" } } },
];

// Secrets
const apiSecrets = new k8s.core.v1.Secret("api-secrets", {
  metadata: {
    name: "api-secrets",
    namespace: namespace.metadata.name,
  },
  stringData: {
    jwtSecret: jwtSecret,
    mongodbUri: mongodbUri,
    sessionSecret: sessionSecret,
    mfaEncryptionKey: mfaEncryptionKey,
    sendgridApiKey: sendgridApiKey,
    ghClientId: ghClientId,
    ghClientSecret: ghClientSecret,
    certificateArn: certificateArn,
    githubActionRoleArn: githubActionRoleArn,
    githubToken: githubToken,
    githubEmail: githubEmail,
    githubUsername: githubUsername,
  },
}, { provider: k8sProvider });

// Deployment
const apiDeployment = new k8s.apps.v1.Deployment("api-deployment", {
  metadata: {
    namespace: namespace.metadata.name,
    name: "api",
  },
  spec: {
    replicas: 2,
    selector: {
      matchLabels: { app: "api" },
    },
    template: {
      metadata: { labels: { app: "api" } },
      spec: {
        containers: [
          {
            name: "api",
            image: pulumi.interpolate`ghcr.io/${githubUsername}/speedscore-api:latest`,
            ports: [{ containerPort: 4000 }],
            env: apiEnvVars,
          },
        ],
        imagePullSecrets: [{ name: "ghcr-secret" }],
      },
    },
  },
}, { provider: k8sProvider });

// Service
const service = new k8s.core.v1.Service("api-service", {
  metadata: {
    name: "api-service",
    namespace: namespace.metadata.name,
    annotations: {
      "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
      "service.beta.kubernetes.io/aws-load-balancer-backend-protocol": "http",
      "service.beta.kubernetes.io/aws-load-balancer-ssl-cert": certificateArn,
      "service.beta.kubernetes.io/aws-load-balancer-ssl-ports": "https",
    },
  },
  spec: {
    type: "LoadBalancer",
    selector: { app: "api" },
    ports: [
      { name: "http", port: 80, targetPort: 4000 },
      { name: "https", port: 443, targetPort: 4000 },
    ],
  },
}, { provider: k8sProvider });

// Export values
export const kubeconfig = cluster.kubeconfig;
export const apiServiceHostname = service.status.loadBalancer.ingress[0].hostname;

