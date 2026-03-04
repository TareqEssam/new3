/****************************************************************************
 * 🎙️ VOICE AGENT MODULE - v1.1 (FIXED)
 * ✅ إصلاح: نظام اختيار منفصل للأصوات العربية والإنجليزية
 * ✅ إصلاح: تحسين ظهور الأصوات على الموبايل
 ****************************************************************************/

// تهيئة كائن الصوت العالمي لربط الملفات
window.GPT_VOICE = window.GPT_VOICE || {};

// المتغيرات التي تم استخراجها من الملف الأصلي
window.GPT_VOICE.isListening = false;
window.GPT_VOICE.speechEnabled = true;
window.GPT_VOICE.speechRecognition = null;

// إضافة متغيرات الإعدادات الجديدة
window.GPT_VOICE.currentRate = parseFloat(localStorage.getItem('gpt_voice_rate') || '1.45');
window.GPT_VOICE.currentPitch = parseFloat(localStorage.getItem('gpt_voice_pitch') || '1.0');
window.GPT_VOICE.autoMicEnabled = localStorage.getItem('gpt_auto_mic') === 'true';
window.GPT_VOICE.micDelay = parseInt(localStorage.getItem('gpt_mic_delay') || '2000');


// ==================== تهيئة الأصوات عند التحميل (محسّنة للموبايل) ====================
if (typeof speechSynthesis !== 'undefined') {
    // تحميل الأصوات مسبقاً
    speechSynthesis.getVoices();
    
    // الاستماع لحدث تحميل الأصوات
    speechSynthesis.addEventListener('voiceschanged', function() {
        console.log('✅ الأصوات تم تحميلها:', speechSynthesis.getVoices().length);
        
        // عرض تفاصيل الأصوات العربية للتأكد من تحميلها
        const arabicVoices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('ar'));
        console.log('🇸🇦 عدد الأصوات العربية:', arabicVoices.length);
        arabicVoices.forEach(v => console.log(`  - ${v.name} (${v.lang})`));
    });
    
    // إعادة تحميل الأصوات كل 100ms حتى تكون جاهزة (محسّنة للموبايل)
    let voiceCheckInterval = setInterval(function() {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            console.log('✅ الأصوات جاهزة:', voices.length);
            const arabicCount = voices.filter(v => v.lang.startsWith('ar')).length;
            const englishCount = voices.filter(v => v.lang.startsWith('en')).length;
            console.log(`📊 عربي: ${arabicCount} | إنجليزي: ${englishCount}`);
            clearInterval(voiceCheckInterval);
        }
    }, 100);
    
    // 🔥 تحميل إضافي خاص بالموبايل (انتظار 3 ثوانٍ)
    setTimeout(() => {
        speechSynthesis.getVoices();
        console.log('🔄 إعادة تحميل الأصوات للموبايل');
    }, 3000);
}

// 1. دالة تهيئة نظام التعرف على الكلام - منقولة لملف الصوت
window.GPT_VOICE.initSpeechRecognition = function() {
    if ('webkitSpeechRecognition' in window) {
        window.GPT_VOICE.speechRecognition = new webkitSpeechRecognition();
        const recognition = window.GPT_VOICE.speechRecognition;
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'ar-SA';
        
        recognition.onstart = function() {
            window.GPT_VOICE.isListening = true;
            
            // تأثيرات بصرية متعددة للدلالة على الاستماع
            const actionBtn = document.getElementById('gptActionBtn');
            const voiceWave = document.getElementById('voiceWave');
            const voiceText = document.getElementById('voiceText');
            const inputWrapper = document.getElementById('gptInputWrapper');
            
            // تأثير على الزر
            if (actionBtn) {
                actionBtn.classList.add('listening');
                actionBtn.style.animation = 'pulse 1.5s ease-in-out infinite';
            }
            
            // إظهار الموجة الصوتية
            if (voiceWave) {
                voiceWave.style.display = 'flex';
                voiceWave.style.animation = 'fadeIn 0.3s ease-in';
            }
            
            // نص الاستماع
            if (voiceText) {
                voiceText.style.display = 'block';
                voiceText.textContent = '🎤 أتكلم الآن...';
                voiceText.style.animation = 'fadeIn 0.3s ease-in';
            }
            
            // تأثير توهج على حاوية الإدخال
            if (inputWrapper) {
                inputWrapper.style.boxShadow = '0 0 20px rgba(0, 210, 255, 0.6), 0 0 40px rgba(58, 123, 213, 0.4)';
                inputWrapper.style.borderColor = '#00d2ff';
                inputWrapper.style.transition = 'all 0.3s ease';
            }
        };
        
        recognition.onresult = function(event) {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            
            document.getElementById('voiceText').textContent = `🎤: ${transcript}`;
            document.getElementById('voiceText').style.display = 'block';

            
            if (result.isFinal) {
                window.GPT_VOICE.autoSendAfterSpeech(transcript);
            }
        };
        
        recognition.onerror = function(event) {
            console.log('خطأ في التعرف:', event.error);
            if (window.GPT_VOICE.stopListening) window.GPT_VOICE.stopListening();
        };
        
        recognition.onend = function() {
            if (window.GPT_VOICE.stopListening) window.GPT_VOICE.stopListening();
        };
    } else {
        console.log('المتصفح لا يدعم التعرف على الكلام');
        const micBtn = document.getElementById('gptMicBtn');
        if (micBtn) micBtn.disabled = true;
    }
};

// 2. دالة إرسال الرسالة تلقائياً بعد التحدث - منقولة لملف الصوت
window.GPT_VOICE.autoSendAfterSpeech = function(transcript) {
    const input = document.getElementById('gptInput');
    if (!input) return;

    input.value = transcript;
    
    
    document.getElementById('voiceText').textContent = `📝: ${transcript}`;
    document.getElementById('voiceText').style.display = 'block';
    
    setTimeout(() => {
        const wave = document.getElementById('voiceWave');
        const vText = document.getElementById('voiceText');
        if (wave) wave.style.display = 'none';
        if (vText) vText.style.display = 'none';
        
        if (transcript.trim().length > 0 && window.sendMessage) {
            window.sendMessage();
        }
    }, 2000);
};


// 3. دالة تشغيل/إيقاف المايكروفون - منقولة لملف الصوت
window.GPT_VOICE.toggleMicrophone = function() {
    // إيقاف أي نطق جاري قبل البدء بالاستماع
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    // التأكد من تهيئة المحرك
    if (!window.GPT_VOICE.speechRecognition) {
        window.GPT_VOICE.initSpeechRecognition();
    }
    
    if (window.GPT_VOICE.isListening) {
        window.GPT_VOICE.stopListening();
    } else {
        try {
            window.GPT_VOICE.speechRecognition.start();
        } catch (e) {
            console.error("Error starting speech recognition:", e);
        }
    }
};

// 4. دالة إيقاف الاستماع وتنظيف الواجهة - منقولة لملف الصوت
window.GPT_VOICE.stopListening = function() {
    if (window.GPT_VOICE.speechRecognition && window.GPT_VOICE.isListening) {
        window.GPT_VOICE.speechRecognition.stop();
        window.GPT_VOICE.isListening = false;
        
        const actionBtn = document.getElementById('gptActionBtn');
        const wave = document.getElementById('voiceWave');
        const vText = document.getElementById('voiceText');
        const inputWrapper = document.getElementById('gptInputWrapper');
        
        // إزالة التأثيرات البصرية
        if (actionBtn) {
            actionBtn.classList.remove('listening');
            actionBtn.style.animation = '';
        }
        
        // إخفاء الموجة الصوتية بتأثير
        if (wave) {
            wave.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                wave.style.display = 'none';
                wave.style.animation = '';
            }, 300);
        }
        
        // إزالة تأثير التوهج من حاوية الإدخال
        if (inputWrapper) {
            inputWrapper.style.boxShadow = '';
            inputWrapper.style.borderColor = '';
        }
        
        // إخفاء النص بعد فترة
        setTimeout(() => {
            if (vText) {
                vText.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    vText.style.display = 'none';
                    vText.style.animation = '';
                }, 300);
            }
        }, 2000);
    }
};

// 5. دالة تحويل الأرقام إلى كلمات عربية - منقولة لملف الصوت
window.GPT_VOICE.convertNumbersToArabicWords = function(text) {
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    
    const convert = (num) => {
        if (num === 0) return 'صفر';
        if (num < 0) return 'سالب ' + convert(-num);
        let result = '';
        if (num >= 1000) {
            const thousands = Math.floor(num / 1000);
            if (thousands === 1) result += 'ألف';
            else if (thousands === 2) result += 'ألفان';
            else if (thousands <= 10) result += convert(thousands) + ' آلاف';
            else result += convert(thousands) + ' ألف';
            num %= 1000;
            if (num > 0) result += ' و';
        }
        if (num >= 100) {
            result += hundreds[Math.floor(num / 100)];
            num %= 100;
            if (num > 0) result += ' و';
        }
          if (num >= 20) {
            const remainder = num % 10;
            const tenValue = Math.floor(num / 10);
            if (remainder === 0) {
                result += tens[tenValue];
            } else {
                // نطق الآحاد أولاً ثم العشرات (اثنين وسبعين)
                result += ones[remainder] + ' و' + tens[tenValue];
            }
            num = 0; // تم الانتهاء من الرقم
        } else if (num >= 10) {
            result += teens[num - 10];
            return result;
        }
        if (num > 0) result += ones[num];
        return result;
    };
    
    return text.replace(/\d+/g, (match) => {
        const num = parseInt(match);
        return num <= 999999 ? convert(num) : match;
    });
};

// 6. دالة تحسين النص للنطق المصري - (نسخة محسنة لمنع نطق كلمة نقطة)
window.GPT_VOICE.improveTextForEgyptianSpeech = function(text) {
    let improved = window.GPT_VOICE.convertNumbersToArabicWords(text);
    
    const replacements = {
        'القرار رقم': 'القرار',
        'القانون رقم': 'القانون',
        'المادة رقم': 'المادة',
      // التعديل الجراحي لإلغاء الوقفات تماماً وزيادة سرعة الأرقام:
        '\\.': ' ',    // حذف النقطة تماماً وتحويلها لمسافة
        '،': ' ',      // حذف الفاصلة (هي أكبر سبب لبطء الأرقام)
        ':': ' ',      // حذف النقطتين
        'ش.م.م': 'شركة ذات مسؤولية محدودة',
        'م.م': 'مسؤولية محدودة',
        'متر2': 'متر مربع',
        'م2': 'متر مربع',
    };

    for (const [old, replacement] of Object.entries(replacements)) {
        improved = improved.replace(new RegExp(old, 'g'), replacement);
    }
    
    // إزالة أي نقاط متكررة قد تسبب نطق كلمة "نقطة"
    improved = improved.replace(/\.{2,}/g, ' '); 
    
    return improved;
};


// 7. جلب الأصوات العربية
window.getAvailableArabicVoicesGPT = function() {
    return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('ar'));
};

// 7.ب جلب أفضل صوت إنجليزي متاح في النظام
window.getBestEnglishVoice = function() {
    // ✅ استخدام الصوت المحفوظ أولاً
    const savedEnglishVoice = localStorage.getItem('preferred_english_voice_gpt');
    
    let voices = window.speechSynthesis.getVoices();
    
    // إذا لم تكن جاهزة، انتظر قليلاً
    if (voices.length === 0) {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (voices.length === 0 && attempts < maxAttempts) {
            voices = window.speechSynthesis.getVoices();
            attempts++;
            
            const start = Date.now();
            while (Date.now() - start < 20) { /* انتظار 20ms */ }
        }
    }
    
    // ✅ البحث عن الصوت المحفوظ أولاً
    if (savedEnglishVoice) {
        const savedVoice = voices.find(v => v.name === savedEnglishVoice && v.lang.startsWith('en'));
        if (savedVoice) return savedVoice;
    }
    
    // إذا لم يوجد صوت محفوظ، اختر أفضل صوت افتراضي
    return voices.find(v => v.lang.startsWith('en-GB') && v.name.includes('Google')) || 
           voices.find(v => v.lang.startsWith('en-US')) || 
           voices.find(v => v.lang.startsWith('en'));
};

// 8. اختيار أفضل صوت عربي متاح تلقائياً
window.getBestArabicVoice = function() {
    // ✅ استخدام الصوت المحفوظ أولاً
    const savedArabicVoice = localStorage.getItem('preferred_arabic_voice_gpt');
    
    let voices = window.speechSynthesis.getVoices();
    
    // إذا لم تكن جاهزة، انتظر قليلاً
    if (voices.length === 0) {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (voices.length === 0 && attempts < maxAttempts) {
            voices = window.speechSynthesis.getVoices();
            attempts++;
            
            const start = Date.now();
            while (Date.now() - start < 20) { /* انتظار 20ms */ }
        }
    }
    
    // ✅ البحث عن الصوت المحفوظ أولاً
    if (savedArabicVoice) {
        const savedVoice = voices.find(v => v.name === savedArabicVoice && v.lang.startsWith('ar'));
        if (savedVoice) return savedVoice;
    }
    
    // إذا لم يوجد صوت محفوظ، اختر أفضل صوت افتراضي
    return voices.find(v => v.lang === 'ar-EG') || 
           voices.find(v => v.lang === 'ar-SA' && v.name.includes('Google')) ||
           voices.find(v => v.lang.startsWith('ar'));
};

// 9. عرض نافذة اختيار الصوت - ✅ محسّنة للموبايل ومع اختيار منفصل للعربي والإنجليزي
window.showGPTVoiceSelector = function() {
    // 🔥 حل خاص للموبايل: انتظار أطول لتحميل الأصوات
    let voices = window.speechSynthesis.getVoices();

    // إذا كانت فارغة، انتظر وأعد المحاولة عدة مرات
    if (voices.length === 0) {
        const maxAttempts = 20; // ✅ زيادة المحاولات من 10 إلى 20
        let attempts = 0;
        
        const checkInterval = setInterval(() => {
            voices = window.speechSynthesis.getVoices();
            attempts++;
            
            console.log(`🔄 محاولة تحميل الأصوات ${attempts}/${maxAttempts}...`);
            
            if (voices.length > 0 || attempts >= maxAttempts) {
                clearInterval(checkInterval);
                if (voices.length > 0) {
                    console.log('✅ الأصوات جاهزة، إعادة بناء النافذة');
                    // الأصوات جاهزة، أعد بناء النافذة
                    const existingOverlay = document.getElementById('gpt-voice-overlay');
                    if (existingOverlay) existingOverlay.remove();
                    window.showGPTVoiceSelector();
                } else {
                    console.log('⚠️ فشل تحميل الأصوات بعد جميع المحاولات');
                }
            }
        }, 200); // ✅ زيادة المدة بين المحاولات من 100ms إلى 200ms
        
        // في حالة لم تُحمّل الأصوات بعد، اعرض رسالة انتظار
        if (voices.length === 0) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'gpt-voice-overlay';
            loadingOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:2147483647; display:flex; align-items:center; justify-content:center;';
            loadingOverlay.innerHTML = `
                <div style="background:white; padding:30px; border-radius:15px; text-align:center;">
                    <div style="font-size:40px; margin-bottom:15px;">⏳</div>
                    <div style="color:#3a7bd5; font-weight:600; font-size:16px;">جاري تحميل الأصوات...</div>
                    <div style="color:#666; font-size:12px; margin-top:8px;">الرجاء الانتظار (محاولة ${attempts}/${maxAttempts})</div>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
            return;
        }
    }

    // ✅ فلترة الأصوات العربية والإنجليزية
    const arabicVoices = voices.filter(v => v.lang.startsWith('ar'));
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));

    // ✅ الحصول على الأصوات المحفوظة بشكل منفصل
    const currentArabicVoice = localStorage.getItem('preferred_arabic_voice_gpt') || '';
    const currentEnglishVoice = localStorage.getItem('preferred_english_voice_gpt') || '';
    
    console.log(`📊 إحصائيات الأصوات: عربي=${arabicVoices.length}, إنجليزي=${englishVoices.length}`);
    
    // استرجاع الإعدادات المحفوظة
    const savedRate = localStorage.getItem('gpt_voice_rate') || '1.45';
    const savedPitch = localStorage.getItem('gpt_voice_pitch') || '1.0';
    const savedAutoMic = localStorage.getItem('gpt_auto_mic') || 'false';
    const savedMicDelay = localStorage.getItem('gpt_mic_delay') || '2000';
    
    const overlay = document.createElement('div');
    overlay.id = 'gpt-voice-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:2147483647; display:flex; align-items:center; justify-content:center; padding:20px;';
    
    // 🔥 رسالة تحذير إذا لم تُعثر على أصوات عربية
    let arabicWarning = '';
    if (arabicVoices.length === 0) {
        arabicWarning = `
            <div style="background:#fff3cd; border:2px solid #ffc107; padding:15px; border-radius:10px; margin-bottom:15px; text-align:center;">
                <div style="font-size:24px; margin-bottom:8px;">⚠️</div>
                <div style="color:#856404; font-weight:600; font-size:14px; margin-bottom:8px;">
                    لا توجد أصوات عربية مثبتة على جهازك
                </div>
                <div style="color:#856404; font-size:12px; line-height:1.5;">
                    يمكنك تثبيت أصوات عربية من:<br>
                    <strong>الإعدادات ← اللغة والإدخال ← تحويل النص إلى كلام</strong>
                </div>
            </div>
        `;
    }
    
    overlay.innerHTML = `
        <div style="background:white; border-radius:20px; max-width:650px; width:100%; overflow:hidden; max-height:90vh; display:flex; flex-direction:column;">
            <div style="background:linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%); color:white; padding:20px; display:flex; justify-content:space-between;">
                <h5 style="margin:0;">⚙️ إعدادات الصوت والمايكروفون</h5>
                <button onclick="closeGPTVoiceSelector()" style="background:none; border:none; color:white; font-size:28px; cursor:pointer; line-height:1;">&times;</button>
            </div>
            
            <div style="padding:20px; overflow-y:auto; flex:1;">
                ${arabicWarning}
                
                <!-- قسم اختيار الصوت العربي -->
                ${arabicVoices.length > 0 ? `
                <div style="margin-bottom:25px;">
                    <h6 style="color:#3a7bd5; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-microphone-alt"></i> 🇸🇦 الصوت العربي (${arabicVoices.length} متاح)
                    </h6>
                    <div style="max-height:200px; overflow-y:auto; border:1px solid #ddd; border-radius:10px; padding:10px;">
                        ${arabicVoices.map(voice => `
                            <div class="gpt-voice-option-arabic" onclick="selectGPTArabicVoice('${voice.name}', this)" 
                                 style="margin-bottom:8px; padding:12px; border:2px solid ${voice.name === currentArabicVoice ? '#0d6efd' : '#e0e0e0'}; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:${voice.name === currentArabicVoice ? '#e7f3ff' : 'white'}; transition:all 0.2s;">
                                <div style="flex: 1; min-width: 0; text-align: right; direction: rtl; padding-left: 10px; overflow: visible;">
                                    <div style="font-size: 13px; color: #000000 !important; font-weight: 600; line-height: 1.2; word-wrap: break-word; display: block !important; visibility: visible !important;">
                                        ${voice.name}
                                    </div>
                                    <div style="color: #444444 !important; font-size: 10px; margin-top: 2px; display: block !important;">
                                        (${voice.lang})
                                    </div>
                                </div>
                                <button onclick="event.stopPropagation(); testGPTVoice('${voice.name}')" 
                                        style="padding:6px 10px; background:#0d6efd; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; flex-shrink:0;">
                                    تجربة
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- قسم اختيار الصوت الإنجليزي -->
                ${englishVoices.length > 0 ? `
                <div style="margin-bottom:25px;">
                    <h6 style="color:#ff6f00; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-microphone-alt"></i> 🇬🇧 English Voice (${englishVoices.length} available)
                    </h6>
                    <div style="max-height:200px; overflow-y:auto; border:1px solid #ddd; border-radius:10px; padding:10px;">
                        ${englishVoices.map(voice => `
                            <div class="gpt-voice-option-english" onclick="selectGPTEnglishVoice('${voice.name}', this)" 
                                 style="margin-bottom:8px; padding:12px; border:2px solid ${voice.name === currentEnglishVoice ? '#ff6f00' : '#e0e0e0'}; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:${voice.name === currentEnglishVoice ? '#fff3e0' : 'white'}; transition:all 0.2s;">
                                <div style="flex: 1; min-width: 0; text-align: left; direction: ltr; padding-right: 10px; overflow: visible;">
                                    <div style="font-size: 13px; color: #000000 !important; font-weight: 600; line-height: 1.2; word-wrap: break-word; display: block !important; visibility: visible !important;">
                                        ${voice.name}
                                    </div>
                                    <div style="color: #444444 !important; font-size: 10px; margin-top: 2px; display: block !important;">
                                        (${voice.lang})
                                    </div>
                                </div>
                                <button onclick="event.stopPropagation(); testGPTVoice('${voice.name}')" 
                                        style="padding:6px 10px; background:#ff6f00; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; flex-shrink:0;">
                                    Test
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- قسم سرعة الصوت -->
                <div style="margin-bottom:25px;">
                    <h6 style="color:#3a7bd5; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-tachometer-alt"></i> سرعة الصوت
                    </h6>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <input type="range" id="voiceRateSlider" min="0.5" max="2.0" step="0.05" value="${savedRate}" 
                               style="flex:1; height:8px; border-radius:5px; outline:none; cursor:pointer;"
                               oninput="updateVoiceRateDisplay(this.value)">
                        <span id="voiceRateValue" style="min-width:60px; text-align:center; font-weight:bold; color:#3a7bd5; font-size:16px;">${savedRate}x</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:#666; margin-top:5px;">
                        <span>بطيء</span>
                        <span>عادي</span>
                        <span>سريع</span>
                    </div>
                </div>
                
                <!-- قسم نبرة الصوت -->
                <div style="margin-bottom:25px;">
                    <h6 style="color:#3a7bd5; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-sliders-h"></i> نبرة الصوت
                    </h6>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <input type="range" id="voicePitchSlider" min="0.5" max="2.0" step="0.1" value="${savedPitch}" 
                               style="flex:1; height:8px; border-radius:5px; outline:none; cursor:pointer;"
                               oninput="updateVoicePitchDisplay(this.value)">
                        <span id="voicePitchValue" style="min-width:60px; text-align:center; font-weight:bold; color:#3a7bd5; font-size:16px;">${savedPitch}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:#666; margin-top:5px;">
                        <span>منخفض</span>
                        <span>عادي</span>
                        <span>مرتفع</span>
                    </div>
                </div>
                
                <!-- قسم فتح المايك تلقائياً -->
                <div style="margin-bottom:25px; padding:15px; background:#f8f9fa; border-radius:10px; border:1px solid #e0e0e0;">
                    <label style="display:flex; align-items:center; gap:12px; cursor:pointer; user-select:none;">
                        <input type="checkbox" id="autoMicCheckbox" ${savedAutoMic === 'true' ? 'checked' : ''} 
                               onchange="toggleAutoMicDelay(this.checked)"
                               style="width:20px; height:20px; cursor:pointer;">
                        <span style="font-weight:600; color:#333;">
                            <i class="fas fa-microphone" style="color:#3a7bd5;"></i> 
                            فتح المايك تلقائياً بعد الرد
                        </span>
                    </label>
                    
                    <div id="micDelayContainer" style="margin-top:15px; display:${savedAutoMic === 'true' ? 'block' : 'none'};">
                        <label style="display:block; margin-bottom:8px; font-size:13px; color:#555;">
                            ⏱️ المدة قبل فتح المايك (بالثواني):
                        </label>
                        <div style="display:flex; align-items:center; gap:15px;">
                            <input type="range" id="micDelaySlider" min="1000" max="5000" step="500" value="${savedMicDelay}" 
                                   style="flex:1; height:8px; border-radius:5px; outline:none; cursor:pointer;"
                                   oninput="updateMicDelayDisplay(this.value)">
                            <span id="micDelayValue" style="min-width:60px; text-align:center; font-weight:bold; color:#3a7bd5; font-size:16px;">${(parseInt(savedMicDelay)/1000).toFixed(1)}s</span>
                        </div>
                    </div>
                </div>
                
                <!-- أزرار الحفظ والاستعادة -->
                <div style="display:flex; gap:10px;">
                    <button onclick="resetToDefaultSettings()" 
                            style="flex:1; padding:14px; background:#6c757d; color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <i class="fas fa-undo-alt"></i> استعادة الافتراضي
                    </button>
                    <button onclick="saveVoiceSettings()" 
                            style="flex:2; padding:14px; background:linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%); color:white; border:none; border-radius:10px; font-size:16px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;">
                        <i class="fas fa-save"></i> حفظ الإعدادات
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};


// دالة تحديث عرض سرعة الصوت
window.updateVoiceRateDisplay = function(value) {
    document.getElementById('voiceRateValue').textContent = parseFloat(value).toFixed(2) + 'x';
};

// دالة تحديث عرض نبرة الصوت
window.updateVoicePitchDisplay = function(value) {
    document.getElementById('voicePitchValue').textContent = parseFloat(value).toFixed(1);
};

// دالة تحديث عرض تأخير المايك
window.updateMicDelayDisplay = function(value) {
    document.getElementById('micDelayValue').textContent = (parseInt(value)/1000).toFixed(1) + 's';
};

// دالة إظهار/إخفاء إعدادات تأخير المايك
window.toggleAutoMicDelay = function(isChecked) {
    const container = document.getElementById('micDelayContainer');
    if (container) {
        container.style.display = isChecked ? 'block' : 'none';
    }
};

// ✅ دالة حفظ الصوت العربي المختار
window.selectGPTArabicVoice = function(voiceName, element) {
    localStorage.setItem('preferred_arabic_voice_gpt', voiceName);
    console.log('✅ تم حفظ الصوت العربي:', voiceName);
    
    // تحديث التمييز البصري للصوت العربي فقط
    document.querySelectorAll('.gpt-voice-option-arabic').forEach(opt => {
        opt.style.borderColor = '#e0e0e0'; 
        opt.style.background = 'white';
    });
    element.style.borderColor = '#0d6efd'; 
    element.style.background = '#e7f3ff';
};

// ✅ دالة حفظ الصوت الإنجليزي المختار
window.selectGPTEnglishVoice = function(voiceName, element) {
    localStorage.setItem('preferred_english_voice_gpt', voiceName);
    console.log('✅ تم حفظ الصوت الإنجليزي:', voiceName);
    
    // تحديث التمييز البصري للصوت الإنجليزي فقط
    document.querySelectorAll('.gpt-voice-option-english').forEach(opt => {
        opt.style.borderColor = '#e0e0e0'; 
        opt.style.background = 'white';
    });
    element.style.borderColor = '#ff6f00'; 
    element.style.background = '#fff3e0';
};

// 11. تجربة الصوت
window.testGPTVoice = function(voiceName) {
    const voice = window.speechSynthesis.getVoices().find(v => v.name === voiceName);
    if (!voice) return;
    
    window.speechSynthesis.cancel();
    
    // 🎯 جلب القيم الحالية من السلايدرات (قبل الحفظ)
    const currentRate = parseFloat(document.getElementById('voiceRateSlider')?.value || '1.45');
    const currentPitch = parseFloat(document.getElementById('voicePitchSlider')?.value || '1.0');
    
    // ✅ اختيار النص حسب لغة الصوت
    let testText;
    if (voice.lang.startsWith('ar')) {
        testText = 'مَرحَباً، أنا المساعد. هذا اختبار للصوت بالسرعة والنبرة المختارة. كيف تجد هذا الصوت؟';
    } else if (voice.lang.startsWith('en')) {
        testText = 'Hello! This is a voice test with the selected speed and pitch. How do you like this voice?';
    } else {
        testText = 'Hello, this is a test. مرحباً، هذا اختبار.';
    }
    
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = currentRate;  // ✅ تطبيق السرعة الحالية
    utterance.pitch = currentPitch; // ✅ تطبيق النبرة الحالية
    
    window.speechSynthesis.speak(utterance);
};

// 12. إغلاق النافذة
window.closeGPTVoiceSelector = function() {
    const overlay = document.getElementById('gpt-voice-overlay');
    if (overlay) overlay.remove();
};

// دالة حفظ جميع الإعدادات
window.saveVoiceSettings = function() {
    const rate = document.getElementById('voiceRateSlider')?.value || '1.45';
    const pitch = document.getElementById('voicePitchSlider')?.value || '1.0';
    const autoMic = document.getElementById('autoMicCheckbox')?.checked || false;
    const micDelay = document.getElementById('micDelaySlider')?.value || '2000';
    
    localStorage.setItem('gpt_voice_rate', rate);
    localStorage.setItem('gpt_voice_pitch', pitch);
    localStorage.setItem('gpt_auto_mic', autoMic.toString());
    localStorage.setItem('gpt_mic_delay', micDelay);
    
    // تطبيق الإعدادات فوراً
    if (window.GPT_VOICE) {
        window.GPT_VOICE.currentRate = parseFloat(rate);
        window.GPT_VOICE.currentPitch = parseFloat(pitch);
        window.GPT_VOICE.autoMicEnabled = autoMic;
        window.GPT_VOICE.micDelay = parseInt(micDelay);
    }
    
    console.log('✅ تم حفظ جميع الإعدادات');
    
    // إظهار رسالة نجاح
    const overlay = document.getElementById('gpt-voice-overlay');
    const saveBtn = overlay?.querySelector('button[onclick="saveVoiceSettings()"]');
    if (saveBtn) {
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check-circle"></i> تم الحفظ بنجاح!';
        saveBtn.style.background = '#28a745';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.background = 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)';
            closeGPTVoiceSelector();
        }, 1500);
    }
};

// دالة استعادة الإعدادات الافتراضية
window.resetToDefaultSettings = function() {
    // القيم الافتراضية
    const defaultRate = '1.45';
    const defaultPitch = '1.0';
    const defaultAutoMic = 'false';
    const defaultMicDelay = '2000';
    
    // تحديث واجهة المستخدم
    const rateSlider = document.getElementById('voiceRateSlider');
    const pitchSlider = document.getElementById('voicePitchSlider');
    const autoMicCheckbox = document.getElementById('autoMicCheckbox');
    const micDelaySlider = document.getElementById('micDelaySlider');
    
    if (rateSlider) {
        rateSlider.value = defaultRate;
        updateVoiceRateDisplay(defaultRate);
    }
    
    if (pitchSlider) {
        pitchSlider.value = defaultPitch;
        updateVoicePitchDisplay(defaultPitch);
    }
    
    if (autoMicCheckbox) {
        autoMicCheckbox.checked = false;
        toggleAutoMicDelay(false);
    }
    
    if (micDelaySlider) {
        micDelaySlider.value = defaultMicDelay;
        updateMicDelayDisplay(defaultMicDelay);
    }
    
    // حفظ القيم الافتراضية
    localStorage.setItem('gpt_voice_rate', defaultRate);
    localStorage.setItem('gpt_voice_pitch', defaultPitch);
    localStorage.setItem('gpt_auto_mic', defaultAutoMic);
    localStorage.setItem('gpt_mic_delay', defaultMicDelay);
    
    // تطبيق الإعدادات
    if (window.GPT_VOICE) {
        window.GPT_VOICE.currentRate = parseFloat(defaultRate);
        window.GPT_VOICE.currentPitch = parseFloat(defaultPitch);
        window.GPT_VOICE.autoMicEnabled = false;
        window.GPT_VOICE.micDelay = parseInt(defaultMicDelay);
    }
    
    console.log('✅ تم استعادة الإعدادات الافتراضية');
    
    // إظهار رسالة نجاح
    const overlay = document.getElementById('gpt-voice-overlay');
    const resetBtn = overlay?.querySelector('button[onclick="resetToDefaultSettings()"]');
    if (resetBtn) {
        const originalText = resetBtn.innerHTML;
        resetBtn.innerHTML = '<i class="fas fa-check-circle"></i> تمت الاستعادة!';
        resetBtn.style.background = '#28a745';
        setTimeout(() => {
            resetBtn.innerHTML = originalText;
            resetBtn.style.background = '#6c757d';
        }, 1500);
    }
};


// دالة تطبيع النص العربي (استخدامها في speakText)
function normalizeArabic(text) {
    return text.replace(/[ًٌٍَُِّْ]/g, '').toLowerCase();
}


// 17. المحرك الفائق للنطق - (النسخة المتكاملة: ميزاتك الأصلية + مصل السرعة + ذكاء البنود)
window.speakText = function(text) {
    if (!window.GPT_VOICE.speechEnabled || !text || text.length < 2) return;

    // --- 1. إعداد النص الأساسي وتنظيف الضوضاء التقنية (كما هي في كودك) ---
    let script = text;
    script = script.replace(/تطابق\s?\d+%/g, '');
    script = script.replace(/ثقة\s?\d+%/g, '');
    script = script.replace(/Confidence:\s?\d+%/gi, '');
    script = script.replace(/•/g, ' '); 

    // --- 2. محلل السياق العميق (تمت إضافة تمييز "البنود" للقرار 104) ---
    let contextType = 'عام'; 
    const norm = normalizeArabic(script);
    
    if (norm.includes('قرار رئيس مجلس الوزراء') || norm.includes('وارد بالقرار') || norm.includes('القرار 104')) {
        contextType = 'قرار_104'; // تمييز خاص للقرار
    } else if (norm.includes('منطق') || norm.includes('محافظ') || norm.includes('جهة ولاية')) {
        contextType = 'مؤنث_منطقة'; 
    } else if (norm.includes('نشاط') || norm.includes('أنشط') || norm.includes('قطاع')) {
        contextType = 'مذكر_نشاط';
    } else if (norm.includes('ترخيص') || norm.includes('شروط') || norm.includes('ضوابط')) {
        contextType = 'إجراءات';
    }

    // --- 3. محرك الترقيم اللفظي المدمج (تم دمج "البند" مع ميزاتك الأصلية) ---
    const mascOrdinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
    const femOrdinals  = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
    const adverbs      = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً', 'سادساً', 'سابعاً', 'ثامناً', 'تاسعاً', 'عاشراً'];

    let listIndex = 0;
    script = script.replace(/(📋|🎯|(\b\d+\.\s))/g, function(match, icon, num, offset) {
        
        // استثناء خاص بك: حماية العناوين في بداية القرار 104
        if (contextType === 'قرار_104' && offset < 60) {
             return " ، بخصوص : "; 
        }

        // حماية العناوين العامة في بداية أي رد (ميزتك الأصلية)
        if (listIndex === 0 && offset < 30 && !norm.includes('عثرت') && !norm.includes('نتائج')) {
            listIndex++; 
            return " ، إليك تفاصيل : "; 
        }

        let label = " ، ، ";
        if (listIndex < 10) {
            // التعديل الجديد: نطق "البند" إذا كان السياق قرار 104
            if (contextType === 'قرار_104') label = ` ، ، البند ${mascOrdinals[listIndex]} هو : `;
            else if (contextType === 'مؤنث_منطقة') label = ` ، ، المنطقة ${femOrdinals[listIndex]} هي : `;
            else if (contextType === 'مذكر_نشاط') label = ` ، ، النشاط ${mascOrdinals[listIndex]} هو : `;
            else if (contextType === 'إجراءات') label = ` ، ، ${adverbs[listIndex]} : `;
            else label = ` ، ، الخيار ${mascOrdinals[listIndex]} هو : `;
        } else {
            label = " ، ، والنقطة التالية هي : ";
        }
        listIndex++;
        return label;
    });

    // --- 4. مترجم الرموز التخصصي (تم استعادتها بالكامل كما هي في كودك) ---
    script = script.replace(/📍/g, " ، يقع الموقع الجغرافي في : ")
                   .replace(/🏛️/g, " ، والجهة التابع لها هي : ")
                   .replace(/📏/g, " ، بمساحة إجمالية قدرها : ")
                   .replace(/فدان/g, " فدان استثماري . ")
                   .replace(/📜/g, " ، وبالنسبة لقرار الإنشاء : ")
                   .replace(/🎁/g, " ، وعن الحوافز والامتيازات : ")
                   .replace(/⚖️/g, " ، أما الضوابط القانونية فهي : ")
                   .replace(/القطاع أ/g, " القطاع أَلِفْ ، ")
                   .replace(/القطاع ب/g, " القطاع بـاء ")
                   .replace(/⭐/g, " ، ومن المزايا الإضافية : ")
                   .replace(/📄/g, " ، وصف النشاط. كما يلي : ")
                   .replace(/📝/g, " ، وتتضمن التراخيص المطلوبة : ")
                   .replace(/🔍/g, " ، وأظهرت نتائج البحث ما يلي : ")
                   .replace(/💡/g, " ، ، ملاحظة  : ")
                   .replace(/⚠️/g, " ، ، تنبيه هام جداً : ")
                   .replace(/✅/g, " ، .بالفعل. ، ")
                   .replace(/❌/g, " ، غير متاح حالياً ، ")
                   .replace(/📥/g, " ، رابط تحميل الملف : ");

    script = script.replace(/:/g, " : ").replace(/\n/g, " . ");
 
    script = script.replace(/<[^>]*>/g, ' '); // تنظيف الـ HTML

    // --- 5. محرك التقطيع ثنائي اللغة (تم الحفاظ عليه بالكامل مع تحسين السرعة) ---
    const chunks = script.split(/([a-zA-Z0-9\s\-_]{3,})/g);
    
    window.speechSynthesis.cancel();
    
    const arVoice = window.getBestArabicVoice();
    const enVoice = window.getBestEnglishVoice();
    
    let processedChunksCount = 0;
    const activeChunks = chunks.filter(c => c.trim().length > 0);

    activeChunks.forEach((chunk) => {
        const isEnglish = /[a-zA-Z]/.test(chunk);
        
        let finalChunkText = isEnglish ? chunk : window.GPT_VOICE.improveTextForEgyptianSpeech(chunk);
        
        if (!isEnglish) {
            finalChunkText = finalChunkText.replace(/[^\u0600-\u06FF\s\d،؟.:]/g, ' ');
        }

        const utterance = new SpeechSynthesisUtterance(finalChunkText);
        
        // استرجاع الإعدادات المحفوظة
        const savedRate = parseFloat(localStorage.getItem('gpt_voice_rate') || '1.45');
        const savedPitch = parseFloat(localStorage.getItem('gpt_voice_pitch') || '1.0');
        
        if (isEnglish && enVoice) {
            utterance.voice = enVoice;
            utterance.lang = 'en-US';
            utterance.rate = 1.05; // سرعة الإنجليزي ثابتة
        } else {
            utterance.voice = arVoice;
            utterance.lang = 'ar-EG';
            // تطبيق السرعة المحفوظة من الإعدادات
            utterance.rate = savedRate; 
        }

        // تطبيق النبرة المحفوظة من الإعدادات
        utterance.pitch = savedPitch;

        utterance.onstart = () => {
            const btn = document.getElementById('gptSpeakerBtn');
            if (btn) btn.classList.add('muted');
        };
        
       utterance.onend = () => {
            processedChunksCount++;
            if (processedChunksCount >= activeChunks.length) {
                const btn = document.getElementById('gptSpeakerBtn');
                const voiceControls = document.getElementById('gptVoiceControls');
                
                if (btn) btn.classList.remove('muted');
                
                // إخفاء زر السماعة فوراً بعد انتهاء الكلام
                if (voiceControls) {
                    voiceControls.style.display = 'none';
                    voiceControls.style.visibility = 'hidden';
                    voiceControls.style.position = 'absolute';
                    voiceControls.classList.remove('active');
                }
                
                // فتح المايك تلقائياً إذا كانت الميزة مفعلة
                const autoMicEnabled = localStorage.getItem('gpt_auto_mic') === 'true';
                if (autoMicEnabled) {
                    const micDelay = parseInt(localStorage.getItem('gpt_mic_delay') || '2000');
                    setTimeout(() => {
                        if (window.GPT_VOICE && window.GPT_VOICE.toggleMicrophone) {
                            // التأكد أن المايك غير مفتوح مسبقاً
                            if (!window.GPT_VOICE.isListening) {
                                window.GPT_VOICE.toggleMicrophone();
                            }
                        }
                    }, micDelay);
                }
            }
        };

        window.speechSynthesis.speak(utterance);
    });
};
