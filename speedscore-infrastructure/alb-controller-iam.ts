import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { cluster } from "./cluster";

const oidcProvider = cluster.core.oidcProvider!;

const oidcUrl = oidcProvider.apply(p => {
  if (!p) throw new Error("OIDC provider is undefined");
  return p.url;
});

const oidcArn = oidcProvider.apply(p => {
  if (!p) throw new Error("OIDC provider is undefined");
  return p.arn;
});

const albControllerPolicy = new aws.iam.Policy("albControllerPolicy-adv", {
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

const albControllerRole = new aws.iam.Role("albControllerRole-adv", {
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

new aws.iam.RolePolicyAttachment("albControllerPolicyAttach-adv", {
  role: albControllerRole.name,
  policyArn: albControllerPolicy.arn,
});

export const albControllerRoleArn = albControllerRole.arn;
