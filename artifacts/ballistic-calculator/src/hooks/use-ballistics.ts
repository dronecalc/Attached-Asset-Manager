import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProfiles,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
  useCalculateBallistics,
  getGetProfilesQueryKey
} from "@workspace/api-client-react";

// Wrap the generated hooks to add automatic cache invalidation for profiles
// and provide a clean interface for the components.

export function useProfiles() {
  return useGetProfiles();
}

export function useCreateProfileMutation() {
  const queryClient = useQueryClient();
  return useCreateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfilesQueryKey() });
      }
    }
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfilesQueryKey() });
      }
    }
  });
}

export function useDeleteProfileMutation() {
  const queryClient = useQueryClient();
  return useDeleteProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfilesQueryKey() });
      }
    }
  });
}

export function useCalculatorMutation() {
  return useCalculateBallistics();
}
