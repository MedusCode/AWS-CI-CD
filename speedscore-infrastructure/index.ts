import { cluster } from "./cluster";
import { albControllerRoleArn } from "./alb-controller-iam";

export const kubeconfig = cluster.kubeconfig;
export const clusterName = cluster.eksCluster.name;
export const vpcId = cluster.eksCluster.vpcConfig.vpcId;
export { albControllerRoleArn };
