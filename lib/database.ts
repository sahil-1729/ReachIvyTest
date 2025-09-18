// Simple in-memory database for form entries
export interface FormEntry {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}
import { createClient } from "@supabase/supabase-js";

// Create a supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const database = {
  // Add a new form entry
  addEntry: async (
    entry: Omit<FormEntry, "id" | "created_at">
  ): Promise<FormEntry> => {
    const { data, error } = await supabase
      .from("User")
      .insert({ name: entry.name, email: entry.email, message: entry.message })
      .select();

    console.log("inserted row ", data, error);
    const insertedRow = data && data?.length > 0 ? data[0] : {};
    return insertedRow;
  },

  // Get all form entries
  getAllEntries: async (): Promise<FormEntry[]> => {
    const { data, error } = await supabase.from("User").select();
    const FormList = data ? data : [];
    // console.log("entries ", FormList);

    return FormList.sort((a, b) => {
      // console.log(new Date(b.created_at).toLocaleString());
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  },

  // Clear all entries (for testing)
  // clearEntries: (): void => {

  // },
};
