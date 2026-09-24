import type {
  ClientProject,
  ClientProjectActivity,
  ClientProjectFile,
  ClientProjectTimelineStage,
} from './client-project';

export type ClientProjectMilestoneStatus = ClientProjectTimelineStage['status'];

export interface ClientProjectMilestone extends Omit<ClientProjectTimelineStage, 'fileIds'> {
  files: ClientProjectFile[];
}

export interface ClientProjectUpdate extends ClientProjectActivity {
  file: ClientProjectFile;
}

export interface ClientProjectFileGroup {
  category: string;
  label: string;
  files: ClientProjectFile[];
}

export interface ClientProjectWorkspace {
  progress: number;
  completedStages: number;
  timeline: ClientProjectMilestone[];
  updates: ClientProjectUpdate[];
  fileGroups: ClientProjectFileGroup[];
}

function groupFiles(project: ClientProject): ClientProjectFileGroup[] {
  const groups = new Map<string, ClientProjectFile[]>();
  for (const file of project.files) {
    groups.set(file.category, [...(groups.get(file.category) ?? []), file]);
  }
  return [...groups.entries()]
    .map(([category, files]) => ({
      category,
      label: files[0]?.categoryLabel ?? 'Archivos compartidos',
      files: [...files].sort((left, right) => left.sortOrder - right.sortOrder),
    }))
    .sort(
      (left, right) =>
        Math.min(...left.files.map((file) => file.sortOrder)) -
        Math.min(...right.files.map((file) => file.sortOrder)),
    );
}

function buildTimeline(project: ClientProject): ClientProjectMilestone[] {
  const filesById = new Map(project.files.map((file) => [file.fileId, file]));

  return project.clientTimeline.map((stage) => ({
    ...stage,
    files: stage.fileIds.flatMap((fileId) => {
      const file = filesById.get(fileId);
      return file ? [file] : [];
    }),
  }));
}

function buildReconstructedUpdates(project: ClientProject): ClientProjectUpdate[] {
  const filesById = new Map(project.files.map((file) => [file.fileId, file]));

  return project.clientActivity.flatMap((activity) => {
    const file = filesById.get(activity.fileId);
    return file ? [{ ...activity, file }] : [];
  });
}

/**
 * The server owns the visible client timeline and activity projection. The browser only joins
 * each already-authorized file id to the public files returned for the same project.
 */
export function buildClientProjectWorkspace(project: ClientProject): ClientProjectWorkspace {
  const timeline = buildTimeline(project);
  const updates = buildReconstructedUpdates(project);
  const completedStages = timeline.filter((entry) => entry.status === 'completed').length;
  const hasCurrentStage = timeline.some((entry) => entry.status === 'current');

  return {
    progress: timeline.length
      ? Math.round(((completedStages + (hasCurrentStage ? 0.5 : 0)) / timeline.length) * 100)
      : 0,
    completedStages,
    timeline,
    updates,
    fileGroups: groupFiles(project),
  };
}
