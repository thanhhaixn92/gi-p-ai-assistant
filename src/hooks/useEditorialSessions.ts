import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSession,
  deleteSession,
  listSessions,
  updateSession,
  type CreateSessionInput,
} from "@/services/editorialService";
import type { EditorialSession } from "@/types/editorial";

const KEY = ["editorial_sessions"] as const;

export function useEditorialSessions() {
  const qc = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: KEY,
    queryFn: listSessions,
  });

  const create = useMutation({
    mutationFn: (input: CreateSessionInput) => createSession(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EditorialSession> }) =>
      updateSession(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return { sessionsQuery, create, update, remove };
}
