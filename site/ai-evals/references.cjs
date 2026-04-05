const fs = require("fs");
const path = require("path");

function readContentIndex() {
  const siteRoot = path.resolve(__dirname, "..");
  const staticDir = path.join(siteRoot, "static");
  const pointerPath = path.join(staticDir, "content-index-latest.json");
  const pointer = JSON.parse(fs.readFileSync(pointerPath, "utf8"));
  const indexPath = path.join(staticDir, pointer.filename);
  return JSON.parse(fs.readFileSync(indexPath, "utf8"));
}

function awsExperienceReference() {
  const index = readContentIndex();
  const awsExperience = (index.experience || []).find(
    (entry) => entry.company === "Amazon Web Services"
  );
  const certificates = (index.resume?.certificates || [])
    .filter((cert) => cert.toLowerCase().includes("aws"))
    .slice(0, 4);

  if (!awsExperience) {
    return "";
  }

  const highlights = (awsExperience.highlights || [])
    .slice(0, 5)
    .map((highlight) =>
      typeof highlight === "string" ? highlight : `${highlight.text || ""}`.trim()
    )
    .filter(Boolean)
    .map((highlight) => `- ${highlight}`)
    .join("\n");

  return [
    `Current role: ${awsExperience.role} at ${awsExperience.company} (${awsExperience.dateRange}).`,
    "Relevant AWS experience highlights:",
    highlights,
    certificates.length > 0
      ? `AWS certifications:\n${certificates.map((cert) => `- ${cert}`).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

module.exports = {
  awsExperienceReference,
};
