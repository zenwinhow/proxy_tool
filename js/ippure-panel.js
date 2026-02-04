/**
 * IPPure - My IP 纯净度面板
 * API: https://my.ippure.com/v1/info  (IPPure My IP Information API)
 * 输出字段包含：ip, fraudScore, isResidential, isBroadcast, asn, asOrganization, country/region/city...
 */

const API_URL = "https://my.ippure.com/v1/info";

function httpGet(url) {
  return new Promise((resolve, reject) => {
    if (typeof $httpClient === "undefined" || !$httpClient.get) {
      reject(new Error("No $httpClient.get available in this runtime."));
      return;
    }
    $httpClient.get(url, (error, response, body) => {
      if (error) return reject(error);
      resolve({ response, body });
    });
  });
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreLabel(purity) {
  // purity: 0-100 (越高越纯净)
  if (purity >= 85) return "高";
  if (purity >= 60) return "中";
  return "低";
}

function riskLabel(fraudScore) {
  // fraudScore: 0-100 (越高风险越大)
  if (fraudScore >= 80) return "高风险";
  if (fraudScore >= 50) return "中风险";
  return "低风险";
}

(async () => {
  try {
    const { body } = await httpGet(API_URL);
    const data = JSON.parse(body || "{}");

    const ip = data.ip || "-";
    const fraudScoreRaw = Number(data.fraudScore);
    const fraudScore = Number.isFinite(fraudScoreRaw) ? clamp(fraudScoreRaw, 0, 100) : null;

    const purity = fraudScore === null ? null : clamp(100 - fraudScore, 0, 100);

    const isResidential = data.isResidential === true;
    const isBroadcast = data.isBroadcast === true;

    const asn = (data.asn !== undefined && data.asn !== null) ? `AS${data.asn}` : "-";
    const asOrg = data.asOrganization || "-";

    const loc = [data.country, data.region, data.city].filter(Boolean).join(" / ") || "-";

    const line1 = purity === null
      ? `纯净度：-`
      : `纯净度：${purity}/100（${scoreLabel(purity)}）`;

    const line2 = fraudScore === null
      ? `风险评分：-`
      : `风险评分：${fraudScore}/100（${riskLabel(fraudScore)}）`;

    const line3 = `类型：${isResidential ? "住宅" : "机房/非住宅"}${isBroadcast ? " / 广播" : ""}`;
    const line4 = `IP：${ip}`;
    const line5 = `ASN：${asn} · ${asOrg}`;
    const line6 = `位置：${loc}`;

    const content = [line1, line2, line3, line4, line5, line6].join("\n");

    $done({
      title: "IPPure - IP 纯净度",
      content,
      // icon / icon-color 在不同客户端表现不完全一致；不影响核心展示
      icon: "shield.lefthalf.filled",
      "icon-color": "#4A90E2"
    });
  } catch (e) {
    $done({
      title: "IPPure - IP 纯净度",
      content: `请求失败：${String(e && e.message ? e.message : e)}`,
      icon: "exclamationmark.triangle",
      "icon-color": "#D0021B"
    });
  }
})();
