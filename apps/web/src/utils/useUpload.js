import * as React from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      
      if (!supabase) {
        throw new Error("Kredensial Supabase (VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY) belum dikonfigurasi di file .env");
      }
      
      let fileBody;
      let fileName;
      let mimeType = null;
      
      if ("file" in input && input.file) {
        fileBody = input.file;
        fileName = `${Date.now()}-${input.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        mimeType = input.file.type;
      } else if ("base64" in input) {
        const res = await fetch(input.base64);
        fileBody = await res.blob();
        fileName = `${Date.now()}-upload.file`;
        mimeType = fileBody.type;
      } else if ("buffer" in input) {
        fileBody = input.buffer;
        fileName = `${Date.now()}-upload.file`;
      } else if ("url" in input) {
        const res = await fetch(input.url);
        fileBody = await res.blob();
        fileName = `${Date.now()}-upload.file`;
        mimeType = fileBody.type;
      } else {
        throw new Error("Invalid input. Must provide file, base64, buffer, or url.");
      }
      
      const { data, error } = await supabase.storage
        .from('contractor-documents')
        .upload(fileName, fileBody, {
          contentType: mimeType || 'application/octet-stream',
          upsert: false
        });
        
      if (error) {
        throw error;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('contractor-documents')
        .getPublicUrl(fileName);
        
      return { url: publicUrlData.publicUrl, mimeType };
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
export default useUpload;