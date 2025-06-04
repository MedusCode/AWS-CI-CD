import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Конфигурация: SSH ключ из `pulumi config`
const config = new pulumi.Config();
const sshKeyName = config.require("sshKeyName");

// Получаем последний доступный Ubuntu AMI (работает в любом регионе)
const ami = aws.ec2.getAmi({
  mostRecent: true,
  owners: ["099720109477"], // Canonical (официальные Ubuntu образы)
  filters: [
    {
      name: "name",
      values: ["ubuntu/images/hvm-ssd/ubuntu-*-amd64-server-*"], // Универсально
    },
  ],
});

// Security Group для SSH, HTTP, HTTPS
const securityGroup = new aws.ec2.SecurityGroup("frontend-sg", {
  description: "Allow SSH, HTTP, and HTTPS access",
  ingress: [
    {
      protocol: "tcp",
      fromPort: 22,
      toPort: 22,
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      protocol: "tcp",
      fromPort: 80,
      toPort: 80,
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      protocol: "tcp",
      fromPort: 443,
      toPort: 443,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
});

// EC2 инстанс
const instance = new aws.ec2.Instance("frontend-instance", {
  ami: ami.then(a => a.id),
  instanceType: "t2.micro",
  keyName: sshKeyName,
  vpcSecurityGroupIds: [securityGroup.id],
  tags: {
    Name: "SpeedScore Frontend",
  },
});

// Экспортируем публичный IP и DNS
export const publicIp = instance.publicIp;
export const publicDns = instance.publicDns;
