// gpt_activities.js
window.GPT_AGENT = window.GPT_AGENT || {};

// ==================== 🆕 دالة كشـــف طلب الدليل/المصادر ====================
function isGuideRequest(query) {
    const guideKeywords = [
        'دليل', 'الدليل', 'ادله', 'الادله', 'أدلة', 'الأدلة',
        'مصدر', 'المصدر', 'مصادر', 'المصادر',
        'ملف', 'الملف', 'ملفات', 'الملفات',
        'وثيقة', 'الوثيقة', 'وثائق', 'الوثائق',
        'مرجع', 'المرجع', 'مراجع', 'المراجع',
        'pdf', 'تحميل', 'تنزيل'
    ];
    const q = (query || '').toLowerCase();
    return guideKeywords.some(keyword => q.includes(keyword));
}

// ==================== معــالج أسئلة الأنشطة - الإصدار الأصلي ====================
async function handleActivityQuery(query, questionType, preComputedContext, preComputedEntities) {
    if (typeof NeuralSearch === 'undefined' || typeof masterActivityDB === 'undefined') {
        return "⚠️ نظام البحث عن الأنشطة غير متوفر حالياً.";
    }

    // ⭐ كشف تلقائي لطلبات الأدلة والمصادر والملفات
    if (isGuideRequest(query) && questionType !== 'guide') {
        questionType = 'guide';
        console.log("📚 تم اكتشاف طلب دليل/مصادر تلقائياً من الكلمات المفتاحية");
    }

    // ⭐ استخدام البيانات المحسوبة إن وُجدت
    const entities = preComputedEntities || extractEntities(query);
    const context = preComputedContext || analyzeContext(query, questionType);

    console.log("📋 معالج الأنشطة - سؤال:", query);
    console.log("🎯 الكيانات المستخدمة:", entities);

    // ⭐ البحث بدون فلتر صارم - نثق في NeuralSearch
    // 🆕 استخدام NeuralSearch مع دعم السياق
    const contextBoost = ContextManager.getContextualBoost(query, 'activities');
    const searchResults = NeuralSearch(query, masterActivityDB, {
        minScore: contextBoost.boost > 1 ? 20 : 30 // نخفض الحد الأدنى إذا كان هناك سياق
    });

    console.log("🎯 دعم السياق:", contextBoost);
    console.log(`🔍 نتائج البحث: ${searchResults.results.length} نتيجة`);

    if (searchResults.results && searchResults.results.length > 0) {
        const topResult = searchResults.results[0];

        console.log(`🔍 نتائج البحث: ${searchResults.results.length} نشاط`);
        console.log(`🎯 النتيجة الأولى: "${topResult.text}" - ثقة: ${topResult.finalScore}`);

        // ✅ فحص جديد: هل هناك عدة أنشطة متشابهة؟
        const similarActivities = detectSimilarActivities(query, searchResults.results);

        if (similarActivities.length > 1) {
            console.log(`🔍 عثرت على ${similarActivities.length} أنشطة متشابهة`);
            AgentMemory.setClarification(similarActivities.map(r => ({
                type: 'activity',
                name: r.text,
                data: r
            })));

            return formatSimilarActivitiesChoice(query, similarActivities);
        }

        // ✅ إذا كانت الثقة عالية جداً (950+) ونتيجة واحدة واضحة
        if (topResult.finalScore > 950) {
            await AgentMemory.setActivity(topResult, query);
            return formatActivityResponse(topResult, questionType);
        }

        // ✅ إذا كانت الثقة عالية (800+) والفارق كبير مع الثانية
        if (topResult.finalScore > 800) {
            if (searchResults.results.length === 1) {
                await AgentMemory.setActivity(topResult, query);
                return formatActivityResponse(topResult, questionType);
            }

            const secondResult = searchResults.results[1];
            const scoreDiff = topResult.finalScore - secondResult.finalScore;

            if (scoreDiff > 200) {
                // الفارق كبير - النتيجة الأولى واضحة
                await AgentMemory.setActivity(topResult, query);
                return formatActivityResponse(topResult, questionType);
            }
        }

        // ✅ إذا كانت الثقة متوسطة ويوجد أكثر من نتيجة
        if (searchResults.results.length > 1 && topResult.finalScore > 300) {
            const topResults = searchResults.results.slice(0, 3);
            AgentMemory.setClarification(topResults.map(r => ({
                type: 'activity',
                name: r.text,
                data: r
            })));

            let html = `🤔 <strong>عثرت على نتائج متشابهة، أيهم تقصد؟</strong><br><br>`;
            topResults.forEach((r, i) => {
                html += `<div class="choice-btn" onclick="resolveAmbiguity('activity', ${i})">
                    <span class="choice-icon">📋</span> ${r.text}
                </div>`;
            });
            return html;
        }

        await AgentMemory.setActivity(topResult, query);
        return formatActivityResponse(topResult, questionType);
    }

    return null;
}

// ==================== 🆕 كاشف الأنشطة المتشابهة ====================
function detectSimilarActivities(query, results) {
    if (!results || results.length <= 1) return results;

    const q = normalizeArabic(query);
    const queryWords = q.split(/\s+/).filter(w => w.length > 2);

    console.log(`🔍 فحص التشابه - كلمات البحث: ${queryWords.join(', ')}`);

    // ✅ استخراج الكلمات المفتاحية الرئيسية
    const keyWords = queryWords.filter(word => {
        // استبعاد كلمات عامة جداً
        const commonWords = ['ماهي', 'ما هي', 'ايه هي', 'اية هي', 'ايه هى', 'اية هى', 'ما هو', 'ماهو ', 'تراخيص', 'ترخيص', 'نشاط', 'مطلوب', 'شروط', 'كيف', 'خطوات', 'اجراءات', 'عرض', 'اظهر', 'تفاصيل'];
        return !commonWords.includes(word);
    });

    if (keyWords.length === 0) return [results[0]];

    console.log(`🎯 الكلمات المفتاحية: ${keyWords.join(', ')}`);

    // ✅ البحث عن أنشطة تحتوي على نفس الكلمات المفتاحية
    const similar = [];

    for (const result of results) {
        const resultText = normalizeArabic(result.text);
        let matchCount = 0;

        for (const key of keyWords) {
            if (resultText.includes(key)) {
                matchCount++;
            }
        }

        // ✅ إذا طابق 70% أو أكثر من الكلمات المفتاحية
        const matchPercentage = (matchCount / keyWords.length) * 100;

        if (matchPercentage >= 70) {
            similar.push({
                ...result,
                matchPercentage: matchPercentage,
                matchedWords: matchCount
            });

            console.log(`✅ تطابق: "${result.text}" - ${Math.round(matchPercentage)}% (${matchCount}/${keyWords.length} كلمات)`);
        }
    }

    // ✅ ترتيب حسب عدد الكلمات المطابقة ثم النقاط
    similar.sort((a, b) => {
        if (b.matchedWords !== a.matchedWords) {
            return b.matchedWords - a.matchedWords;
        }
        return b.finalScore - a.finalScore;
    });

    // ✅ إرجاع أفضل 5 نتائج كحد أقصى
    const topSimilar = similar.slice(0, 5);

    console.log(`📊 النتيجة النهائية: ${topSimilar.length} نشاط متشابه`);

    return topSimilar;
}

// ==================== 🆕 عرض خيارات الأنشطة المتشابهة ====================
function formatSimilarActivitiesChoice(query, activities) {
    let html = `<div class="info-card" style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left-color: #ff9800;">
        <div class="info-card-header" style="color: #e65100;">
            🔍 عثرت على ${activities.length} أنشطة تحتوي على: "${query}"
        </div>
        <div class="info-card-content" style="color: #bf360c;">
            يرجى اختيار النشاط المطلوب بالضبط:
        </div>
    </div>
    <div style="margin-top: 12px;">`;

    activities.forEach((activity, i) => {
        const matchInfo = activity.matchPercentage
            ? `<small style="color: #666;"> • تطابق ${Math.round(activity.matchPercentage)}%</small>`
            : '';

        html += `<div class="choice-btn" onclick="resolveAmbiguity('activity', ${i})" style="margin: 8px 0; padding: 12px 16px; text-align: right;">
            <span class="choice-icon">📋</span>
            <div style="display: inline-block; width: calc(100% - 40px);">
                <strong>${activity.text}</strong>
                ${matchInfo}
            </div>
        </div>`;
    });

    html += `</div>
    <div style="margin-top: 12px; padding: 10px; background: #e3f2fd; border-radius: 8px; font-size: 0.85rem; color: #0d47a1;">
        💡 اختر النشاط الذي يطابق احتياجك بالضبط للحصول على التراخيص الصحيحة
    </div>`;

    return html;
}

// ==================== دالة تنسيق رد النشاط الأساسية ====================
function formatActivityResponse(activity, questionType) {
    const details = activity.details || {};

    let html = `<div class="info-card">
        <div class="info-card-header">
            📋 ${activity.text}
        </div>
        <div class="info-card-content">`;

    if (details.act) {
        html += `<div class="info-row">
            <div class="info-label">📄 الوصف:</div>
            <div class="info-value">${details.act}</div>
        </div>`;
    }

    // عرض التراخيص كاملة (بدون اختصار)
    if (details.req) {
        html += `<div class="info-row">
            <div class="info-label">📝 التراخيص:</div>
            <div class="info-value">${details.req}</div>
        </div>`;
    }

    // إضافة الجهة المصدرة إذا كانت متوفرة
    if (details.auth) {
        html += `<div class="info-row">
            <div class="info-label">🏛️ الجهة المُصدرة للترخيص:</div>
            <div class="info-value">${details.auth}</div>
        </div>`;
    }

    html += `</div></div>`;

    // فحص القرار 104 (يتم عبر الدالة الموجودة في gpt_decision104.js)
    if (window.checkDecision104Full) {
        const decision104Info = window.checkDecision104Full(activity.text);
        if (decision104Info) {
            html += decision104Info;
        }
    }

    // الدليل والروابط (يدعم المتعدد والمفرد بأنواعه)
    if ((details.guides && details.guides.length > 0) || details.link) {
        html += `<div style="margin-top: 15px; border-top: 1px dashed #cfe2ff; padding-top: 10px;">
                    <div style="color: #084298; font-weight: bold; margin-bottom: 8px;">
                        📚 المصادر : 
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">`;
        
       // استخدام الدالة الذكية الموحدة لاستخراج روابط العرض والتحميل
        if (details.guides && details.guides.length > 0) {
            details.guides.forEach(guide => {
                const links = getSmartLinksGPT(guide.link);
                
                // 🔍 [تعديل جديد] البحث عن الدليل في القاعدة الذكية
                const guideInDB = window.findGuideInDB ? window.findGuideInDB(guide.name) : null;
                
                html += `
                <div style="background: white; border: 1px solid #cfe2ff; border-radius: 8px; padding: 10px; margin-bottom: 5px;">
                    <div style="font-weight: bold; color: #084298; margin-bottom: 8px;">
                        <i class="fas fa-book-open"></i> ${guide.name}
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <a href="${links.viewUrl}" target="_blank" class="link-btn" style="flex:1; justify-content:center; background: #e0f2fe; color: #0369a1 !important; box-shadow:none; border: 1px solid #bae6fd;">
                            <i class="fas fa-eye"></i> عرض
                        </a>
                        <button onclick="forceDownloadGuide('${links.downloadUrl}', '${guide.name}')" class="link-btn" style="flex:1; justify-content:center; box-shadow:none; cursor:pointer; border: none;">
    <i class="fas fa-download"></i> تحميل
</button>
                        
                        ${guideInDB ? `
                        <!-- زر البحث الذكي يظهر فقط إذا توفر الدليل في القاعدة -->
                        <button onclick="window.startGuideChat('${guideInDB.id}', '${guide.name}')" class="link-btn" style="flex:1; justify-content:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; border: none; box-shadow: 0 2px 5px rgba(118, 75, 162, 0.3);">
                            <i class="fas fa-robot"></i> ابحث 
                        </button>
                        ` : ''}
                    </div>
                </div>`;
            });
        } else if (details.link) {
            const guideName = details.guid || "دليل الترخيص";
            const links = getSmartLinksGPT(details.link);
            html += `
            <div style="background: white; border: 1px solid #cfe2ff; border-radius: 8px; padding: 10px; margin-bottom: 5px;">
                <div style="font-weight: bold; color: #084298; margin-bottom: 8px;">
                    <i class="fas fa-book-open"></i> ${guideName}
                </div>
                <div style="display: flex; gap: 8px;">
                    <a href="${links.viewUrl}" target="_blank" class="link-btn" style="flex:1; justify-content:center; background: #e0f2fe; color: #0369a1 !important; box-shadow:none; border: 1px solid #bae6fd;">
                        <i class="fas fa-eye"></i> عرض
                    </a>
                    <button onclick="forceDownloadGuide('${links.downloadUrl}', '${guideName}')" class="link-btn" style="flex:1; justify-content:center; box-shadow:none; cursor:pointer; border: none;">
    <i class="fas fa-download"></i> تحميل
</button>
                </div>
            </div>`;
        }
        
        html += `   </div>
                 </div>`;
    }

    html += `<div style="margin-top: 12px; padding: 10px; background: #f0f9ff; border-radius: 8px; font-size: 0.85rem; color: #0369a1;">
        💡 اسألني عن: التراخيص، الجهة المُصدرة ، السند التشريعي ، الموقع الملائم، الملاحظات الفنية لفريق اللجنة
    </div>`;

    return html;
}

// ==================== دوال التنسيق الفرعية ====================
function formatLicensesDetailed(activity) {
    const details = activity.details || {};
    let html = `<div class="license-card">
        <div class="license-title">📝 التراخيص المطلوبة لـ: ${activity.text}</div>
        <div class="license-list">`;

    if (details.req) {
        html += `<strong>المتطلبات الأساسية:</strong><br>${details.req}<br><br>`;
    }

    if (activity.dynamicLicenseFields && activity.dynamicLicenseFields.length > 0) {
        html += `<strong>قائمة التراخيص التفصيلية:</strong><br>`;
        activity.dynamicLicenseFields.forEach((lic, i) => {
            html += `${i + 1}. ${lic.name}${lic.required ? ' <strong>(إلزامي)</strong>' : ''}<br>`;
        });
    }

    html += `</div></div>`;

    if (details.link) {
        html += `<a href="${details.link}" target="_blank" class="link-btn">
            <i class="fas fa-file-pdf"></i> تحميل دليل التراخيص الكامل
        </a>`;
    }

    return html;
}

function formatAuthority(details) {
    if (!details.auth) {
        return "⚠️ معلومات الجهة المُصدرة غير متوفرة حالياً.";
    }
    return `<div class="info-card">
        <div class="info-card-header">🏛️ الجهة المُصدرة للتراخيص</div>
        <div class="info-card-content">${details.auth}</div>
    </div>`;
}

function formatLegislation(details) {
    if (!details.leg) {
        return "⚠️ معلومات السند التشريعي غير متوفرة حالياً.";
    }

    // 1. تقسيم النص إلى مصفوفة بناءً على السطر الجديد
    // 2. تنظيف النصوص وإزالة الشرطة (-) في بداية السطر لتوحيد التنسيق
    const lines = details.leg.split('\n').filter(line => line.trim() !== '');
    
    let formattedList = `<ul style="list-style: none; padding: 0; margin: 0;">`;
    
    lines.forEach((line, index) => {
        // إزالة الشرطة الزائدة في البداية إن وجدت للحصول على نص نظيف
        let cleanLine = line.trim().replace(/^-/, '').trim();
        
        // إزالة الفاصل الأخير في آخر عنصر
        let borderStyle = index === lines.length - 1 ? '' : 'border-bottom: 1px dashed rgba(245, 127, 23, 0.3);';
        
        formattedList += `
        <li style="
            margin-bottom: 8px; 
            padding-right: 18px; 
            position: relative; 
            line-height: 1.6;
            padding-bottom: 8px;
            ${borderStyle}">
            <span style="
                position: absolute; 
                right: 0; 
                top: 9px; 
                width: 6px; 
                height: 6px; 
                background-color: #f57f17; 
                border-radius: 50%;">
            </span>
            ${cleanLine}
        </li>`;
    });
    
    formattedList += `</ul>`;

    return `<div class="info-card" style="background: linear-gradient(135deg, #fff9c4 0%, #fffde7 100%); border-left-color: #f57f17;">
        <div class="info-card-header" style="color: #e65100; border-bottom: 2px solid rgba(245, 127, 23, 0.2); padding-bottom: 8px; margin-bottom: 12px;">
            ⚖️ السند التشريعي
        </div>
        <div class="info-card-content" style="color: #bf360c; font-size: 0.95rem;">
            ${formattedList}
        </div>
    </div>`;
}

// دالة مساعدة لمعالجة الروابط (توضع قبل الدوال)
function getSmartLinksGPT(url) {
    let viewUrl = url;
    let downloadUrl = url;

    // روابط GitHub (مجلد guides/) - فتح مباشر وتحميل مباشر
    if (url.startsWith('guides/') || url.includes('/guides/')) {
        viewUrl = url;
        downloadUrl = url;
    }
    // روابط Google Drive (للتوافق مع أي روابط قديمة)
    else if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            viewUrl = url.includes('/view') ? url.replace('/view', '/preview') : url;
            downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
    }
    // باقي الروابط الخارجية
    else {
        viewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
        downloadUrl = url;
    }

    return { viewUrl: viewUrl, downloadUrl: downloadUrl };
}

function forceDownloadGuide(url, name) {
    // 1. معالجة اسم الملف: حذف النقاط الزائدة في النهاية ثم إضافة الامتداد
    // هذا يحل مشكلة (..pdf)
    var cleanName = name.replace(/[.\s]+$/, ''); // حذف النقاط والمسافات من نهاية الاسم
    var fileName = cleanName + '.pdf';

    // 2. بناء الرابط الصحيح المتوافق مع GitHub Pages
    // نستخدم الرابط الحالي كقاعدة لضمان وجود اسم المشروع (Repository Name)
    var absoluteUrl = url;
    if (!url.startsWith('http')) {
        try {
            absoluteUrl = new URL(url, window.location.href).href;
        } catch (e) {
            console.error("خطأ في بناء الرابط:", e);
            absoluteUrl = url; // محاولة استخدام الرابط النسبي كبديل
        }
    }

    console.log(`📥 جاري تحميل: ${fileName} من الرابط: ${absoluteUrl}`);

    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isIOS) {
        fetch(absoluteUrl)
            .then(function(r) { 
                if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                return r.arrayBuffer(); 
            })
            .then(function(buffer) {
                var bytes = new Uint8Array(buffer);
                var binary = '';
                var chunk = 8192;
                for (var i = 0; i < bytes.length; i += chunk) {
                    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
                }
                var dataUri = 'data:application/octet-stream;base64,' + btoa(binary);
                var a = document.createElement('a');
                a.href = dataUri;
                a.download = fileName;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(function() { document.body.removeChild(a); }, 1000);
            })
            .catch(function(err) { 
                console.error("فشل التحميل:", err);
                window.open(absoluteUrl, '_blank'); 
            });
    } else {
        fetch(absoluteUrl)
            .then(function(r) { 
                if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                return r.blob(); 
            })
            .then(function(blob) {
                var b = new Blob([blob], { type: 'application/octet-stream' });
                var blobUrl = URL.createObjectURL(b);
                var a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                }, 2000);
            })
            .catch(function(err) {
                console.error("فشل التحميل المباشر، جاري الفتح في نافذة جديدة:", err);
                // محاولة أخيرة باستخدام الطريقة التقليدية
                var a = document.createElement('a');
                a.href = absoluteUrl;
                a.download = fileName;
                a.target = '_blank';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(function() { document.body.removeChild(a); }, 1000);
            });
    }
}


function formatGuideInfo(details) {
    let html = '';
    
    // النظام الجديد: عدة أدلة
    if (details.guides && details.guides.length > 0) {
        html += `<div class="info-card">
            <div class="info-card-header">📚 الأدلة والملفات الخاصة بالنشاط</div>
            <div class="info-card-content" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">`;
            
        details.guides.forEach(guide => {
            const links = getSmartLinksGPT(guide.link);
            
            // 🔍 البحث عن الدليل في القاعدة الذكية
            const guideInDB = window.findGuideInDB ? window.findGuideInDB(guide.name) : null;
            
            html += `
            <div style="background: white; border: 1px solid #cfe2ff; border-radius: 8px; padding: 10px;">
                <div style="font-weight: bold; color: #084298; margin-bottom: 8px;"><i class="fas fa-file-pdf"></i> ${guide.name}</div>
                <div style="display: flex; gap: 5px;">
                    <a href="${links.viewUrl}" target="_blank" rel="noopener noreferrer" class="link-btn" style="flex:1; justify-content:center; background: #e0f2fe; color: #0369a1 !important; box-shadow:none; border: 1px solid #bae6fd;">
    <i class="fas fa-eye"></i> عرض
</a>
<button onclick="forceDownloadGuide('${links.downloadUrl}', '${guide.name}')" class="link-btn" style="flex:1; justify-content:center; box-shadow:none; cursor:pointer;">
    <i class="fas fa-download"></i> تحميل
</button>
                    ${guideInDB ? `
                    <button onclick="window.startGuideChat('${guideInDB.id}', '${guide.name}')" class="link-btn" style="flex:1; justify-content:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; border: none; box-shadow: 0 2px 5px rgba(118, 75, 162, 0.3);">
                        <i class="fas fa-robot"></i> ابحث 
                    </button>
                    ` : ''}
                </div>
            </div>`;
        });
        
        html += `</div></div>`;
    } 
    // النظام القديم: دليل واحد
    else if (details.link) {
        const links = getSmartLinksGPT(details.link);
        const guideName = details.guid || "دليل الترخيص";
        
        // 🔍 البحث عن الدليل في القاعدة الذكية
        const guideInDB = window.findGuideInDB ? window.findGuideInDB(guideName) : null;
        
        html += `<div class="info-card">
            <div class="info-card-header">📚 دليل الترخيص</div>
            <div class="info-card-content">
                <strong>اسم الدليل:</strong><br>${guideName}
            </div>
        </div>
        <div style="display: flex; gap: 10px;">
            <a href="${links.viewUrl}" target="_blank" class="link-btn" style="flex:1; justify-content:center; background: #e0f2fe; color: #0369a1 !important;">
                <i class="fas fa-eye"></i> عرض
            </a>
           <button onclick="forceDownloadGuide('${links.downloadUrl}', '${guideName}')" class="link-btn" style="flex:1; justify-content:center; cursor:pointer; border: none;">
    <i class="fas fa-download"></i> تحميل
</button>
            ${guideInDB ? `
            <button onclick="window.startGuideChat('${guideInDB.id}', '${guideName}')" class="link-btn" style="flex:1; justify-content:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; border: none; box-shadow: 0 2px 5px rgba(118, 75, 162, 0.3);">
                <i class="fas fa-robot"></i> ابحث 
            </button>
            ` : ''}
        </div>`;
    }

    if (!html) return "⚠️ معلومات الدليل غير متوفرة لهذا النشاط حالياً.";
    return html;
}

function formatTechnicalNotes(activity) {
    if (!activity.technicalNotes) {
        return "⚠️ الملاحظات الفنية غير متوفرة لهذا النشاط حالياً.";
    }
    return `<div class="tech-notes">
        <div class="tech-notes-title">🔧 ملاحظات فنية هامة لفريق اللجنة</div>
        <div class="tech-notes-content">${activity.technicalNotes}</div>
    </div>
    <div style="margin-top: 8px; padding: 8px; background: #fef3c7; border-radius: 6px; font-size: 0.85rem; color: #92400e;">
        ⚠️ هذه الملاحظات ضرورية عند المعاينة الميدانية
    </div>`;
}

function formatSuitableLocation(details) {
    if (!details.loc) {
        return "⚠️ معلومات الموقع الملائم غير متوفرة حالياً.";
    }
    return `<div class="info-card" style="background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%); border-left-color: #c2185b;">
        <div class="info-card-header" style="color: #880e4f;">📍 الموقع الملائم لممارسة النشاط</div>
        <div class="info-card-content" style="color: #ad1457;">${details.loc}</div>
    </div>`;
}


// ==================== 🧠 دالة مطابقة الأدلة الذكية (جديد) ====================
function findGuideInDB(guideNameOrLink) {
    if (typeof window.FULL_GUIDES_DB === 'undefined' || !guideNameOrLink) return null;

    // تنظيف الاسم للمقارنة (حذف المسافات والرموز)
    const cleanName = (str) => str.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '').toLowerCase();
    const target = cleanName(guideNameOrLink);

    // البحث في قاعدة البيانات الجديدة
    return window.FULL_GUIDES_DB.find(g => {
        const dbName = cleanName(g.guide_name);
        const dbFile = cleanName(g.source_file);
        // مقارنة الاسم أو اسم الملف
        return dbName.includes(target) || target.includes(dbName) || 
               dbFile.includes(target) || target.includes(dbFile);
    });
}
// ==================== تصدير الدوال العامة ====================
window.handleActivityQuery = handleActivityQuery;
window.isGuideRequest = isGuideRequest;
window.formatActivityResponse = formatActivityResponse;
window.formatLicensesDetailed = formatLicensesDetailed;
window.formatAuthority = formatAuthority;
window.formatLegislation = formatLegislation;
window.formatGuideInfo = formatGuideInfo;
window.formatTechnicalNotes = formatTechnicalNotes;
window.formatSuitableLocation = formatSuitableLocation;
window.detectSimilarActivities = detectSimilarActivities;
window.formatSimilarActivitiesChoice = formatSimilarActivitiesChoice;
window.findGuideInDB = findGuideInDB;


console.log('✅ gpt_activities.js - تم تحميله بنجاح (مستقل تماماً)');
