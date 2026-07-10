import policy from "../../security-policy.json";

type Directives = Record<string, string[]>;

function renderDirectives(names: string[]): string {
  const directives = policy.csp.directives as Directives;
  return names.map((name) => `${name} ${directives[name].join(" ")}`).join("; ");
}

export const contentSecurityPolicy = renderDirectives(Object.keys(policy.csp.directives));

export const contentSecurityPolicyMeta = renderDirectives(policy.csp.metaDirectives);

export const securityHeaders: Readonly<Record<string, string>> = Object.freeze({
  "Content-Security-Policy": contentSecurityPolicy,
  ...policy.httpHeaders
});
