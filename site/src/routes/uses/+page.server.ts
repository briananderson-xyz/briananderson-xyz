import fs from "fs";
import yaml from "js-yaml";
import path from "path";

export const prerender = true;

interface SetupItem {
  label: string;
  value: string;
}

interface SetupCategory {
  name: string;
  items: SetupItem[];
}

interface Section {
  id: string;
  name: string;
  description?: string;
  type: string;
  categories?: SetupCategory[];
}

interface InterestsFile {
  sections: Section[];
}

// /uses is the well-known convention (uses.tech) for "what hardware and
// software I use". Rather than maintain a second copy, it reads the same
// `setup` section that powers /interests, so the two never drift.
export const load = async () => {
  const filePath = path.resolve("content/interests.yaml");
  const file = fs.readFileSync(filePath, "utf-8");
  const data = yaml.load(file) as InterestsFile;
  const setup = data.sections?.find((s) => s.id === "setup");

  return {
    setup: setup
      ? { name: setup.name, description: setup.description, categories: setup.categories ?? [] }
      : null,
  };
};
