import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export function createAlbController(args: {
  k8sProvider: k8s.Provider,
  clusterName: pulumi.Input<string>,
  vpcId: pulumi.Input<string>,
  albControllerRoleArn: pulumi.Input<string>
}) {
  const {k8sProvider, clusterName, vpcId, albControllerRoleArn} = args;

  const albServiceAccount = new k8s.core.v1.ServiceAccount("alb-controller-sa-app-adv", {
    metadata: {
      name: "aws-load-balancer-controller",
      namespace: "kube-system",
      annotations: {
        "eks.amazonaws.com/role-arn": albControllerRoleArn,
      },
    },
  }, { provider: k8sProvider });

  const albController = new k8s.helm.v3.Chart("alb-controller-chart-app-adv", {
    chart: "aws-load-balancer-controller",
    version: "1.7.1",
    fetchOpts: {
      repo: "https://aws.github.io/eks-charts",
    },
    namespace: "kube-system",
    values: {
      clusterName,
      region: "us-west-2",
      vpcId,
      enableWaf: false,
      enableWafv2: false,
      serviceAccount: {
        create: false,
        name: albServiceAccount.metadata.name,
      },
    },
  }, { provider: k8sProvider, dependsOn: [albServiceAccount] });
}
