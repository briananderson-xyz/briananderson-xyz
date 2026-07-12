import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

const resumes = [
  { name: "leader", path: "/resume/" },
  { name: "ops", path: "/ops/resume/" },
  { name: "builder", path: "/builder/resume/" }
] as const;

function countPdfPages(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

async function inspectRenderedPdf(pdf: Buffer) {
  const document = await getDocument({ data: new Uint8Array(pdf) }).promise;
  const pageTexts: string[] = [];
  let portraitChromaticPixelRatio = 0;
  let portraitImageCount = 0;

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const pdfPage = await document.getPage(pageNumber);
    const textContent = await pdfPage.getTextContent();
    pageTexts.push(
      normalizeText(textContent.items.map((item) => ("str" in item ? item.str : "")).join(" "))
    );

    if (pageNumber !== 1) continue;
    const operators = await pdfPage.getOperatorList();
    for (let index = 0; index < operators.fnArray.length; index += 1) {
      if (operators.fnArray[index] !== OPS.paintImageXObject) continue;
      const imageId = operators.argsArray[index]?.[0];
      if (typeof imageId !== "string") continue;
      await new Promise<void>((resolve) => pdfPage.objs.get(imageId, () => resolve()));
      const image = pdfPage.objs.get(imageId) as {
        width: number;
        height: number;
        data: Uint8ClampedArray;
      };
      if (image.width !== 800 || image.height !== 800 || image.data.length < 3) continue;
      portraitImageCount += 1;

      let chromaticPixels = 0;
      const pixelCount = image.data.length / 3;
      for (let offset = 0; offset < image.data.length; offset += 3) {
        const red = image.data[offset];
        const green = image.data[offset + 1];
        const blue = image.data[offset + 2];
        if (Math.max(red, green, blue) - Math.min(red, green, blue) >= 20) {
          chromaticPixels += 1;
        }
      }
      portraitChromaticPixelRatio = chromaticPixels / pixelCount;
    }
  }

  return {
    pageCount: document.numPages,
    pageTexts,
    portraitImageCount,
    portraitChromaticPixelRatio
  };
}

for (const resume of resumes) {
  test(`${resume.name} resume prints in color on two Letter portrait pages`, async ({
    page
  }, testInfo) => {
    await page.goto(resume.path);
    await page.waitForLoadState("networkidle");
    await page.emulateMedia({ media: "print" });

    const portrait = page.locator("[data-resume-portrait]");
    await expect(portrait).toBeVisible();
    await expect(page.locator('[data-resume-section="experience"]')).toBeVisible();
    await expect(page.locator('[data-resume-section="education"]')).toBeVisible();
    await expect(page.locator('[data-resume-section="certifications"]')).toBeVisible();
    const expectedSchool = normalizeText(
      await page.locator('[data-resume-section="education"] h3').first().innerText()
    );
    const expectedCertification = normalizeText(
      await page.locator('[data-resume-section="certifications"] .flex-1').first().innerText()
    );

    const printStyles = await portrait.evaluate((element) => {
      const portraitStyle = getComputedStyle(element);
      const imageStyle = getComputedStyle(element.querySelector("img")!);
      return {
        filter: imageStyle.filter,
        printColorAdjust: imageStyle.getPropertyValue("print-color-adjust"),
        webkitPrintColorAdjust: imageStyle.getPropertyValue("-webkit-print-color-adjust"),
        portraitPrintColorAdjust: portraitStyle.getPropertyValue("print-color-adjust")
      };
    });
    expect(printStyles.filter).toBe("none");
    expect(printStyles.printColorAdjust || printStyles.webkitPrintColorAdjust).toBe("exact");
    expect(printStyles.portraitPrintColorAdjust).toBe("exact");

    const pdf = await page.pdf({
      format: "Letter",
      landscape: false,
      printBackground: true,
      preferCSSPageSize: true
    });
    const artifactDirectory = path.resolve("artifacts/resume-print");
    const artifactPath = path.join(artifactDirectory, `${resume.name}-resume.pdf`);
    await mkdir(artifactDirectory, { recursive: true });
    await writeFile(artifactPath, pdf);
    await testInfo.attach(`${resume.name}-resume.pdf`, {
      path: artifactPath,
      contentType: "application/pdf"
    });

    expect(pdf.toString("latin1")).toMatch(
      /\/MediaBox\s*\[0\s+0\s+612(?:\.\d+)?\s+792(?:\.\d+)?\]/
    );
    expect(countPdfPages(pdf)).toBe(2);
    const renderedPdf = await inspectRenderedPdf(pdf);
    expect(renderedPdf.pageCount).toBe(2);
    expect(renderedPdf.pageTexts[1]).toContain(expectedSchool);
    expect(renderedPdf.pageTexts[1]).toContain(expectedCertification);
    expect(renderedPdf.pageTexts[1]).toContain("CERTIFICATIONS");
    expect(renderedPdf.portraitImageCount).toBe(1);
    expect(renderedPdf.portraitChromaticPixelRatio).toBeGreaterThan(0.1);
  });
}
