import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Load config values
const config = new pulumi.Config();
const domain = config.require("domain");
const subDomain = config.require("subDomain");
const certificateArn = config.require("certificateArn");
const sshKeyName = config.require("sshKeyName");

// Lookup default VPC and subnets
const vpc = aws.ec2.getVpc({ default: true });
const subnetIds = pulumi
  .output(vpc)
  .apply(v =>
    aws.ec2.getSubnets({ filters: [{ name: "vpc-id", values: [v.id] }] })
  )
  .apply(subnets => subnets.ids);

// Create security group to allow web traffic
const secGroup = new aws.ec2.SecurityGroup("web-sec-group", {
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

// Fetch Ubuntu AMI
const ami = aws.ec2.getAmi({
  mostRecent: true,
  owners: ["099720109477"],
  filters: [
    { name: "name", values: ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"] },
  ],
});

// Launch EC2 instance
const instance = new aws.ec2.Instance("frontend-instance", {
  instanceType: "t2.micro",
  ami: pulumi.output(ami).id,
  subnetId: subnetIds.apply(ids => ids[0]),
  vpcSecurityGroupIds: [secGroup.id],
  associatePublicIpAddress: true,
  keyName: sshKeyName,
  tags: { Name: "frontend-server" },
});

// Create Target Group for the instance
const targetGroup = new aws.lb.TargetGroup("frontend-tg", {
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
const alb = new aws.lb.LoadBalancer("frontend-lb", {
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

const zone = aws.route53.getZone({
  name: domain,
  privateZone: false,
});

// Create Route53 DNS record
const dnsRecord = new aws.route53.Record("frontend-alias-record", {
  name: `${subDomain}.${domain}`,
  type: "A",
  zoneId: zone.then(z => z.zoneId),
  aliases: [{
    name: alb.dnsName,
    zoneId: alb.zoneId,
    evaluateTargetHealth: true,
  }],
});

export const frontendUrl = alb.dnsName;
export const dnsRecordName = dnsRecord.name;
export const instancePublicIp = instance.publicIp;
export const ansibleUser = "ubuntu";
