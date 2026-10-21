import { MEMORIES, type Memory } from "../config/content";
import { supabase } from "./supabase";

export interface PhotoSource {
  configured: boolean;
  listMemories(): Promise<Memory[]>;
  uploadMemory(file: File, caption: string, date?: string): Promise<void>;
  updateMemory(path: string, caption: string, date?: string): Promise<void>;
  downloadMemory(path: string): Promise<Blob>;
  deleteMemory(path: string): Promise<void>;
}

export const placeholderPhotoSource: PhotoSource = {
  configured: false,
  listMemories: async () => MEMORIES,
  uploadMemory: async () => {
    throw new Error("Configure Supabase before uploading photos.");
  },
  updateMemory: async () => {
    throw new Error("Configure Supabase before editing photos.");
  },
  downloadMemory: async () => {
    throw new Error("Configure Supabase before downloading photos.");
  },
  deleteMemory: async () => {
    throw new Error("Configure Supabase before deleting photos.");
  },
};

const IMAGE_FILE = /\.(avif|gif|jpe?g|png|webp)$/i;
export const SIGNED_URL_TTL_SECONDS = 30 * 60;
export const SIGNED_URL_REFRESH_INTERVAL_MS = 20 * 60 * 1000;
const PAGE_SIZE = 1000;
const MANAGED_FILENAME =
  /^memory__(\d{4}-\d{2}-\d{2}|undated)__([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})__(.+)$/i;

function createSupabasePhotoSource(bucket: string): PhotoSource {
  return {
    configured: true,
    async listMemories() {
      if (!supabase) throw new Error("Supabase is not configured.");
      const storage = supabase.storage.from(bucket);
      const files: Array<{ name: string; path: string }> = [];

      async function listFolder(folder: string): Promise<void> {
        for (let offset = 0; ; offset += PAGE_SIZE) {
          const { data, error } = await storage.list(folder, {
            limit: PAGE_SIZE,
            offset,
            sortBy: { column: "name", order: "asc" },
          });
          if (error) throw new Error(`Could not list images in the "${bucket}" bucket: ${error.message}`);

          const nestedFolders: string[] = [];
          for (const entry of data) {
            const path = folder ? `${folder}/${entry.name}` : entry.name;
            if (entry.id && IMAGE_FILE.test(entry.name)) {
              files.push({ name: entry.name, path });
            } else if (!entry.id) {
              nestedFolders.push(path);
            }
          }
          await Promise.all(nestedFolders.map((path) => listFolder(path)));
          if (data.length < PAGE_SIZE) break;
        }
      }

      await listFolder("");

      if (files.length === 0) return [];

      const paths = files.map((file) => file.path);
      const { data: signedFiles, error } = await storage.createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      if (error) throw new Error(`Could not create image URLs from the "${bucket}" bucket: ${error.message}`);

      const signedUrls = new Map(signedFiles.map((file) => [file.path, file.signedUrl]));
      return files.map((file, index) => {
        const baseName = file.name.replace(IMAGE_FILE, "");
        const managedName = baseName.match(MANAGED_FILENAME);
        let caption = baseName.replace(/[-_]+/g, " ").trim() || "a little moment";
        let date: string | undefined;
        if (managedName) {
          try {
            caption = decodeURIComponent(managedName[3]) || caption;
            date = managedName[1] === "undated" ? undefined : managedName[1];
          } catch {
            caption = baseName;
          }
        }
        const style = MEMORIES[index % MEMORIES.length];
        const src = signedUrls.get(file.path);
        if (!src) throw new Error(`Supabase did not return an image URL for "${file.name}".`);

        return {
          id: `${bucket}/${file.path}`,
          caption,
          date,
          alt: caption,
          src,
          tone: style.tone,
          tilt: style.tilt,
          charm: style.charm,
        };
      });
    },
    async uploadMemory(file, caption, date) {
      if (!supabase) throw new Error("Supabase is not configured.");
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !IMAGE_FILE.test(`.${extension}`)) {
        throw new Error("Choose an AVIF, GIF, JPEG, PNG, or WebP image.");
      }
      if (!caption.trim()) throw new Error("Add a caption for the photo.");
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a valid photo date.");

      const encodedCaption = encodeURIComponent(caption.trim()).replace(/_/g, "%5F");
      const storagePath = `memory__${date || "undated"}__${crypto.randomUUID()}__${encodedCaption}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type || `image/${extension === "jpg" ? "jpeg" : extension}`,
        upsert: false,
      });
      if (uploadError) throw new Error(`Could not upload the photo: ${uploadError.message}`);
    },
    async updateMemory(path, caption, date) {
      if (!supabase) throw new Error("Supabase is not configured.");
      if (!caption.trim()) throw new Error("Add a caption for the photo.");
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a valid photo date.");

      const filename = path.split("/").pop();
      if (!filename) throw new Error("Could not determine the photo filename.");
      const extension = filename.match(IMAGE_FILE)?.[0].toLowerCase();
      if (!extension) throw new Error("This photo format cannot be edited.");

      const oldManagedName = filename.slice(0, -extension.length).match(MANAGED_FILENAME);
      const id = oldManagedName?.[2] ?? crypto.randomUUID();
      const encodedCaption = encodeURIComponent(caption.trim()).replace(/_/g, "%5F");
      const newFilename = `memory__${date || "undated"}__${id}__${encodedCaption}${extension}`;
      const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
      const newPath = `${folder}${newFilename}`;
      if (newPath === path) return;

      const { error } = await supabase.storage.from(bucket).move(path, newPath);
      if (error) throw new Error(`Could not update the photo details: ${error.message}`);
    },
    async downloadMemory(path) {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw new Error(`Could not download the photo: ${error.message}`);
      return data;
    },
    async deleteMemory(path) {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw new Error(`Could not delete the photo: ${error.message}`);
    },
  };
}

export function getPhotoSource(): PhotoSource {
  const bucket = import.meta.env.VITE_SUPABASE_BUCKET?.trim() || "our-little-memories";
  if (!supabase) {
    if (
      !import.meta.env.VITE_SUPABASE_URL?.trim() &&
      !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() &&
      !import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
    ) {
      return placeholderPhotoSource;
    }
    const configurationMessage =
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or the legacy VITE_SUPABASE_ANON_KEY) to connect Supabase.";
    return {
      configured: true,
      listMemories: async () => {
        throw new Error(configurationMessage);
      },
      uploadMemory: async () => {
        throw new Error(configurationMessage);
      },
      updateMemory: async () => {
        throw new Error(configurationMessage);
      },
      downloadMemory: async () => {
        throw new Error(configurationMessage);
      },
      deleteMemory: async () => {
        throw new Error(configurationMessage);
      },
    };
  }

  return createSupabasePhotoSource(bucket);
}
