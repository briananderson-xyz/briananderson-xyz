import fs from "fs";
import yaml from "js-yaml";
import path from "path";

export const prerender = true;

interface Creator {
  name: string;
  handle: string;
  url: string;
  platform: string;
  thumbnail?: string;
  description: string;
}

interface CreatorCategory {
  id?: string;
  name: string;
  creators: Creator[];
}

interface SetupItem {
  label: string;
  value: string;
}

interface SetupCategory {
  name: string;
  items: SetupItem[];
}

interface TextItem {
  heading: string;
  body: string;
}

interface Section {
  id: string;
  name: string;
  description?: string;
  type: "creators" | "setup" | "text";
  categories?: CreatorCategory[] | SetupCategory[];
  items?: TextItem[];
}

interface Interests {
  title: string;
  description: string;
  sections: Section[];
}

export const load = async () => {
  try {
    const filePath = path.resolve("content/interests.yaml");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const interests = yaml.load(fileContents) as Interests;
    return { interests };
  } catch (e) {
    console.error("Error loading interests.yaml:", e);
    return { interests: null };
  }
};
