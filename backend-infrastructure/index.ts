import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

// Load config values
const config = new pulumi.Config();
const certificateArn = config.requireSecret("certificateArn");
const jwtSecret = config.requireSecret("jwtSecret");
const mongodbUri = config.requireSecret("mongodbUri");
const githubUsername = config.require("github_username");
const githubToken = config.requireSecret("github_token");
const githubActionsRoleArn = config.require("github_actions_role_arn");

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
      roleArn: githubActionsRoleArn,
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

// Secret for GHCR (GitHub Container Registry)
const dockerConfig = pulumi.secret({
  auths: {
    "ghcr.io": {
      username: githubUsername,
      password: githubToken,
      email: "dev@example.com", // dummy email
      auth: Buffer.from(`${githubUsername}:${githubToken}`).toString("base64"),
    },
  },
});
const registrySecret = new k8s.core.v1.Secret("ghcr-secret", {
  metadata: {
    name: "ghcr-secret",
    namespace: namespace.metadata.name,
  },
  type: "kubernetes.io/dockerconfigjson",
  stringData: {
    ".dockerconfigjson": dockerConfig.apply(JSON.stringify),
  },
}, { provider: k8sProvider });

// Deployment environment variables
const apiEnvVars = [
  { name: "NODE_ENV", value: "production" },
  { name: "PORT", value: "4000" },
  { name: "JWT_SECRET", valueFrom: { secretKeyRef: { name: "api-secrets", key: "jwtSecret" } } },
  { name: "MONGODB_URI", valueFrom: { secretKeyRef: { name: "api-secrets", key: "mongodbUri" } } },
  { name: "API_DEPLOYMENT_URL", value: `https://api.medus.click` },
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
            image: `ghcr.io/${githubUsername}/speedscore-api:latest`,
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

