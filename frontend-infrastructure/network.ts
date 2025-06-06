import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Lookup default VPC
export const vpc = aws.ec2.getVpc({ default: true });

// Lookup subnets in the VPC
export const subnetIds = pulumi
  .output(vpc)
  .apply(v => aws.ec2.getSubnets({ filters: [{ name: "vpc-id", values: [v.id] }] }))
  .apply(subnets => subnets.ids);

// Create a security group allowing SSH, HTTP, HTTPS
export const secGroup = new aws.ec2.SecurityGroup("web-sec-group", {
  description: "Allow HTTP and HTTPS",
  ingress: [
    { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
  ],
  egress: [
    { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
  ],
});
