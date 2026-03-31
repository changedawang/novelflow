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
        if (text === undefined || text === null) return null;
        if (typeof text === 'object') return text;

        const raw = String(text).trim();
        if (!raw) return null;

        const tryParse = (value) => {
            if (!value) return null;
            try { return JSON.parse(value); } catch(e) { return null; }
        };

        const pushCandidate = (list, value) => {
            const normalized = String(value || '').trim();
            if (normalized && !list.includes(normalized)) list.push(normalized);
        };

        const extractBalanced = (value) => {
            const snippets = [];
            let start = -1;
            let depth = 0;
            let quote = '';
            let escaped = false;

            for (let i = 0; i < value.length; i++) {
                const ch = value[i];

                if (quote) {
                    if (escaped) {
                        escaped = false;
                        continue;
                    }
                    if (ch === '\\') {
                        escaped = true;
                        continue;
                    }
                    if (ch === quote) {
                        quote = '';
                    }
                    continue;
                }

                if (ch === '"' || ch === "'") {
                    quote = ch;
                    continue;
                }

                if (ch === '{' || ch === '[') {
                    if (depth === 0) start = i;
                    depth += 1;
                    continue;
                }

                if (ch === '}' || ch === ']') {
                    if (depth <= 0) continue;
                    depth -= 1;
                    if (depth === 0 && start >= 0) {
                        snippets.push(value.slice(start, i + 1));
                        start = -1;
                    }
                }
            }

            return snippets;
        };

        const direct = tryParse(raw);
        if (direct !== null) return direct;

        const candidates = [];
        pushCandidate(candidates, raw.replace(/^\uFEFF/, ''));
        pushCandidate(candidates, raw.replace(/```json?\s*/gi, '').replace(/```\s*/g, ''));
        (raw.match(/```(?:json)?\s*[\s\S]*?```/gi) || []).forEach(block => {
            pushCandidate(candidates, block.replace(/```json?\s*/gi, '').replace(/```\s*/g, ''));
        });

        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            const parsed = tryParse(candidate);
            if (parsed !== null) return parsed;

            const snippets = extractBalanced(candidate);
            for (let j = 0; j < snippets.length; j++) {
                const snippetParsed = tryParse(snippets[j]);
                if (snippetParsed !== null) return snippetParsed;
            }
        }

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
