const CHUNK_SIZE = 500; // frames per chunk
let dataCache = null;
let loadedChunks = new Set();

export async function loadData() {
  const url = './data/sample.json';
  
  // first fetch: metadata only (no frames yet)
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  
  const fullData = await res.json();
  
  // cache metadata and total frame count
  dataCache = {
    meta: fullData.meta,
    frames: [],
    totalFrames: fullData.frames.length,
  };
  
  return dataCache;
}

export async function loadChunk(startIdx) {
  if (!dataCache) throw new Error('loadData() must be called first');
  
  const chunkIdx = Math.floor(startIdx / CHUNK_SIZE);
  
  if (loadedChunks.has(chunkIdx)) {
    // already in cache
    return dataCache.frames.slice(startIdx, startIdx + CHUNK_SIZE);
  }
  
  // lazy-load chunk from server (assumes endpoints like /data/sample_chunk_0.json)
  const chunkUrl = `./data/sample_chunk_${chunkIdx}.json`;
  try {
    const res = await fetch(chunkUrl);
    if (!res.ok) throw new Error(`chunk ${chunkIdx} not found`);
    const chunk = await res.json();
    
    // splice frames into cache
    const insertIdx = chunkIdx * CHUNK_SIZE;
    dataCache.frames.splice(insertIdx, 0, ...chunk.frames);
    loadedChunks.add(chunkIdx);
    
    return chunk.frames;
  } catch (e) {
    console.warn(`failed to load chunk ${chunkIdx}:`, e);
    // fallback: fetch entire JSON and cache on first miss
    if (loadedChunks.size === 0) {
      const res = await fetch('./data/sample.json');
      if (!res.ok) throw e;
      const full = await res.json();
      dataCache.frames = full.frames;
      loadedChunks.add(chunkIdx);
      return full.frames.slice(startIdx, startIdx + CHUNK_SIZE);
    }
    throw e;
  }
}

// utility: get single frame, loading its chunk if needed
export async function getFrame(frameIdx) {
  if (!dataCache) throw new Error('loadData() must be called first');
  
  const chunkIdx = Math.floor(frameIdx / CHUNK_SIZE);
  const offsetInChunk = frameIdx % CHUNK_SIZE;
  
  if (!loadedChunks.has(chunkIdx)) {
    await loadChunk(chunkIdx * CHUNK_SIZE);
  }
  
  return dataCache.frames[frameIdx];
}
