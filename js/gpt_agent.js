// gpt_agent.js
/****************************************************************************
 * 🤖 GPT-Like Agent v9.0 - ULTIMATE PRECISION EDITION
 * 
 * ⚡ الميزات الثورية:
 * ✓ ذكاء اصطناعي متقدم لفهم الأسئلة المعقدة
 * ✓ استخراج بيانات بدقة 100% من جميع المصادر
 * ✓ ربط ديناميكي مع القرار 104 (معالج خارجي)
 * ✓ معالجة لغوية طبيعية عربية قوية
 * ✓ نظام ذاكرة سياقية ذكي
 * ✓ واجهة مستخدم تفاعلية محسنة
 ****************************************************************************/

// تهيئة كائن الوكيل العالمي لربط الملفات
window.GPT_AGENT = window.GPT_AGENT || {};

if (document.getElementById('gptFloatBtn')) {
    console.log("GPT Agent already loaded.");
} else {

// ==================== ربط ملف التنسيقات (CSS) ====================
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = 'js/gpt-agent-style.css';
document.head.appendChild(styleLink);

// ==================== الهيكل (HTML) ====================
const chatHTML = `
    <div class="gpt-float-btn" id="gptFloatBtn">
        <i class="fas fa-bolt"></i>
    </div>

    <div class="gpt-chat-container" id="gptChatContainer" style="display: none;"> 
        <div class="gpt-header">
            <div class="gpt-title">
                <i class="fas fa-brain"></i>
                مساعد لأعضاء اللجان
                <div class="gpt-status"></div>
            </div>
            <div class="gpt-header-actions">
                <div class="gpt-settings-btn" onclick="window.showGPTVoiceSelector()" title="إعدادات الصوت">
                    <i class="fas fa-cog"></i>
                </div>
                <div class="gpt-clear-btn" onclick="clearMemoryWithConfirm()" title="مسح الذاكرة">
                    <i class="fas fa-eraser"></i>
                </div>
                <div class="gpt-expand-btn" id="gptExpandBtn" onclick="toggleExpandChat()" title="توسيع/تصغير">
                    <i class="fas fa-expand-alt"></i>
                </div>
                <div class="gpt-close" onclick="toggleGPTChat()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        </div>
        
        <div class="gpt-messages" id="gptMessages">
            <div class="message-row ai">
                <div class="avatar ai"><i class="fas fa-sparkles"></i></div>
                <div class="message-bubble">
                    🧠 <strong>مرحباً! أنا مساعدك الفني</strong><br><br>
                    يمكنني مساعدتك في:<br>
                    ✅ الأنشطة والتراخيص بالتفاصيل الكاملة..<br>
                    ✅ المناطق الصناعية (عدد، مواقع، قرارات..)<br>
                    ✅ القرار 104 والحوافز الاستثمارية...<br>
                    ✅ الملاحظات الفنية لفريق اللجنة<br>
                    ✅ الجهات الصادرة للتراخيص والسند التشريعي...<br>
                    ✅ النظام لا يعتمد على أي نموذج ذكاء اصطناعي (لا يوجد تسريب بيانات)<br><br>
                    <em style="color: #10a37f;">جرب أن تسأل: "مصنع مستحضرات طبية"</em>
                </div>
            </div>
        </div>

        <div class="gpt-input-area">
            <div class="gpt-input-wrapper" id="gptInputWrapper">
                <textarea class="gpt-input" id="gptInput" placeholder="اكتب سؤالك هنا أو اضغط على المايك..." rows="1" oninput="autoResize(this); checkInputState()" onkeydown="handleEnter(event)"></textarea>
                
                <div class="gpt-voice-controls" id="gptVoiceControls" style="display: none; margin-left: 8px;">
                    <button class="voice-btn speaker" id="gptSpeakerBtn" title="كتم الصوت" onclick="window.toggleSpeech()">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                
                <button class="gpt-action-btn" id="gptActionBtn" title="التحدث بالصوت" onclick="handleActionButtonClick()">
                    <i class="fas fa-microphone" id="actionIcon"></i>
                </button>
            </div>
            
            <div class="voice-wave" id="voiceWave" style="display: none;">
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
            </div>
            
            <div class="voice-text" id="voiceText" style="display: none;"></div>
        </div>
    </div>
`;

document.body.insertAdjacentHTML('beforeend', chatHTML);

// ==================== منطق التحريك (Draggable Logic) ====================
(function initDraggable() {
    const btn = document.getElementById('gptFloatBtn');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let hasMoved = false;

    function dragStart(e) {
        if (e.type === 'mousedown' && e.which !== 1) return;
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        initialLeft = btn.offsetLeft;
        initialTop = btn.offsetTop;
        startX = clientX;
        startY = clientY;
        isDragging = true;
        hasMoved = false;
        btn.style.bottom = 'auto';
        btn.style.right = 'auto';
        btn.style.left = initialLeft + "px";
        btn.style.top = initialTop + "px";

        if (e.type === 'touchstart') {
            document.addEventListener('touchmove', dragMove, { passive: false });
            document.addEventListener('touchend', dragEnd);
        } else {
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
        }
    }

    function dragMove(e) {
        if (!isDragging) return;
        if (e.type === 'touchmove') e.preventDefault();
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        const dx = clientX - startX;
        const dy = clientY - startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            hasMoved = true;
        }
        btn.style.left = (initialLeft + dx) + "px";
        btn.style.top = (initialTop + dy) + "px";
    }

    function dragEnd() {
        isDragging = false;
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchmove', dragMove);
        document.removeEventListener('touchend', dragEnd);
        if (!hasMoved && typeof toggleGPTChat === 'function') {
            toggleGPTChat();
        }
    }

    btn.addEventListener('mousedown', dragStart);
    btn.addEventListener('touchstart', dragStart, { passive: false });
})();

// ==================== أدوات المعالجة اللغوية ====================

function normalizeArabic(text) {
    if (!text) return "";
    return text.toString()
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/[ةه]/g, 'ه')
        .replace(/[ىي]/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

window.GPT_AGENT.stopWords = ['في', 'من', 'الى', 'على', 'عن', 'هل', 'ما', 'هو', 'هي', 'ذلك', 'تلك', 'لي', 'لك', 'كيف', 'ماذا', 'متى', 'اين', 'لماذا', 'كم'];

function extractKeywords(text) {
    const normalized = normalizeArabic(text);
    const stopWordsList = window.GPT_AGENT.stopWords || [];
    return normalized.split(/\s+/)
        .filter(word => word.length > 2 && !stopWordsList.includes(word));
}

// كاشف نوع السؤال - الإصدار المحسّن
window.detectQuestionType = function(query) {
    const q = normalizeArabic(query);

    // فحص مبكر: إذا كان السؤال عن "عدد المناطق التابعة لجهة"
    const isCountAreasForDependency = (
        /عدد.*مناطق.*تابع/i.test(q) ||
        /كم.*منطق.*تابع/i.test(q) ||
        /عدد.*منطق.*تابع/i.test(q)
    );
    if (isCountAreasForDependency) {
        return {
            isCount: true, isList: false, isLocation: false, isLicense: false, isAuthority: false,
            isLaw: false, isGuide: false, isTechnical: false, isDecision104: false,
            isDependency: true, isGovernorate: false, isIndustrial: true, isActivity: false,
            isYesNo: /هل|ايه|صح|خطأ/.test(q),
            isGeneralAreaCount: false, isSpecificAreaCount: true,
            isAreaList: false, isGovernanceAuthority: false, isLicensingAuthority: false,
            isAreaExistenceCheck: false, hasLicenseContext: false, hasLocationContext: false
        };
    }

    const hasIndustrialPattern = (
        /منطقه صناعيه|مناطق صناعيه|منطقة صناعية|مناطق صناعية/.test(q) ||
        (q.includes('صناعيه') && q.includes('منطقه')) ||
        (q.includes('صناعية') && q.includes('منطقة'))
    );
    const hasAreaKeywords = q.includes('منطقه') || q.includes('منطقة') || q.includes('صناعيه') || q.includes('صناعية');
    const hasLicenseKeywords = /ترخيص|تراخيص|رخصه|رخصة|موافقه|موافقة|اذن|إذن|اجراءات|إجراءات|متطلبات|شروط/.test(q);
    const hasLocationKeywords = /مكان|موقع|فين|اين|خريطه|خريطة|احداثيات|إحداثيات|عنوان/.test(q);
    const isGovernanceAuthority = /جهة (ولاية|تبعية|ادارة|إدارة) (المنطقة|منطقة|المناطق)/.test(q) || 
                                   /تابع(ة)? ل(ـ)?(المحافظة|الهيئة|وزارة)/.test(q);
    const isLicensingAuthority = /جهة (مصدرة|اصدار|إصدار|ترخيص|منح|موافقة)/.test(q) ||
                                  /(من|اي|أي) (يصدر|تصدر|يمنح|تمنح) (الترخيص|الرخصة)/.test(q);
    const isAreaExistenceCheck = /هل/.test(q) && hasIndustrialPattern && 
                                  !hasLicenseKeywords && 
                                  !/(ترخيص|نشاط|مشروع)/.test(q);
    const isDecision104 = /قرار.*104|104|حافز|حوافز|قطاع\s*(أ|ا|ب)/.test(q);

    return {
        isCount: /عدد|كام|كم|تعداد|عدده/.test(q),
        isList: /اسماء|قائمه|قائمة|اذكر|وضح|ايه|اي|ما هي|عرض|اظهر/.test(q),
        isLocation: hasLocationKeywords,
        isLicense: hasLicenseKeywords,
        isAuthority: /جهه|جهة|هيئه|هيئة|وزاره|وزارة|مسئول|مسؤول|من يصدر/.test(q),
        isLaw: /قانون|سند|تشريع|قرار|تشريعي/.test(q),
        isGuide: /دليل|جايد|guide|رابط|لينك|تحميل|مجلد/.test(q),
        isTechnical: /ملاحظات|فنيه|فنية|معاينه|معاينة|لجنه|لجنة|فحص/.test(q),
        isDecision104: isDecision104,
        isDependency: /تابع|تبعيه|تبعية|ولايه|ولاية|جهه ولايه|جهة ولاية/.test(q),
        isGovernorate: /محافظه|محافظة|مدينه|مدينة|مركز|قرية/.test(q),
        isIndustrial: hasIndustrialPattern || hasAreaKeywords,
        isActivity: /نشاط|مشروع|عمل|business/.test(q),
        isYesNo: /هل|ايه|صح|خطأ|صحيح|غلط/.test(q),
        isGeneralAreaCount: (q.includes('عدد') && hasAreaKeywords && !/(محافظه|جهه|ولاية|تابع)/.test(q)),
        isSpecificAreaCount: (q.includes('عدد') && hasAreaKeywords && /(محافظه|جهه|ولاية|تابع)/.test(q)),
        isAreaList: (
            (q.includes('ما هي') && hasAreaKeywords) || 
            (q.includes('قائمه') && hasAreaKeywords) ||
            (q.includes('عرض') && hasAreaKeywords) || 
            (q.includes('اظهر') && hasAreaKeywords) ||
            (q.includes('المناطق') && q.includes('تابعه')) ||
            (q.includes('المناطق') && q.includes('تبعية')) ||
            (q.includes('المناطق') && q.includes('تبع'))
        ),
        isGovernanceAuthority: isGovernanceAuthority,
        isLicensingAuthority: isLicensingAuthority,
        isAreaExistenceCheck: isAreaExistenceCheck,
        hasLicenseContext: hasLicenseKeywords,
        hasLocationContext: hasLocationKeywords
    };
};

// ==================== 🧠 محلل السياق الذكي ====================
function analyzeContext(query, questionType) {
    const q = normalizeArabic(query);
    let areaScore = 0;
    let activityScore = 0;
    const hasAreaKeywords = q.includes('منطقه') || q.includes('منطقة') || q.includes('صناعيه') || q.includes('صناعية');
    const hasLicenseContext = /ترخيص|تراخيص|متطلبات|شروط|اجراءات/.test(q);

    if (questionType.isGeneralAreaCount) areaScore += 2000;
    if (questionType.isSpecificAreaCount) areaScore += 1900;
    if (questionType.isAreaList) areaScore += 1850;
    if (questionType.isGovernanceAuthority) areaScore += 1800;
    if (questionType.isAreaExistenceCheck) areaScore += 1750;

    if (hasAreaKeywords) {
        if (/عرض|اظهر/.test(q) && /(كل|جميع)/.test(q)) {
            areaScore += 1850;
        } else if (/(كل|جميع)/.test(q) && !hasLicenseContext) {
            areaScore += 1700;
        }
    }

    if (questionType.isCount && /منطقه|منطقة|مناطق/.test(q)) {
        areaScore += 1500;
    }

    if (/منطقة صناعية/.test(q) || /مناطق صناعية/.test(q)) areaScore += 1000;
    if (questionType.hasLocationContext && questionType.isIndustrial) areaScore += 800;
    if (questionType.isGovernorate && questionType.isIndustrial) areaScore += 700;
    if (/قرار (إنشاء|انشاء)/.test(q)) areaScore += 700;
    if (/موقع.*منطقة/.test(q) || /مكان.*منطقة/.test(q)) areaScore += 750;
    if (/(محافظة|محافظه).*صناعية/.test(q)) areaScore += 600;
    if (questionType.isDependency && questionType.isIndustrial) areaScore += 650;

    if (questionType.hasLicenseContext && questionType.isIndustrial) {
        areaScore -= 400;
    }
    if (questionType.hasLocationContext && questionType.isActivity) {
        activityScore -= 300;
    }

    const hasSpecificAreaName = checkForSpecificAreaName(q);
    if (hasSpecificAreaName.found) {
        areaScore += 500;
    }

    const hasSpecificActivityType = checkForSpecificActivityType(q);
    if (hasSpecificActivityType.found) {
        activityScore += 500;
    }

    const delta = areaScore - activityScore;
    const totalScore = areaScore + activityScore;
    const confidence = totalScore > 0 ? Math.min(Math.abs(delta) / totalScore * 100, 100) : 0;

    return {
        areaScore, activityScore, delta, confidence: Math.round(confidence),
        recommendation: delta > 300 ? 'areas' : delta < -300 ? 'activities' : 'ambiguous',
        needsClarification: Math.abs(delta) < 300 && totalScore > 0,
        specificAreaName: hasSpecificAreaName.name || null,
        specificActivityType: hasSpecificActivityType.type || null
    };
}

// ==================== 🔍 فحص وجود اسم منطقة محددة ====================
function checkForSpecificAreaName(normalizedQuery) {
    if (typeof industrialAreasData === 'undefined') return { found: false, name: null };
    for (const area of industrialAreasData) {
        const areaName = normalizeArabic(area.name);
        const simplifiedName = areaName.replace(/المنطقة الصناعية/g, '').replace(/المنطقه الصناعيه/g, '').replace(/ب/g, '').trim();
        if (normalizedQuery.includes(areaName)) return { found: true, name: area.name };
        if (simplifiedName.length > 4 && normalizedQuery.includes(simplifiedName)) return { found: true, name: area.name };
    }
    return { found: false, name: null };
}

// ==================== 🎯 مستخرج الكيانات ====================
function extractEntities(query) {
    const q = normalizeArabic(query);
    const governorates = extractGovernorates(q);
    const dependencies = extractDependencies(q);
    const areaNames = extractAreaNames(q);
    const activityTypes = extractActivityTypes(q);
    return {
        governorates, dependencies, areaNames, activityTypes,
        hasGovernorate: governorates.length > 0,
        hasDependency: dependencies.length > 0,
        hasAreaName: areaNames.length > 0,
        hasActivityType: activityTypes.length > 0
    };
}

// ==================== 📍 استخراج المحافظات ====================
function extractGovernorates(normalizedQuery) {
    if (typeof industrialAreasData === 'undefined') return [];
    const governorates = [...new Set(industrialAreasData.map(a => a.governorate))];
    return governorates.filter(gov => normalizedQuery.includes(normalizeArabic(gov)));
}

// ==================== 🏛️ استخراج جهات الولاية ====================
function extractDependencies(normalizedQuery) {
    if (typeof industrialAreasData === 'undefined') return [];
    const dependencies = [...new Set(industrialAreasData.map(a => a.dependency))];
    const found = [];
    for (const dep of dependencies) {
        const normalizedDep = normalizeArabic(dep);
        const depKeywords = normalizedDep.split(/\s+/).filter(w => w.length > 2);
        const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
        let matchScore = 0;
        let totalPossible = depKeywords.length;
        for (const depWord of depKeywords) {
            for (const queryWord of queryWords) {
                if (depWord === queryWord) { matchScore += 2; break; }
                else if (depWord.includes(queryWord) && queryWord.length > 2) { matchScore += 1.5; break; }
                else if (queryWord.includes(depWord) && depWord.length > 2) { matchScore += 1.5; break; }
                else if (depWord.length > 3 && queryWord.length > 3) {
                    const similarity = calculateSimilarity(depWord, queryWord);
                    if (similarity > 0.7) { matchScore += 1; break; }
                }
            }
        }
        const matchPercentage = (matchScore / (totalPossible * 2)) * 100;
        if (matchPercentage >= 30) found.push(dep);
    }
    return found;
}

function calculateSimilarity(word1, word2) {
    const len1 = word1.length, len2 = word2.length;
    const maxLen = Math.max(len1, len2);
    let matches = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
        if (word1[i] === word2[i]) matches++;
    }
    return matches / maxLen;
}

// ==================== 🏭 استخراج أسماء المناطق ====================
function extractAreaNames(normalizedQuery) {
    if (typeof industrialAreasData === 'undefined') return [];
    const found = [];
    for (const area of industrialAreasData) {
        const areaName = normalizeArabic(area.name);
        const distinctiveName = areaName.replace(/المنطقة الصناعية/g, '').replace(/المنطقه الصناعيه/g, '').replace(/^ب/g, '').trim();
        if (distinctiveName.length > 3) {
            if (normalizedQuery.includes(distinctiveName)) {
                found.push({ name: area.name, distinctiveName, matchType: 'full', confidence: 100 });
                continue;
            }
            const words = distinctiveName.split(/\s+/).filter(w => w.length > 2);
            let matchedWords = 0;
            for (const word of words) {
                if (normalizedQuery.includes(word)) matchedWords++;
            }
            if (matchedWords > 0) {
                const confidence = Math.round((matchedWords / words.length) * 100);
                if (confidence >= 60) found.push({ name: area.name, distinctiveName, matchType: 'partial', confidence });
            }
        }
    }
    return found.sort((a, b) => b.confidence - a.confidence);
}

// ==================== 📋 استخراج أنواع الأنشطة ====================
function extractActivityTypes(normalizedQuery) {
    if (typeof masterActivityDB === 'undefined') return [];
    const found = [];
    for (const activity of masterActivityDB) {
        const activityText = normalizeArabic(activity.text);
        if (normalizedQuery.includes(activityText)) {
            found.push({ text: activity.text, value: activity.value, matchType: 'exact', confidence: 100 });
            continue;
        }
        if (activity.keywords) {
            for (const keyword of activity.keywords) {
                const normalizedKeyword = normalizeArabic(keyword);
                if (normalizedQuery.includes(normalizedKeyword)) {
                    found.push({ text: activity.text, value: activity.value, matchType: 'keyword', confidence: 80 });
                    break;
                }
            }
        }
        if (activity.synonyms) {
            for (const synonym of activity.synonyms) {
                const normalizedSynonym = normalizeArabic(synonym);
                if (normalizedQuery.includes(normalizedSynonym)) {
                    found.push({ text: activity.text, value: activity.value, matchType: 'synonym', confidence: 70 });
                    break;
                }
            }
        }
    }
    const unique = [];
    const seen = new Set();
    for (const item of found) {
        if (!seen.has(item.value)) {
            seen.add(item.value);
            unique.push(item);
        }
    }
    return unique.sort((a, b) => b.confidence - a.confidence);
}

// ==================== 🤔 آلية الاستفسار الذكية ====================
function requestClarification(query, context, entities, questionType) {
    const q = normalizeArabic(query);
    const ambiguityType = detectAmbiguityType(query, context, entities, questionType);
    if (!ambiguityType) return null;
    switch (ambiguityType.type) {
        case 'authority_confusion': return buildAuthorityClairification(query, entities);
        case 'area_vs_activity': return buildAreaVsActivityClarification(query, entities);
        case 'multiple_areas': return buildMultipleAreasClarification(entities.areaNames);
        case 'multiple_activities': return buildMultipleActivitiesClarification(entities.activityTypes);
        case 'dependency_confusion': return buildDependencyClarification(entities.dependencies);
        default: return buildGeneralClarification(query, context);
    }
}

function detectAmbiguityType(query, context, entities, questionType) {
    const q = normalizeArabic(query);
    if (questionType.isAuthority && !questionType.isGovernanceAuthority && !questionType.isLicensingAuthority) {
        if (q.includes('جهه') || q.includes('جهة')) return { type: 'authority_confusion', confidence: 90 };
    }
    if (context.needsClarification && Math.abs(context.delta) < 200) return { type: 'area_vs_activity', confidence: 85 };
    if (entities.areaNames.length > 1 && entities.areaNames[0].confidence < 100) return { type: 'multiple_areas', confidence: 80 };
    if (entities.activityTypes.length > 1 && entities.activityTypes[0].confidence < 100) return { type: 'multiple_activities', confidence: 75 };
    if (entities.dependencies.length > 1) return { type: 'dependency_confusion', confidence: 70 };
    return null;
}

function buildAuthorityClairification(query, entities) {
    return `
        <div class="clarification-card">
            <div class="clarification-header"><div class="clarification-icon">🤔</div><div class="clarification-title">سؤالك يحتمل أكثر من معنى</div></div>
            <div class="clarification-subtitle">هل تقصد:</div>
            <div class="choice-btn" onclick="clarifyIntent('governance_authority')">
                <span class="choice-icon">🏛️</span> 
                <div class="choice-content"><strong>جهة الولاية للمنطقة الصناعية</strong><small>أي جهة حكومية تتبع لها المنطقة (محافظة، هيئة، وزارة)</small></div>
            </div>
            <div class="choice-btn" onclick="clarifyIntent('licensing_authority')">
                <span class="choice-icon">📋</span> 
                <div class="choice-content"><strong>الجهة المُصدرة لتراخيص الأنشطة</strong><small>الجهة التي تمنح التراخيص لممارسة النشاط</small></div>
            </div>
        </div>
    `;
}

function buildAreaVsActivityClarification(query, entities) {
    const areaContext = entities.hasAreaName ? `للمنطقة ${entities.areaNames[0].distinctiveName}` : 'للمناطق الصناعية';
    const activityContext = entities.hasActivityType ? `لنشاط ${entities.activityTypes[0].text}` : 'للأنشطة';
    return `
        <div class="clarification-card">
            <div class="clarification-header"><div class="clarification-icon">🤔</div><div class="clarification-title">سؤالك يحتمل معنيين مختلفين</div></div>
            <div class="clarification-subtitle">هل تبحث عن:</div>
            <div class="choice-btn" onclick="clarifyIntent('industrial_areas')">
                <span class="choice-icon">🏭</span> 
                <div class="choice-content"><strong>معلومات عن المناطق الصناعية</strong><small>الموقع، جهة الولاية، المساحة، قرار الإنشاء ${areaContext}</small></div>
            </div>
            <div class="choice-btn" onclick="clarifyIntent('business_activities')">
                <span class="choice-icon">📋</span> 
                <div class="choice-content"><strong>تراخيص ومتطلبات الأنشطة</strong><small>التراخيص المطلوبة، الإجراءات، الجهات المٌصدرة ${activityContext}</small></div>
            </div>
        </div>
    `;
}

function buildMultipleAreasClarification(areaNames) {
    let optionsHTML = '';
    areaNames.slice(0, 3).forEach((area, index) => {
        optionsHTML += `<div class="choice-btn" onclick="selectSpecificArea('${area.name.replace(/'/g, "\\'")}')">
            <span class="choice-icon">${index === 0 ? '🎯' : '🏭'}</span> 
            <div class="choice-content"><strong>${area.name}</strong><small>تطابق ${area.confidence}% - ${area.matchType === 'full' ? 'تطابق كامل' : 'تطابق جزئي'}</small></div>
        </div>`;
    });
    return `
        <div class="clarification-card">
            <div class="clarification-header"><div class="clarification-icon">🗺️</div><div class="clarification-title">وجد عدة مناطق مطابقة</div></div>
            <div class="clarification-subtitle">اختر المنطقة المقصودة:</div>
            ${optionsHTML}
        </div>
    `;
}

function buildMultipleActivitiesClarification(activityTypes) {
    let optionsHTML = '';
    activityTypes.slice(0, 3).forEach((activity, index) => {
        optionsHTML += `<div class="choice-btn" onclick="selectSpecificActivity('${activity.value}', '${activity.text.replace(/'/g, "\\'")}')">
            <span class="choice-icon">${index === 0 ? '🎯' : '📋'}</span> 
            <div class="choice-content"><strong>${activity.text}</strong><small>تطابق ${activity.confidence}% - ${activity.matchType === 'exact' ? 'تطابق دقيق' : 'مرادف'}</small></div>
        </div>`;
    });
    return `
        <div class="clarification-card">
            <div class="clarification-header"><div class="clarification-icon">📋</div><div class="clarification-title">وجد عدة أنشطة مطابقة</div></div>
            <div class="clarification-subtitle">اختر النشاط المقصود:</div>
            ${optionsHTML}
        </div>
    `;
}

function buildDependencyClarification(dependencies) {
    let optionsHTML = '';
    dependencies.forEach((dep, index) => {
        const count = industrialAreasData.filter(a => a.dependency === dep).length;
        optionsHTML += `<div class="choice-btn" onclick="selectDependency('${dep.replace(/'/g, "\\'")}')">
            <span class="choice-icon">🏛️</span> 
            <div class="choice-content"><strong>${dep}</strong><small>${count} منطقة صناعية</small></div>
        </div>`;
    });
    return `
        <div class="clarification-card">
            <div class="clarification-header"><div class="clarification-icon">🏢</div><div class="clarification-title">وجد عدة جهات ولاية مطابقة</div></div>
            <div class="clarification-subtitle">اختر جهة الولاية المقصودة:</div>
            ${optionsHTML}
        </div>
    `;
}

function buildGeneralClarification(query, context) {
    return `
        <div class="clarification-card">
            <div class="clarification-header"><div class="clarification-icon">💭</div><div class="clarification-title">لم أفهم سؤالك بوضوح</div></div>
            <div class="clarification-subtitle">يمكنك إعادة صياغة السؤال أو اختيار أحد المواضيع:</div>
            <div class="choice-btn" onclick="clarifyIntent('show_areas_options')"><span class="choice-icon">🏭</span> <strong>المناطق الصناعية</strong></div>
            <div class="choice-btn" onclick="clarifyIntent('show_activities_options')"><span class="choice-icon">📋</span> <strong>تراخيص الأنشطة</strong></div>
        </div>
    `;
}

// ==================== 🎯 دوال معالجة اختيارات التوضيح ====================
window.clarifyIntent = function(intent) {
    const input = document.getElementById('gptInput');
    switch(intent) {
        case 'governance_authority': input.value = 'المناطق الصناعية: ما جهات الولاية للمناطق الصناعية؟'; break;
        case 'licensing_authority': input.value = 'الانشطة والتراخيص: ما الجهات المُصدرة للتراخيص؟'; break;
        case 'industrial_areas': input.value = 'المناطق الصناعية: ' + document.getElementById('gptInput').value; break;
        case 'business_activities': input.value = 'الانشطة والتراخيص: ' + document.getElementById('gptInput').value; break;
        case 'show_areas_options': input.value = 'كم عدد المناطق الصناعية؟'; break;
        case 'show_activities_options': input.value = 'ما التراخيص المطلوبة لمصنع؟'; break;
    }
    sendMessage();
};

window.selectSpecificArea = function(areaName) {
    document.getElementById('gptInput').value = areaName;
    sendMessage();
};

window.selectSpecificActivity = function(value, text) {
    document.getElementById('gptInput').value = text;
    sendMessage();
};

window.selectDependency = function(dependency) {
    document.getElementById('gptInput').value = `المناطق التابعة لـ ${dependency}`;
    sendMessage();
};

// ==================== 🔍 فحص وجود نوع نشاط محدد ====================
function checkForSpecificActivityType(normalizedQuery) {
    if (typeof masterActivityDB === 'undefined') return { found: false, type: null };
    const activityIndicators = ['فندق', 'مطعم', 'مصنع', 'صيدلية', 'عيادة', 'مخزن', 'مستودع', 'ورشة', 'معمل', 'مزرعة', 'مخبز', 'محل'];
    for (const indicator of activityIndicators) {
        if (normalizedQuery.includes(indicator)) return { found: true, type: indicator };
    }
    return { found: false, type: null };
}

// ==================== 🧠 DeepIntentAnalyzer - فاحص النية العميق ====================
const DeepIntentAnalyzer = {
    knownActivityWords: [
        'فندق', 'مطعم', 'مصنع', 'صيدلية', 'عيادة', 'مخزن', 'مستودع', 'ورشة', 'معمل', 'مزرعة', 'مخبز', 'محل',
        'كافيه', 'كافتيريا', 'بقالة', 'سوبر', 'جزار', 'حلاوي', 'نجار', 'سباك', 'كهربائي', 'طبيب', 'دكتور', 'بيطري',
        'مدرسة', 'جامعة', 'معهد', 'محطة', 'مزار', 'منتجع'
    ],
    isStandaloneActivity(query) {
        const q = normalizeArabic(query).trim();
        const words = q.split(/\s+/).filter(w => w.length > 1);
        if (words.length <= 2) {
            for (const actWord of this.knownActivityWords) {
                if (q.includes(normalizeArabic(actWord))) return { found: true, activity: actWord };
            }
        }
        return { found: false };
    },
    scanForAreaName(query) {
        if (typeof industrialAreasData === 'undefined' || !industrialAreasData) return { found: false, score: 0, areaName: null };
        const q = normalizeArabic(query);
        const queryWords = q.split(/\s+/).filter(w => w.length > 2);
        if (queryWords.length === 0) return { found: false, score: 0, areaName: null };
        let bestMatch = { found: false, score: 0, areaName: null, area: null };
        for (const area of industrialAreasData) {
            const areaName = normalizeArabic(area.name);
            const areaWords = areaName.replace(/المنطقة الصناعية/g, '').replace(/المنطقه الصناعيه/g, '').replace(/^ب/g, '').split(/\s+/).filter(w => w.length > 2 && !['في', 'من', 'على', 'الي'].includes(w));
            if (areaWords.length === 0) continue;
            let matchedQueryWords = 0;
            for (const qWord of queryWords) {
                for (const aWord of areaWords) {
                    if (aWord === qWord || aWord.includes(qWord) || qWord.includes(aWord)) {
                        matchedQueryWords++;
                        break;
                    }
                }
            }
            const coverage = matchedQueryWords / queryWords.length;
            if (coverage >= 0.4 && matchedQueryWords > 0) {
                const score = coverage * 100;
                if (score > bestMatch.score) {
                    bestMatch = { found: true, score, areaName: area.name, area };
                }
            }
        }
        return bestMatch;
    },
    analyze(query) {
        const activityCheck = this.isStandaloneActivity(query);
        if (activityCheck.found) return { intent: 'activity', confidence: 95, reason: 'standalone_activity', details: activityCheck };
        const areaCheck = this.scanForAreaName(query);
        if (areaCheck.found && areaCheck.score >= 50) return { intent: 'industrial', confidence: areaCheck.score, reason: 'deep_area_scan', details: areaCheck };
        if (areaCheck.found && areaCheck.score >= 40) return { intent: 'probable_industrial', confidence: areaCheck.score, reason: 'weak_area_scan', details: areaCheck };
        return { intent: 'unknown', confidence: 0, reason: 'no_signal', details: null };
    }
};

// ==================== الذاكرة السياقية مع التخزين الدائم ====================
window.AgentMemory = {
    storageKey: 'agent-memory',
       activeGuide: null, // 🆕 جديد: لتخزين الدليل النشط
    lastActivity: null,
    lastIndustrial: null,
    previousContext: null,
    lastQuery: null,
    pendingClarification: null,
    conversationContext: [],

    async load() {
        try {
            const dataStr = localStorage.getItem(this.storageKey);
            if (dataStr) {
                const data = JSON.parse(dataStr);
                         this.activeGuide = data.activeGuide || null; // 🆕 تحميل الدليل النشط
                this.lastActivity = data.lastActivity || null;
                this.lastIndustrial = data.lastIndustrial || null;
                this.previousContext = data.previousContext || null;
                this.lastQuery = data.lastQuery || null;
                this.pendingClarification = data.pendingClarification || null;
                this.conversationContext = data.conversationContext || [];
            }
        } catch (error) {
            console.log('📝 بدء ذاكرة جديدة (تم استخدام localStorage)');
        }
    },

    async save() {
        try {
            const data = {
                         activeGuide: this.activeGuide, // 🆕 حفظ الدليل النشط
                lastActivity: this.lastActivity,
                lastIndustrial: this.lastIndustrial,
                previousContext: this.previousContext,
                lastQuery: this.lastQuery,
                pendingClarification: this.pendingClarification,
                conversationContext: this.conversationContext
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('⚠️ فشل حفظ الذاكرة في localStorage:', error);
        }
    },

    async setActivity(data, query) {
        if (this.lastActivity && this.lastActivity.value !== data.value) {
            this.previousContext = { type: 'activity', data: this.lastActivity };
            console.log("💾 تم نقل النشاط السابق للذاكرة الاحتياطية: ", this.lastActivity.text);
        }
        this.lastActivity = data;
        this.lastQuery = query;
        this.pendingClarification = null;
        await this.addToContext('activity', data.text);
        await this.save();
    },

    async setIndustrial(data, query) {
        if (this.lastIndustrial && this.lastIndustrial.name !== data.name) {
            this.previousContext = { type: 'industrial', data: this.lastIndustrial };
            console.log("💾 تم نقل المنطقة السابقة للذاكرة الاحتياطية: ", this.lastIndustrial.name);
        }
        this.lastIndustrial = data;
        this.lastQuery = query;
        this.pendingClarification = null;
        await this.addToContext('industrial', data.name);
        await this.save();
    },

    getBacklinkContext() {
        return this.previousContext;
    },

    async setClarification(matches) {
        this.pendingClarification = matches;
        await this.save();
    },

    async addToContext(type, value) {
        this.conversationContext.push({ type, value, timestamp: Date.now() });
        if (this.conversationContext.length > 10) this.conversationContext.shift();
        await this.save();
    },

    getContext() {
        if (this.pendingClarification) return { type: 'clarification', data: this.pendingClarification };
        if (this.lastIndustrial) return { type: 'industrial', data: this.lastIndustrial };
        if (this.lastActivity) return { type: 'activity', data: this.lastActivity };
        return null;
    },
 // 🆕 دالة جديدة لضبط الدليل النشط
    async setActiveGuide(guideId, guideName) {
        this.activeGuide = { id: guideId, name: guideName };
        this.lastActivity = null; // تفريغ النشاط مؤقتاً للتركيز
        this.lastIndustrial = null;
        await this.save();
    },

    // 🆕 دالة للخروج من وضع الدليل
    async clearGuideMode() {
        this.activeGuide = null;
        await this.save();
    },
    
    async clear() {
        this.lastActivity = null;
        this.lastIndustrial = null;
        this.previousContext = null;
        this.lastQuery = null;
        this.pendingClarification = null;
        this.conversationContext = [];
        await this.save();
    }
};

// ==================== 🔍 البحث في المناطق الصناعية باستخدام NeuralSearch ====================
function searchIndustrialZonesWithNeural(query) {
    const q = normalizeArabic(query);
    if (q === 'المحافظه' || q === 'المحافظة' || q === 'الجهه' || q === 'الجهة') return null;
    if (typeof industrialAreasData === 'undefined' || !industrialAreasData) return null;
    console.log("🏭 البحث في المناطق باستخدام NeuralSearch:", query);
    const searchResults = NeuralSearch(query, industrialAreasData, { minScore: 50 });
    if (searchResults.results.length === 0) return null;
    const topResult = searchResults.results[0];
    if (topResult.finalScore >= 1000) return topResult.originalData;
    if (searchResults.results.length >= 2) {
        const secondScore = searchResults.results[1].finalScore;
        const scoreDiff = topResult.finalScore - secondScore;
        if (scoreDiff < 200 && secondScore >= 300) {
            AgentMemory.setClarification(searchResults.results.slice(0, 3).map(r => ({
                type: 'industrial', name: r.originalData.name, data: r.originalData, score: r.finalScore
            })));
            return null;
        }
    }
    if (topResult.finalScore >= 300) return topResult.originalData;
    return null;
}

// ==================== دوال مساعدة جديدة ====================
window.normalizeArabic = function(text) {
    if (!text) return "";
    return text.toString()
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/[ةه]/g, 'ه')
        .replace(/[ىي]/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
};

window.generateDefaultResponse = function(query) {
    const q = normalizeArabic(query);
    if (q.length < 3) {
        return `😕 <strong>السؤال قصير جداً</strong><br><br>💡 جرب أن تسأل:<br>• "كم عدد المناطق الصناعية؟"<br>• "ما التراخيص المطلوبة لفندق؟"`;
    }
    return `😕 <strong>عذراً، لم أجد معلومات عن: "${query}"</strong><br><br>💡 جرب أحد هذه الأسئلة:<br>• "كم عدد المناطق الصناعية في مصر؟"<br>• "اذكر اسم أي نشاط"<br>• "هل نشاط النقل الجماعي وارد بالقرار 104؟"`;
};

// ==================== دالة فحص الارتباط الذكية المُحسّنة ====================
function isQueryRelatedToContext(query, context) {
    const q = normalizeArabic(query);
    const questionType = detectQuestionType(query);
    const previous = AgentMemory.getBacklinkContext();

    let isReferringToPrevious = q.includes('السابق') || q.includes('القديم') || q.includes('الاول');
    if (!isReferringToPrevious && previous && previous.data) {
        const prevName = normalizeArabic(previous.data.text || previous.data.name || "");
        const coreWords = prevName.split(/\s+/).filter(w => w.length > 3);
        isReferringToPrevious = coreWords.some(word => q.includes(word));
    }

    if (isReferringToPrevious && previous) {
        console.log("🔄 تبديل السياق للنشاط السابق المذكور جزئياً...");
        const currentBackup = { type: context.type, data: context.data };
        const nameToRestore = previous.data.text || previous.data.name;
        if (previous.type === 'activity') {
            AgentMemory.lastActivity = previous.data;
            AgentMemory.lastIndustrial = null;
        } else {
            AgentMemory.lastIndustrial = previous.data;
            AgentMemory.lastActivity = null;
        }
        AgentMemory.previousContext = currentBackup;
        AgentMemory.save();
        showGPTNotification(`تم العودة إلى: ${nameToRestore}`, 'success');
        return true;
    }

    if (!context || !context.data) return false;
    console.log("🔍 فحص الارتباط - السؤال:", query);
    console.log("📋 السياق الحالي:", context.type);

    const isShortFollowUpQuestion = (
        q.length <= 30 &&
        (
            q === 'ترخيص' || q === 'تراخيص' || q === 'موقع' || q === 'موقع ملائم' || q === 'الموقع الملائم' ||
            q === 'قرار' || q === 'قانون' || q === 'المحافظه' || q === 'المحافظة' || q.includes('محافظه') ||
            q.includes('محافظة') || q.includes('تبعيه') || q.includes('تبعية') || q === 'جهه' || q === 'جهة' ||
            q === 'الجهه المصدره' || q === 'دليل' || q === 'رابط' || q === 'ملاحظات' || q === 'ملاحظات فنيه' ||
            q === '104' || q === 'قرار 104' || q === 'حوافز' || q === 'خريطه' || q === 'خريطة' || q === 'احداثيات' ||
            q === 'هل هو وارد بالقرار 104' || q === 'هل هوارد بالقرار 104' || q === 'هل هو وارد' ||
            q === 'هل موجود' || q === 'وارد بالقرار 104' || q === 'هل موجود بالقرار 104' || q === 'هل مدرج بالقرار 104' ||
            /^(ما|ماذا|كيف|هل)\s+(ترخيص|تراخيص|موقع|قرار|جهه|دليل)/.test(q) ||
            /^(اين|فين|وين)\s/.test(q) && q.length < 15 ||
            /^هل\s*(هو|هي|هوارد|هيوارد)?\s*(وارد|موجود|مدرج)\s*(بالقرار|في القرار|ب)?\s*104?/.test(q)
        )
    );

    if (isShortFollowUpQuestion) {
        console.log("✅ سؤال مكمل قصير - مرتبط بالسياق");
        return true;
    }

    if (context.type === 'activity') {
        const isDetailedFollowUp = (
            questionType.isLicense || questionType.isAuthority || questionType.isLaw ||
            questionType.isGuide || questionType.isTechnical || questionType.isLocation || questionType.isDecision104
        );
        if (isDetailedFollowUp) {
            const deepCheck = DeepIntentAnalyzer.isStandaloneActivity(query);
            if (deepCheck.found) {
                const currentActivityName = normalizeArabic(context.data.text || "");
                const newActivityFound = normalizeArabic(deepCheck.activity);
                if (!currentActivityName.includes(newActivityFound) && !newActivityFound.includes(currentActivityName)) {
                    console.log(`⚠️ تصادم كيانات: نشاط جديد [${newActivityFound}] يختلف عن السياق الحالي [${currentActivityName}]`);
                    return false;
                }
            }
        }
        if (isDetailedFollowUp && !/(منطقه|منطقة|مناطق|صناعيه|صناعية)/.test(q)) {
            console.log("✅ سؤال تفصيلي عن النشاط - مرتبط");
            return true;
        }
    }

    if (context.type === 'industrial') {
        const isDetailedFollowUp = (
            questionType.isLocation || questionType.isLaw || questionType.isDependency ||
            /قرار|انشاء|مساحه|فدان|احداثيات/.test(q)
        );
        if (isDetailedFollowUp && !/ترخيص|تراخيص|نشاط|مشروع/.test(q)) {
            console.log("✅ سؤال تفصيلي عن المنطقة - مرتبط");
            return true;
        }
    }

    if (context.type === 'activity') {
        const isAboutAreas = (
            /كم عدد.*منطقه|كم عدد.*مناطق/.test(q) || /ما هي.*المناطق/.test(q) ||
            /عرض.*كل.*المناطق/.test(q) || /قائمه.*مناطق/.test(q) ||
            questionType.isGeneralAreaCount || questionType.isSpecificAreaCount ||
            (questionType.isAreaList && q.length > 15)
        );
        if (isAboutAreas) {
            console.log("❌ السؤال الجديد عن المناطق - غير مرتبط");
            return false;
        }
    }

    if (context.type === 'industrial') {
        const isAboutCompleteActivity = (
            q.length > 15 && /نشاط.*ترخيص|ترخيص.*نشاط/.test(q) && !/منطقه|منطقة|مناطق/.test(q)
        );
        if (isAboutCompleteActivity) {
            console.log("❌ السؤال الجديد عن نشاط كامل - غير مرتبط");
            return false;
        }
    }

    if (context.type === 'activity') {
        const activityName = normalizeArabic(context.data.text);
        const mainWords = activityName.split(/\s+/).filter(w => w.length > 4);
        let matchCount = 0;
        for (const word of mainWords) if (q.includes(word)) matchCount++;
        if (mainWords.length > 0 && matchCount === 0 && q.length > 15) {
            console.log("❌ لا يحتوي على كلمات النشاط السابق - غير مرتبط");
            return false;
        }
        if (matchCount >= Math.ceil(mainWords.length * 0.5)) {
            console.log("✅ يحتوي على كلمات النشاط السابق - مرتبط");
            return true;
        }
    }

    if (context.type === 'industrial') {
        const areaName = normalizeArabic(context.data.name);
        const mainWords = areaName.split(/\s+/).filter(w => w.length > 4);
        let matchCount = 0;
        for (const word of mainWords) if (q.includes(word)) matchCount++;
        if (mainWords.length > 0 && matchCount === 0 && q.length > 15) {
            console.log("❌ لا يحتوي على كلمات المنطقة السابقة - غير مرتبط");
            return false;
        }
        if (matchCount >= Math.ceil(mainWords.length * 0.5)) {
            console.log("✅ يحتوي على كلمات المنطقة السابقة - مرتبط");
            return true;
        }
    }

    if (q.length < 10) {
        const deepCheck = DeepIntentAnalyzer.isStandaloneActivity(query);
        if (deepCheck.found) {
            console.log(`❌ كلمة نشاط مستقلة "${deepCheck.activity}" - غير مرتبط بالسياق`);
            return false;
        }
        console.log("✅ سؤال قصير جداً وليس نشاطاً مستقلاً - افتراضياً مرتبط");
        return true;
    }

    console.log("⚠️ غير محدد - افتراضياً غير مرتبط");
    return false;
}

// ==================== المحرك الرئيسي ====================
async function processUserQuery(query) {
    console.log("🔍 معالجة السؤال:", query);
        // 🆕 [1] فحص وضع الدليل (الأولوية القصوى)
    if (AgentMemory.activeGuide) {
        // التحقق من طلب الخروج
        if (query.match(/(خروج|إلغاء|رجوع|كفاية|شكرا|انتهيت|غيره)/i)) {
            // 1. حفظ الاسم مؤقتاً قبل المسح
            const guideName = AgentMemory.activeGuide.name;
            
            // 2. مسح الوضع
            await AgentMemory.clearGuideMode();
            
            // 3. استخدام الاسم المحفوظ
            return `✅ <strong>تم الخروج من وضع الدليل: ${guideName}</strong><br>يمكنك الآن سؤالي عن الأنشطة والمناطق او القرار 104 بشكل عام.`;
        }
        
        // استدعاء دالة البحث في الدليل (سننشئها في الخطوة 3)
        // حالياً سنضع هذا الكود ليعمل كـ "جسر"
        if (window.handleGuideSearch) {
            return window.handleGuideSearch(query, AgentMemory.activeGuide);
        } else {
            return "⚠️ عذراً، محرك بحث الأدلة قيد التحميل. يرجى المحاولة بعد قليل.";
        }
    }
    // 🎯 توجيه مباشر لمحرك القرار 104 المطور (من الملف الخارجي)
    if (window.isDecision104Question && window.isDecision104Question(query)) {
        console.log("🎯 العقل المدبر: توجيه السؤال لمحرك القرار 104 المطور");
        const decision104Response = window.handleDecision104Query(query, detectQuestionType(query));
        if (decision104Response) return decision104Response;
    }

    const currentDbType = detectQuestionDatabase(query);
    const contextAnalysis = ContextManager.isRelatedToContext(query, currentDbType);
    console.log("🧠 تحليل السياق:", {
        related: contextAnalysis.related, strength: contextAnalysis.strength, previousContext: contextAnalysis.context
    });
    if (contextAnalysis.related && contextAnalysis.context) {
        console.log("💡 السياق المرتبط:", contextAnalysis.context);
    }

    const q = normalizeArabic(query);
    const questionType = detectQuestionType(query);
    const context = AgentMemory.getContext();
    console.log("\n🚀 ========== بداية المعالجة ==========");
    console.log("📝 السؤال:", query);

    // الأسئلة الموجهة صراحة
    if (q.startsWith('المناطق الصناعيه:') || q.startsWith('مناطق صناعيه:') || q.startsWith('مناطق:')) {
        const actualQuery = query.replace(/^(المناطق الصناعيه:|مناطق صناعيه:|مناطق:)/i, '').trim();
        await AgentMemory.clear();
        return await handleIndustrialQuery(actualQuery, detectQuestionType(actualQuery), null, null);
    }

    if (q.startsWith('الانشطه والتراخيص:') || q.startsWith('نشاط:') || q.startsWith('تراخيص:')) {
        const actualQuery = query.replace(/^(الانشطه والتراخيص:|نشاط:|تراخيص:)/i, '').trim();
        await AgentMemory.clear();
        return await handleActivityQuery(actualQuery, detectQuestionType(actualQuery), null, null);
    }

    if (context && context.type !== 'clarification') {
        const isRelated = isQueryRelatedToContext(query, context);
        if (!isRelated) {
            console.log("🔄 مسح الذاكرة تلقائياً - سؤال جديد غير مرتبط");
            await AgentMemory.clear();
        } else {
            const activeContext = AgentMemory.getContext();
            const contextResponse = await handleContextualQuery(query, questionType, activeContext);
            if (contextResponse) return contextResponse;
        }
    }

    if (context && context.type === 'clarification') {
        const choice = context.data.find(c => 
            normalizeArabic(c.name).split(/\s+/).some(word => q.includes(word))
        );
        if (choice) {
            if (choice.type === 'industrial') {
                AgentMemory.setIndustrial(choice.data, query);
                return formatIndustrialResponse(choice.data);
            } else {
                await AgentMemory.setActivity(choice.data, query);
                return formatActivityResponse(choice.data, questionType);
            }
        }
    }


    console.log("⏱️ بداية التحليل الشامل...");
    const startTime = performance.now();
    const analysisContext = analyzeContext(query, questionType);
    const entities = extractEntities(query);
    const endTime = performance.now();
    console.log(`✅ اكتمل التحليل في ${(endTime - startTime).toFixed(2)}ms`);
    console.log("📊 السياق:", analysisContext);
    console.log("🎯 الكيانات:", entities);

    const deepIntent = DeepIntentAnalyzer.analyze(query);
    console.log("🧠 DeepIntent نتيجة:", deepIntent);

    if (deepIntent.intent === 'industrial' && (deepIntent.confidence >= 80 || q.includes('منطق'))) {
        console.log("🎯 DeepIntent حسم: منطقة صناعية → توجيه مباشر للمناطق");
        const response = await handleIndustrialQuery(query, questionType, analysisContext, entities);
        if (response) return response;
    }

    if (deepIntent.intent === 'activity' && deepIntent.confidence >= 90) {
        console.log("🎯 DeepIntent حسم: نشاط مستقل → توجيه مباشر للأنشطة");
        await AgentMemory.clear();
        const response = await handleActivityQuery(query, questionType, analysisContext, entities);
        if (response) return response;
    }

    if (deepIntent.intent === 'probable_industrial' && analysisContext.recommendation === 'ambiguous') {
        console.log("🎯 DeepIntent hint: غالباً منطقة → نغير التوصية للـ areas");
        analysisContext.recommendation = 'areas';
    }

    if (analysisContext.needsClarification) {
        const clarification = requestClarification(query, analysisContext, entities, questionType);
        if (clarification) {
            console.log("🤔 طلب توضيح من المستخدم");
            return clarification;
        }
    }

    const isClearlyIndustrial = checkIfIndustrialQuestion(query, questionType, analysisContext, entities);
    const isClearlyActivity = checkIfActivityQuestion(query, questionType, analysisContext, entities);
    console.log("🏭 واضح أنه منطقة:", isClearlyIndustrial);
    console.log("📋 واضح أنه نشاط:", isClearlyActivity);
    console.log("⚖️ التوصية:", analysisContext.recommendation);

    if (isClearlyIndustrial && !isClearlyActivity) {
        console.log("🎯 توجيه مباشر → معالج المناطق");
        const response = await handleIndustrialQuery(query, questionType, analysisContext, entities);
        if (response) return response;
    }

    if (isClearlyActivity && !isClearlyIndustrial) {
        console.log("🎯 توجيه مباشر → معالج الأنشطة");
        const response = await handleActivityQuery(query, questionType, analysisContext, entities);
        if (response) return response;
    }

    if (analysisContext.recommendation === 'areas') {
        console.log("🎯 توصية السياق → معالج المناطق");
        const response = await handleIndustrialQuery(query, questionType, analysisContext, entities);
        if (response) return response;
        const activityResponse = await handleActivityQuery(query, questionType, analysisContext, entities);
        if (activityResponse) return activityResponse;
    }

    if (analysisContext.recommendation === 'activities') {
        console.log("🎯 توصية السياق → معالج الأنشطة");
        const response = await handleActivityQuery(query, questionType, analysisContext, entities);
        if (response) return response;
        const industrialResponse = await handleIndustrialQuery(query, questionType, analysisContext, entities);
        if (industrialResponse) return industrialResponse;
    }

    if (!isClearlyIndustrial && !isClearlyActivity) {
        console.log("🔍 التباس - بحث متوازن (DeepIntent hint:", deepIntent.intent, ")");
        if (deepIntent.intent === 'probable_industrial' || deepIntent.intent === 'industrial') {
            const industrialResponse = await handleIndustrialQuery(query, questionType, analysisContext, entities);
            if (industrialResponse) {
                console.log("✅ وجدت في المناطق (بعد DeepIntent hint)");
                return industrialResponse;
            }
            const activityResponse = await handleActivityQuery(query, questionType, analysisContext, entities);
            if (activityResponse) {
                console.log("✅ وجدت في الأنشطة");
                return activityResponse;
            }
        } else {
            const activityResponse = await handleActivityQuery(query, questionType, analysisContext, entities);
            if (activityResponse) {
                console.log("✅ وجدت في الأنشطة");
                return activityResponse;
            }
            const industrialResponse = await handleIndustrialQuery(query, questionType, analysisContext, entities);
            if (industrialResponse) {
                console.log("✅ وجدت في المناطق");
                return industrialResponse;
            }
        }
    }

    if (isClearlyIndustrial && isClearlyActivity) {
        console.log("⚠️ تعارض - كلاهما واضح!");
        if (analysisContext.areaScore > analysisContext.activityScore) {
            const response = await handleIndustrialQuery(query, questionType, analysisContext, entities);
            if (response) return response;
        } else {
            const response = await handleActivityQuery(query, questionType, analysisContext, entities);
            if (response) return response;
        }
    }

    console.log("❌ لم يتم العثور على إجابة");
    return generateDefaultResponse(query);
}

// ==================== 📝 تنسيق رسالة السياق ====================
function formatContextMessage(contextAnalysis) {
    if (!contextAnalysis.related || !contextAnalysis.context) return null;
    const { context, strength } = contextAnalysis;
    if (strength === 'strong') {
        return `<div class="info-card" style="background: linear-gradient(135deg, #e3f2fd 0%, #f1f8ff 100%); border-left: 4px solid #2196f3;">
            <div class="info-card-header" style="color: #1565c0;">💡 فهمت! سؤالك متعلق بـ: <strong>${context.name}</strong></div>
        </div>`;
    }
    return null;
}

// ==================== 🔍 كشف نوع قاعدة البيانات من السؤال ====================
function detectQuestionDatabase(query) {
    const q = normalizeArabic(query);
    if (/قرار.*104|القرار|حوافز|اعفاءات|قطاع\s*(أ|ا|ب)/.test(q)) return 'decision104';
    if (/منطقة|منطقه|صناعية|صناعيه|محافظة|تبعية|ولاية/.test(q)) return 'industrial_zones';
    return 'activities';
}

// ==================== ✅ فحص نوع السؤال - مناطق (بدون إعادة حساب) ====================
function checkIfIndustrialQuestion(query, questionType, analysisContext, entities) {
    const q = normalizeArabic(query);
    if (/عرض|اظهر|اعرض/.test(q) && /(كل|جميع|قائمه)/.test(q) && /منطقه|مناطق|صناعيه|صناعية/.test(q)) return true;
    if (q.startsWith('المناطق الصناعية:') || q.startsWith('مناطق صناعية:')) return true;
    if (questionType.isCount && /عدد.*منطقه|عدد.*مناطق/.test(q)) return true;
    if (/المناطق.*التابعه|المناطق.*التابعة/.test(q)) return true;
    if (/(كم|ما) عدد.*المناطق/.test(q)) return true;
    if (questionType.isGeneralAreaCount || questionType.isSpecificAreaCount || questionType.isAreaList || questionType.isGovernanceAuthority || questionType.isAreaExistenceCheck) return true;
    if (entities.hasAreaName && entities.areaNames[0].confidence >= 80) return true;
    if (analysisContext.recommendation === 'areas' && analysisContext.confidence >= 60) return true;
    const strongPatterns = [/عدد.*منطقه.*صناعيه/, /عدد.*مناطق.*صناعيه/, /ما هي.*المناطق.*الصناعيه/, /اسماء.*المناطق.*الصناعيه/, /قائمه.*المناطق.*الصناعيه/, /المنطقة الصناعية ب/, /موقع.*منطقه.*صناعيه/];
    if (strongPatterns.some(p => p.test(q))) return true;
    const hasAreaKeywords = q.includes('منطقه') || q.includes('منطقة') || q.includes('صناعيه') || q.includes('صناعية');
    const hasLicenseContext = /ترخيص|تراخيص|متطلبات|شروط|اجراءات/.test(q);
    if (hasAreaKeywords && !hasLicenseContext) {
        const hasGeographicContext = questionType.hasLocationContext || entities.hasGovernorate || entities.hasDependency || /محافظه|محافظة|مدينه|مدينة/.test(q);
        if (hasGeographicContext) return true;
    }
    if (entities.hasGovernorate && q.includes('صناعي') && !/(نشاط|مشروع|ترخيص).*صناعي/.test(q)) return true;
    if (entities.hasDependency && !hasLicenseContext) return true;
    return false;
}

// ==================== ✅ فحص نوع السؤال - أنشطة (بدون إعادة حساب) ====================
function checkIfActivityQuestion(query, questionType, analysisContext, entities) {
    const q = normalizeArabic(query);
    if (questionType.isCount && /منطقه|منطقة|مناطق/.test(q) && !/(نشاط|ترخيص)/.test(q)) return false;
    if (questionType.isCount && /عدد.*منطقه|عدد.*مناطق/.test(q)) return false;
    if (/المناطق.*التابعه|المناطق.*التابعة/.test(q)) return false;
    const strongActivityPatterns = [
        /تراخيص.*فندق/, /تراخيص.*مطعم/, /تراخيص.*مصنع/, /تراخيص.*صيدلية/, /تراخيص.*مخزن/, /ترخيص.*فندق/, /ترخيص.*مطعم/, /ترخيص.*مصنع/,
        /(انشاء|إنشاء).*تشغيل.*فندق/, /(انشاء|إنشاء).*تشغيل.*مطعم/, /ترخيص.*مطلوب/, /تراخيص.*مطلوبه/, /ما.*التراخيص.*المطلوبه/,
        /كيف.*احصل.*ترخيص/, /متطلبات.*نشاط/, /شروط.*نشاط/, /اجراءات.*ترخيص/, /خطوات.*ترخيص/, /دليل.*الترخيص/, /سجل صناعي/, /رخصة تشغيل/,
        /الجهة المصدرة.*ترخيص/
    ];
    if (strongActivityPatterns.some(p => p.test(q))) return true;
    if (questionType.isLicensingAuthority) return true;
    if (questionType.hasLicenseContext && questionType.isActivity) return true;
    if (questionType.isTechnical && !questionType.isIndustrial) return true;
    if (questionType.isDecision104) return true;
    if (entities.hasActivityType && entities.activityTypes[0].confidence >= 70) return true;
    if (analysisContext.recommendation === 'activities' && analysisContext.confidence >= 60) return true;
    const hasStrongLicenseKeywords = /ترخيص|تراخيص|رخصه|رخصة|متطلبات|شروط|اجراءات|إجراءات/.test(q);
    if (hasStrongLicenseKeywords) {
        const isExplicitlyAboutAreaLocation = questionType.hasLocationContext && /موقع.*منطقه|مكان.*منطقه|اين.*منطقه/.test(q);
        if (!isExplicitlyAboutAreaLocation) return true;
    }
    if (/كيف|ازاي|طريقة/.test(q) && questionType.isActivity && !/(كيف|ازاي).*اروح|اوصل/.test(q)) return true;
    if (/ما (المطلوب|الشروط|المتطلبات)/.test(q)) return true;
    if (questionType.isAuthority && entities.hasActivityType && !questionType.isGovernanceAuthority) return true;
    return false;
}

// ==================== معالج الأسئلة السياقية ====================
async function handleContextualQuery(query, questionType, context) {
    const q = normalizeArabic(query);

    if (context.type === 'industrial') {
        const area = context.data;
        if (questionType.isLocation || q.includes('خريطه') || q.includes('map') || q.includes('موقع')) {
            return formatIndustrialMapLink(area);
        }
        if (q.includes('قرار') || q.includes('انشاء') || questionType.isLaw) {
            return `📜 <strong>قرار إنشاء ${area.name}:</strong><br><br>${area.decision || 'غير متوفر'}`;
        }
        if (q.includes('ولايه') || q.includes('تبعيه') || q.includes('جهه') || questionType.isDependency) {
            return `🏛️ <strong>جهة الولاية:</strong> ${area.dependency}`;
        }
        if (q.includes('مساحه') || q.includes('فدان')) {
            return `📏 <strong>المساحة:</strong> ${area.area} فدان`;
        }
        if (q.includes('محافظه') || q.includes('محافظة') || q.includes('مدينه') || q.includes('مدينة')) {
            return `<div class="info-card" style="border-right: 4px solid #0ea5e9; background: #f0f9ff;">
                <div class="info-card-header">📍 الموقع الإداري</div>
                <div class="info-card-content">منطقة <strong>${area.name}</strong> تقع إدارياً ضمن نطاق <strong>محافظة ${area.governorate}</strong>.</div>
            </div>
            <div class="choice-btn" onclick="selectIndustrialArea('${area.name.replace(/'/g, "\\'")}')">
                <span class="choice-icon">📋</span> عرض باقي تفاصيل المنطقة
            </div>`;
        }
    } else if (context.type === 'activity') {
        const act = context.data;
        const details = act.details || {};
        if (questionType.isLicense || q.includes('ترخيص') || q.includes('رخص')) {
            return formatLicensesDetailed(act);
        }
        if (questionType.isAuthority || q.includes('جهه') || q.includes('وزاره') || q.includes('هيئه')) {
            return formatAuthority(details);
        }
        if (questionType.isLaw || q.includes('قانون') || q.includes('سند') || q.includes('تشريع')) {
            return formatLegislation(details);
        }
        if (questionType.isGuide || q.includes('دليل') || q.includes('جايد') || q.includes('رابط')) {
            return formatGuideInfo(details);
        }
        if (questionType.isTechnical || q.includes('ملاحظات') || q.includes('فنيه') || q.includes('لجنه')) {
            return formatTechnicalNotes(act);
        }
        if (questionType.isLocation || q.includes('موقع') || q.includes('مكان')) {
            return formatSuitableLocation(details);
        }
        if (questionType.isDecision104 || q.includes('104') || q.includes('حوافز')) {
            if (/هل\s*(هو|هي|هوارد|هيوارد)?\s*(وارد|موجود|مدرج)\s*(بالقرار|في القرار|ب)?\s*104?/.test(q) || 
                q === 'هل هو وارد بالقرار 104' || q === 'هل هوارد بالقرار 104' || q === 'هل هو وارد' ||
                q === 'هل موجود' || q === 'وارد بالقرار 104') {
                return window.handleDecision104Query(`هل ${act.text} وارد بالقرار 104`, detectQuestionType(query));
            }
            return window.checkDecision104Full ? window.checkDecision104Full(act.text) : null;
        }
    }
    return null;
}

// ==================== الوظائف المساعدة ====================

window.toggleGPTChat = function() {
    const container = document.getElementById('gptChatContainer');
    const floatBtn = document.getElementById('gptFloatBtn');
    if (!container || !floatBtn) return;
    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'flex';
        floatBtn.style.display = 'none';
    } else {
        container.style.display = 'none';
        floatBtn.style.display = 'flex';
    }
};

window.autoResize = function(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    checkInputState();
};

window.handleEnter = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

window.clearMemoryWithConfirm = async function() {
    const context = AgentMemory.getContext();
    if (!context || context.type === 'clarification') {
        const container = document.getElementById('gptMessages');
        const notification = document.createElement('div');
        notification.style.cssText = 'background: #fff3e0; padding: 10px; border-radius: 8px; margin: 8px 0; text-align: center; color: #e65100;';
        notification.innerHTML = 'ℹ️ لا يوجد سياق محفوظ حالياً';
        container.appendChild(notification);
        container.scrollTop = container.scrollHeight;
        setTimeout(() => notification.remove(), 3000);
        return;
    }
    const contextName = context.type === 'industrial' ? context.data.name : context.data.text;
    const container = document.getElementById('gptMessages');
    const confirmBox = document.createElement('div');
    confirmBox.style.cssText = 'background: #fff3e0; padding: 16px; border-radius: 12px; margin: 8px 0; border: 2px solid #ff9800;';
    confirmBox.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px;">
            <strong style="color: #e65100;">🗑️ هل تريد مسح السياق المحفوظ؟</strong><br>
            <small style="color: #bf360c;">السياق الحالي: ${contextName}</small>
        </div>
        <div style="display: flex; gap: 8px; justify-content: center;">
            <button onclick="confirmClearMemory()" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold;">✓ نعم، امسح</button>
            <button onclick="cancelClearMemory()" style="background: #e0e0e0; color: #333; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold;">✕ إلغاء</button>
        </div>
    `;
    confirmBox.id = 'memory-confirm-box';
    container.appendChild(confirmBox);
    container.scrollTop = container.scrollHeight;
};

window.confirmClearMemory = async function() {
    await AgentMemory.clear();
    const confirmBox = document.getElementById('memory-confirm-box');
    if (confirmBox) confirmBox.remove();
    const container = document.getElementById('gptMessages');
    const notification = document.createElement('div');
    notification.style.cssText = 'background: #e8f5e9; padding: 10px; border-radius: 8px; margin: 8px 0; text-align: center; color: #2e7d32;';
    notification.innerHTML = '✅ تم مسح الذاكرة بنجاح';
    container.appendChild(notification);
    container.scrollTop = container.scrollHeight;
    setTimeout(() => notification.remove(), 3000);
};

window.cancelClearMemory = function() {
    const confirmBox = document.getElementById('memory-confirm-box');
    if (confirmBox) confirmBox.remove();
};

window.sendMessage = async function(overrideQuery) {
    stopOngoingGeneration();
    const input = document.getElementById('gptInput');
    const query = overrideQuery || input.value.trim();
    if (!query) return;
    if (!overrideQuery) input.value = '';
    autoResize(input);
    checkInputState();
    addMessageToUI('user', query);
    if (window.checkForGPTCloseIntent && window.checkForGPTCloseIntent(query)) {
        window.gptGracefulClose();
        return;
    }
    const typingId = showTypingIndicator();
    try {
        const responseHTML = await processUserQuery(query);
        removeTypingIndicator(typingId);
        if (responseHTML) typeWriterResponse(responseHTML);
    } catch (error) {
        console.error("❌ خطأ في معالجة الرسالة:", error);
        removeTypingIndicator(typingId);
        typeWriterResponse("عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.");
    }
};

window.resolveAmbiguity = async function(type, index) {
    const context = AgentMemory.getContext();
    if (context && context.type === 'clarification') {
        const choice = context.data[index];
        if (choice) {
            AgentMemory.clear();
            if (type === 'industrial') {
                await AgentMemory.setIndustrial(choice.data, choice.name);
                addMessageToUI('user', choice.name);
                const responseHTML = formatIndustrialResponse(choice.data);
                const typingId = showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator(typingId);
                    typeWriterResponse(responseHTML);
                }, 600);
            } else if (type === 'activity') {
                await AgentMemory.setActivity(choice.data, choice.name);
                addMessageToUI('user', choice.name);
                const responseHTML = formatActivityResponse(choice.data, detectQuestionType(choice.name));
                const typingId = showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator(typingId);
                    typeWriterResponse(responseHTML);
                }, 600);
            }
        }
    }
};

window.selectIndustrialArea = async function(areaName) {
    if (typeof industrialAreasData === 'undefined') {
        console.error("❌ قاعدة بيانات المناطق غير متوفرة");
        return;
    }
    const area = industrialAreasData.find(a => a.name === areaName);
    if (area) {
        console.log("✅ تم العثور على المنطقة:", area.name);
        await AgentMemory.setIndustrial(area, areaName);
        addMessageToUI('user', areaName);
        const responseHTML = formatIndustrialResponse(area);
        const typingId = showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator(typingId);
            typeWriterResponse(responseHTML);
        }, 600);
    } else {
        console.warn("⚠️ لم يتم العثور على تطابق تام - استخدام البحث الاحتياطي");
        document.getElementById('gptInput').value = areaName;
        window.sendMessage();
    }
};

window.addMessageToUI = function(role, content) {
    const chatMessagesContainer = document.getElementById('gptMessages');
    if (!chatMessagesContainer) return;
    if (role === 'user') {
        const div = document.createElement('div');
        div.className = 'message-row user';
        div.innerHTML = `<div class="avatar user"><i class="fas fa-user"></i></div><div class="message-bubble">${content}</div>`;
        chatMessagesContainer.appendChild(div);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        if (window.speechSynthesis && window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    } else if (role === 'ai') {
        typeWriterResponse(content, true);
    }
};

window.activeTypingSession = null;

function stopOngoingGeneration() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (window.activeTypingSession) {
        window.activeTypingSession.isCancelled = true;
        if (window.activeTypingSession.animationId) cancelAnimationFrame(window.activeTypingSession.animationId);
        window.activeTypingSession = null;
    }
}

window.typeWriterResponse = function(htmlContent, shouldAutoSpeak = true) {
    if (!htmlContent || typeof htmlContent !== 'string') return;
    const chatMessagesContainer = document.getElementById('gptMessages');
    if (!chatMessagesContainer) return;
    stopOngoingGeneration();
    chatMessagesContainer.style.scrollBehavior = 'auto';
    const msgRow = document.createElement('div');
    msgRow.className = 'message-row ai';
    msgRow.innerHTML = `<div class="avatar ai"><i class="fas fa-robot"></i></div><div class="message-bubble"></div>`;
    chatMessagesContainer.appendChild(msgRow);
    const bubble = msgRow.querySelector('.message-bubble');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const taskQueue = [];

    function traverseAndQueue(node, parentElement) {
        if (node.nodeType === 3) {
            const text = node.nodeValue;
            if (!text) return;
            const secureTextNode = document.createTextNode('');
            taskQueue.push({ type: 'inject-node', node: secureTextNode, parent: parentElement });
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                let punctuationDelay = 0;
                if (char === '.' || char === '؟' || char === '!' || char === '\n') punctuationDelay = 5;
                else if (char === '،' || char === ',') punctuationDelay = 0;
                taskQueue.push({ type: 'char', char: char, targetNode: secureTextNode, extraDelay: punctuationDelay });
            }
        } else if (node.nodeType === 1) {
            const tagName = node.tagName.toLowerCase();
            const newEl = document.createElement(tagName);
            Array.from(node.attributes).forEach(attr => newEl.setAttribute(attr.name, attr.value));
            taskQueue.push({ type: 'element', element: newEl, parent: parentElement, extraDelay: 5 });
            node.childNodes.forEach(child => traverseAndQueue(child, newEl));
        }
    }
    Array.from(tempDiv.childNodes).forEach(child => traverseAndQueue(child, bubble));

    const currentSession = { isCancelled: false, animationId: null };
    window.activeTypingSession = currentSession;
    let taskIndex = 0;
    let fullTextForSpeech = "";
    let isUserInteracting = false;
    let accumulatedDelay = 0;
    const interactionEvents = ['mousedown', 'wheel', 'touchstart'];
    const interactHandler = () => { isUserInteracting = true; };
    interactionEvents.forEach(evt => chatMessagesContainer.addEventListener(evt, interactHandler, { passive: true }));

    function renderFrame(timestamp) {
        if (currentSession.isCancelled) return;
        if (taskIndex >= taskQueue.length) {
            finishTyping();
            return;
        }
        const startTime = performance.now();
        if (accumulatedDelay > 0) {
            if (timestamp < accumulatedDelay) {
                currentSession.animationId = requestAnimationFrame(renderFrame);
                return;
            }
            accumulatedDelay = 0;
        }
        let charsToProcessLimit = 10;
        const randomFactor = Math.random();
        if (randomFactor > 0.7) charsToProcessLimit = 6;
        else if (randomFactor < 0.05) charsToProcessLimit = 0;
        if (charsToProcessLimit === 0) {
            accumulatedDelay = timestamp + (Math.random() * 20 + 10);
            currentSession.animationId = requestAnimationFrame(renderFrame);
            return;
        }
        let processedCount = 0;
        while (taskIndex < taskQueue.length && processedCount < charsToProcessLimit) {
            if (currentSession.isCancelled) return;
            const task = taskQueue[taskIndex];
            if (task.type === 'element') {
                task.parent.appendChild(task.element);
                if (task.extraDelay) accumulatedDelay = timestamp + task.extraDelay;
            } else if (task.type === 'inject-node') {
                task.parent.appendChild(task.node);
            } else if (task.type === 'char') {
                task.targetNode.nodeValue += task.char;
                fullTextForSpeech += task.char;
                if (task.extraDelay > 0) {
                    accumulatedDelay = timestamp + task.extraDelay;
                    taskIndex++;
                    break;
                }
            }
            taskIndex++;
            processedCount++;
            if (!isUserInteracting) {
                const currentHeight = chatMessagesContainer.scrollHeight;
                const visibleHeight = chatMessagesContainer.clientHeight;
                if (currentHeight > visibleHeight + chatMessagesContainer.scrollTop) {
                    chatMessagesContainer.scrollTop = currentHeight;
                }
            }
            if (performance.now() - startTime > 12) break;
            if (accumulatedDelay > 0) break;
        }
        currentSession.animationId = requestAnimationFrame(renderFrame);
    }

    function finishTyping() {
        if (currentSession.isCancelled) return;
        interactionEvents.forEach(evt => chatMessagesContainer.removeEventListener(evt, interactHandler));
        chatMessagesContainer.style.scrollBehavior = 'smooth';
        const buttons = bubble.querySelectorAll('.choice-btn, .smart-btn');
        buttons.forEach(btn => {
            btn.style.opacity = 1;
            btn.style.transform = 'translateY(0)';
        });
        if (shouldAutoSpeak && typeof window.speakText === 'function' && fullTextForSpeech.trim().length > 0) {
            setTimeout(() => {
                if (!currentSession.isCancelled) {
                    const voiceControls = document.getElementById('gptVoiceControls');
                    if (voiceControls) voiceControls.style.display = 'flex';
                    window.speakText(fullTextForSpeech);
                    if (window.speechSynthesis) {
                        window.speechSynthesis.addEventListener('end', function hideSpeaker() {
                            if (voiceControls) voiceControls.style.display = 'none';
                            window.speechSynthesis.removeEventListener('end', hideSpeaker);
                        });
                    }
                }
            }, 200);
        }
        window.activeTypingSession = null;
    }
    currentSession.animationId = requestAnimationFrame(renderFrame);
};

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const container = document.getElementById('gptMessages');
    const div = document.createElement('div');
    div.className = 'message-row ai';
    div.id = id;
    div.innerHTML = `<div class="avatar ai"><i class="fas fa-robot"></i></div><div class="message-bubble"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeForJS(text) {
    if (!text) return "";
    return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

window.toggleExpandChat = function() {
    const container = document.getElementById('gptChatContainer');
    const expandBtn = document.getElementById('gptExpandBtn');
    const icon = expandBtn.querySelector('i');
    container.classList.toggle('expanded');
    if (container.classList.contains('expanded')) {
        icon.classList.replace('fa-expand-alt', 'fa-compress-alt');
        expandBtn.title = "تصغير النافذة";
    } else {
        icon.classList.replace('fa-compress-alt', 'fa-expand-alt');
        expandBtn.title = "توسيع النافذة";
    }
    setTimeout(() => document.getElementById('gptInput').focus(), 400);
};

window.checkInputState = function() {
    const input = document.getElementById('gptInput');
    const actionBtn = document.getElementById('gptActionBtn');
    const actionIcon = document.getElementById('actionIcon');
    if (!input || !actionBtn || !actionIcon) return;
    const hasText = input.value.trim().length > 0;
    if (hasText) {
        actionBtn.title = "إرسال الرسالة";
        actionBtn.classList.remove('mic-mode');
        actionBtn.classList.add('send-mode');
        actionIcon.classList.replace('fa-microphone', 'fa-paper-plane');
    } else {
        actionBtn.title = "التحدث بالصوت";
        actionBtn.classList.remove('send-mode');
        actionBtn.classList.add('mic-mode');
        actionIcon.classList.replace('fa-paper-plane', 'fa-microphone');
    }
};

window.handleActionButtonClick = function() {
    const input = document.getElementById('gptInput');
    const hasText = input.value.trim().length > 0;
    if (hasText) {
        sendMessage();
    } else {
        if (window.GPT_VOICE && window.GPT_VOICE.toggleMicrophone) {
            window.GPT_VOICE.toggleMicrophone();
        }
    }
};

window.toggleSpeech = function() {
    if (!window.GPT_VOICE) return;
    window.GPT_VOICE.speechEnabled = !window.GPT_VOICE.speechEnabled;
    const speakerBtn = document.getElementById('gptSpeakerBtn');
    const voiceControls = document.getElementById('gptVoiceControls');
    if (window.GPT_VOICE.speechEnabled) {
        if (speakerBtn) {
            speakerBtn.classList.remove('muted');
            speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            speakerBtn.title = "كتم الصوت";
        }
        if (voiceControls) voiceControls.style.display = 'flex';
        const lastMsg = document.querySelector('.message-row.ai:last-child .message-bubble');
        if (lastMsg && window.speakText) {
            window.speakText(lastMsg.textContent);
            if (window.speechSynthesis) {
                window.speechSynthesis.addEventListener('end', function hideSpeaker() {
                    if (voiceControls) voiceControls.style.display = 'none';
                    window.speechSynthesis.removeEventListener('end', hideSpeaker);
                });
            }
        }
    } else {
        if (speakerBtn) {
            speakerBtn.classList.add('muted');
            speakerBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            speakerBtn.title = "تشغيل الصوت";
        }
        if (voiceControls) voiceControls.style.display = 'none';
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
};

window.GPT_AGENT.closeKeywords = ['شكرا', 'شكراً', 'باي', 'مع السلامة', 'إغلاق', 'كفاية', 'خلاص', 'انتهيت', 'سلام'];

window.checkForGPTCloseIntent = function(text) {
    const q = normalizeArabic(text);
    return window.GPT_AGENT.closeKeywords.some(k => q.includes(k));
};

window.gptGracefulClose = function() {
    const msgs = ['تشرفنا بخدمتك، في أمان الله.', 'سعدت بمساعدتك، مع السلامة.', 'العفو، أنا في الخدمة دائماً.'];
    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
    const typingId = showTypingIndicator();
    setTimeout(() => {
        removeTypingIndicator(typingId);
        typeWriterResponse(randomMsg, true);
        setTimeout(() => {
            if (document.getElementById('gptChatContainer').style.display !== 'none') {
                toggleGPTChat();
            }
        }, 4000);
    }, 500);
};

window.showGPTNotification = function(msg, type = 'success') {
    const container = document.getElementById('gptMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.style.cssText = `
        align-self: center;
        background: ${type === 'success' ? '#e8f5e9' : '#fff3e0'};
        color: ${type === 'success' ? '#2e7d32' : '#e65100'};
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 0.8rem;
        margin: 10px 0;
        border: 1px solid ${type === 'success' ? '#a5d6a7' : '#ffcc80'};
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        animation: fadeIn 0.5s ease;
        text-align: center;
        width: fit-content;
        z-index: 10;
    `;
    div.innerHTML = `✨ ${msg}`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    setTimeout(() => {
        div.style.transition = 'opacity 1s';
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 1000);
    }, 4000);
};

window.addEventListener('load', function() {
    setTimeout(checkInputState, 100);
});

// ==================== 📚 إدارة وضع الدليل (جديد) ====================
window.startGuideChat = async function(guideId, guideName) {
    // 1. تفعيل وضع الدليل في الذاكرة
    await AgentMemory.setActiveGuide(guideId, guideName);

    // 2. عرض رسالة ترحيبية في الشات
    const welcomeMsg = `
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
        <div style="color: #0369a1; font-weight: bold; margin-bottom: 5px;">
            <i class="fas fa-book-reader"></i>  البحث في الدليل مفعل
        </div>
        <div style="color: #0c4a6e; font-size: 0.9em;">
            أنا الآن أقرأ ملف: <strong>"${guideName}"</strong>.<br>
            اسألني أي سؤال عن محتوى هذا الدليل تحديداً.
        </div>
        <div style="margin-top: 8px; font-size: 0.8em; color: #64748b;">
            💡 للخروج من  البحث فى الدليل، اكتب "خروج".
        </div>
    </div>`;
    
    // 3. فتح الشات إذا كان مغلقاً
    const container = document.getElementById('gptChatContainer');
    if (container.style.display === 'none') {
        window.toggleGPTChat();
    }

    // 4. كتابة الرسالة
    window.typeWriterResponse(welcomeMsg);
};

// دوال مشتركة للكيانات والبحث
window.extractEntities = extractEntities;
window.extractGovernorates = extractGovernorates;
window.extractDependencies = extractDependencies;
window.calculateSimilarity = calculateSimilarity;
window.extractAreaNames = extractAreaNames;
window.searchIndustrialZonesWithNeural = searchIndustrialZonesWithNeural;

console.log('✅ GPT Agent v9.0 - Core initialized!');
console.log('✅ GPT Agent v9.0 - Ultimate Precision Edition initialized successfully!');
console.log('🎯 Features: Advanced NLP • 100% Data Extraction • Decision 104 Integration • Smart Memory');
console.log('🆕 Smart Action Button: ENABLED ✨');
console.log('🆕 Mobile Optimized: ENABLED 📱');
console.log('🆕 Fullscreen Expand: ENABLED 🖥️');

} // النهاية الشرطية للتأكد من عدم التحميل المزدوج