import { apiDeploymentUrl } from "./config";
import "./cluster";
import "./alb-controller";
import "./namespace";
import "./api";
import "./dns";
import { albHostname } from "./ingress";

export { albHostname, apiDeploymentUrl };
