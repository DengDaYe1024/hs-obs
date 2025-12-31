
import OBSWebSocket from 'https://esm.sh/obs-websocket-js@5.0.5';

class OBSClient {
  public instance: any;
  public isConnected: boolean = false;

  constructor() {
    this.instance = new OBSWebSocket();
  }

  async connect(address: string, password?: string) {
    let url = address.trim();
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      url = `ws://${url}`;
    }
    try {
      await this.instance.connect(url, password);
      this.isConnected = true;
      return true;
    } catch (err) {
      this.isConnected = false;
      throw err;
    }
  }

  disconnect() {
    this.instance.disconnect();
    this.isConnected = false;
  }

  // --- 通用调用 (用于透传任何 API) ---
  async call(requestType: string, requestData?: any) {
    return await this.instance.call(requestType, requestData);
  }

  // --- 1. General (通用) ---
  async getVersion() { return await this.instance.call('GetVersion'); }
  async getStats() { return await this.instance.call('GetStats'); }
  async getHotkeyList() { return await this.instance.call('GetHotkeyList'); }
  async triggerHotkeyByName(hotkeyName: string) { return await this.instance.call('TriggerHotkeyByName', { hotkeyName }); }
  async triggerHotkeyBySequence(keyId: string, keyModifiers: any) { return await this.instance.call('TriggerHotkeyBySequence', { keyId, keyModifiers }); }
  async broadcastCustomEvent(eventData: any) { return await this.instance.call('BroadcastCustomEvent', { eventData }); }

  // --- 2. Config (配置) ---
  async getProfileList() { return await this.instance.call('GetProfileList'); }
  async setCurrentProfile(profileName: string) { return await this.instance.call('SetCurrentProfile', { profileName }); }
  async createProfile(profileName: string) { return await this.instance.call('CreateProfile', { profileName }); }
  async getSceneCollectionList() { return await this.instance.call('GetSceneCollectionList'); }
  async setCurrentSceneCollection(sceneCollectionName: string) { return await this.instance.call('SetCurrentSceneCollection', { sceneCollectionName }); }
  async createSceneCollection(sceneCollectionName: string) { return await this.instance.call('CreateSceneCollection', { sceneCollectionName }); }
  async getVideoSettings() { return await this.instance.call('GetVideoSettings'); }
  async setVideoSettings(settings: any) { return await this.instance.call('SetVideoSettings', settings); }
  async getStreamServiceSettings() { return await this.instance.call('GetStreamServiceSettings'); }
  async setStreamServiceSettings(streamServiceType: string, streamServiceSettings: any) { return await this.instance.call('SetStreamServiceSettings', { streamServiceType, streamServiceSettings }); }
  async getRecordDirectory() { return await this.instance.call('GetRecordDirectory'); }
  async setRecordDirectory(recordDirectory: string) { return await this.instance.call('SetRecordDirectory', { recordDirectory }); }

  // --- 3. Scenes (场景) ---
  async getSceneList() { return await this.instance.call('GetSceneList'); }
  async getGroupList() { return await this.instance.call('GetGroupList'); }
  async setCurrentScene(sceneName: string) { return await this.instance.call('SetCurrentProgramScene', { sceneName }); }
  async setPreviewScene(sceneName: string) { return await this.instance.call('SetCurrentPreviewScene', { sceneName }); }
  async createScene(sceneName: string) { return await this.instance.call('CreateScene', { sceneName }); }
  async removeScene(sceneName: string) { return await this.instance.call('RemoveScene', { sceneName }); }
  async setSceneName(sceneName: string, newSceneName: string) { return await this.instance.call('SetSceneName', { sceneName, newSceneName }); }

  // --- 4. Inputs (输入/源) ---
  async getInputList(inputKind?: string) { return await this.instance.call('GetInputList', { inputKind }); }
  async getInputKindList(unversioned: boolean = true) { return await this.instance.call('GetInputKindList', { unversioned }); }
  async getSpecialInputs() { return await this.instance.call('GetSpecialInputs'); } // 获取桌面音频/麦克风默认源
  async getInputDefaultSettings(inputKind: string) { return await this.instance.call('GetInputDefaultSettings', { inputKind }); }
  async createInput(sceneName: string, inputName: string, inputKind: string, inputSettings: any = {}, sceneItemEnabled: boolean = true) {
    return await this.instance.call('CreateInput', { sceneName, inputName, inputKind, inputSettings, sceneItemEnabled });
  }
  async removeInput(inputName: string) { return await this.instance.call('RemoveInput', { inputName }); }
  async setInputName(inputName: string, newInputName: string) { return await this.instance.call('SetInputName', { inputName, newInputName }); }
  async getInputSettings(inputName: string) { return await this.instance.call('GetInputSettings', { inputName }); }
  async setInputSettings(inputName: string, inputSettings: any, overlay: boolean = true) { return await this.instance.call('SetInputSettings', { inputName, inputSettings, overlay }); }
  async toggleInputMute(inputName: string) { return await this.instance.call('ToggleInputMute', { inputName }); }
  async setInputMute(inputName: string, inputMuted: boolean) { return await this.instance.call('SetInputMute', { inputName, inputMuted }); }
  async setInputVolume(inputName: string, inputVolumeDb?: number, inputVolumeMul?: number) { return await this.instance.call('SetInputVolume', { inputName, inputVolumeDb, inputVolumeMul }); }
  async setInputAudioSyncOffset(inputName: string, inputAudioSyncOffset: number) { return await this.instance.call('SetInputAudioSyncOffset', { inputName, inputAudioSyncOffset }); }
  async setInputMonitorType(inputName: string, monitorType: string) { return await this.instance.call('SetInputAudioMonitorType', { inputName, monitorType }); }
  async getInputAudioTracks(inputName: string) { return await this.instance.call('GetInputAudioTracks', { inputName }); }
  async setInputAudioTracks(inputName: string, inputAudioTracks: any) { return await this.instance.call('SetInputAudioTracks', { inputName, inputAudioTracks }); }

  // --- 5. Scene Items (场景项/变换) ---
  async getSceneItemList(sceneName: string) { return await this.instance.call('GetSceneItemList', { sceneName }); }
  async getGroupSceneItemList(groupName: string) { return await this.instance.call('GetGroupSceneItemList', { groupName }); }
  async getSceneItemTransform(sceneName: string, sceneItemId: number) { return await this.instance.call('GetSceneItemTransform', { sceneName, sceneItemId }); }
  async setSceneItemTransform(sceneName: string, sceneItemId: number, sceneItemTransform: any) { return await this.instance.call('SetSceneItemTransform', { sceneName, sceneItemId, sceneItemTransform }); }
  async setSceneItemEnabled(sceneName: string, sceneItemId: number, sceneItemEnabled: boolean) { return await this.instance.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled }); }
  async setSceneItemLocked(sceneName: string, sceneItemId: number, sceneItemLocked: boolean) { return await this.instance.call('SetSceneItemLocked', { sceneName, sceneItemId, sceneItemLocked }); }
  async setSceneItemIndex(sceneName: string, sceneItemId: number, sceneItemIndex: number) { return await this.instance.call('SetSceneItemIndex', { sceneName, sceneItemId, sceneItemIndex }); }
  async removeSceneItem(sceneName: string, sceneItemId: number) { return await this.instance.call('RemoveSceneItem', { sceneName, sceneItemId }); }
  async setSceneItemBlendMode(sceneName: string, sceneItemId: number, sceneItemBlendMode: string) { return await this.instance.call('SetSceneItemBlendMode', { sceneName, sceneItemId, sceneItemBlendMode }); }

  // --- 6. Filters (滤镜) ---
  async getSourceFilters(sourceName: string) { return await this.instance.call('GetSourceFilterList', { sourceName }); }
  async createSourceFilter(sourceName: string, filterName: string, filterKind: string, filterSettings?: any) { return await this.instance.call('CreateSourceFilter', { sourceName, filterName, filterKind, filterSettings }); }
  async removeSourceFilter(sourceName: string, filterName: string) { return await this.instance.call('RemoveSourceFilter', { sourceName, filterName }); }
  async setSourceFilterEnabled(sourceName: string, filterName: string, filterEnabled: boolean) { return await this.instance.call('SetSourceFilterEnabled', { sourceName, filterName, filterEnabled }); }
  async setSourceFilterIndex(sourceName: string, filterName: string, filterIndex: number) { return await this.instance.call('SetSourceFilterIndex', { sourceName, filterName, filterIndex }); }
  async getSourceFilterSettings(sourceName: string, filterName: string) { return await this.instance.call('GetSourceFilter', { sourceName, filterName }); }
  async setSourceFilterSettings(sourceName: string, filterName: string, filterSettings: any, overlay: boolean = true) { return await this.instance.call('SetSourceFilterSettings', { sourceName, filterName, filterSettings, overlay }); }

  // --- 7. Transitions (转场) ---
  async getTransitionList() { return await this.instance.call('GetSceneTransitionList'); }
  async setCurrentTransition(transitionName: string) { return await this.instance.call('SetCurrentSceneTransition', { transitionName }); }
  async setTransitionDuration(transitionDuration: number) { return await this.instance.call('SetCurrentSceneTransitionDuration', { transitionDuration }); }
  async getTransitionKindList() { return await this.instance.call('GetTransitionKindList'); }
  async triggerTransition() { return await this.instance.call('TriggerStudioModeTransition'); }
  async getSceneTransitionCursor() { return await this.instance.call('GetSceneTransitionCursor'); }

  // --- 8. Media (媒体控制) ---
  async getMediaInputStatus(inputName: string) { return await this.instance.call('GetMediaInputStatus', { inputName }); }
  async setMediaInputCursor(inputName: string, mediaCursor: number) { return await this.instance.call('SetMediaInputCursor', { inputName, mediaCursor }); }
  async offsetMediaInputCursor(inputName: string, mediaCursorOffset: number) { return await this.instance.call('OffsetMediaInputCursor', { inputName, mediaCursorOffset }); }
  async triggerMediaAction(inputName: string, mediaAction: string) { return await this.instance.call('TriggerMediaInputActionEvent', { inputName, mediaAction }); }

  // --- 9. Outputs & Streaming (推流录制) ---
  async getStreamStatus() { return await this.instance.call('GetStreamStatus'); }
  async toggleStream() { return await this.instance.call('ToggleStream'); }
  async startStream() { return await this.instance.call('StartStream'); }
  async stopStream() { return await this.instance.call('StopStream'); }

  async getRecordStatus() { return await this.instance.call('GetRecordStatus'); }
  async toggleRecord() { return await this.instance.call('ToggleRecord'); }
  async startRecord() { return await this.instance.call('StartRecord'); }
  async stopRecord() { return await this.instance.call('StopRecord'); }
  async pauseRecord() { return await this.instance.call('PauseRecord'); }
  async resumeRecord() { return await this.instance.call('ResumeRecord'); }

  // --- Replay Buffer (回放缓存) 安全处理 ---
  async getReplayBufferStatus() { 
    try { 
      return await this.instance.call('GetReplayBufferStatus'); 
    } catch (e: any) { 
      // 捕获 "Replay buffer is not available" 错误并返回非激活状态
      return { outputActive: false }; 
    } 
  }
  async toggleReplayBuffer() { 
    try {
      return await this.instance.call('ToggleReplayBuffer'); 
    } catch (e: any) {
      console.warn("OBS Replay Buffer API Error:", e.message);
      return { outputActive: false };
    }
  }
  async startReplayBuffer() { 
    try {
      return await this.instance.call('StartReplayBuffer'); 
    } catch (e: any) {
      console.warn("OBS Replay Buffer API Error:", e.message);
    }
  }
  async stopReplayBuffer() { 
    try {
      return await this.instance.call('StopReplayBuffer'); 
    } catch (e: any) {
      console.warn("OBS Replay Buffer API Error:", e.message);
    }
  }
  async saveReplayBuffer() { 
    try {
      return await this.instance.call('SaveReplayBuffer'); 
    } catch (e: any) {
      console.warn("OBS Replay Buffer API Error:", e.message);
    }
  }
  async getLastReplayBufferPath() { 
    try {
      return await this.instance.call('GetLastReplayBufferPath'); 
    } catch {
      return { replayBufferPath: "" };
    }
  }

  async getVirtualCamStatus() { return await this.instance.call('GetVirtualCamStatus'); }
  async toggleVirtualCam() { return await this.instance.call('ToggleVirtualCam'); }
  async startVirtualCam() { return await this.instance.call('StartVirtualCam'); }
  async stopVirtualCam() { return await this.instance.call('StopVirtualCam'); }

  // --- 10. Studio Mode (工作室模式) ---
  async getStudioModeEnabled() { return await this.instance.call('GetStudioModeEnabled'); }
  async setStudioModeEnabled(studioModeEnabled: boolean) { return await this.instance.call('SetStudioModeEnabled', { studioModeEnabled }); }

  // --- 11. UI & Screenshot (截图) ---
  async getScreenshot(sourceName: string) {
    if (!this.isConnected) return null;
    try {
      return await this.instance.call('GetSourceScreenshot', {
        sourceName, imageFormat: 'webp', imageWidth: 480, imageHeight: 270, imageCompressionQuality: 50
      });
    } catch (e) { return null; }
  }

  // --- 12. Source Active (检测源是否正在渲染) ---
  async getSourceActive(sourceName: string) {
    try {
      return await this.instance.call('GetSourceActive', { sourceName });
    } catch {
      return { videoActive: false, videoShowing: false };
    }
  }
}

export const obsClient = new OBSClient();
