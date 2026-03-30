/* ============================================
   NovelFlow — 工具函数
   ============================================ */

const Utils = {
    /** 估算token数（粗略：英文~4字符/token，中文~2字符/token） */
    estimateTokens(text) {
        if (!text) return 0;
        let en = 0, zh = 0, other = 0;
        for (const ch of text) {
            if (/[\u4e00-\u9fff]/.test(ch)) zh++;
            else if (/[a-zA-Z]/.test(ch)) en++;
            else other++;
        }
        return Math.ceil(en / 4 + zh / 1.5 + other / 4);
    },

    /** 格式化数字（1234567 → 1.23M） */
    formatNumber(n) {
        if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
        return String(n);
    },

    /** 延迟 */
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    },

    /** 生成唯一ID */
    uid() {
        return 'id_' + Math.random().toString(36).slice(2, 10);
    },

    /** 安全解析JSON（从可能包含markdown代码块的文本中提取） */
    parseJSON(text) {
        // 尝试直接解析
        try { return JSON.parse(text); } catch(e) {}
        // 去除markdown代码块
        const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '');
        try { return JSON.parse(cleaned); } catch(e) {}
        // 提取第一个{...}或[...]
        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objMatch) try { return JSON.parse(objMatch[0]); } catch(e) {}
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrMatch) try { return JSON.parse(arrMatch[0]); } catch(e) {}
        return null;
    },

    /** 截断文本 */
    truncate(text, maxLen = 100) {
        if (!text || text.length <= maxLen) return text;
        return text.slice(0, maxLen) + '...';
    },

    /** 下载文件 */
    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type: type + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /** HTML转义 */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /** 本地存储 */
    saveLocal(key, value) {
        try { localStorage.setItem('nf_' + key, JSON.stringify(value)); } catch(e) {}
    },
    loadLocal(key, fallback = null) {
        try {
            const v = localStorage.getItem('nf_' + key);
            return v ? JSON.parse(v) : fallback;
        } catch(e) { return fallback; }
    }
};
