import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { secGroup, subnetIds, vpc } from "./network";
import { sshKeyName } from "./config";

// Fetch Ubuntu AMI
const ami = aws.ec2.getAmi({
  mostRecent: true,
  owners: ["099720109477"],
  filters: [
    { name: "name", values: ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"] },
  ],
});

// Launch EC2 instance
export const instance = new aws.ec2.Instance("frontend-instance", {
  instanceType: "t2.micro",
  ami: pulumi.output(ami).id,
  subnetId: subnetIds.apply(ids => ids[0]),
  vpcSecurityGroupIds: [secGroup.id],
  associatePublicIpAddress: true,
  keyName: sshKeyName,
  tags: { Name: "frontend-server" },
});
