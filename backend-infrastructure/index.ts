import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

// Load config values
const config = new pulumi.Config();

const certificateArn = config.requireSecret("certificateArn");
const githubActionRoleArn = config.requireSecret("githubActionRoleArn");
const githubToken = config.requireSecret("githubToken");
const githubUsername = config.requireSecret("githubUsername");
const subDomain = config.require("subDomain");
const domain = config.require("domain");

const nodeEnv = config.require("nodeEnv");
const port = config.require("port")
const clientDeploymentUrl = config.require("clientDeploymentUrl");
const accessTokenDuration = config.require("accessTokenDuration");
const refreshTokenDuration = config.require("refreshTokenDuration");
const sendgridFromAddress = config.require("sendgridFromAddress");
const cookieDomain = config.require("cookieDomain");
const sessionSecret = config.requireSecret("sessionSecret");
const jwtSecret = config.requireSecret("jwtSecret");
const mongodbUri = config.requireSecret("mongodbUri");
const mfaEncryptionKey = config.requireSecret("mfaEncryptionKey");
const sendgridApiKey = config.requireSecret("sendgridApiKey");
const ghClientId = config.requireSecret("ghClientId");
const ghClientSecret = config.requireSecret("ghClientSecret");

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
  { name: "NODE_ENV", value: nodeEnv },
  { name: "PORT", value: port },
  { name: "API_DEPLOYMENT_URL", value: `https://${subDomain}.${domain}` },
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

const apiZone = aws.route53.getZone({
  name: domain,
  privateZone: false,
});

// Route53 DNS Record
const apiCnameRecord = new aws.route53.Record("api-cname-record", {
  name: `${subDomain}.${domain}`,
  type: "CNAME",
  ttl: 300,
  zoneId: apiZone.then(z => z.zoneId),
  records: [service.status.loadBalancer.ingress[0].hostname],
});

// Export values
export const apiServiceHostname = service.status.loadBalancer.ingress[0].hostname;
export const apiCustomDomain = pulumi.interpolate`https://${apiCnameRecord.name}`;

