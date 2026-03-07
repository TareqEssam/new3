/**
 * 🧠 neural_guide_engine.js
 * محرك البحث في الأدلة الرسمية
 * 
 * يعمل مع: processed_guides.js + gpt_agent.js + neural_search_v6.js
 * بدون أي نموذج ذكاء اصطناعي خارجي — 100% Client-Side
 */

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
    const q = window.normalizeArabic ? window.normalizeArabic(query) : query;

    const toLatinNum = n => n ? n.toString().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)) : null;

    // ① البحث عن مادة/بند/فقرة + رقم (أرقام عربية أو لاتينية)
    //    مثال: "مادة 12"، "المادة ١٢"، "الماده12"
    const articleMatchNum = q.match(
      /(?:مادة|ماده|المادة|الماده|بند|الفقرة|الفقره|فقرة|فقره)\s*[\(\[]*\s*([٠-٩\d]+)\s*[\)\]]*/i
    );

    // ② البحث عن مادة/بند/فقرة + رقم مكتوب بالكلمات
    //    مثال: "المادة الثانية"، "مادة التانية"، "المادة الثاني عشر"
    const articlePrefixMatch = q.match(
      /(?:مادة|ماده|المادة|الماده|بند|الفقرة|الفقره|فقرة|فقره)\s+(.{2,25})/i
    );
    let wordNum = null;
    if (!articleMatchNum && articlePrefixMatch) {
      wordNum = this.wordToNumber(articlePrefixMatch[1].trim());
    }

    // ③ البحث عن رقم منفرد فقط (مثال: يكتب "12" فقط)
    const numOnlyMatch = !articleMatchNum && !wordNum && query.match(/^[\s]*([٠-٩\d]+)[\s]*$/) 
                       ? query.match(/([٠-٩\d]+)/) : null;

    const articleNum = articleMatchNum 
      ? toLatinNum(articleMatchNum[1])
      : wordNum 
        ? String(wordNum)
        : (numOnlyMatch ? toLatinNum(numOnlyMatch[1]) : null);

    // ③ استخراج الكلمات + تصحيح الأخطاء + التوسيع الدلالي
    const stopWords = new Set(['في','من','الى','على','عن','هل','ما','هو','هي',
      'ذلك','تلك','لي','لك','كيف','ماذا','متى','اين','لماذا','كم','وفي',
      'وعلى','ومن','وان','أن','إذا','حيث','التي','الذي','بعد','قبل']);

    const rawWords = q.split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .map(w => this.fixTypos(w)); // ← تصحيح الأخطاء

    // توليد جذور الكلمات (إزالة أل التعريف والسوابق الشائعة)
    const stemWord = w => w.replace(/^(ال|وال|بال|كال|فال|لل)/, '');
    const stems = rawWords.map(stemWord).filter(w => w.length > 2);

    // التوسيع الدلالي
    const expandedWords = new Set([...rawWords, ...stems]);
    rawWords.forEach(word => {
      const synonyms = GuideSemantic[word] || GuideSemantic[stemWord(word)] || [];
      synonyms.forEach(s => {
        const norm = window.normalizeArabic ? window.normalizeArabic(s) : s;
        expandedWords.add(norm);
        expandedWords.add(stemWord(norm));
      });
    });

    // ④ نوع الاستعلام
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
    let score = 0;
    const rawText = getChunkText(chunk);
    const text = window.normalizeArabic ? window.normalizeArabic(rawText) : rawText;
    const chunkKeywords = new Set(chunk.keywords || []);

    // ① تطابق رقم المادة (أعلى أولوية)
    if (intent.queryType === 'article' && intent.articleNum) {
      if (chunk.article_num == intent.articleNum) {
        score += 2000; // تطابق مباشر
      } else {
        // البحث عن الرقم في النص
        const numAr = intent.articleNum.toString().split('').map(d => '٠١٢٣٤٥٦٧٨٩'[d] ?? d).join('');
        const articleRegex = new RegExp(`مادة\\s*[\\(\\[]*\\s*(?:${intent.articleNum}|${numAr})\\s*[\\)\\]]*`, 'i');
        if (articleRegex.test(chunk.text)) score += 1500;
      }
    }

    // ② تطابق الكلمات الموسعة مع الجذور
    intent.expandedWords.forEach(word => {
      if (word.length < 3) return;
      if (chunkKeywords.has(word)) score += 30;
      const regex = new RegExp(word, 'g');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * 8;
        if (text.startsWith(word) || text.includes('\n' + word)) score += 15;
      }
    });

    // ③ الكلمات الأصلية — وزن أعلى
    intent.rawWords.forEach(word => {
      if (text.includes(word)) score += 25;
    });

    // ③-ب الجذور — تطابق جزئي
    (intent.stems || []).forEach(stem => {
      if (stem.length < 3) return;
      const stemRegex = new RegExp(stem, 'g');
      const stemMatches = text.match(stemRegex);
      if (stemMatches) score += stemMatches.length * 12;
    });

    // ③-ج بونص التجاور: كلمتان من السؤال بجانب بعض في النص
    if (intent.rawWords.length >= 2) {
      for (let i = 0; i < intent.rawWords.length - 1; i++) {
        const phrase = intent.rawWords[i] + '.{0,20}' + intent.rawWords[i+1];
        if (new RegExp(phrase).test(text)) score += 150;
      }
    }

    // ④ بونص نوع القطعة
    if (chunk.type === 'article') score += 100;
    if (chunk.type === 'list') score += 60;
    if (chunk.has_items) score += 40;

    // ⑤ بونص الكثافة (نص أقصر مع نقاط أعلى = أدق)
    if (score > 0 && chunk.char_count > 0) {
      const density = score / (chunk.char_count / 100);
      score += Math.min(density * 3, 200);
    }

    return Math.round(score);
  },

  /**
   * يبحث في قاعدة البيانات المُعالجة ويرجع أفضل النتائج
   */
  search(intent, guideId = null) {
    if (!window.PROCESSED_GUIDES) {
      console.warn('⚠️ PROCESSED_GUIDES غير محملة');
      return [];
    }

    // تحديد نطاق البحث
    const guidesToSearch = guideId
      ? window.PROCESSED_GUIDES.filter(g => g.id === guideId)
      : window.PROCESSED_GUIDES;

    const results = [];

    guidesToSearch.forEach(guide => {
      (guide.chunks || []).forEach(chunk => {
        const score = this.scoreChunk(chunk, intent);
        if (score > 50) { // عتبة دنيا للنتائج
          results.push({
            score,
            chunk,
            guide_name: guide.guide_name,
            guide_id: guide.id
          });
        }
      });
    });

    // ترتيب تنازلياً ثم أخذ أفضل 5
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
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

    // تقسيم إلى أسطر
    let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let html = '';

    lines.forEach((line, idx) => {
      // عنوان المادة
      if (/^مادة\s*[\(\[]*\s*[\d٠-٩]+/.test(line) || /^المادة\s+[\d٠-٩]+/.test(line)) {
        html += `<div class="guide-article-title">📋 ${line}</div>`;
      }
      // بنود أرقام عربية (١- ٢- ...)
      else if (/^[١٢٣٤٥٦٧٨٩٠]+\s*[-–.]/.test(line)) {
        const num = line.match(/^([١٢٣٤٥٦٧٨٩٠]+)/)[1];
        const content = line.replace(/^[١٢٣٤٥٦٧٨٩٠]+\s*[-–.]\s*/, '');
        html += `<div class="guide-item"><span class="guide-item-num">${num}</span><span class="guide-item-text">${content}</span></div>`;
      }
      // بنود أرقام لاتينية (1. 2. ...)
      else if (/^\d+\s*[-–.]/.test(line)) {
        const num = line.match(/^(\d+)/)[1];
        const content = line.replace(/^\d+\s*[-–.]\s*/, '');
        html += `<div class="guide-item"><span class="guide-item-num">${num}</span><span class="guide-item-text">${content}</span></div>`;
      }
      // بنود أبجدية (أ) (ب) ...
      else if (/^\([أ-ي]\)/.test(line)) {
        const letter = line.match(/^\(([أ-ي])\)/)[1];
        const content = line.replace(/^\([أ-ي]\)\s*/, '');
        html += `<div class="guide-item guide-item-alpha"><span class="guide-item-num">${letter}</span><span class="guide-item-text">${content}</span></div>`;
      }
      // عناوين (أولاً، ثانياً...)
      else if (/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً)/.test(line)) {
        html += `<div class="guide-section-title">◆ ${line}</div>`;
      }
      // خط فاصل
      else if (/^[-─━]{3,}$/.test(line)) {
        html += `<hr class="guide-divider">`;
      }
      // نص عادي
      else {
        html += `<div class="guide-paragraph">${line}</div>`;
      }
    });

    // تلوين كلمات البحث إذا وُجدت
    if (highlightWords && highlightWords.length > 0) {
      highlightWords.forEach(word => {
        if (!word || word.length < 3) return;
        // تلوين بدون كسر HTML tags
        const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${safeWord})`, 'gi');
        html = html.replace(regex, (match, p1) => {
          // تجنب التلوين داخل attributes
          return `<mark class="guide-highlight">${p1}</mark>`;
        });
      });
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
        <div class="guide-answer-icon">🔘</div>
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

    // ===== نتائج بديلة مع مقتطف =====
    if (hasAlternatives) {
      const altItems = results.slice(1, 4).map(r => {
        // استخراج أول جملة مفيدة من النص (تتجاوز العنوان)
        const fullText = getChunkText(r.chunk) || '';
        const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 15);
        // تخطي العنوان (أول سطر) وأخذ أول جملة حقيقية
        const snippetLine = lines.length > 1 ? lines[1] : lines[0] || '';
        // اقتطاع بذكاء عند نهاية جملة
        let snippet = snippetLine.substring(0, 110);
        if (snippetLine.length > 110) {
          const lastStop = Math.max(snippet.lastIndexOf('،'), snippet.lastIndexOf('.'));
          if (lastStop > 60) snippet = snippet.substring(0, lastStop + 1);
          else snippet += '...';
        }
        // تلوين كلمات البحث في المقتطف
        let coloredSnippet = snippet;
        (intent.rawWords || []).forEach(word => {
          if (!word || word.length < 3) return;
          const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          coloredSnippet = coloredSnippet.replace(
            new RegExp(`(${safe})`, 'gi'),
            '<mark class="guide-highlight">$1</mark>'
          );
        });
        const guideName = r.guide_name.replace(/\.pdf\.pdf$/i,'.pdf').replace(/\.pdf$/i,'');
        const shortName = guideName.length > 38 ? guideName.substring(0,38)+'...' : guideName;
        return `
          <div class="guide-alt-item" onclick="window.showGuideChunk('${r.guide_id}', '${r.chunk.id}')">
            <span class="guide-alt-icon">📋</span>
            <div class="guide-alt-content">
              <div class="guide-alt-header">
                <strong>${shortName}</strong>
                <span class="guide-alt-page">ص ${r.chunk.page_num}</span>
              </div>
              <div class="guide-alt-title">${r.chunk.title.substring(0,60)}</div>
              ${coloredSnippet ? `<div class="guide-alt-snippet">${coloredSnippet}</div>` : ''}
            </div>
          </div>`;
      }).join('');

      html += `
      <div class="guide-alternatives">
        <div class="guide-alternatives-label">🔍 وجدت أيضاً في:</div>
        ${altItems}
      </div>`;
    }

    html += `</div>`;
    return html;
  },

  /**
   * يبني سؤال التوضيح عند التساوي
   */
  buildClarificationCard(results, query) {
    let html = `
    <div class="guide-clarification-card">
      <div class="guide-clarify-header">
        <div class="guide-clarify-icon">🤔</div>
        <div class="guide-clarify-title">وجدت هذا الموضوع في أكثر من دليل</div>
      </div>
      <div class="guide-clarify-subtitle">أي الأدلة تقصد؟</div>`;

    results.slice(0, 4).forEach((r, i) => {
      html += `
      <div class="choice-btn" onclick="window.selectGuideResult('${r.guide_id}', '${r.chunk.id}', '${encodeURIComponent(query)}')">
        <span class="choice-icon">${i === 0 ? '🎯' : '📋'}</span>
        <div class="choice-content">
          <strong>${r.guide_name.replace('.pdf', '').replace('.pdf.pdf', '').substring(0, 45)}</strong>
          <small>صفحة ${r.chunk.page_num} — ${r.chunk.title.substring(0, 50)}</small>
        </div>
      </div>`;
    });

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

  // تحليل النية
  const intent = GuideIntentDetector.analyze(query);
  console.log('🧠 Intent:', intent);

  // البحث في الدليل المحدد
  const results = GuideScorer.search(intent, activeGuide.id);
  console.log(`📊 النتائج: ${results.length} — أعلى نقاط: ${results[0]?.score}`);

  // لا نتائج
  if (results.length === 0) {
    return `
    <div class="guide-no-result">
      <div class="guide-no-result-icon">🔍</div>
      <div class="guide-no-result-text">
        لم أجد معلومات عن <strong>"${query}"</strong> في هذا الدليل.<br>
        <small>جرب كلمات مختلفة أو رقم مادة محدد</small>
      </div>
    </div>`;
  }

  // تحقق من الالتباس: نتيجتان متقاربتان جداً من أدلة مختلفة
  const topScore = results[0].score;
  const secondScore = results[1]?.score || 0;
  const isAmbiguous = (
    results.length >= 2 &&
    results[0].guide_id !== results[1].guide_id &&
    secondScore > topScore * 0.85 &&
    topScore < 500
  );

  if (isAmbiguous) {
    console.log('🤔 السؤال ملتبس — طلب توضيح');
    return GuideFormatter.buildClarificationCard(results, query);
  }

  // إجابة واضحة
  return GuideFormatter.buildAnswerCard(results, intent);
};

// =====================================================
// ⑦ دوال مساعدة
// =====================================================

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
      background: linear-gradient(120deg, #fef08a 0%, #fde047 100%);
      color: #713f12;
      padding: 1px 3px;
      border-radius: 3px;
      font-weight: bold;
      font-style: normal;
      box-shadow: 0 1px 3px rgba(234,179,8,0.3);
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
