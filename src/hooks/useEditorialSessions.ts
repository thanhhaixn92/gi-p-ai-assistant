import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  listVersions,
  snapshotVersion,
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
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["editorial_session", vars.id] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["editorial_session", id] });
    },
  });

  return { sessionsQuery, create, update, remove };
}

export function useEditorialSession(id?: string) {
  return useQuery({
    queryKey: ["editorial_session", id],
    enabled: !!id,
    queryFn: () => getSession(id!),
  });
}

export function useEditorialVersions(sessionId?: string) {
  return useQuery({
    queryKey: ["editorial_versions", sessionId],
    enabled: !!sessionId,
    queryFn: () => listVersions(sessionId!),
  });
}

export function useSnapshotEditorialVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content, note }: { sessionId: string; content: string; note?: string }) =>
      snapshotVersion(sessionId, content, note),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["editorial_versions", vars.sessionId] });
    },
  });
}
