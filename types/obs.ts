
export interface OBSScene {
  sceneName: string;
  sceneIndex: number;
}

export interface OBSSceneItem {
  sceneItemId: number;
  sourceName: string;
  sourceKind: string;
  sceneItemEnabled: boolean;
  sceneItemLocked: boolean;
  sourceType: string;
}

export interface OBSInput {
  inputName: string;
  inputKind: string;
  unversionedInputKind: string;
  inputVolumeDb: number;
  inputMuted: boolean;
  monitorType: string;
}

export interface OBSFilter {
  filterName: string;
  filterKind: string;
  filterEnabled: boolean;
  filterIndex: number;
}

export interface OBSStats {
  cpuUsage: number;
  memoryUsage: number;
  availableDiskSpace: number;
  activeFps: number;
  averageFrameRenderTime: number;
}

export interface OBSStreamStatus {
  outputActive: boolean;
  outputReconnecting: boolean;
  outputTimecode: string;
  outputDuration: number;
  outputBytes: number;
}

export interface OBSMediaStatus {
  inputCursor: number;
  inputDuration: number;
  mediaState: string;
}
