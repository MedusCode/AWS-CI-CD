import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { instance } from "./compute";
import { vpc, subnetIds, secGroup } from './network'
import { certificateArn } from "./config";

// Create Target Group for the instance
export const targetGroup = new aws.lb.TargetGroup("frontend-tg", {
  port: 80,
  protocol: "HTTP",
  targetType: "instance",
  vpcId: pulumi.output(vpc).id,
});

// Register instance to Target Group
new aws.lb.TargetGroupAttachment("frontend-tg-attachment", {
  targetGroupArn: targetGroup.arn,
  targetId: instance.id,
  port: 80,
});

// Create Application Load Balancer (ALB)
export const alb = new aws.lb.LoadBalancer("frontend-lb", {
  internal: false,
  loadBalancerType: "application",
  securityGroups: [secGroup.id],
  subnets: subnetIds,
});

// Create HTTPS listener
new aws.lb.Listener("https-listener", {
  loadBalancerArn: alb.arn,
  port: 443,
  protocol: "HTTPS",
  sslPolicy: "ELBSecurityPolicy-2016-08",
  certificateArn: certificateArn,
  defaultActions: [{ type: "forward", targetGroupArn: targetGroup.arn }],
});

// Redirect HTTP to HTTPS
new aws.lb.Listener("http-redirect-listener", {
  loadBalancerArn: alb.arn,
  port: 80,
  protocol: "HTTP",
  defaultActions: [{
    type: "redirect",
    redirect: {
      port: "443",
      protocol: "HTTPS",
      statusCode: "HTTP_301",
    },
  }],
});
