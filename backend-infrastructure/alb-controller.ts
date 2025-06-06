import * as aws from "@pulumi/aws";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { cluster, k8sProvider } from "./cluster";

const oidcProvider = cluster.core.oidcProvider!;

const oidcUrl = oidcProvider.apply(p => {
  if (!p) throw new Error("OIDC provider is undefined");
  return p.url;
});

const oidcArn = oidcProvider.apply(p => {
  if (!p) throw new Error("OIDC provider is undefined");
  return p.arn;
});

const albControllerPolicy = new aws.iam.Policy("albControllerPolicy", {
  description: "ALB Controller access policy",
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "elasticloadbalancing:*",
          "ec2:Describe*",
          "ec2:CreateSecurityGroup",
          "ec2:CreateTags",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:DeleteSecurityGroup",
          "iam:CreateServiceLinkedRole",
          "cognito-idp:DescribeUserPoolClient",
          "waf-regional:GetWebACLForResource",
          "waf-regional:GetWebACL",
          "waf-regional:AssociateWebACL",
          "waf-regional:DisassociateWebACL",
          "tag:GetResources",
          "tag:TagResources",
          "waf:GetWebACL",
        ],
        Resource: "*",
      },
    ],
  }),
});

const albControllerRole = new aws.iam.Role("albControllerRole", {
  assumeRolePolicy: pulumi.all([oidcUrl, oidcArn]).apply(([url, arn]) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            Federated: arn,
          },
          Action: "sts:AssumeRoleWithWebIdentity",
          Condition: {
            StringEquals: {
              [`${url.replace("https://", "")}:sub`]: "system:serviceaccount:kube-system:aws-load-balancer-controller",
            },
          },
        },
      ],
    })
  ),
});

new aws.iam.RolePolicyAttachment("albControllerPolicyAttach", {
  role: albControllerRole.name,
  policyArn: albControllerPolicy.arn,
});

const albServiceAccount = new k8s.core.v1.ServiceAccount("aws-load-balancer-controller-sa", {
  metadata: {
    name: "aws-load-balancer-controller",
    namespace: "kube-system",
    annotations: {
      "eks.amazonaws.com/role-arn": albControllerRole.arn,
    },
  },
}, { provider: k8sProvider });

export const albController = new k8s.helm.v3.Chart("aws-load-balancer-controller", {
  chart: "aws-load-balancer-controller",
  version: "1.7.1",
  fetchOpts: {
    repo: "https://aws.github.io/eks-charts",
  },
  namespace: "kube-system",
  values: {
    clusterName: cluster.eksCluster.name,
    serviceAccount: {
      create: false,
      name: albServiceAccount.metadata.name,
    },
    region: "us-west-2",
    vpcId: cluster.eksCluster.vpcConfig.vpcId,
    enableWaf: false,
    enableWafv2: false,
  },
}, { provider: k8sProvider, dependsOn: [albServiceAccount] });
