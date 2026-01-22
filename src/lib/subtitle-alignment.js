/**
 * 字幕对齐工具
 * 用于解决 ASR 识别结果与原文不一致、漏字、错字的问题
 */

/**
 * 核心对齐函数
 * @param {string} originalText 原始文案（带标点）
 * @param {Array} asrSegments ASR 识别出的片段列表
 * @returns {string}
 */
export function alignSubtitles(originalText, asrSegments) {
    if (!originalText || !asrSegments || asrSegments.length === 0) return "";
  
    // 1. 预处理原文：构建“纯净文本”到“原始文本”的索引映射
    const { cleanText: cleanOrigin, originalIndices } = buildIndexMap(originalText);
    
    let originCursor = 0;
    const srtItems = [];
  
    asrSegments.forEach((seg, i) => {
      // 清洗当前 segment 的文本（去除标点）
      const cleanSegText = seg.text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
      
      // 如果是最后一段，直接取剩余所有文本
      if (i === asrSegments.length - 1) {
        const remainingText = originalText.substring(
          originalIndices[originCursor], 
          originalText.length
        ).trim();
        
        srtItems.push({
          index: i + 1,
          start: seg.start,
          end: seg.end,
          text: remainingText || seg.text
        });
        return;
      }
  
      if (!cleanSegText) return; 
  
      // 2. 确定搜索窗口
      // 考虑到 ASR 可能多字或少字，我们不仅要看当前这句，最好能“偷看”下一句的开头
      // 来确定当前句子的边界。
      // 这里采用简化的策略：
      // 在 originCursor 之后寻找与 cleanSegText 最相似的子串。
      
      // 搜索范围：ASR文本长度的 0.5倍 到 1.5倍
      // 且必须限制在剩余文本长度内
      const minLen = Math.floor(cleanSegText.length * 0.5);
      const maxLen = Math.min(
        cleanOrigin.length - originCursor, 
        Math.ceil(cleanSegText.length * 2.0) + 5 // 放宽上限以容忍 ASR 严重漏读
      );
  
      // 3. 寻找最佳匹配截止点 (在 cleanOrigin 中的相对偏移量)
      const bestOffset = findBestCutPoint(
        cleanOrigin.substring(originCursor, originCursor + maxLen + 10), // 多取一点用于边界检测
        cleanSegText,
        originalText,
        originalIndices,
        originCursor
      );
  
      // 4. 计算 endIndex
      let endIndex = originCursor + bestOffset;
      // 兜底：如果没找到或者长度为0，至少前进1个字符
      if (endIndex <= originCursor) endIndex = originCursor + 1;
      if (endIndex > cleanOrigin.length) endIndex = cleanOrigin.length;
  
      // 5. 映射回带标点的原文
      const originalStart = originalIndices[originCursor];
      const originalEnd = (endIndex < originalIndices.length) 
        ? originalIndices[endIndex] 
        : originalText.length;
  
      let alignedText = originalText.substring(originalStart, originalEnd);
  
      // 6. 后处理：去除首尾空白
      alignedText = alignedText.trim();
  
      srtItems.push({
        index: i + 1,
        start: seg.start,
        end: seg.end,
        text: alignedText || seg.text 
      });
  
      // 更新指针
      originCursor = endIndex;
    });
  
    return generateSrtString(srtItems);
  }
  
  /**
   * 直接将 ASR 片段转换为 SRT 格式（不进行原文对齐）
   * 同时去除末尾的标点符号
   * @param {Array} segments
   * @returns {string}
   */
  function generateDirectSrt(segments) {
    const srtItems = segments.map((seg, index) => {
      // 去除末尾的标点符号 (逗号、句号、分号等，中英文)
      const cleanText = seg.text.trim().replace(/[，。；、,.;?!]+$/, '');
      
      return {
        index: index + 1,
        start: seg.start,
        end: seg.end,
        text: cleanText
      };
    });
    return generateSrtString(srtItems);
  }
  
  // --- 辅助函数 ---
  
  /**
   * 构建索引映射：纯净字符 -> 原始字符索引
   * @param {string} text
   */
  function buildIndexMap(text) {
    let cleanText = "";
    const originalIndices = [];
  
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // 仅保留汉字、字母、数字进行匹配
      // 如果需要保留空格作为分隔符（如英文），需调整正则
      if (/[\u4e00-\u9fa5a-zA-Z0-9]/.test(char)) {
        cleanText += char;
        originalIndices.push(i);
      }
    }
    // 哨兵，方便处理末尾
    originalIndices.push(text.length);
  
    return { cleanText, originalIndices };
  }
  
  /**
   * 寻找最佳分割点
   * 核心逻辑：
   * 1. 模糊匹配：找到 cleanOrigin 中与 asrText 最相似的片段
   * 2. 标点吸附：如果最佳匹配点附近有标点符号，优先吸附到标点符号（解决断句问题）
   * @param {string} originFragment
   * @param {string} asrText
   * @param {string} fullOriginalText
   * @param {Array} originalIndices
   * @param {number} globalOffset
   * @returns {number}
   */
  function findBestCutPoint(
    originFragment, 
    asrText,
    fullOriginalText,
    originalIndices,
    globalOffset
  ) {
    if (originFragment.length === 0) return 0;
  
    // 1. 基础相似度评分
    // 我们遍历 originFragment 的每一个可能长度，计算它与 asrText 的相似度
    let bestScore = -Infinity;
    let bestLen = asrText.length; // 默认长度
  
    // 搜索区间：ASR 长度的 ±50%
    // 或者是整个 fragment 的长度（如果 fragment 很短）
    const minSearch = Math.max(1, Math.floor(asrText.length * 0.5));
    const maxSearch = Math.min(originFragment.length, Math.floor(asrText.length * 1.8));
  
    for (let len = minSearch; len <= maxSearch; len++) {
      const candidate = originFragment.substr(0, len);
      
      // 计算相似度 (0~1)
      const sim = calculateSimilarity(candidate, asrText);
      
      // 长度惩罚：我们期望原文长度和ASR长度尽量接近
      // 但 ASR 经常漏字，所以原文通常比 ASR 长
      // 惩罚系数要小，允许原文比 ASR 长
      const lenDiff = Math.abs(len - asrText.length);
      const lenPenalty = lenDiff * 0.02; 
  
      // 标点奖励 (Punctuation Bonus) - 关键逻辑
      // 检查当前 len 对应的原文位置是否是标点符号
      let punctuationBonus = 0;
      const globalIdx = globalOffset + len;
      
      if (globalIdx < originalIndices.length) {
        // 获取 cleanOrigin[globalIdx] 对应在原文中的位置
        // 我们看这个位置的前面（即刚才截取的片段末尾）是不是标点
        const originalPos = originalIndices[globalIdx];
        // 检查 originalPos 之前的字符
        const prevChar = fullOriginalText[originalPos - 1]; 
        // 检查 originalPos 处的字符
        const currChar = fullOriginalText[originalPos];
  
        // 定义标点集合
        const stops = /[。！？；，、.!?;,]/;
        
        // 强力吸附：如果切分点正好在标点之后
        if (stops.test(prevChar)) {
          punctuationBonus = 0.3; // 相当于相似度增加了 30%
        } 
        // 如果切分点在标点之前（即把标点切到了下一句），给予惩罚
        else if (stops.test(currChar)) {
          punctuationBonus = -0.1;
        }
      }
  
      const finalScore = sim - lenPenalty + punctuationBonus;
  
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestLen = len;
      }
    }
  
    return bestLen;
  }
  
  /**
   * 简单的字符重合度计算 (0~1)
   * @param {string} s1
   * @param {string} s2
   * @returns {number}
   */
  function calculateSimilarity(s1, s2) {
    if (s1 === s2) return 1;
    
    // 计算公共字符数（不考虑顺序的简单版本，适合高性能粗略匹配）
    // 更严谨可用 LCS (Longest Common Subsequence)
    let common = 0;
    const s2Arr = s2.split('');
    for (const char of s1) {
      const index = s2Arr.indexOf(char);
      if (index !== -1) {
        common++;
        s2Arr.splice(index, 1); // 避免重复计算
      }
    }
    
    // Jaccard-like similarity
    return (common * 2) / (s1.length + s2.length);
  }
  
  /**
   * 格式化时间为 SRT 格式 (HH:MM:SS,ms)
   * @param {number} seconds 时间（秒）
   * @returns {string}
   */
  export function formatSRTTime(seconds) {
    const date = new Date(0);
    date.setUTCMilliseconds(Math.round(seconds * 1000));
  
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
  
    return `${hours}:${minutes}:${secs},${ms}`;
  }
  
  /**
   * 根据文本和总时长生成 SRT (简单模式)
   * 策略：按标点分句，按字符数比例分配时间
   * @param {string} text 完整文本
   * @param {number} totalDuration 音频总时长（秒）
   * @returns {string}
   */
  export function generateSRT(text, totalDuration) {
    if (!text || totalDuration <= 0) return "";
  
    // 1. 清理文本并分句
    // 正则说明：匹配非结束标点的内容 + 可选的结束标点
    // 这种简单的切分方式适用于大部分演示场景
    const rawSegments = text.match(/[^。！？；.!?;\n]+[。！？；.!?;\n]*|.+/g) || [];
    
    const segments = rawSegments.map(s => s.trim()).filter(s => s.length > 0);
  
    if (segments.length === 0) return "";
  
    // 2. 计算总有效字符数 (用于权重分配)
    const totalLength = segments.reduce((acc, cur) => acc + cur.length, 0);
  
    if (totalLength === 0) return "";
  
    const charDuration = totalDuration / totalLength;
  
    let currentTime = 0;
    let srtContent = "";
  
    segments.forEach((segment, index) => {
      const segmentDuration = segment.length * charDuration;
      const startTime = currentTime;
      const endTime = currentTime + segmentDuration;
  
      srtContent += `${index + 1}\n`;
      srtContent += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
      srtContent += `${segment}\n\n`;
  
      currentTime = endTime;
    });
  
    return srtContent;
  }
  
  /**
   * @param {Array} items
   * @returns {string}
   */
  function generateSrtString(items) {
    return items.map(item => {
      return `${item.index}\n${formatSRTTime(item.start)} --> ${formatSRTTime(item.end)}\n${item.text}\n`;
    }).join('\n');
  }
  
  // --- 业务流程集成 ---
  
  /**
   * 完整的 SRT 生成流程：文本 -> 语音 -> ASR -> 对齐 -> SRT
   * @param {string} text 原始文本
   * @returns {Promise<{ srt: string, audioBlob: Blob }>} 包含 SRT 内容和音频 Blob 的对象
   */
  export async function generateAlignedSrt(text) {
    // 1. 参数验证
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('Invalid input: text must be a non-empty string');
    }
  
    console.log('[SRT Generator] Starting process for text length:', text.length);
  
    try {
      // 2. 调用 TTS 接口生成语音
      // /cgs/api/api/UniformSpeech
      console.log('[SRT Generator] Step 1: Calling TTS API...');
      const ttsResponse = await fetch('https://vr.genew.com/cgs/api/api/UniformSpeech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
  
      if (!ttsResponse.ok) {
        throw new Error(`TTS API failed with status: ${ttsResponse.status}`);
      }
  
      const ttsData = await ttsResponse.json();
      if (!ttsData.filePath) {
        throw new Error('TTS API response missing filePath');
      }
      console.log('[SRT Generator] TTS success, file path:', ttsData.filePath);
  
  
      // 3. 下载语音文件并准备传给 ASR
      const audioFileResponse = await fetch(`https://vr.genew.com/whisper/${ttsData.filePath}`);
      if (!audioFileResponse.ok) {
        throw new Error(`Failed to download audio file: ${ttsData.filePath}`);
      }
      const audioBlob = await audioFileResponse.blob();
      const audioFile = new File([audioBlob], "speech.wav", { type: "audio/wav" });
  
  
      // 4. 调用 ASR 接口进行识别
      console.log('[SRT Generator] Step 2: Calling ASR API...');
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', '1');
  
      const asrResponse = await fetch('http://10.8.109.236:20091/v1/audio/transcriptions', {
        method: 'POST',
        body: formData,
      });
  
      if (!asrResponse.ok) {
        throw new Error(`ASR API failed with status: ${asrResponse.status}`);
      }
  
      const asrData = await asrResponse.json();
      
      // 验证返回数据格式
      if (!asrData || !Array.isArray(asrData.segments)) {
        console.error('Invalid ASR response structure:', asrData);
        throw new Error('ASR API response missing valid segments array');
      }
      console.log(`[SRT Generator] ASR success, received ${asrData.segments.length} segments`);
  
  
      // 5. 文本对齐与 SRT 生成
      console.log('[SRT Generator] Step 3: Aligning text and generating SRT...');
      
      // 使用 ASR 结果直接生成 SRT (带去标点逻辑)
      const finalSrt = generateDirectSrt(asrData.segments);
      
      console.log('[SRT Generator] Process completed successfully');
      
      // 返回 SRT 内容和音频 Blob
      return {
        srt: finalSrt,
        audioBlob: audioBlob
      };
  
    } catch (error) {
      console.error('[SRT Generator] Process failed:', error);
      throw error;
    }
  }
  