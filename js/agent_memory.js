// js/agent_memory.js
// هذا الملف يجب أن يكون أول ملف يتم تحميله لضمان عمل الذاكرة في كل المشروع

window.AgentMemory = {
    storageKey: 'agent-memory',
    lastActivity: null,
    lastIndustrial: null,
    previousContext: null,
    lastQuery: null,
    pendingClarification: null,
    conversationContext: [],

    load: function() {
        try {
            const dataStr = localStorage.getItem(this.storageKey);
            if (dataStr) {
                const data = JSON.parse(dataStr);
                this.lastActivity = data.lastActivity || null;
                this.lastIndustrial = data.lastIndustrial || null;
                this.previousContext = data.previousContext || null;
                this.lastQuery = data.lastQuery || null;
                this.pendingClarification = data.pendingClarification || null;
                this.conversationContext = data.conversationContext || [];
                console.log("🧠 الذاكرة السياقية جاهزة للخدمة.");
            }
        } catch (error) {
            console.log('📝 بدء جلسة ذاكرة جديدة.');
        }
    },

    save: function() {
        try {
            const data = {
                lastActivity: this.lastActivity,
                lastIndustrial: this.lastIndustrial,
                previousContext: this.previousContext,
                lastQuery: this.lastQuery,
                pendingClarification: this.pendingClarification,
                conversationContext: this.conversationContext
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('⚠️ فشل حفظ الذاكرة:', error);
        }
    },

    setActivity: async function(data, query) {
        if (this.lastActivity && this.lastActivity.value !== data.value) {
            this.previousContext = { type: 'activity', data: this.lastActivity };
        }
        this.lastActivity = data;
        this.lastQuery = query;
        this.pendingClarification = null;
        await this.addToContext('activity', data.text);
        this.save();
    },

    setIndustrial: async function(data, query) {
        if (this.lastIndustrial && this.lastIndustrial.name !== data.name) {
            this.previousContext = { type: 'industrial', data: this.lastIndustrial };
        }
        this.lastIndustrial = data;
        this.lastQuery = query;
        this.pendingClarification = null;
        await this.addToContext('industrial', data.name);
        this.save();
    },

    getBacklinkContext: function() { return this.previousContext; },
    setClarification: function(matches) { this.pendingClarification = matches; this.save(); },
    addToContext: async function(type, value) {
        this.conversationContext.push({ type, value, timestamp: Date.now() });
        if (this.conversationContext.length > 10) this.conversationContext.shift();
        this.save();
    },
    getContext: function() {
        if (this.pendingClarification) return { type: 'clarification', data: this.pendingClarification };
        if (this.lastIndustrial) return { type: 'industrial', data: this.lastIndustrial };
        if (this.lastActivity) return { type: 'activity', data: this.lastActivity };
        return null;
    },
    clear: async function() {
        this.lastActivity = null;
        this.lastIndustrial = null;
        this.previousContext = null;
        this.lastQuery = null;
        this.pendingClarification = null;
        this.conversationContext = [];
        this.save();
        console.log("🧹 تم مسح الذاكرة.");
    }
};

// تشغيل التحميل فوراً
window.AgentMemory.load();