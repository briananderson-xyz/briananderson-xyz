import fs from "fs";
import yaml from "js-yaml";
import path from "path";

export const prerender = true;

interface Creator {
  name: string;
  handle: string;
  url: string;
  description: string;
}

interface FollowingCategory {
  name: string;
  creators: Creator[];
}

interface Following {
  title: string;
  description: string;
  categories: FollowingCategory[];
}

export const load = async () => {
  try {
    const filePath = path.resolve("content/following.yaml");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const following = yaml.load(fileContents) as Following;
    return { following };
  } catch (e) {
    console.error("Error loading following.yaml:", e);
    return { following: null };
  }
};
