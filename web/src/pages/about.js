import { t } from "../lib/i18n.js";
import { esc, icon, BAND_COLORS } from "../lib/ui.js";

export const load = () => Promise.resolve();

const FLOW = ["EventBridge Scheduler", "Lambda · poller", "DynamoDB", "Step Functions", "Lambda · API", "Amplify Hosting"];
const SERVICES = ["EventBridge Scheduler", "Lambda", "DynamoDB", "Step Functions", "SES", "Amplify Hosting", "CloudWatch", "Bedrock (optional)", "Polly", "Location Service"];

export function view() {
  return `<section class="page-head wrap"><div><p class="eyebrow">${t("navAbout")}</p><h1 class="page-title">${t("abTitle")}</h1><p class="page-lead">${t("abLead")}</p></div></section>
  <div class="wrap about">
    <ol class="how-grid compact">${["how1", "how2", "how3"].map((k, i) => `<li class="how-card"><span class="how-n">${i + 1}</span><h3>${t(k)[0]}</h3><p>${t(k)[1]}</p></li>`).join("")}</ol>

    <div class="about-2">
      <section class="panel">
        <h2 class="h2s">${t("ruleTitle")}</h2>
        <table class="rule-t"><tbody>${t("rules").map(([r, b, a], i) => `<tr><td><i style="background:${BAND_COLORS[[2, 3, 4][i]]}"></i>AQI ${r}</td><td class="muted">${esc(b)}</td><td><b>${esc(a)}</b></td></tr>`).join("")}</tbody></table>
        <p class="muted small">${t("ruleNote")}</p>
      </section>
      <section class="panel">
        <h2 class="h2s">${t("estTitle")}</h2>
        <ul class="est-list">${t("est").map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </section>
    </div>

    <section class="panel never">
      <h2 class="h2s">${t("neverTitle")}</h2>
      <ul>${t("never").map((x) => `<li><span>✕</span>${esc(x)}</li>`).join("")}</ul>
      <p class="muted small">${t("honest")}</p>
    </section>

    <section class="aws-sec">
      <h2 class="h2s">${t("awsTitle")}</h2>
      <p class="muted">${t("awsLead")}</p>
      <ol class="flow">${FLOW.map((n, i) => `<li class="flow-node"><b>${n}</b><small>${esc(t("flowSub")[i])}</small></li>`).join("")}</ol>
      <div class="svc-grid">${SERVICES.map((n, i) => `<div class="svc"><b>${n}</b><p>${esc(t("svc")[i])}</p></div>`).join("")}</div>
    </section>

    <section class="panel">
      <h2 class="h2s">${t("srcTitle")}</h2>
      <ul class="src-list">${t("srcs").map(([n, d]) => `<li><b>${esc(n)}</b> · ${esc(d)}</li>`).join("")}</ul>
      <a class="btn ghost" href="https://github.com/Cubix33/taaza-hawa" target="_blank" rel="noopener">GitHub ${icon.arrow}</a>
    </section>
  </div>`;
}
