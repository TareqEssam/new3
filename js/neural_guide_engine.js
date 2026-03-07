/**
 * 🧠 neural_guide_engine.js
 * مــحرك البحث في الأدلة الرسمية
 *
 * ⚙️  الاعتماديات (يجب تحميلها قبل هذا الملف بالترتيب):
 *   1. neural_search_v6.js   ← يوفر: advancedNormalize, smartLevenshtein,
 *                                     jaroWinkler, autoCorrectKeyboardLayout,
 *                                     IntelligentCache
 *   2. processed_guides.js   ← يوفر: PROCESSED_GUIDES, FULL_GUIDES_DB
 *   3. gpt_agent.js          ← يوفر: AgentMemory
 *
 * ✅ لا يوجد أي تكرار للكود — كل الأدوات تُستدعى من neural_search_v6
 */

// =====================================================
// 🔌 طبقة التوافق — تضمن وجود الأدوات من v6
//    إذا لم يُحمَّل v6 بعد، تُعرِّف نسخة احتياطية بسيطة
// =====================================================
const _guideNormalize   = () => window.advancedNormalize   || window.normalizeArabic  || (t => t);
const _guideLevenshtein = () => window.smartLevenshtein    || (() => 99);
const _guideJaro        = () => window.jaroWinkler         || (() => 0);
const _guideCache       = () => window.IntelligentCache    || { get: () => undefined, set: () => {} };
const _guideKeyboard    = () => window.autoCorrectKeyboardLayout || (t => t);

// =====================================================
// ① المصفوفة الدلالية المخصصة للأدلة القانونية
// =====================================================

const GuideSemantic = {
  // نوايا البحث
  "شروط":       ["متطلبات", "اشتراطات", "يشترط", "يلزم", "يجب", "لازم", "ضروري", "مطلوب"],
  "ترخيص":      ["تراخيص", "رخصه", "رخصة", "موافقه", "موافقة", "اذن", "إذن", "اجازه"],
  "اجراءات":    ["خطوات", "مراحل", "طريقه", "كيفيه", "آلية", "طريقة", "مسار"],
  "غرامه":      ["عقوبه", "جزاء", "مخالفه", "غرامة", "عقوبة", "مخالفة", "جزائي"],
  "جهه":        ["جهة", "هيئه", "هيئة", "وزاره", "وزارة", "مسئول", "سلطه"],
  "مدة":        ["فترة", "مده", "وقت", "ايام", "أيام", "شهر", "سنه", "سنة"],
  "رفض":        ["قبول", "اعتراض", "طعن", "تظلم", "استئناف"],
  "تجديد":      ["تمديد", "استمرار", "تحديث", "تجديد الترخيص"],
  "الغاء":      ["إلغاء", "سحب", "وقف", "تعليق", "انهاء"],
  "محل":        ["المحل", "تجاري", "نشاط", "مشروع", "منشاه", "منشأة"],
  "غلق":        ["اغلاق", "إغلاق", "اقفال", "تعليق", "وقف"],
  "مواد":       ["مادة", "بند", "فقرة", "نص", "نصوص"],
  "عقوبات":     ["عقوبه", "جزاء", "غرامه", "حبس", "سجن", "مخالفة"],
  "تفتيش":      ["رقابه", "رقابة", "متابعه", "فحص", "كشف", "معاينه"],
  "استيراد":    ["تصدير", "جمارك", "تجاره", "تجارة", "دولية"],
  "بيئه":       ["بيئة", "تلوث", "سلامه", "حمايه", "اشتراطات بيئية"],
};

// =====================================================
// ② كاشف نية السؤال الذكي
// =====================================================

const GuideIntentDetector = {

  /**
   * يحلل السؤال ويستخرج:
   * - نوع الاستعلام (مادة / بحث دلالي / سؤال مفتوح)
   * - الرقم إن وُجد
   * - الكلمات المفتاحية الموسعة
   */
  // تصحيح الأخطاء الإملائية الشائعة
  fixTypos(word) {
    const typos = {
      'شرء': 'شراء', 'شرا': 'شراء', 'الشرء': 'الشراء',
      'اجراء': 'إجراء', 'اجراءات': 'إجراءات',
      'انشاء': 'إنشاء', 'اعفاء': 'إعفاء',
      'مستشفيات': 'مستشفيات', 'صيدليه': 'صيدلية',
      'ادويه': 'أدوية', 'ادوية': 'أدوية',
      'مستلزمات': 'مستلزمات', 'مستحضرات': 'مستحضرات',
      // تطبيع التاء المربوطة ↔ الهاء المفتوحة
      'ماده': 'مادة', 'الماده': 'المادة',
      'فقره': 'فقرة', 'الفقره': 'الفقرة',
      'هيئه': 'هيئة', 'لائحه': 'لائحة',
      'غرامه': 'غرامة', 'عقوبه': 'عقوبة',
      'رخصه': 'رخصة', 'موافقه': 'موافقة',
    };
    return typos[word] || word;
  },

  // =====================================================
  // تحويل الأرقام المكتوبة بالكلمات إلى أرقام
  // يدعم: الأولى/الأول، الثانية/الثاني، التانية/التاني ... إلخ
  // =====================================================
  wordToNumber(text) {
    const map = {
      // الأول / الأولى
      'الأول':1,'الأولى':1,'اول':1,'أول':1,'أولى':1,'اولي':1,'اولى':1,
      // الثاني / الثانية / التاني / التانية (عامية)
      'الثاني':2,'الثانية':2,'ثاني':2,'ثانية':2,
      'التاني':2,'التانية':2,'تاني':2,'تانية':2,'تانيه':2,
      // الثالث / الثالثة
      'الثالث':3,'الثالثة':3,'ثالث':3,'ثالثة':3,'ثالثه':3,
      // الرابع / الرابعة
      'الرابع':4,'الرابعة':4,'رابع':4,'رابعة':4,'رابعه':4,
      // الخامس / الخامسة
      'الخامس':5,'الخامسة':5,'خامس':5,'خامسة':5,'خامسه':5,
      // السادس / السادسة
      'السادس':6,'السادسة':6,'سادس':6,'سادسة':6,'سادسه':6,
      // السابع / السابعة
      'السابع':7,'السابعة':7,'سابع':7,'سابعة':7,'سابعه':7,
      // الثامن / الثامنة
      'الثامن':8,'الثامنة':8,'ثامن':8,'ثامنة':8,'ثامنه':8,
      // التاسع / التاسعة
      'التاسع':9,'التاسعة':9,'تاسع':9,'تاسعة':9,'تاسعه':9,
      // العاشر / العاشرة
      'العاشر':10,'العاشرة':10,'عاشر':10,'عاشرة':10,'عاشره':10,
      // الحادي عشر
      'الحادي عشر':11,'حادي عشر':11,'الحاديه عشر':11,
      // الثاني عشر
      'الثاني عشر':12,'ثاني عشر':12,'التاني عشر':12,'تاني عشر':12,
      // الثالث عشر
      'الثالث عشر':13,'ثالث عشر':13,
      // الرابع عشر
      'الرابع عشر':14,'رابع عشر':14,
      // الخامس عشر
      'الخامس عشر':15,'خامس عشر':15,
      // السادس عشر
      'السادس عشر':16,'سادس عشر':16,
      // السابع عشر
      'السابع عشر':17,'سابع عشر':17,
      // الثامن عشر
      'الثامن عشر':18,'ثامن عشر':18,
      // التاسع عشر
      'التاسع عشر':19,'تاسع عشر':19,
      // العشرون
      'العشرون':20,'العشرين':20,'عشرون':20,'عشرين':20,
    };

    // نحاول أولاً الأرقام المركبة (الحادي عشر، الثاني عشر ...)
    const multiWordKeys = Object.keys(map).filter(k => k.includes(' ')).sort((a,b)=>b.length-a.length);
    for (const key of multiWordKeys) {
      if (text.includes(key)) return map[key];
    }
    // ثم الأرقام المفردة
    for (const [key, val] of Object.entries(map)) {
      if (!key.includes(' ') && text.includes(key)) return val;
    }
    return null;
  },

  analyze(query) {
    // ✅ نستخدم advancedNormalize من v6 مباشرة (أقوى من normalizeArabic)
    //    تطبّع: أ/إ/آ→ا، ة/ه→ه، ى/ي→ي، تشكيل، أرقام هندية→عربية
    const normalize = _guideNormalize();

    // تصحيح لوحة المفاتيح أولاً (لو كتب بالإنجليزي بالغلط) — من v6
    const keyboardFixed = _guideKeyboard()(query);
    const q = normalize(keyboardFixed);

    const toLatinNum = n => n ? n.toString().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)) : null;

    // ① البحث عن مادة/بند/فقرة + رقم (أرقام عربية أو لاتينية)
    //    مثال: "مادة 12"، "المادة ١٢"، "الماده12"
    const articleMatchNum = q.match(
      /(?:ماده|ماد[ةه]|ماد|بند|فقر[ةه])\s*[\(\[]*\s*([٠-٩\d]+)\s*[\)\]]*/i
    );

    // ② البحث عن مادة/بند/فقرة + رقم مكتوب بالكلمات
    //    مثال: "المادة الثانية"، "مادة التانية"، "المادة الثاني عشر"
    const articlePrefixMatch = q.match(
      /(?:ماده|ماد[ةه]|ماد|بند|فقر[ةه])\s+(.{2,25})/i
    );
    let wordNum = null;
    if (!articleMatchNum && articlePrefixMatch) {
      wordNum = this.wordToNumber(articlePrefixMatch[1].trim());
    }

    // ③ رقم منفرد فقط (مثال: يكتب "12" فقط)
    const numOnlyMatch = !articleMatchNum && !wordNum && query.match(/^[\s]*([٠-٩\d]+)[\s]*$/)
                       ? query.match(/([٠-٩\d]+)/) : null;

    const articleNum = articleMatchNum
      ? toLatinNum(articleMatchNum[1])
      : wordNum
        ? String(wordNum)
        : (numOnlyMatch ? toLatinNum(numOnlyMatch[1]) : null);

    // ④ استخراج الكلمات + تصحيح + توسيع دلالي
    const stopWords = new Set(['في','من','الى','على','عن','هل','ما','هو','هي',
      'ذلك','تلك','لي','لك','كيف','ماذا','متى','اين','لماذا','كم','وفي',
      'وعلى','ومن','وان','ان','اذا','حيث','التي','الذي','بعد','قبل']);

    const stemWord = w => w.replace(/^(ال|وال|بال|كال|فال|لل)/, '');

    const rawWords = q.split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .map(w => this.fixTypos(w));

    const stems = rawWords.map(stemWord).filter(w => w.length > 2);

    // التوسيع الدلالي — يستخدم normalize من v6 على المرادفات
    const expandedWords = new Set([...rawWords, ...stems]);
    rawWords.forEach(word => {
      const synonyms = GuideSemantic[word] || GuideSemantic[stemWord(word)] || [];
      synonyms.forEach(s => {
        const norm = normalize(s);
        expandedWords.add(norm);
        expandedWords.add(stemWord(norm));
      });
    });

    // ⑤ نوع الاستعلام
    let queryType = 'semantic';
    if (articleNum) queryType = 'article';
    else if (rawWords.length <= 2) queryType = 'keyword';

    const isGlobal = !window.AgentMemory?.activeGuide;

    return {
      queryType,
      articleNum,
      rawWords,
      stems,
      expandedWords: [...expandedWords],
      isGlobal,
      originalQuery: query,
      normalizedQuery: q
    };
  }
};

// =====================================================
// ③ محرك التسجيل والترتيب
// =====================================================

const GuideScorer = {

  /**
   * يحسب نقاط تطابق قطعة معرفية مع الاستعلام
   */
  scoreChunk(chunk, intent) {
    // ✅ نستخدم أدوات v6 مباشرة بدون تكرار
    const normalize    = _guideNormalize();
    const levenshtein  = _guideLevenshtein();
    const jaro         = _guideJaro();
    const cache        = _guideCache();

    // --- Cache: إذا حسبنا هذه القطعة مع هذه النية من قبل ---
    const cacheKey = `guide_score_${chunk.id}_${intent.normalizedQuery}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined) return cached;

    let score = 0;
    const rawText = getChunkText(chunk);
    const text = normalize(rawText);
    const chunkKeywords = new Set((chunk.keywords || []).map(k => normalize(k)));

    // ① تطابق رقم المادة (أعلى أولوية)
    if (intent.queryType === 'article' && intent.articleNum) {
      if (chunk.article_num == intent.articleNum) {
        score += 2000;
      } else {
        const numAr = intent.articleNum.toString().split('').map(d => '٠١٢٣٤٥٦٧٨٩'[d] ?? d).join('');
        const articleRegex = new RegExp(`(?:ماد[ةه]|ماده)\\s*[\\(\\[]*\\s*(?:${intent.articleNum}|${numAr})\\s*[\\)\\]]*`, 'i');
        if (articleRegex.test(rawText)) score += 1500;
      }
    }

    // ② تطابق الكلمات الموسعة
    intent.expandedWords.forEach(word => {
      if (word.length < 3) return;
      const normWord = normalize(word);
      if (chunkKeywords.has(normWord)) score += 30;
      const regex = new RegExp(normWord, 'g');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * 8;
        if (text.startsWith(normWord) || text.includes('\n' + normWord)) score += 15;
      }
    });

    // ③ الكلمات الأصلية — وزن أعلى
    intent.rawWords.forEach(word => {
      const normWord = normalize(word);
      if (text.includes(normWord)) score += 25;
    });

    // ③-ب الجذور
    (intent.stems || []).forEach(stem => {
      if (stem.length < 3) return;
      const normStem = normalize(stem);
      const stemMatches = text.match(new RegExp(normStem, 'g'));
      if (stemMatches) score += stemMatches.length * 12;
    });

    // ③-ج بونص التجاور
    if (intent.rawWords.length >= 2) {
      for (let i = 0; i < intent.rawWords.length - 1; i++) {
        const w1 = normalize(intent.rawWords[i]);
        const w2 = normalize(intent.rawWords[i + 1]);
        if (new RegExp(`${w1}.{0,20}${w2}`).test(text)) score += 150;
      }
    }

    // ④ بونص نوع القطعة
    if (chunk.type === 'article') score += 100;
    if (chunk.type === 'list')    score += 60;
    if (chunk.has_items)          score += 40;

    // ⑤ بونص الكثافة
    if (score > 0 && chunk.char_count > 0) {
      const density = score / (chunk.char_count / 100);
      score += Math.min(density * 3, 200);
    }

    // ⑥ 🆕 تشابه تقريبي Fuzzy (من v6) — للكلمات الطويلة التي لم تتطابق بعد
    if (score < 80 && intent.normalizedQuery && intent.normalizedQuery.length > 4) {
      // Jaro-Winkler مع عنوان القطعة
      const titleSim = jaro(intent.normalizedQuery, normalize(chunk.title || ''));
      if (titleSim > 0.82) score += Math.round(titleSim * 120);

      // Levenshtein مع الكلمات المفتاحية
      if (score < 60) {
        for (const kw of chunkKeywords) {
          if (kw.length < 3) continue;
          const dist = levenshtein(intent.normalizedQuery, kw);
          const maxDist = Math.floor(intent.normalizedQuery.length * 0.3);
          if (dist <= maxDist && dist > 0) {
            score += Math.max(80 - dist * 15, 20);
            break; // نكتفي بأول تطابق
          }
        }
      }
    }

    const finalScore = Math.round(score);

    // حفظ في Cache
    cache.set(cacheKey, finalScore);

    return finalScore;
  },

  /**
   * يبحث في قاعدة البيانات المُعالجة ويرجع أفضل النتائج
   */
  search(intent, guideId = null) {
    if (!window.PROCESSED_GUIDES) {
      console.warn('⚠️ PROCESSED_GUIDES غير محملة');
      return [];
    }

    // ✅ Cache على مستوى البحث الكامل (من v6)
    const cache = _guideCache();
    const searchCacheKey = `guide_search_${guideId || 'all'}_${intent.normalizedQuery}`;
    const cachedSearch = cache.get(searchCacheKey);
    if (cachedSearch) {
      console.log('⚡ guide search من الذاكرة المؤقتة');
      return cachedSearch;
    }

    const guidesToSearch = guideId
      ? window.PROCESSED_GUIDES.filter(g => g.id === guideId)
      : window.PROCESSED_GUIDES;

    const results = [];

    guidesToSearch.forEach(guide => {
      (guide.chunks || []).forEach(chunk => {
        const score = this.scoreChunk(chunk, intent);
        if (score > 50) {
          results.push({ score, chunk, guide_name: guide.guide_name, guide_id: guide.id });
        }
      });
    });

    const sorted = results
      .sort((a, b) => b.score - a.score);
      // ✅ لا نقطع هنا — القرار يتم في handleGuideSearch حسب نوع الحالة

    cache.set(searchCacheKey, sorted);
    return sorted;
  }
};

// =====================================================
// ④ مُنسّق الإجابات الذكي
// =====================================================

const GuideFormatter = {

  /**
   * يُنسّق نص القطعة ليكون مقروءاً وجميلاً
   */
  formatChunkText(text, highlightWords = []) {
    if (!text) return '';

    // ① بناء HTML أولاً بدون تلوين
    let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let html = '';

    lines.forEach((line) => {
      if (/^مادة\s*[\(\[]*\s*[\d٠-٩]+/.test(line) || /^المادة\s+[\d٠-٩]+/.test(line)) {
        html += `<div class="guide-article-title">📋 ${line}</div>`;
      } else if (/^[١٢٣٤٥٦٧٨٩٠]+\s*[-–.]/.test(line)) {
        const num = line.match(/^([١٢٣٤٥٦٧٨٩٠]+)/)[1];
        const content = line.replace(/^[١٢٣٤٥٦٧٨٩٠]+\s*[-–.]\s*/, '');
        html += `<div class="guide-item"><span class="guide-item-num">${num}</span><span class="guide-item-text">${content}</span></div>`;
      } else if (/^\d+\s*[-–.]/.test(line)) {
        const num = line.match(/^(\d+)/)[1];
        const content = line.replace(/^\d+\s*[-–.]\s*/, '');
        html += `<div class="guide-item"><span class="guide-item-num">${num}</span><span class="guide-item-text">${content}</span></div>`;
      } else if (/^\([أ-ي]\)/.test(line)) {
        const letter = line.match(/^\(([أ-ي])\)/)[1];
        const content = line.replace(/^\([أ-ي]\)\s*/, '');
        html += `<div class="guide-item guide-item-alpha"><span class="guide-item-num">${letter}</span><span class="guide-item-text">${content}</span></div>`;
      } else if (/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً)/.test(line)) {
        html += `<div class="guide-section-title">◆ ${line}</div>`;
      } else if (/^[-─━]{3,}$/.test(line)) {
        html += `<hr class="guide-divider">`;
      } else {
        html += `<div class="guide-paragraph">${line}</div>`;
      }
    });

    // ② تلوين كلمات البحث — بطريقة آمنة لا تكسر HTML
    if (highlightWords && highlightWords.length > 0) {

      // نبني قائمة شاملة: الكلمة الأصلية + جذرها + بدائل ة/ه
      const allVariants = new Set();
      const stemWord = w => w.replace(/^(ال|وال|بال|كال|فال|لل)/, '');

      highlightWords.forEach(word => {
        if (!word || word.length < 2) return;
        const stem = stemWord(word);

        // الكلمة كما هي
        allVariants.add(word);
        // جذرها بدون أل
        if (stem !== word) allVariants.add(stem);
        // بديل ة ↔ ه
        if (word.endsWith('ة'))  { allVariants.add(word.slice(0,-1) + 'ه'); allVariants.add(stem.slice(0,-1) + 'ه'); }
        if (word.endsWith('ه'))  { allVariants.add(word.slice(0,-1) + 'ة'); allVariants.add(stem.slice(0,-1) + 'ة'); }
        // بديل ى ↔ ي
        if (word.endsWith('ى'))  allVariants.add(word.slice(0,-1) + 'ي');
        if (word.endsWith('ي'))  allVariants.add(word.slice(0,-1) + 'ى');
        // بديل أ ↔ ا
        allVariants.add(word.replace(/[أإآ]/g, 'ا'));
      });

      // ③ التلوين الآمن: نعمل فقط داخل محتوى tags وليس داخل attributes
      //    الفكرة: نقسم الـ HTML عند >...< ونلوّن فقط الأجزاء النصية
      const safeHighlight = (htmlStr, variants) => {
        // نبني regex واحد يجمع كل البدائل (الأطول أولاً لتفادي التعارض)
        const sorted = [...variants]
          .filter(v => v && v.length >= 2)
          .sort((a, b) => b.length - a.length);

        if (sorted.length === 0) return htmlStr;

        const pattern = sorted
          .map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|');

        // نقسم عند الـ tags: الأجزاء الزوجية (0,2,4...) نص — الفردية tags
        return htmlStr.replace(/>([^<]+)</g, (match, textContent) => {
          const highlighted = textContent.replace(
            new RegExp(`(${pattern})`, 'g'),
            '<mark class="guide-highlight">$1</mark>'
          );
          return `>${highlighted}<`;
        });
      };

      html = safeHighlight(html, allVariants);
    }

    return html;
  },

  /**
   * يبني بطاقة الإجابة الكاملة
   */
  buildAnswerCard(results, intent) {
    if (!results || results.length === 0) return null;

    const top = results[0];
    const hasAlternatives = results.length > 1 && results[1].score > results[0].score * 0.5;

    // ===== الإجابة الرئيسية =====
    let html = `
    <div class="guide-answer-card">
      <div class="guide-answer-header">
        <div class="guide-answer-icon">📄</div>
        <div class="guide-answer-meta">
          <div class="guide-answer-source">${top.guide_name.replace('.pdf', '').replace('.pdf.pdf', '')}</div>
          <div class="guide-answer-page">صفحة ${top.chunk.page_num}</div>
        </div>
        <button class="guide-open-btn" onclick="window.openGuidePage('${top.guide_id}', ${top.chunk.page_num})" title="فتح الصفحة في الدليل">
          <i class="fas fa-external-link-alt"></i>
        </button>
      </div>
      
      <div class="guide-answer-body">
        ${this.formatChunkText(getChunkText(top.chunk), intent.rawWords)}
      </div>`;

    // ===== نتائج بديلة مع مقتطف ونسبة تطابق =====
    if (hasAlternatives) {
      const topScore = results[0].score;
      // نعرض كل النتائج التي نسبتها > 40% — وليس 3 فقط
      const altResults = results.slice(1).filter(r => r.score / topScore >= 0.40);

      const altItems = altResults.map(r => {
        const matchPct  = Math.min(Math.round((r.score / topScore) * 100), 100);
        const barColor  = matchPct >= 70 ? '#0369a1' : (matchPct >= 50 ? '#0891b2' : '#94a3b8');

        const fullText = getChunkText(r.chunk) || '';
        const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 15);
        const snippetLine = lines.length > 1 ? lines[1] : lines[0] || '';
        let snippet = snippetLine.substring(0, 110);
        if (snippetLine.length > 110) {
          const lastStop = Math.max(snippet.lastIndexOf('،'), snippet.lastIndexOf('.'));
          if (lastStop > 60) snippet = snippet.substring(0, lastStop + 1);
          else snippet += '...';
        }
        let coloredSnippet = snippet;
        (intent.rawWords || []).forEach(word => {
          if (!word || word.length < 3) return;
          const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          coloredSnippet = coloredSnippet.replace(
            new RegExp(`(${safe})`, 'gi'),
            '<mark class="guide-highlight">$1</mark>'
          );
        });
        const guideName = r.guide_name.replace(/\.pdf\.pdf$/i,'').replace(/\.pdf$/i,'');
        const shortName = guideName.length > 38 ? guideName.substring(0,38)+'...' : guideName;
        return `
          <div class="guide-alt-item" onclick="window.showGuideChunk('${r.guide_id}', '${r.chunk.id}')">
            <span class="guide-alt-icon">📋</span>
            <div class="guide-alt-content">
              <div class="guide-alt-header">
                <strong>${shortName}</strong>
                <span class="guide-alt-page" style="background:${barColor};">${matchPct}% — ص ${r.chunk.page_num}</span>
              </div>
              <div class="guide-alt-title">${(r.chunk.title || '').substring(0,60)}</div>
              ${coloredSnippet ? `<div class="guide-alt-snippet">${coloredSnippet}</div>` : ''}
            </div>
          </div>`;
      }).join('');

      html += `
      <div class="guide-alternatives">
        <div class="guide-alternatives-label">🔍 وجدت أيضاً في (${altResults.length}):</div>
        ${altItems}
      </div>`;
    }

    html += `</div>`;
    return html;
  },

  /**
   * يبني سؤال التوضيح عند التساوي
   * - يعرض كل النتائج ذات الصلة (حتى 8) مرتبةً تنازلياً
   * - يُظهر مقتطف نصي + رقم الصفحة + نسبة التطابق لكل نتيجة
   * - يحدد "الأقرب" تلقائياً بأيقونة 🎯
   */
  buildClarificationCard(results, query, guideId = null) {
    const normalize = _guideNormalize();
    const topScore  = results[0]?.score || 1;

    // نعرض النتائج التي نسبتها > 40% — بحد أقصى 10 في البطاقة، والباقي في زر "عرض الكل"
    const toShow = results
      .filter((r, i) => i === 0 || (r.score / topScore) >= 0.40)
      .slice(0, 10);

    // دالة مساعدة: استخرج أول جملة مفيدة من النص
    const getSnippet = (chunk) => {
      const fullText = getChunkText(chunk) || '';
      const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
      const line = lines.length > 1 ? lines[1] : (lines[0] || '');
      let snip = line.substring(0, 90);
      if (line.length > 90) {
        const cut = Math.max(snip.lastIndexOf('،'), snip.lastIndexOf('.'));
        snip = cut > 40 ? snip.substring(0, cut + 1) : snip + '…';
      }
      // تلوين كلمات البحث في المقتطف
      (query.split(/\s+/).filter(w => w.length > 2)).forEach(word => {
        const safe = normalize(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!safe) return;
        snip = snip.replace(new RegExp(`(${safe})`, 'gi'),
          '<mark class="guide-highlight">$1</mark>');
      });
      return snip;
    };

    let html = `
    <div class="guide-clarification-card">
      <div class="guide-clarify-header">
        <div class="guide-clarify-icon">🤔</div>
        <div>
          <div class="guide-clarify-title">وجدت هذا الموضوع في ${toShow.length} مصدر</div>
          <div class="guide-clarify-subtitle">اختر الدليل الذي تقصده:</div>
        </div>
      </div>`;

    toShow.forEach((r, i) => {
      const matchPct  = Math.min(Math.round((r.score / topScore) * 100), 100);
      const isTop     = i === 0;
      const icon      = isTop ? '🎯' : (matchPct >= 70 ? '📋' : '📄');
      const barColor  = isTop ? '#0369a1' : (matchPct >= 70 ? '#0891b2' : '#94a3b8');
      const guideName = r.guide_name.replace(/\.pdf\.pdf$/i, '').replace(/\.pdf$/i, '');
      const shortName = guideName.length > 42 ? guideName.substring(0, 42) + '…' : guideName;
      const snippet   = getSnippet(r.chunk);

      html += `
      <div class="choice-btn${isTop ? ' choice-btn--top' : ''}"
           onclick="window.selectGuideResult('${r.guide_id}', '${r.chunk.id}', '${encodeURIComponent(query)}')">
        <span class="choice-icon">${icon}</span>
        <div class="choice-content" style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:3px;">
            <strong style="font-size:0.82rem;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${shortName}
            </strong>
            <span style="font-size:0.72rem;background:${barColor};color:white;
                         padding:1px 7px;border-radius:10px;white-space:nowrap;flex-shrink:0;">
              ${matchPct}%
            </span>
          </div>
          <div style="font-size:0.75rem;color:#64748b;margin-bottom:4px;">
            صفحة ${r.chunk.page_num}
            ${r.chunk.title ? ` — ${r.chunk.title.substring(0, 45)}` : ''}
          </div>
          ${snippet ? `
          <div style="font-size:0.78rem;color:#475569;line-height:1.5;
                      border-right:2px solid #e2e8f0;padding-right:7px;
                      display:-webkit-box;-webkit-line-clamp:2;
                      -webkit-box-orient:vertical;overflow:hidden;">
            ${snippet}
          </div>` : ''}
        </div>
      </div>`;
    });

    // زر "عرض المزيد" إذا كانت النتائج أكثر من ما يُعرض
    if (results.length > toShow.length) {
      const safeGuideId = guideId ? `'${guideId}'` : 'null';
      html += `
      <div style="text-align:center;margin-top:8px;">
        <button onclick="window.showAllGuideResults(${JSON.stringify(query)}, ${safeGuideId})"
                style="background:none;border:1px dashed #94a3b8;color:#64748b;
                       border-radius:8px;padding:6px 14px;font-size:0.78rem;cursor:pointer;">
          🔍 عرض كل النتائج (${results.length})
        </button>
      </div>`;
    }

    html += `</div>`;
    return html;
  }
};

// =====================================================
// ⑤ دالة استرجاع النص الفعلي من FULL_GUIDES_DB
// =====================================================

function getChunkText(chunk) {
  // إذا كان النص مخزناً مباشرة (للتوافق مع النسخ القديمة)
  if (chunk.text) return chunk.text;

  // استرجاع النص بالإحداثيات من FULL_GUIDES_DB
  if (!window.FULL_GUIDES_DB) return '';

  const guide = window.FULL_GUIDES_DB.find(g => g.id === chunk.guide_id);
  if (!guide) return '';

  const page = (guide.pages || []).find(p => p.page_num === chunk.page_num);
  if (!page || !page.text) return '';

  // استخراج القطعة بالإحداثيات
  if (chunk.text_start !== undefined && chunk.text_end !== undefined) {
    return page.text.slice(chunk.text_start, chunk.text_end).trim();
  }

  // fallback: الصفحة كاملة
  return page.text;
}

// =====================================================
// ⑥ المحرك الرئيسي — handleGuideSearch
// =====================================================

window.handleGuideSearch = function(query, activeGuide) {
  console.log(`🔍 بحث في الدليل: "${activeGuide.name}" — السؤال: "${query}"`);

  const intent = GuideIntentDetector.analyze(query);
  console.log('🧠 Intent:', intent);

  const allResults = GuideScorer.search(intent, activeGuide.id);
  console.log(`📊 النتائج الكلية: ${allResults.length} — أعلى نقاط: ${allResults[0]?.score}`);

  // ① لا نتائج
  if (allResults.length === 0) {
    return `
    <div class="guide-no-result">
      <div class="guide-no-result-icon">🔍</div>
      <div class="guide-no-result-text">
        لم أجد معلومات عن <strong>"${query}"</strong> في هذا الدليل.<br>
        <small>جرب كلمات مختلفة أو رقم مادة محدد</small>
      </div>
    </div>`;
  }

  const topScore    = allResults[0].score;
  const secondScore = allResults[1]?.score || 0;

  // ② سؤال ناقص: كلمة "مادة" أو "بند" وحدها بدون رقم أو موضوع
  //    علامتها: rawWords قصيرة + النتائج كثيرة + النقاط متقاربة كلها
  const isVagueQuery = (
    intent.rawWords.length <= 1 &&
    intent.articleNum === null &&
    allResults.length >= 5 &&
    secondScore > topScore * 0.70
  );

  if (isVagueQuery) {
    console.log('💬 سؤال ناقص — اطلب توضيح');
    return `
    <div class="guide-clarification-card">
      <div class="guide-clarify-header">
        <div class="guide-clarify-icon">💬</div>
        <div>
          <div class="guide-clarify-title">السؤال غير محدد كفاية</div>
          <div class="guide-clarify-subtitle">وجدت <strong>${allResults.length}</strong> نتيجة لكلمة "<strong>${query}</strong>".<br>حدد أكثر — مثلاً: رقم المادة أو موضوعها</div>
        </div>
      </div>
      <div style="padding:10px 14px;background:#fef9c3;border-radius:8px;margin-top:8px;font-size:0.85rem;color:#713f12;direction:rtl;">
        💡 أمثلة: <strong>المادة 5</strong> &nbsp;|&nbsp; <strong>مادة الترخيص</strong> &nbsp;|&nbsp; <strong>المادة الثانية</strong>
      </div>
    </div>`;
  }

  // ③ التباس: نتيجتان متقاربتان — اعرض بطاقة الاختيار
  const isAmbiguous = (
    allResults.length >= 2 &&
    secondScore > topScore * 0.75
  );

  if (isAmbiguous) {
    console.log('🤔 السؤال ملتبس — طلب توضيح');
    return GuideFormatter.buildClarificationCard(allResults, query, activeGuide.id);
  }

  // ④ إجابة واضحة — أعطِ buildAnswerCard أفضل 8 فقط
  return GuideFormatter.buildAnswerCard(allResults.slice(0, 8), intent);
};

// =====================================================
// ⑥-ب عرض كل النتائج بدون حد أقصى
// =====================================================

window.showAllGuideResults = function(query, guideId) {
  const intent     = GuideIntentDetector.analyze(query);
  const allResults = GuideScorer.search(intent, guideId);

  if (!allResults.length) return;

  // نبني قائمة كاملة كبطاقات مضغوطة قابلة للنقر
  const topScore = allResults[0].score;
  let html = `
  <div class="guide-clarification-card">
    <div class="guide-clarify-header">
      <div class="guide-clarify-icon">📋</div>
      <div>
        <div class="guide-clarify-title">كل النتائج (${allResults.length})</div>
        <div class="guide-clarify-subtitle">للسؤال: <strong>${query}</strong></div>
      </div>
    </div>`;

  allResults.forEach((r, i) => {
    const matchPct = Math.min(Math.round((r.score / topScore) * 100), 100);
    const barColor = matchPct >= 70 ? '#0369a1' : (matchPct >= 50 ? '#0891b2' : '#94a3b8');
    const guideName = r.guide_name.replace(/\.pdf\.pdf$/i,'').replace(/\.pdf$/i,'');
    const shortName = guideName.length > 42 ? guideName.substring(0,42)+'…' : guideName;
    html += `
    <div class="choice-btn${i===0 ? ' choice-btn--top' : ''}"
         onclick="window.showGuideChunk('${r.guide_id}', '${r.chunk.id}')">
      <span class="choice-icon">${i===0 ? '🎯' : '📄'}</span>
      <div class="choice-content" style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
          <strong style="font-size:0.82rem;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${shortName}
          </strong>
          <span style="font-size:0.72rem;background:${barColor};color:white;
                       padding:1px 7px;border-radius:10px;white-space:nowrap;flex-shrink:0;">
            ${matchPct}% — ص ${r.chunk.page_num}
          </span>
        </div>
        ${r.chunk.title ? `<div style="font-size:0.75rem;color:#0369a1;margin-top:2px;">${r.chunk.title.substring(0,55)}</div>` : ''}
      </div>
    </div>`;
  });

  html += `</div>`;

  if (window.typeWriterResponse) window.typeWriterResponse(html, false);
};

/**
 * عرض قطعة محددة بعد اختيار المستخدم
 */
window.showGuideChunk = function(guideId, chunkId) {
  if (!window.PROCESSED_GUIDES) return;
  
  const guide = window.PROCESSED_GUIDES.find(g => g.id === guideId);
  if (!guide) return;

  const chunk = guide.chunks.find(c => c.id === chunkId);
  if (!chunk) return;

  const result = [{
    score: 999,
    chunk,
    guide_name: guide.guide_name,
    guide_id: guide.id
  }];

  const html = GuideFormatter.buildAnswerCard(result, {});
  if (html && window.typeWriterResponse) {
    window.typeWriterResponse(html);
  }
};

/**
 * تحديد نتيجة بعد توضيح المستخدم
 */
window.selectGuideResult = function(guideId, chunkId, encodedQuery) {
  const query = decodeURIComponent(encodedQuery);
  
  // تعيين الدليل المحدد في الذاكرة مؤقتاً
  if (window.AgentMemory?.activeGuide) {
    const originalId = window.AgentMemory.activeGuide.id;
    window.AgentMemory.activeGuide.id = guideId;
    
    // عرض الإجابة
    window.showGuideChunk(guideId, chunkId);
    
    // إعادة الدليل الأصلي
    window.AgentMemory.activeGuide.id = originalId;
  } else {
    window.showGuideChunk(guideId, chunkId);
  }
};

/**
 * فتــح الدليل على صفحة محددة
 */
window.openGuidePage = function(guideId, pageNum) {
  if (!window.FULL_GUIDES_DB) return;

  const originalGuide = window.FULL_GUIDES_DB.find(g => g.id === guideId);
  if (!originalGuide) return;

  let fileName = originalGuide.source_file || originalGuide.guide_name || '';
  fileName = fileName.replace(/\.pdf\.pdf$/i, '.pdf');

  const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
  const finalUrl = `${baseUrl}guides/${encodeURIComponent(fileName)}`;

  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent)
    || window.innerWidth <= 768
    || ('ontouchstart' in window);

  if (isMobile) {
    if (typeof window.openMobilePdfViewer === 'function') {
        window.openMobilePdfViewer(finalUrl, pageNum, fileName.replace('.pdf', ''));
    } else {
    }
} else {
    window.open(`${finalUrl}#page=${pageNum}`, '_blank');
}
};

// =====================================================
// ⑧ CSS المدمج للتنسيق الجميل
// =====================================================

(function injectGuideStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('guide-engine-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'guide-engine-styles';
  style.textContent = `
    /* ===== بطاقة الإجابة الرئيسية ===== */
    .guide-answer-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
      border: 1px solid #bae6fd;
      border-radius: 12px;
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
    }

    .guide-answer-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
      color: white;
    }

    .guide-answer-icon { font-size: 1.4rem; }

    .guide-answer-meta { flex: 1; }

    .guide-answer-source {
      font-weight: bold;
      font-size: 0.85rem;
      line-height: 1.3;
    }

    .guide-answer-page {
      font-size: 0.75rem;
      opacity: 0.85;
      margin-top: 2px;
    }

    .guide-open-btn {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.4);
      color: white;
      border-radius: 6px;
      padding: 5px 8px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: background 0.2s;
    }
    .guide-open-btn:hover { background: rgba(255,255,255,0.35); }

    /* ===== محتوى الإجابة ===== */
    .guide-answer-body {
      padding: 16px;
    }

    .guide-article-title {
      font-weight: bold;
      font-size: 1rem;
      color: #0369a1;
      padding: 8px 12px;
      background: #e0f2fe;
      border-radius: 8px;
      margin-bottom: 10px;
      border-right: 4px solid #0369a1;
    }

    .guide-section-title {
      font-weight: bold;
      color: #1e40af;
      padding: 6px 0;
      margin: 8px 0 4px;
      font-size: 0.95rem;
    }

    .guide-item {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 7px 10px;
      margin: 4px 0;
      background: #f8fafc;
      border-radius: 8px;
      border-right: 3px solid #e2e8f0;
      transition: border-color 0.2s;
    }
    .guide-item:hover { border-right-color: #0369a1; background: #f0f9ff; }

    .guide-item-alpha { border-right-color: #7c3aed; }
    .guide-item-alpha:hover { border-right-color: #6d28d9; background: #f5f3ff; }

    .guide-item-num {
      min-width: 24px;
      height: 24px;
      background: #0369a1;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: bold;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .guide-item-alpha .guide-item-num { background: #7c3aed; }

    .guide-item-text {
      font-size: 0.9rem;
      line-height: 1.6;
      color: #334155;
    }

    .guide-paragraph {
      font-size: 0.9rem;
      line-height: 1.7;
      color: #475569;
      padding: 4px 0;
    }

    .guide-divider {
      border: none;
      border-top: 1px dashed #cbd5e1;
      margin: 10px 0;
    }

    /* ===== النتائج البديلة ===== */
    .guide-alternatives {
      border-top: 1px solid #e2e8f0;
      padding: 12px 16px;
      background: #f8fafc;
    }

    .guide-alternatives-label {
      font-size: 0.8rem;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: bold;
    }

    .guide-alt-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 8px 10px;
      margin: 4px 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .guide-alt-item:hover {
      border-color: #0369a1;
      background: #f0f9ff;
      transform: translateX(-2px);
    }

    .guide-alt-icon { font-size: 1rem; flex-shrink: 0; }

    .guide-alt-content { flex: 1; min-width: 0; }

    .guide-alt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 3px;
    }

    .guide-alt-content strong {
      font-size: 0.82rem;
      color: #1e293b;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .guide-alt-page {
      font-size: 0.72rem;
      background: #0369a1;
      color: white;
      padding: 1px 7px;
      border-radius: 10px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .guide-alt-title {
      font-size: 0.78rem;
      color: #0369a1;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .guide-alt-snippet {
      font-size: 0.78rem;
      color: #64748b;
      line-height: 1.5;
      border-right: 2px solid #e2e8f0;
      padding-right: 8px;
      margin-top: 4px;
      /* اقتطاع بعد سطرين */
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ===== بطاقة التوضيح ===== */
    .guide-clarification-card {
      background: white;
      border: 2px solid #fbbf24;
      border-radius: 12px;
      padding: 16px;
      direction: rtl;
    }

    .guide-clarify-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .guide-clarify-icon { font-size: 1.5rem; }

    .guide-clarify-title {
      font-weight: bold;
      font-size: 1rem;
      color: #92400e;
    }

    .guide-clarify-subtitle {
      font-size: 0.85rem;
      color: #78716c;
      margin-bottom: 12px;
      padding-right: 4px;
    }

    /* choice-btn الأساسي والمميز */
    .choice-btn {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 10px 12px;
      margin: 5px 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      direction: rtl;
    }
    .choice-btn:hover {
      border-color: #0369a1;
      background: #f0f9ff;
      transform: translateX(-2px);
    }
    .choice-btn--top {
      border-color: #0369a1;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      box-shadow: 0 2px 8px rgba(3,105,161,0.12);
    }
    .choice-btn--top:hover {
      background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
    }
    .choice-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }

    /* ===== لا توجد نتيجة ===== */
    .guide-no-result {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 16px;
      background: #fef9c3;
      border: 1px solid #fde047;
      border-radius: 10px;
      direction: rtl;
    }

    .guide-no-result-icon { font-size: 1.5rem; }

    .guide-no-result-text {
      font-size: 0.9rem;
      color: #713f12;
      line-height: 1.6;
    }

    .guide-no-result-text small {
      display: block;
      margin-top: 4px;
      color: #92400e;
      font-size: 0.8rem;
    }

    /* ===== تلوين كلمات البحث ===== */
    mark.guide-highlight {
      background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%);
      color: #1c1917;
      padding: 2px 4px;
      border-radius: 4px;
      font-weight: bold;
      font-style: normal;
      box-shadow: 0 1px 4px rgba(245,158,11,0.4);
      border-bottom: 2px solid #d97706;
    }
  `;
  
  document.head.appendChild(style);
  console.log('✅ Guide Engine Styles injected');
})();

// =====================================================
// ⑨ تحقق من التهيئة
// =====================================================

(function checkInit() {
  if (typeof window === 'undefined') return;
  if (!window.PROCESSED_GUIDES) {
    console.warn('⚠️ neural_guide_engine: PROCESSED_GUIDES غير محملة!');
    console.warn('   تأكد من إضافة processed_guides.js قبل هذا الملف في HTML');
  } else {
    const totalChunks = window.PROCESSED_GUIDES.reduce((sum, g) => sum + (g.chunks?.length || 0), 0);
    console.log(`✅ Neural Guide Engine جاهز — ${window.PROCESSED_GUIDES.length} دليل، ${totalChunks} قطعة معرفية`);
  }
})();
