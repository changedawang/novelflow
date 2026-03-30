/* ============================================
   NovelFlow — 术语表管理器
   ============================================ */

class GlossaryManager {
    constructor() {
        this.entries = []; // GlossaryEntry[]
        this.version = 0;
    }

    /** 添加/更新术语 */
    addOrUpdate(term) {
        const existing = this.entries.find(
            e => e.original.toLowerCase() === term.original.toLowerCase()
        );
        if (existing) {
            if (!existing.locked) {
                existing.translation = term.translation || existing.translation;
                existing.category = term.category || existing.category;
                if (term.aliases) existing.aliases = [...new Set([...existing.aliases, ...term.aliases])];
            }
            existing.frequency = (existing.frequency || 0) + 1;
        } else {
            this.entries.push({
                id: Utils.uid(),
                original: term.original,
                translation: term.translation || term.original,
                category: term.category || 'other',
                aliases: term.aliases || [],
                aliasTranslations: term.aliasTranslations || {},
                description: term.description || '',
                frequency: 1,
                confidence: 0.9,
                source: term.source || 'auto',
                locked: false,
            });
        }
        this.version++;
    }

    /** 批量添加 */
    addBatch(terms) {
        for (const t of terms) {
            this.addOrUpdate(t);
        }
    }

    /** 删除术语 */
    remove(id) {
        this.entries = this.entries.filter(e => e.id !== id);
        this.version++;
    }

    /** 切换锁定 */
    toggleLock(id) {
        const entry = this.entries.find(e => e.id === id);
        if (entry) {
            entry.locked = !entry.locked;
            this.version++;
        }
    }

    /** 手动编辑术语 */
    edit(id, updates) {
        const entry = this.entries.find(e => e.id === id);
        if (entry) {
            Object.assign(entry, updates);
            entry.source = 'manual';
            this.version++;
        }
    }

    /**
     * 获取与文本相关的术语（优化版：硬上限控制）
     * 返回文本中出现的术语 + 高频角色，总数不超过maxTotal
     */
    getRelevant(text, topChars = 5, maxTotal = 12) {
        const textLower = text.toLowerCase();
        const relevant = [];
        const seenIds = new Set();

        // 1. 文本中直接出现的术语（优先级最高）
        for (const entry of this.entries) {
            if (relevant.length >= maxTotal) break;
            const names = [entry.original, ...(entry.aliases || [])];
            if (names.some(n => textLower.includes(n.toLowerCase()))) {
                if (!seenIds.has(entry.id)) {
                    relevant.push(entry);
                    seenIds.add(entry.id);
                }
            }
        }

        // 2. 高频核心角色（补充到上限）
        if (relevant.length < maxTotal) {
            const chars = this.entries
                .filter(e => e.category === 'character')
                .sort((a, b) => (b.frequency || 0) - (a.frequency || 0));

            for (const c of chars.slice(0, topChars)) {
                if (relevant.length >= maxTotal) break;
                if (!seenIds.has(c.id)) {
                    relevant.push(c);
                    seenIds.add(c.id);
                }
            }
        }

        return relevant;
    }

    /**
     * 生成注入prompt的术语表文本（精简格式）
     */
    toPromptText(relevantEntries = null) {
        const entries = relevantEntries || this.entries;
        if (entries.length === 0) return '';
        // 紧凑格式：原文→译文; 原文→译文
        return '[术语] ' + entries.map(e => {
            let s = `${e.original}→${e.translation}`;
            if (e.aliases && e.aliases.length > 0) {
                s += `(${e.aliases.slice(0, 2).join('/')})`;
            }
            return s;
        }).join('; ');
    }

    _categoryLabel(cat) {
        const labels = {
            character: '人物', location: '地名', item: '物品',
            organization: '组织', concept: '概念', other: '其他'
        };
        return labels[cat] || '其他';
    }

    /** 搜索术语 */
    search(query) {
        if (!query) return this.entries;
        const q = query.toLowerCase();
        return this.entries.filter(e =>
            e.original.toLowerCase().includes(q) ||
            e.translation.includes(q) ||
            (e.aliases || []).some(a => a.toLowerCase().includes(q))
        );
    }

    /** 导出JSON */
    toJSON() {
        return { entries: this.entries, version: this.version };
    }

    /** 从JSON恢复 */
    fromJSON(data) {
        this.entries = data.entries || [];
        this.version = data.version || 0;
    }
}
