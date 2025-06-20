
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Workflow } from "@/types/workflow";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupaWorkflowRow = Database["public"]["Tables"]["workflows"]["Row"];
type SupaWorkflowInsert = Database["public"]["Tables"]["workflows"]["Insert"];
type SupaWorkflowUpdate = Database["public"]["Tables"]["workflows"]["Update"];

// Get all workflows for a user (by userId)
export async function getWorkflows(supabaseClient: SupabaseClient<Database>, userId: string): Promise<Workflow[]> {
  if (!userId) return [];
  const { data, error } = await supabaseClient
    .from("workflows")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getWorkflows] Supabase error:", error);
    return [];
  }
  // Map to Workflow type to handle null workflow_description
  return (data || []).map((row) => ({
    id: row.id,
    workflow_name: row.workflow_name,
    workflow_description: row.workflow_description || "",
    workflow_steps: row.workflow_steps as any[],
    user_id: row.user_id,
  }));
}

// Get a single workflow
export async function getWorkflow(supabaseClient: SupabaseClient<Database>, workflowId: string): Promise<Workflow | null> {
  if (!workflowId) return null;
  const { data, error } = await supabaseClient
    .from("workflows")
    .select("*")
    .eq("id", workflowId)
    .maybeSingle();
  if (error) {
    console.error("[getWorkflow] Supabase error:", error);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    workflow_name: data.workflow_name,
    workflow_description: data.workflow_description || "",
    workflow_steps: data.workflow_steps as any[],
    user_id: data.user_id,
  };
}

// Create a new workflow
export async function createWorkflow({ workflow, supabase }: { workflow: Omit<Workflow, "id">, supabase: SupabaseClient<Database> }) {
  // Remove id (let db generate), make sure user_id is set
  const payload: SupaWorkflowInsert = {
    workflow_name: workflow.workflow_name,
    workflow_description: workflow.workflow_description || "",
    workflow_steps: workflow.workflow_steps,
    user_id: workflow.user_id!,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("workflows")
    .insert([payload])
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return { id: data?.id };
}

// Update an existing workflow
export async function updateWorkflow({ id, updates, supabase }: { id: string, updates: Omit<Workflow, "id">, supabase: SupabaseClient<Database> }) {
  const payload: SupaWorkflowUpdate = {
    workflow_name: updates.workflow_name,
    workflow_description: updates.workflow_description || "",
    workflow_steps: updates.workflow_steps,
    user_id: updates.user_id,
    // do not update created_at
  };
  const { data, error } = await supabase
    .from("workflows")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return { id };
}

// Delete a workflow
export async function deleteWorkflow({ id, supabase }: { id: string, supabase: SupabaseClient<Database> }) {
  const { error } = await supabase
    .from("workflows")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
