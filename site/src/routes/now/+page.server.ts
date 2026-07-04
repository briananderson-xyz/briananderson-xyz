import fs from "fs";
import yaml from "js-yaml";
import path from "path";

export const prerender = true;

interface FocusItem {
  heading: string;
  body: string;
}

interface NowFile {
  title: string;
  description: string;
  updated: string;
  intro: string;
  focus: FocusItem[];
}

// /now is the nownownow.com convention: a dated snapshot of current focus.
// Content lives in content/now.yaml so it can be updated without code changes.
export const load = async () => {
  const filePath = path.resolve("content/now.yaml");
  const file = fs.readFileSync(filePath, "utf-8");
  const now = yaml.load(file) as NowFile;

  return { now };
};
