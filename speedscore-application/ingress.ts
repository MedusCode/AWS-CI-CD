import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { certificateArn, subDomain, domain } from "./config";

export function createIngress(args: {
  apiService: k8s.core.v1.Service,
  namespace: k8s.core.v1.Namespace,
  k8sProvider: k8s.Provider
  dependsOn?: pulumi.Input<pulumi.Resource> | pulumi.Input<pulumi.Resource>[];
}) {
  const { namespace, apiService, k8sProvider, dependsOn } = args;

  const ingress = pulumi.all([
    apiService.metadata.name,
    apiService.spec.ports[0].port,
  ]).apply(([serviceName, servicePort]) => {
    return new k8s.networking.v1.Ingress("api-ingress-adv", {
      metadata: {
        name: "api-ingress-adv",
        namespace: namespace.metadata.name,
        annotations: {
          "kubernetes.io/ingress.class": "alb",
          "alb.ingress.kubernetes.io/scheme": "internet-facing",
          "alb.ingress.kubernetes.io/target-type": "ip",
          "alb.ingress.kubernetes.io/backend-protocol": "HTTP",
          "alb.ingress.kubernetes.io/listen-ports": JSON.stringify([
            { HTTP: 80 },
            { HTTPS: 443 }
          ]),
          "alb.ingress.kubernetes.io/certificate-arn": certificateArn,
          "alb.ingress.kubernetes.io/ssl-redirect": "443",
        },
      },
      spec: {
        rules: [
          {
            host: pulumi.interpolate`${subDomain}.${domain}`,
            http: {
              paths: [
                {
                  path: "/*",
                  pathType: "ImplementationSpecific",
                  backend: {
                    service: {
                      name: serviceName,
                      port: { number: servicePort },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    }, { provider: k8sProvider, dependsOn });
  });

  const albHostname = ingress.status.loadBalancer.ingress[0].hostname;
  return { albHostname };
}
