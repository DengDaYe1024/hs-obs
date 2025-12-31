
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Monitor, Mic, MicOff, Layers, Eye, EyeOff, Lock, Unlock,
  Plus, Minus, ChevronDown, MoreVertical, Settings, ArrowRightLeft,
  Cpu, Activity, LogOut, Sliders, ShieldCheck, Play, Save,
  X, Check, AlertCircle, Wand2, Info, RefreshCw, Trash2, Power,
  Settings2
} from 'lucide-react';
import { obsClient } from './services/obsClient';
import { OBSScene, OBSStats, OBSSceneItem, OBSInput } from './types/obs';
import GeminiDirector from './components/GeminiDirector';

const App: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState('192.168.34.185:4455');
  const [password, setPassword] = useState('jL7jcT9IKJsjWTZ0');
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [programImage, setProgramImage] = useState<string | null>(null);
  
  const [scenes, setScenes] = useState<OBSScene[]>([]);
  const [currentScene, setCurrentScene] = useState('');
  const [previewScene, setPreviewScene] = useState('');
  const [sceneItems, setSceneItems] = useState<OBSSceneItem[]>([]);
  const [inputs, setInputs] = useState<OBSInput[]>([]);
  const [transitions, setTransitions] = useState<any[]>([]);
  const [currentTransition, setCurrentTransition] = useState('');
  const [transitionDuration, setTransitionDuration] = useState(300);
  
  const [studioMode, setStudioMode] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isReplayBuffer, setIsReplayBuffer] = useState(false);
  const [isVirtualCam, setIsVirtualCam] = useState(false);
  const [stats, setStats] = useState<OBSStats | null>(null);
  const [streamTimecode, setStreamTimecode] = useState('00:00:00');
  
  // 模态框与基础状态
  const [addSceneModal, setAddSceneModal] = useState(false);
  const [addSourceModal, setAddSourceModal] = useState(false);
  const [filterModalSource, setFilterModalSource] = useState<string | null>(null);
  const [sourceFilters, setSourceFilters] = useState<any[]>([]);
  const [newSceneName, setNewSceneName] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceKind, setNewSourceKind] = useState('browser_source');
  const [inputKinds, setInputKinds] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [sceneCollections, setSceneCollections] = useState<string[]>([]);

  // 1. 数据获取逻辑
  const fetchAllData = useCallback(async () => {
    if (!obsClient.isConnected) return;
    try {
      const sceneData = await obsClient.getSceneList();
      setScenes(sceneData.scenes || []);
      setCurrentScene(sceneData.currentProgramSceneName || '');
      setPreviewScene(sceneData.currentPreviewSceneName || '');
      
      const studio = await obsClient.getStudioModeEnabled();
      setStudioMode(studio.studioModeEnabled);

      const trans = await obsClient.getTransitionList();
      setTransitions(trans.transitions || []);
      setCurrentTransition(trans.currentSceneTransitionName || '');
      if (trans.currentSceneTransitionDuration) setTransitionDuration(trans.currentSceneTransitionDuration);

      const kinds = await obsClient.getInputKindList();
      setInputKinds(kinds.inputKinds || []);

      const pData = await obsClient.getProfileList();
      setProfiles(pData.profiles || []);

      const cData = await obsClient.getSceneCollectionList();
      setSceneCollections(cData.sceneCollections || []);

      refreshSceneItems(sceneData.currentProgramSceneName);
      refreshInputs();
    } catch (e) { console.error("Initial load failed", e); }
  }, []);

  const refreshSceneItems = async (sceneName: string) => {
    if (!sceneName || !obsClient.isConnected) return;
    try {
      const { sceneItems } = await obsClient.getSceneItemList(sceneName);
      setSceneItems(sceneItems || []);
    } catch (e) { console.error(e); }
  };

  const refreshInputs = async () => {
    if (!obsClient.isConnected) return;
    try {
      const { inputs: rawInputs } = await obsClient.getInputList();
      const special = await obsClient.getSpecialInputs();
      const allInputNames = new Set(rawInputs.map((i: any) => i.inputName));
      
      const globalAudioNames = Object.values(special).filter(n => n && typeof n === 'string' && !allInputNames.has(n)) as string[];
      const combinedInputs = [...rawInputs, ...globalAudioNames.map(name => ({ inputName: name, inputKind: 'global_audio' }))];

      const detailed = await Promise.all(combinedInputs.map(async (i: any) => {
        try {
          const vol = await obsClient.instance.call('GetInputVolume', { inputName: i.inputName });
          const mute = await obsClient.instance.call('GetInputMute', { inputName: i.inputName });
          return { ...i, inputVolumeDb: vol.inputVolumeDb, inputMuted: mute.inputMuted };
        } catch { return { ...i, inputVolumeDb: 0, inputMuted: false }; }
      }));
      setInputs(detailed);
    } catch (e) { console.error(e); }
  };

  // 2. 实时事件监听
  useEffect(() => {
    if (!connected) return;
    const obs = obsClient.instance;

    obs.on('CurrentProgramSceneChanged', (data: any) => {
      setCurrentScene(data.sceneName);
      refreshSceneItems(data.sceneName);
    });
    obs.on('CurrentPreviewSceneChanged', (data: any) => setPreviewScene(data.sceneName));
    obs.on('InputVolumeChanged', (data: any) => {
      setInputs(prev => prev.map(i => i.inputName === data.inputName ? { ...i, inputVolumeDb: data.inputVolumeDb } : i));
    });
    obs.on('InputMuteChanged', (data: any) => {
      setInputs(prev => prev.map(i => i.inputName === data.inputName ? { ...i, inputMuted: data.inputMuted } : i));
    });
    obs.on('StreamStateChanged', (data: any) => setIsStreaming(data.outputActive));
    obs.on('RecordStateChanged', (data: any) => setIsRecording(data.outputActive));
    obs.on('VirtualCamStateChanged', (data: any) => setIsVirtualCam(data.outputActive));
    obs.on('ReplayBufferStateChanged', (data: any) => setIsReplayBuffer(data.outputActive));
    obs.on('StudioModeStateChanged', (data: any) => setStudioMode(data.studioModeEnabled));

    return () => { obs.removeAllListeners(); };
  }, [connected, currentScene]);

  // 3. 截图与状态轮询
  useEffect(() => {
    if (!connected) return;
    const poller = setInterval(async () => {
      try {
        const prog = await obsClient.getScreenshot(currentScene);
        if (prog) setProgramImage(prog.imageData);
        const s = await obsClient.getStats(); setStats(s);
        const stream = await obsClient.getStreamStatus(); setStreamTimecode(stream.outputTimecode || '00:00:00');
        
        const rec = await obsClient.getRecordStatus(); setIsRecording(rec.outputActive);
        const vc = await obsClient.getVirtualCamStatus(); setIsVirtualCam(vc.outputActive);
        
        // Replay buffer 状态安全获取
        const rb = await obsClient.getReplayBufferStatus(); 
        setIsReplayBuffer(rb.outputActive);
      } catch (e) { console.warn("Polling error", e); }
    }, 1500);
    return () => clearInterval(poller);
  }, [connected, currentScene, previewScene, studioMode]);

  const handleConnect = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setConnecting(true);
    try {
      await obsClient.connect(address, password);
      setConnected(true);
      fetchAllData();
    } catch (err: any) { alert(`连接失败: ${err.message}`); }
    finally { setConnecting(false); }
  };

  const handleAddScene = async () => {
    if (!newSceneName) return;
    try {
      await obsClient.createScene(newSceneName);
      setAddSceneModal(false);
      setNewSceneName('');
      fetchAllData();
    } catch (e) { alert("创建场景失败"); }
  };

  const handleAddSource = async () => {
    if (!newSourceName) return;
    try {
      await obsClient.createInput(currentScene, newSourceName, newSourceKind);
      setAddSourceModal(false);
      setNewSourceName('');
      refreshSceneItems(currentScene);
      refreshInputs();
    } catch (e) { alert("添加源失败"); }
  };

  const handleRemoveItem = async (itemId: number, name: string) => {
    if (confirm(`确定要移除 "${name}" 吗?`)) {
      try {
        await obsClient.removeSceneItem(currentScene, itemId);
        refreshSceneItems(currentScene);
      } catch (e) { alert("移除失败"); }
    }
  };

  const openFilters = async (sourceName: string) => {
    try {
      const { filters } = await obsClient.getSourceFilters(sourceName);
      setSourceFilters(filters || []);
      setFilterModalSource(sourceName);
    } catch (e) { alert("获取滤镜失败"); }
  };

  if (!connected) return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="bg-[#1e293b] p-8 rounded-xl border border-slate-700 shadow-2xl w-96">
        <div className="flex flex-col items-center mb-8">
          <Monitor size={48} className="text-blue-500 mb-4" />
          <h1 className="text-xl font-bold">OBS 直播中台</h1>
        </div>
        <form onSubmit={handleConnect} className="space-y-4">
          <input type="text" value={address} onChange={e=>setAddress(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded p-2 text-sm text-white" placeholder="127.0.0.1:4455" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded p-2 text-sm text-white" placeholder="Password" />
          <button className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition flex items-center justify-center gap-2 text-white">
            {connecting ? <RefreshCw className="animate-spin" size={16}/> : <Power size={16}/>}
            {connecting ? "正在连接..." : "连接 OBS"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-slate-200 overflow-hidden text-xs">
      {/* 顶部菜单 */}
      <div className="h-8 bg-[#1e293b] border-b border-slate-800 flex items-center px-4 space-x-6 text-[11px] shrink-0">
         <div className="flex space-x-3 text-slate-400">
           <span className="hover:text-white cursor-pointer transition" onClick={()=>fetchAllData()}>刷新</span>
           <span className="hover:text-white cursor-pointer transition">场景集: {currentScene}</span>
         </div>
         <div className="flex-1"></div>
         <div className="flex items-center space-x-4 text-slate-500">
           <span className="flex items-center gap-1"><Cpu size={12}/> {stats?.cpuUsage.toFixed(1)}%</span>
           <span className="flex items-center gap-1"><Activity size={12}/> {stats?.activeFps} FPS</span>
           <button onClick={()=>{obsClient.disconnect(); setConnected(false);}} className="text-red-400 px-2 border border-red-900/30 rounded hover:bg-red-900/10 transition">断开</button>
         </div>
      </div>

      {/* 监视器区域 */}
      <div className="flex-1 flex bg-black p-1 gap-1">
        {studioMode ? (
          <>
            <div className="flex-1 border border-slate-800 bg-[#020617] relative group">
              <span className="absolute top-2 left-2 bg-green-600/50 px-2 py-0.5 rounded text-[10px] font-bold z-10">PREVIEW</span>
              <div className="flex-1 flex items-center justify-center overflow-hidden h-full">
                {previewImage ? <img src={previewImage} className="max-w-full max-h-full object-contain" /> : <Layers className="text-slate-800" size={64}/>}
              </div>
            </div>
            <div className="flex-1 border border-slate-800 bg-[#020617] relative group">
              <span className="absolute top-2 left-2 bg-red-600/50 px-2 py-0.5 rounded text-[10px] font-bold z-10">PROGRAM</span>
              <div className="flex-1 flex items-center justify-center overflow-hidden h-full">
                {programImage ? <img src={programImage} className="max-w-full max-h-full object-contain" /> : <Layers className="text-slate-800" size={64}/>}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 border border-slate-800 bg-[#020617] relative group">
            <span className="absolute top-2 left-2 bg-blue-600/50 px-2 py-0.5 rounded text-[10px] font-bold z-10">{currentScene}</span>
            <div className="flex-1 flex items-center justify-center h-full">
              {programImage ? <img src={programImage} className="max-w-full max-h-full object-contain" /> : <div className="text-slate-900 font-black text-4xl italic uppercase">Remote Feed</div>}
            </div>
          </div>
        )}
      </div>

      {/* 底部控制 Dock */}
      <div className="h-72 bg-[#1e293b] border-t border-slate-900 flex shrink-0">
        <div className="w-48 border-r border-slate-900 flex flex-col">
          <div className="h-7 bg-[#334155] px-2 flex items-center justify-between border-b border-slate-900">
            <span className="font-bold text-[10px] uppercase tracking-wider">场景</span>
            <button onClick={()=>setAddSceneModal(true)} className="hover:text-white text-slate-400 transition"><Plus size={14}/></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {scenes.map(s => (
              <div key={s.sceneName} onClick={()=>studioMode ? obsClient.setPreviewScene(s.sceneName) : obsClient.setCurrentScene(s.sceneName)}
                className={`px-3 py-2 cursor-pointer border-b border-slate-800/50 transition ${currentScene === s.sceneName ? 'bg-blue-600 text-white font-bold' : previewScene === s.sceneName ? 'bg-blue-900/30 text-blue-400' : 'hover:bg-slate-800'}`}>
                {s.sceneName}
              </div>
            ))}
          </div>
        </div>

        <div className="w-64 border-r border-slate-900 flex flex-col">
          <div className="h-7 bg-[#334155] px-2 flex items-center justify-between border-b border-slate-900">
            <span className="font-bold text-[10px] uppercase tracking-wider">来源</span>
            <button onClick={()=>setAddSourceModal(true)} className="hover:text-white text-slate-400 transition"><Plus size={14}/></button>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#0f172a] custom-scrollbar">
            {sceneItems.map(item => (
              <div key={item.sceneItemId} className="group flex items-center px-3 py-2 border-b border-slate-800/30 hover:bg-slate-800 transition">
                <button onClick={()=>obsClient.setSceneItemEnabled(currentScene, item.sceneItemId, !item.sceneItemEnabled)} className="mr-3 text-slate-500 hover:text-white transition">
                  {item.sceneItemEnabled ? <Eye size={14}/> : <EyeOff size={14}/>}
                </button>
                <span className={`flex-1 truncate ${item.sceneItemEnabled ? 'text-slate-300' : 'text-slate-600 italic'}`}>{item.sourceName}</span>
                <div className="hidden group-hover:flex items-center space-x-2">
                  <button onClick={()=>openFilters(item.sourceName)} title="滤镜" className="hover:text-blue-400 transition"><Settings2 size={13}/></button>
                  <button onClick={()=>handleRemoveItem(item.sceneItemId, item.sourceName)} title="删除" className="text-red-900 hover:text-red-500 transition"><Trash2 size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 border-r border-slate-900 flex flex-col min-w-0">
          <div className="h-7 bg-[#334155] px-2 flex items-center justify-between border-b border-slate-900">
            <span className="font-bold text-[10px] uppercase tracking-wider">混音器</span>
            <Sliders size={12} className="text-slate-500" />
          </div>
          <div className="flex-1 overflow-x-auto p-3 flex gap-6 bg-[#0f172a] custom-scrollbar">
            {inputs.map(input => (
              <div key={input.inputName} className="w-14 shrink-0 flex flex-col items-center">
                <div className="flex-1 w-5 bg-black rounded border border-slate-800 relative group">
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-green-500 via-yellow-400 to-red-600 rounded transition-all duration-300" style={{ height: `${Math.min(100, (input.inputVolumeDb + 60) * 1.6)}%` }}></div>
                  <input type="range" min="-60" max="0" step="1" value={input.inputVolumeDb} onChange={e=>obsClient.setInputVolume(input.inputName, parseFloat(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any} />
                </div>
                <button onClick={()=>obsClient.setInputMute(input.inputName, !input.inputMuted)} className={`mt-2 p-1 rounded transition ${input.inputMuted ? 'bg-red-900/40 text-red-500' : 'text-slate-500 hover:text-white'}`}>
                  {input.inputMuted ? <MicOff size={14}/> : <Mic size={14}/>}
                </button>
                <span className="text-[8px] mt-1 text-slate-500 truncate w-full text-center">{input.inputName}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-44 flex flex-col bg-[#1e293b]">
          <div className="h-7 bg-[#334155] px-2 flex items-center border-b border-slate-900 text-[10px] uppercase font-bold tracking-wider">控制</div>
          <div className="flex-1 p-2 space-y-1.5 overflow-y-auto custom-scrollbar">
            <button onClick={()=>obsClient.toggleStream()} className={`w-full py-1.5 rounded font-bold text-[10px] border border-slate-700 transition ${isStreaming ? 'bg-red-800 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>{isStreaming ? '停止推流' : '开始推流'}</button>
            <button onClick={()=>obsClient.toggleRecord()} className={`w-full py-1.5 rounded font-bold text-[10px] border border-slate-700 transition ${isRecording ? 'bg-red-800 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>{isRecording ? '停止录制' : '开始录制'}</button>
            <button onClick={()=>obsClient.toggleVirtualCam()} className={`w-full py-1.5 rounded font-bold text-[10px] border border-slate-700 transition ${isVirtualCam ? 'bg-blue-900 text-blue-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>虚拟摄像头</button>
            <button onClick={()=>obsClient.setStudioModeEnabled(!studioMode)} className={`w-full py-1.5 rounded font-bold text-[10px] border border-slate-700 transition ${studioMode ? 'bg-blue-900 text-blue-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>工作室模式</button>
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="h-6 bg-[#0f172a] border-t border-slate-800 flex items-center px-4 space-x-8 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div> LIVE: {streamTimecode}</span>
        <span className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-600' : 'bg-slate-600'}`}></div> REC: {isRecording ? '正在录制' : '已停止'}</span>
        <div className="flex-1"></div>
        <span>FPS: {stats?.activeFps.toFixed(0) || 0}</span>
      </div>

      {/* 滤镜设置弹窗 */}
      {filterModalSource && (
        <div className="absolute inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
           <div className="w-96 bg-[#1e293b] border border-slate-700 rounded-lg shadow-2xl flex flex-col max-h-[80%]">
             <div className="h-10 bg-[#334155] px-4 flex items-center justify-between border-b border-slate-900">
                <span className="font-bold text-sm">滤镜 - {filterModalSource}</span>
                <button onClick={()=>setFilterModalSource(null)}><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {sourceFilters.map(f => (
                  <div key={f.filterName} className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-800">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{f.filterName}</span>
                      <span className="text-[10px] text-slate-500">{f.filterKind}</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${f.filterEnabled ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  </div>
                ))}
                {sourceFilters.length === 0 && <div className="text-center py-10 text-slate-600 italic">无滤镜</div>}
             </div>
           </div>
        </div>
      )}

      {/* 新建场景/源弹窗（省略，结构已在代码中包含） */}
      {addSceneModal && (
        <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center">
           <div className="w-80 bg-[#1e293b] p-6 rounded-lg border border-slate-700 shadow-2xl">
              <h3 className="font-bold mb-4">新建场景</h3>
              <input type="text" value={newSceneName} onChange={e=>setNewSceneName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 mb-4 rounded text-white" placeholder="场景名称" />
              <div className="flex justify-end gap-2">
                <button onClick={()=>setAddSceneModal(false)} className="px-3 py-1">取消</button>
                <button onClick={handleAddScene} className="px-6 py-1 bg-blue-600 rounded font-bold">创建</button>
              </div>
           </div>
        </div>
      )}

      {/* AI Assistant */}
      <div className="absolute top-12 right-6 w-80 h-[500px] z-[50] pointer-events-none opacity-95 hover:opacity-100 transition-opacity">
        <div className="pointer-events-auto h-full">
           <GeminiDirector 
            scenes={scenes} 
            currentScene={currentScene} 
            stats={stats} 
            isStreaming={isStreaming} 
            onSwitchScene={name => studioMode ? obsClient.setPreviewScene(name) : obsClient.setCurrentScene(name)} 
           />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default App;
