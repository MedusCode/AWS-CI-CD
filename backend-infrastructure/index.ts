import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

// Load config
const config = new pulumi.Config();
const certificateArn = config.requireSecret("certificateArn");
const jwtSecret = config.requireSecret("jwtSecret");
const mongodbUri = config.requireSecret("mongodbUri");
const githubUsername = config.require("github_username");
const githubToken = config.requireSecret("github_token");

// AWS Provider (region us-west-2)
const awsProvider = new aws.Provider("aws-provider", {
  region: "us-west-2"
});

// EKS Cluster
const cluster = new eks.Cluster("speedscore-cluster", {
  version: "1.29",
  instanceType: "t3.medium",
  desiredCapacity: 2,
  minSize: 1,
  maxSize: 3,
  roleMappings: [
    {
      roleArn: config.require("github_actions_role_arn"),
      username: "github",
      groups: ["system:masters"],
    },
  ],
}, { provider: awsProvider });



// K8s Provider
const k8sProvider = new k8s.Provider("k8s-provider", {
  kubeconfig: cluster.kubeconfig,
  enableServerSideApply: true,
}, { dependsOn: [cluster] });

// Namespace
const namespace = new k8s.core.v1.Namespace("speedscore", {
  metadata: { name: "speedscore" },
}, { provider: k8sProvider });

// Secrets
const secret = new k8s.core.v1.Secret("api-secrets", {
  metadata: {
    namespace: "speedscore",
  },
  stringData: {
    JWT_SECRET: jwtSecret,
    MONGODB_URI: mongodbUri,
  },
}, { provider: k8sProvider });

// Service
const service = new k8s.core.v1.Service("api-service", {
  metadata: {
    namespace: "speedscore",
    name: "api-service",
    annotations: {
      "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
      "service.beta.kubernetes.io/aws-load-balancer-ssl-cert": certificateArn,
      "service.beta.kubernetes.io/aws-load-balancer-backend-protocol": "http",
      "service.beta.kubernetes.io/aws-load-balancer-ssl-ports": "443",
    },
  },
  spec: {
    type: "LoadBalancer",
    ports: [
      { port: 80, targetPort: 4000, name: "http" },
      { port: 443, targetPort: 4000, name: "https" },
    ],
    selector: { app: "speedscore-api" },
  },
}, { provider: k8sProvider, dependsOn: [namespace] });

// Docker Registry Secret for GHCR
const dockerSecret = new k8s.core.v1.Secret("ghcr-secret", {
  metadata: {
    namespace: "speedscore",
    name: "ghcr-secret"
  },
  type: "kubernetes.io/dockerconfigjson",
  stringData: {
    ".dockerconfigjson": pulumi.interpolate`{
      "auths": {
        "https://ghcr.io": {
          "username": "${githubUsername}",
          "password": "${githubToken}",
          "email": "example@example.com",
          "auth": "${Buffer.from(`${githubUsername}:${githubToken}`).toString("base64")}"
        }
      }
    }`
  }
}, { provider: k8sProvider });

// Deployment
const deployment = new k8s.apps.v1.Deployment("api-deployment", {
  metadata: {
    namespace: "speedscore",
    name: "api-deployment"
  },
  spec: {
    replicas: 2,
    selector: {
      matchLabels: {
        app: "speedscore-api"
      }
    },
    template: {
      metadata: {
        labels: {
          app: "speedscore-api"
        }
      },
      spec: {
        containers: [
          {
            name: "speedscore-api",
            image: `ghcr.io/${githubUsername}/speedscore-api:latest`,
            ports: [{ containerPort: 4000 }],
            envFrom: [
              {
                secretRef: {
                  name: "api-secrets"
                }
              }
            ],
          }
        ],
        imagePullSecrets: [{ name: "ghcr-secret" }]
      }
    }
  }
}, { provider: k8sProvider, dependsOn: [namespace, dockerSecret, secret] });

// Output LoadBalancer URL
export const loadBalancerUrl = service.status.loadBalancer.ingress[0].hostname;
export const kubeconfig = cluster.kubeconfig;
export const clusterName = cluster.eksCluster.name;
