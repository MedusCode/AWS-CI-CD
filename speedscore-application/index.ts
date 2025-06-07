import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { createNamespaceResources } from "./namespace";
import { createApiResources } from "./api";
import { createIngress } from "./ingress";
import { createAlbController } from './alb-controller';

const infraStackRef = new pulumi.StackReference("MedusCode-org/speedscore-infrastructure-advanced/dev");

const kubeconfig = infraStackRef.getOutput("kubeconfig");
const albControllerRoleArn = infraStackRef.getOutput("albControllerRoleArn");
const clusterName = infraStackRef.getOutput("clusterName");
const vpcId = infraStackRef.getOutput("vpcId");

const k8sProvider = new k8s.Provider("k8s-provider", {
  kubeconfig,
});

createAlbController({
  k8sProvider,
  clusterName,
  vpcId,
  albControllerRoleArn
});

const { namespace, registrySecret } = createNamespaceResources({
  k8sProvider
});

const { apiService } = createApiResources({
  namespace,
  registrySecret,
  k8sProvider,
});

const { albHostname } = createIngress({
  apiService,
  namespace,
  k8sProvider,
});

export { albHostname };
