import { dnsRecord, frontendUrl } from "./dns";
import { instancePublicIp } from "./compute";

export * from "./compute";
export * from "./alb";
export { frontendUrl, dnsRecord };
export { instancePublicIp };
