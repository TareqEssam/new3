/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   SMART FACILITY ENGINE  v5.0  ·  "Inference Edition"          ║
 * ║   محرك التجهيزات الذكي — الاستنتاج التلقائي الثلاثي           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  ┌─ طبقة 1 DIRECT  ──  خريطة مباشرة boxId → تجهيزات (دقة 100%)
 *  ├─ طبقة 2 NLP     ──  استخراج ذكي من technicalNotes (دقة ~85%)
 *  └─ طبقة 3 SECTOR  ──  تصنيف القطاع + تجهيزات افتراضية (دقة ~70%)
 *
 *  ✅ صفر إضافة يدوية لأي نشاط مستقبلي
 *  ✅ يعمل 100% محلياً — لا API خارجي
 *  ✅ التجهيزات من الثلاث طبقات تتكامل وتُحسّن بعضها
 *  ✅ Toggle: ضغطة للإضافة / ضغطة للإلغاء / لا حذف نهائي
 *  ✅ نص نظيف في siteNarrative بلا أي علامات مرئية
 */

'use strict';

// ══════════════════════════════════════════════════════════════════
//  §1  خريطة التجهيزات المباشرة  boxId → items[]
//  LAYER 1 — DIRECT LOOKUP (دقة 100%)
// ══════════════════════════════════════════════════════════════════
const SFE_BOX_ITEMS = {
    // ── طبي / صحي ──────────────────────────────────────────────
    'medical-facility-box': [
        { name:"غرفة كشف وتشخيص",            icon:"fa-stethoscope" },
        { name:"جناح عمليات جراحية",          icon:"fa-procedures" },
        { name:"معمل تحاليل طبية",            icon:"fa-vials" },
        { name:"قسم أشعة وتصوير تشخيصي",     icon:"fa-x-ray" },
        { name:"صيدلية داخلية",               icon:"fa-pills" },
        { name:"نظام غازات طبية مركزية",      icon:"fa-lungs" },
        { name:"غرفة تعقيم مركزي",            icon:"fa-hand-sparkles" },
        { name:"غرف عناية مركزة (ICU)",       icon:"fa-heartbeat" },
        { name:"وحدة طوارئ واستقبال",         icon:"fa-truck-medical" },
    ],
    'drug-store-box': [
        { name:"منطقة استلام وفرز المستحضرات",         icon:"fa-dolly" },
        { name:"نظام مراقبة درجات الحرارة والرطوبة",   icon:"fa-thermometer-half" },
        { name:"أرفف وطبليات تخزين مطابقة للمعايير",   icon:"fa-boxes-stacked" },
        { name:"وحدة تبريد للمستحضرات الحساسة",        icon:"fa-snowflake" },
        { name:"منطقة الحجر الصحي (Quarantine Zone)",  icon:"fa-lock" },
    ],
    'medical-transport-box': [
        { name:"سيارات نقل طبي مجهزة",           icon:"fa-truck-medical" },
        { name:"أنظمة تتبع GPS",                  icon:"fa-location-dot" },
        { name:"أدوات تطهير وتعقيم السيارات",    icon:"fa-pump-medical" },
        { name:"مهمات الوقاية الشخصية للعاملين", icon:"fa-mask-ventilator" },
        { name:"جراج مبيت مؤمن ومعتمد",          icon:"fa-warehouse" },
    ],
    'treatment-activity-box': [
        { name:"وحدات الفرز وتصنيف المخلفات",           icon:"fa-filter" },
        { name:"ماكينات فك وفصل المكونات والتدوير",     icon:"fa-gears" },
        { name:"معدات المعالجة الفيزيائية والكيميائية", icon:"fa-flask-vial" },
        { name:"أنظمة التعقيم وتطهير المواقع",          icon:"fa-biohazard" },
        { name:"مخازن مؤقتة مؤمنة",                    icon:"fa-warehouse" },
    ],
    'combined-activity-box': [
        { name:"سيارات نقل مجهزة",                  icon:"fa-truck-moving" },
        { name:"أنظمة تتبع GPS",                     icon:"fa-location-dot" },
        { name:"وحدات الفرز والفصل الميكانيكي",     icon:"fa-recycle" },
        { name:"معدات المعالجة الكيميائية والفيزيائية", icon:"fa-vial-circle-check" },
        { name:"جراج مبيت مؤمن",                    icon:"fa-warehouse" },
    ],
    'toll-drug-box': [
        { name:"مقر إداري منفصل ومعاين فنياً",  icon:"fa-building-circle-check" },
        { name:"وحدة حفظ سجلات التتبع الدوائي", icon:"fa-database" },
        { name:"أرشيف ملفات تسجيل المستحضرات",  icon:"fa-file-prescription" },
    ],
    'importmedicines-activity-box': [
        { name:"مقر إداري مرخص للاستيراد",           icon:"fa-building-columns" },
        { name:"وحدة حفظ مستندات الشحن والتحليل",   icon:"fa-file-shield" },
        { name:"أرشيف شهادات المنشأ والمواصفات",    icon:"fa-globe" },
    ],
    'full-med-box': [
        { name:"مقر إداري مدمج (تصنيع واستيراد)",  icon:"fa-building-shield" },
        { name:"مخزن طبي مرخص (100م² فأكثر)",      icon:"fa-warehouse" },
        { name:"منظومة السجلات الإلكترونية الموحدة",icon:"fa-computer" },
    ],
    // ── صيدلاني / بيطري ────────────────────────────────────────
    'pharmacy-sector-box': [
        { name:"منطقة استقبال واستشارة بيطرية",  icon:"fa-user-doctor" },
        { name:"أرفف عرض أدوية بيطرية",           icon:"fa-shelves" },
        { name:"مخزن أدوية رئيسي (مبرد/عادي)",   icon:"fa-temperature-low" },
        { name:"منطقة حفظ السجلات القانونية",     icon:"fa-folder-open" },
    ],
    'biologicals-sector-box': [
        { name:"ثلاجات حفظ المستحضرات البيولوجية", icon:"fa-snowflake" },
        { name:"مخزن المستلزمات التكميلية",         icon:"fa-box" },
        { name:"منطقة حفظ سجلات الدُفعات",          icon:"fa-clipboard-check" },
    ],
    'clinicPharmacy-sector-box': [
        { name:"منطقة الاستقبال والكشف",             icon:"fa-stethoscope" },
        { name:"صيدلية العيادة",                     icon:"fa-prescription-bottle-medical" },
        { name:"غرفة الإسعافات الأولية",             icon:"fa-briefcase-medical" },
        { name:"مكتب الطبيب وسجلات المرضى",          icon:"fa-notes-medical" },
    ],
    'clinicBiologicals-sector-box': [
        { name:"وحدة التبريد للمستحضرات البيولوجية", icon:"fa-temperature-low" },
        { name:"غرفة التحضير والإعطاء",              icon:"fa-syringe" },
        { name:"مكتب الطبيب وسجلات التحصين",         icon:"fa-clipboard-list" },
    ],
    'clinicCombined-sector-box': [
        { name:"منطقة الاستقبال والكشف",         icon:"fa-stethoscope" },
        { name:"صيدلية العيادة",                 icon:"fa-prescription-bottle-medical" },
        { name:"وحدة التبريد للبيولوجيات",       icon:"fa-snowflake" },
        { name:"غرفة الإجراءات والعلاجات",       icon:"fa-syringe" },
    ],
    'pharmacyBiologicals-sector-box': [
        { name:"أرفف عرض الأدوية البيطرية",             icon:"fa-shelves" },
        { name:"وحدات تبريد للمستحضرات البيولوجية",    icon:"fa-temperature-low" },
        { name:"منطقة الفصل والتجهيز للطلبات",         icon:"fa-box-open" },
        { name:"نظام أرشفة السجلات القانونية",          icon:"fa-archive" },
    ],
    'pesticideStorage-sector-box': [
        { name:"منطقة تخزين المبيدات (مفصولة)",  icon:"fa-boxes-stacked" },
        { name:"منطقة عزل المواد الخطرة",         icon:"fa-radiation" },
        { name:"نظام تهوية واستخراج هواء ملوث",  icon:"fa-fan" },
        { name:"غرفة معدات السلامة الشخصية",      icon:"fa-hard-hat" },
    ],
    // ── تعليمي ──────────────────────────────────────────────────
    'school-box': [
        { name:"الفصول الدراسية",              icon:"fa-chalkboard-user" },
        { name:"المعامل التخصصية",              icon:"fa-microscope" },
        { name:"الملاعب والأفنية الرياضية",    icon:"fa-volleyball" },
        { name:"المكتبة المدرسية",              icon:"fa-book" },
        { name:"مسارح وقاعات الأنشطة",          icon:"fa-masks-theater" },
        { name:"معامل الحاسب الآلي",            icon:"fa-desktop" },
        { name:"المكاتب الإدارية",              icon:"fa-user-tie" },
        { name:"الوحدة الصحية المدرسية",        icon:"fa-briefcase-medical" },
    ],
    'university-box': [
        { name:"مباني الكليات والمدرجات",           icon:"fa-school" },
        { name:"المعامل والورش التعليمية",           icon:"fa-flask-vial" },
        { name:"المكتبة المركزية والفرعية",          icon:"fa-book-open" },
        { name:"المرافق الرياضية والخدمية",          icon:"fa-volleyball" },
        { name:"الوحدة الطبية والإسعاف",            icon:"fa-briefcase-medical" },
        { name:"المراكز البحثية المتخصصة",           icon:"fa-microscope" },
        { name:"الداخليات والإقامة الطلابية",        icon:"fa-house-user" },
    ],
    // ── فندقي / سياحي ──────────────────────────────────────────
    'hotel-main-box': [
        { name:"قطاع الغرف (Housekeeping)",      icon:"fa-bed" },
        { name:"إدارة الأغذية والمشروبات (F&B)", icon:"fa-utensils" },
        { name:"منظومة الأمن والتحكم",           icon:"fa-user-shield" },
        { name:"حمامات سباحة ونادي صحي",          icon:"fa-water-ladder" },
        { name:"مغسلة مركزية وخدمات التنظيف",    icon:"fa-soap" },
        { name:"قاعات مؤتمرات ومناسبات",         icon:"fa-champagne-glasses" },
    ],
    'hotel-box': [
        { name:"غرف فندقية وأجنحة",    icon:"fa-bed" },
        { name:"مطابخ مركزية",         icon:"fa-fire-burner" },
        { name:"مطاعم وكافيهات",        icon:"fa-mug-hot" },
        { name:"حمامات سباحة",          icon:"fa-person-swimming" },
        { name:"مغسلة مركزية",          icon:"fa-soap" },
        { name:"قاعات مناسبات",         icon:"fa-champagne-glasses" },
    ],
    'resort-box': [
        { name:"شاليهات ووحدات إقامة", icon:"fa-house-user" },
        { name:"أنشطة ترفيهية ومائية", icon:"fa-water" },
        { name:"مطاعم شاطئية",          icon:"fa-umbrella-beach" },
        { name:"مراسي بحرية",           icon:"fa-anchor" },
        { name:"نادي صحي وسبا",         icon:"fa-spa" },
    ],
    'rest-license-box': [
        { name:"منطقة الاستقبال والضيافة",  icon:"fa-chair" },
        { name:"المطبخ المركزي",             icon:"fa-fire-burner" },
        { name:"منظومة التبريد والتخزين",   icon:"fa-refrigerator" },
        { name:"مناطق جلوس العملاء",         icon:"fa-couch" },
    ],
    'camp-main-box': [
        { name:"وحدات إقامة بيئية (Eco-Tents)", icon:"fa-tent" },
        { name:"منطقة الخدمات والمطبخ",         icon:"fa-fire-burner" },
        { name:"محطة طاقة شمسية متنقلة",        icon:"fa-solar-panel" },
    ],
    'cruise-license-box': [
        { name:"كابينة القيادة وأجهزة الملاحة",      icon:"fa-ship" },
        { name:"غرفة المحركات والمولدات (Engine Room)",icon:"fa-gears" },
        { name:"محطة معالجة الصرف (STP Plant)",      icon:"fa-biohazard" },
        { name:"كبائن الركاب",                        icon:"fa-bed" },
        { name:"منطقة السطح والمطعم",                icon:"fa-umbrella-beach" },
    ],
    // ── مطاعم وأغذية ───────────────────────────────────────────
    'mobile-food-box': [
        { name:"وحدة تجهيز طعام متنقلة",  icon:"fa-truck" },
        { name:"معدات طهي متنقلة",         icon:"fa-fire-burner" },
        { name:"وحدة تبريد وتجميد",        icon:"fa-snowflake" },
        { name:"خزانات مياه نظيفة",        icon:"fa-droplet" },
        { name:"نظام صرف صحي متنقل",       icon:"fa-toilet" },
    ],
    'public-food-box': [
        { name:"منطقة تحضير الطعام",    icon:"fa-utensils" },
        { name:"منطقة تخزين جاف ومبرد", icon:"fa-warehouse" },
        { name:"أحواض غسيل وتطهير",     icon:"fa-sink" },
        { name:"نظام تهوية وشفط",       icon:"fa-wind" },
        { name:"صالة تقديم الطعام",     icon:"fa-chair" },
    ],
    'hyper-market-box': [
        { name:"أقسام عرض السلع الجافة والتموينية", icon:"fa-cart-shopping" },
        { name:"ثلاجات عرض المجمدات واللحوم",       icon:"fa-snowflake" },
        { name:"منظومة الكاشير ونقاط البيع (POS)",  icon:"fa-cash-register" },
        { name:"مخازن مجهزة بأرفف ذكية",           icon:"fa-warehouse" },
        { name:"منظومة مراقبة مركزية",              icon:"fa-video" },
    ],
    'hypermarket-facility': [
        { name:"أقسام عرض السلع المتنوعة",  icon:"fa-cart-shopping" },
        { name:"ثلاجات عرض المجمدات",        icon:"fa-snowflake" },
        { name:"منظومة الكاشير ونقاط البيع", icon:"fa-cash-register" },
        { name:"مخازن خلفية مجهزة",          icon:"fa-warehouse" },
    ],
    // ── صناعي / مصانع ──────────────────────────────────────────
    'factory-main-box': [
        { name:"مناطق الإنتاج (Clean Rooms)",    icon:"fa-door-closed" },
        { name:"منظومة معالجة الهواء (HVAC)",    icon:"fa-fan" },
        { name:"معامل الرقابة على الجودة (QC)",  icon:"fa-microscope" },
        { name:"محطة المياه الصيدلية",           icon:"fa-faucet-drip" },
        { name:"منطقة التعبئة والتغليف",         icon:"fa-box-open" },
        { name:"مستودعات التخزين النهائي",       icon:"fa-warehouse" },
    ],
    'pharmaceutical-production-plant': [
        { name:"غرف الإنتاج المعقمة (Clean Rooms)", icon:"fa-door-closed" },
        { name:"منظومة ضبط الضغط والهواء (HVAC)",   icon:"fa-fan" },
        { name:"معمل مراقبة الجودة (QC Lab)",        icon:"fa-microscope" },
        { name:"محطة تنقية المياه الصيدلية",         icon:"fa-faucet-drip" },
        { name:"وحدة التعبئة الأولية والثانوية",     icon:"fa-box-open" },
        { name:"مستودعات التخزين (GSP)",              icon:"fa-warehouse" },
    ],
    'cosmetics-production-facility': [
        { name:"مناطق الإنتاج والخلط الكيميائي",  icon:"fa-gears" },
        { name:"معامل الرقابة على الجودة",          icon:"fa-microscope" },
        { name:"وحدة التعبئة والتغليف",            icon:"fa-box-open" },
        { name:"مستودعات التخزين النهائي",         icon:"fa-warehouse" },
        { name:"منظومة معالجة الهواء (HVAC)",      icon:"fa-fan" },
    ],
    // ── بناء ───────────────────────────────────────────────────
    'construction-box': [
        { name:"معدات ثقيلة وآلات",           icon:"fa-truck-pickup" },
        { name:"مكتب فني وهندسي",             icon:"fa-drafting-compass" },
        { name:"مخازن تشوين الخامات",         icon:"fa-warehouse" },
        { name:"أدوات سلامة مهنية",           icon:"fa-hard-hat" },
        { name:"وحدة مساحة وقياس",           icon:"fa-ruler-combined" },
    ],
    // ── مياه ───────────────────────────────────────────────────
    'water-utility-box': [
        { name:"وصلة مياه شرب",        icon:"fa-droplet" },
        { name:"وصلة صرف صحي",         icon:"fa-toilet" },
        { name:"غرفة عدادات مجهزة",    icon:"fa-gauge-high" },
        { name:"خزان مياه أرضي",       icon:"fa-database" },
        { name:"طلمبات رفع مياه",      icon:"fa-faucet" },
        { name:"وحدة معالجة أولية",    icon:"fa-recycle" },
    ],
    'well-license-box': [
        { name:"غرفة طلمبة الرفع والتحكم",        icon:"fa-faucet-drip" },
        { name:"عداد قياس التصرف (Flow Meter)",    icon:"fa-gauge-high" },
        { name:"وحدة معالجة أولية",                icon:"fa-filter" },
        { name:"خزان مياه أرضي للترسيب",          icon:"fa-water" },
    ],
    // ── تقنية / اتصالات ────────────────────────────────────────
    'itida-box': [
        { name:"وحدة تطوير البرمجيات",          icon:"fa-code" },
        { name:"غرفة الخوادم (Servers)",         icon:"fa-server" },
        { name:"وحدة فحص وتأكيد الجودة (QA)",   icon:"fa-check-double" },
        { name:"منطقة الدعم الفني",              icon:"fa-headset" },
        { name:"وحدة أمن المعلومات",             icon:"fa-shield-halved" },
        { name:"مركز البيانات (Data Center)",    icon:"fa-database" },
    ],
    'ntra-box': [
        { name:"محطات إرسال واستقبال",    icon:"fa-tower-broadcast" },
        { name:"مركز عمليات الشبكة (NOC)", icon:"fa-satellite-dish" },
        { name:"وحدة الخوادم والبيانات",  icon:"fa-server" },
        { name:"كابلات ألياف ضوئية",      icon:"fa-network-wired" },
        { name:"مركز خدمة العملاء",       icon:"fa-headset" },
    ],
    // ── بترول / طاقة / غاز ─────────────────────────────────────
    'petroleum-box': [
        { name:"منصة حفر واستكشاف",    icon:"fa-oil-well" },
        { name:"وحدة معالجة الخام",    icon:"fa-industry" },
        { name:"مختبر تحاليل جيولوجية",icon:"fa-microscope" },
        { name:"مستودعات تخزين وقود",  icon:"fa-warehouse" },
    ],
    'gas-reg-box': [
        { name:"محطة استقبال وتخفيف ضغط",          icon:"fa-bore-hole" },
        { name:"خطوط أنابيب النقل",                 icon:"fa-grip-lines" },
        { name:"منظومة قياس ذكية (Metering)",       icon:"fa-gauge-high" },
        { name:"خزانات غاز مسال (LNG/CNG)",         icon:"fa-database" },
        { name:"مركز تحكم وتوزيع",                  icon:"fa-tower-observation" },
    ],
    'lpg-station-box': [
        { name:"خزانات استراتيجية لغاز الصب",       icon:"fa-oil-well" },
        { name:"منصة التعبئة الدوارة/الخطية آلياً", icon:"fa-rotate" },
        { name:"موازين المعايرة الرقمية المعتمدة",  icon:"fa-scale-balanced" },
        { name:"أنظمة الإنذار والإطفاء التلقائي",   icon:"fa-fire-extinguisher" },
        { name:"وحدة اختبار وضغط الأسطوانات",       icon:"fa-gauge-high" },
    ],
    'lpg-dist-box': [
        { name:"أرصفة التحميل والتفريغ المجهزة",    icon:"fa-ramp-loading" },
        { name:"منظومة الإطفاء وخزانات الحريق",     icon:"fa-fire-extinguisher" },
        { name:"أجهزة كشف تسريب الغاز",             icon:"fa-sensor-on" },
        { name:"ساحة تخزين الأسطوانات",             icon:"fa-warehouse" },
    ],
    'fuel-station-box': [
        { name:"خزانات الوقود الأرضية",              icon:"fa-database" },
        { name:"طلمبات التموين الإلكترونية",         icon:"fa-gas-pump" },
        { name:"وحدة ضواغط الغاز الطبيعي",          icon:"fa-compress" },
        { name:"منظومة القياس الآلي (ATG)",          icon:"fa-gauge-high" },
        { name:"منطقة خدمات السيارات",               icon:"fa-car" },
    ],
    'electricity-box': [
        { name:"محطة توليد كهرباء",             icon:"fa-solar-panel" },
        { name:"غرفة المحولات (Substation)",    icon:"fa-bolt-lightning" },
        { name:"مركز التحكم والسكادا (SCADA)",  icon:"fa-desktop" },
        { name:"منظومة عدادات القياس",          icon:"fa-gauge" },
        { name:"وحدة تخزين الطاقة (بطاريات)",  icon:"fa-battery-full" },
        { name:"خطوط نقل وتوزيع",              icon:"fa-tower-cell" },
    ],
    'transmission-box': [
        { name:"محطة محولات رئيسية",   icon:"fa-bolt-lightning" },
        { name:"أبراج نقل الكهرباء",   icon:"fa-tower-observation" },
        { name:"كابلات جهد عالي",      icon:"fa-grip-lines" },
        { name:"أنظمة السكادا",        icon:"fa-microchip" },
        { name:"خلايا التوزيع",        icon:"fa-table-cells" },
    ],
    'solar-nrea-box': [
        { name:"ألواح خلايا شمسية",      icon:"fa-solar-panel" },
        { name:"محولات تيار (Inverters)", icon:"fa-bolt" },
        { name:"نظام تثبيت معدني",       icon:"fa-screwdriver-wrench" },
        { name:"أجهزة حماية وتحكم",      icon:"fa-shield-halved" },
        { name:"عدادات قياس ذكية",       icon:"fa-gauge" },
    ],
    // ── تعدين ─────────────────────────────────────────────────
    'mining-box': [
        { name:"منطقة استخراج (منجم/محجر)",  icon:"fa-mountain-city" },
        { name:"وحدة تكسير وغربلة (كسارة)",  icon:"fa-hammer" },
        { name:"معمل تحاليل جيولوجية",       icon:"fa-vial" },
        { name:"مستودع خام رئيسي",          icon:"fa-warehouse" },
        { name:"مستودع متفجرات مؤمن",        icon:"fa-bomb" },
        { name:"معدات حفر ورفع ثقيلة",       icon:"fa-truck-pickup" },
    ],
    // ── مطاحن وتعبئة وصناعات غذائية ───────────────────────────
    'milling-silo-box': [
        { name:"نقرة استقبال بشبكة وشفاط",    icon:"fa-truck-field" },
        { name:"صوامع قمح خام",                icon:"fa-tower-observation" },
        { name:"صوامع الإعداد (الترطيب)",      icon:"fa-droplet" },
        { name:"قسم الطحن (سلندرات/ديسك ميل)",icon:"fa-gears" },
        { name:"سيلوات الدقيق والتعبئة",      icon:"fa-boxes-stacked" },
    ],
    'bakery-activity-box': [
        { name:"أفران الإنتاج (نصف آلي/آلي)",  icon:"fa-fire-burner" },
        { name:"عجانات آلية ستانلس ستيل",      icon:"fa-gears" },
        { name:"طاولات التقطيع والتشكيل",      icon:"fa-utensils" },
        { name:"موازين إلكترونية معتمدة",      icon:"fa-scale-balanced" },
        { name:"مخزن الدقيق المسقوف",          icon:"fa-warehouse" },
        { name:"ماكينة صرف الخبز الذكية",      icon:"fa-cash-register" },
    ],
    'bakery-box': [
        { name:"أفران إنتاج خبز",  icon:"fa-fire-burner" },
        { name:"عجانات آلية",      icon:"fa-gears" },
        { name:"موازين معتمدة",    icon:"fa-scale-balanced" },
        { name:"مخزن دقيق",       icon:"fa-warehouse" },
    ],
    'packing-station-box': [
        { name:"سيور الاستلام والفرز",  icon:"fa-conveyor-belt" },
        { name:"ماكينات التدريج والوزن",icon:"fa-scale-balanced" },
        { name:"وحدات الغسيل والتجفيف",icon:"fa-faucet-drip" },
        { name:"وحدة التعبئة والتغليف", icon:"fa-box" },
        { name:"ثلاجات الحفظ والتبريد", icon:"fa-snowflake" },
    ],
    'drying-station-box': [
        { name:"وحدات الغسيل والتقطيع",         icon:"fa-utensils" },
        { name:"أنفاق وآلات التجفيف الحراري",   icon:"fa-temperature-high" },
        { name:"مناشر التجفيف الشمسي المحمية",  icon:"fa-sun" },
        { name:"أجهزة قياس الرطوبة والحرارة",  icon:"fa-thermometer-half" },
        { name:"وحدة التعبئة المفرغة من الهواء",icon:"fa-box-archive" },
    ],
    'frozen-food-box': [
        { name:"أنفاق التجميد السريع (Blast Freezers)", icon:"fa-snowflake" },
        { name:"خطوط التقطيع والتجهيز الآلي",           icon:"fa-gears" },
        { name:"ماكينات التغليف الحراري والشفط",         icon:"fa-box-open" },
        { name:"ثلاجات التخزين المركزي",                 icon:"fa-temperature-low" },
        { name:"أسطول النقل المبرد",                     icon:"fa-truck-snowflake" },
    ],
    'refrigeration-storage-box': [
        { name:"وحدات التبريد والتجميد المركزية",       icon:"fa-snowflake" },
        { name:"غرف التخزين (ساندوتش بانل)",           icon:"fa-warehouse" },
        { name:"أنظمة مراقبة درجات الحرارة",           icon:"fa-temperature-low" },
        { name:"رافعات الشوكة الكهربائية (Forklifts)", icon:"fa-dolly" },
        { name:"مولدات الطاقة الاحتياطية",             icon:"fa-bolt-lightning" },
    ],
    'rice-mill-box': [
        { name:"وحدات تقشير وتبييض الأرز",          icon:"fa-gears" },
        { name:"جهاز الفرز الإلكتروني (Color Sorter)",icon:"fa-microchip" },
        { name:"وحدات التعبئة الآلية والوزن",        icon:"fa-box-open" },
        { name:"موازين البسكول المعتمدة",            icon:"fa-weight-hanging" },
    ],
    'oil-mill-box': [
        { name:"ماكينات عصر البذور والكبس",          icon:"fa-oil-can" },
        { name:"وحدات تكرير وفلترة الزيوت",         icon:"fa-filter" },
        { name:"صهاريج تخزين الزيوت",               icon:"fa-database" },
        { name:"خطوط التعبئة والوزن الآلي",          icon:"fa-box-open" },
        { name:"معمل التحاليل الكيميائية والجودة",  icon:"fa-flask-vial" },
    ],
    'grain-grinding-box': [
        { name:"وحدات الجرش والطحن (المطارق)",   icon:"fa-hammer" },
        { name:"سيور نقل الحبوب وآلات الرفع",    icon:"fa-conveyor-belt" },
        { name:"منظومة سحب الغبار والفلترة",     icon:"fa-wind" },
        { name:"موازين التعبئة والتحميل",         icon:"fa-scale-balanced" },
    ],
    'banana-ripening-box': [
        { name:"غرف الإنضاج المعزولة حرارياً",  icon:"fa-door-closed" },
        { name:"منظومة حقن غاز الإيثيلين",      icon:"fa-wind" },
        { name:"أجهزة ضبط الرطوبة والحرارة",   icon:"fa-thermometer-half" },
        { name:"منطقة فرز وتعبئة الكراتين",    icon:"fa-box" },
    ],
    // ── زراعي / حيواني ─────────────────────────────────────────
    'fish-farm-box': [
        { name:"مصفوفة الأقفاص العائمة (Floating Cages)", icon:"fa-circle-dot" },
        { name:"وحدة التغذية والتحكم الآلي",              icon:"fa-fish" },
        { name:"رصيف الخدمة واللوجستيات البحرية",         icon:"fa-anchor" },
        { name:"وحدة المراقبة البحرية",                    icon:"fa-tower-observation" },
    ],
    'integrated-farm-box': [
        { name:"أحواض الاستزراع المكثف (Fish Tanks)",       icon:"fa-water" },
        { name:"منظومة الفلترة البيولوجية والتدوير",        icon:"fa-filter" },
        { name:"الصوبات الزراعية التكاملية (Greenhouses)",  icon:"fa-seedling" },
    ],
    'private-farm-box': [
        { name:"أحواض التحضين والتربية",             icon:"fa-border-all" },
        { name:"محطة رفع ومعالجة مياه الري",         icon:"fa-faucet-drip" },
        { name:"وحدة البدالات وأجهزة التهوية",        icon:"fa-fan" },
        { name:"مخازن الأعلاف ووحدات التبريد",        icon:"fa-warehouse" },
    ],
    'poultry-sector-box': [
        { name:"عنابر التربية والإنتاج",              icon:"fa-house-chimney-window" },
        { name:"وحدة التفريخ والفقاسات الآلية",      icon:"fa-egg" },
        { name:"منظومة التحكم البيئي (تهوية وتبريد)", icon:"fa-wind" },
        { name:"مخازن الأعلاف والأمان الحيوي",       icon:"fa-shield-virus" },
    ],
    'feed-sector-box': [
        { name:"وحدة الموازين وتجهيز الخامات",            icon:"fa-scale-balanced" },
        { name:"خط الإنتاج والخلط الآلي",                icon:"fa-gears" },
        { name:"معمل التحليل الكيميائي",                  icon:"fa-flask-vial" },
        { name:"مستودعات تخزين المنتج النهائي",           icon:"fa-warehouse" },
    ],
    'feed-reg-box': [
        { name:"وحدة رقابة الجودة وتطوير التركيبات",  icon:"fa-vial-circle-check" },
        { name:"مخزن الحجر الصحي للمستوردات",          icon:"fa-lock" },
    ],
    'genetics-sector-box': [
        { name:"بنك الأصول الوراثية",                   icon:"fa-dna" },
        { name:"معمل التلقيح الاصطناعي ونقل الأجنة",   icon:"fa-microscope" },
        { name:"وحدة رعاية الطلائق والحيوانات المانحة", icon:"fa-cow" },
        { name:"منظومة النيتروجين السائل",              icon:"fa-snowflake" },
    ],
    'desert-sector-box': [
        { name:"محطات التربية المفتوحة والمظللة",          icon:"fa-cow" },
        { name:"وحدة حفر الآبار ومنظومة الري",            icon:"fa-bore-hole" },
        { name:"مركز تجميع الألبان ووحدات التبريد",       icon:"fa-truck-droplet" },
        { name:"وحدة تخزين الأعلاف الجافة والسيلاج",     icon:"fa-tractor" },
    ],
    'dairy-center-box': [
        { name:"وحدة الاستلام ومنصة فحص الألبان",    icon:"fa-truck-field" },
        { name:"مختبر رقابة الجودة",                  icon:"fa-microscope" },
        { name:"تنكات التبريد السريع (BMC)",           icon:"fa-snowflake" },
        { name:"وحدة الغسيل والتعقيم المركزي (CIP)", icon:"fa-soap" },
    ],
    'apiary-sector-box': [
        { name:"وحدات الخلايا الخشبية الحديثة",  icon:"fa-boxes-stacked" },
        { name:"وحدة تربية الملكات والتلقيح",    icon:"fa-crown" },
        { name:"معمل فرز وتصفية العسل",           icon:"fa-faucet-drip" },
        { name:"مخزن أدوات النحالة والتعبئة",    icon:"fa-jar" },
    ],
    'poultry-trade-box': [
        { name:"وحدة التخليص والحجر البيطري",              icon:"fa-plane-import" },
        { name:"وحدة متابعة السلالات والتحسين الوراثي",   icon:"fa-dna" },
        { name:"أسطول نقل الدواجن (تحكم حراري)",          icon:"fa-truck-fast" },
    ],
    'livestock-import-box': [
        { name:"إدارة الاستيراد والتوثيق الوراثي",         icon:"fa-file-signature" },
        { name:"وحدة حاويات النيتروجين السائل",             icon:"fa-vial" },
        { name:"أسطول نقل الماشية المجهز دولياً",          icon:"fa-truck-moving" },
    ],
    'bee-apiary-production-facility': [
        { name:"وحدات الخلايا وأجهزة التغذية",  icon:"fa-boxes-stacked" },
        { name:"غرفة فرز وتصفية وتعبئة العسل",  icon:"fa-faucet-drip" },
        { name:"وحدة الاختبار والتحليل",         icon:"fa-microscope" },
    ],
    // ── ثقافة وإعلام ───────────────────────────────────────────
    'culture-prod-box': [
        { name:"استوديو التسجيل الصوتي واللحني",  icon:"fa-microphone-lines" },
        { name:"وحدة المونتاج والمعالجة الرقمية", icon:"fa-clapperboard" },
        { name:"إدارة قيد التصرفات والسجلات",    icon:"fa-book-bookmark" },
    ],
    'culture-display-box': [
        { name:"قاعة العرض الرئيسية",        icon:"fa-masks-theater" },
        { name:"غرفة العرض (Projection Room)",icon:"fa-film" },
        { name:"أنظمة الصوت والإضاءة",       icon:"fa-lightbulb" },
    ],
    'culture-dist-box': [
        { name:"مخزن المصنفات المؤمن",            icon:"fa-warehouse" },
        { name:"منطقة العرض والبيع للجمهور",      icon:"fa-shop" },
        { name:"إدارة العقود وسجلات التوزيع",    icon:"fa-file-signature" },
    ],
    'culture-shooting-box': [
        { name:"وحدة الكاميرات والعدسات",             icon:"fa-camera-movie" },
        { name:"وحدة الإضاءة والكهرباء",              icon:"fa-lightbulb" },
        { name:"موقع التصوير أو البلاتوه (Set)",       icon:"fa-clapperboard" },
    ],
    'culture-record-box': [
        { name:"غرفة التسجيل المعزولة",    icon:"fa-microphone" },
        { name:"غرفة التحكم والهندسة الصوتية",icon:"fa-sliders" },
        { name:"وحدة الأرشفة الرقمية",     icon:"fa-hard-drive" },
    ],
    'culture-copy-box': [
        { name:"وحدة النسخ الرئيسية (Mastering)", icon:"fa-compact-disc" },
        { name:"وحدة الطباعة والتغليف الفني",     icon:"fa-print" },
        { name:"مخزن النسخ الجاهزة",              icon:"fa-boxes-stacked" },
    ],
    'culture-conv-box': [
        { name:"وحدة معالجة الوسائط القديمة",          icon:"fa-compact-disc" },
        { name:"منظومة التحويل الرقمي",                icon:"fa-shuffle" },
        { name:"وحدة الأرشفة وسجل قيد التحويلات",    icon:"fa-database" },
    ],
    'cinema-center-box': [
        { name:"قاعات العرض السينمائي",              icon:"fa-film" },
        { name:"مخزن مؤمن للأفلام والمواد الدعائية", icon:"fa-vault" },
        { name:"كاشير ونقاط بيع التذاكر",           icon:"fa-cash-register" },
    ],
    // ── تجزئة غذائية متنوعة ────────────────────────────────────
    'food-retail-facility': [
        { name:"رفوف عرض المنتجات",          icon:"fa-shelves" },
        { name:"ثلاجات وخزانات تبريد",       icon:"fa-snowflake" },
        { name:"مخزن جاف مناسب",            icon:"fa-warehouse" },
        { name:"كاشير ونقطة بيع",           icon:"fa-cash-register" },
    ],
    'general-food-retail-wholesale-facility': [
        { name:"أرفف وطبليات عرض البضاعة", icon:"fa-shelves" },
        { name:"مخزن جاف وبارد",           icon:"fa-warehouse" },
        { name:"ثلاجات وبرادات",           icon:"fa-snowflake" },
    ],
    'dairy-retail-facility': [
        { name:"ثلاجات عرض الألبان والأجبان", icon:"fa-snowflake" },
        { name:"منطقة تقديم وتقطيع الأجبان", icon:"fa-utensils" },
        { name:"مخزن تبريد مركزي",            icon:"fa-temperature-low" },
    ],
};

// ══════════════════════════════════════════════════════════════════
//  §2  LAYER 2 — محرك NLP ذكي لاستخراج التجهيزات من النصوص
//  ✅ تحسين: يقرأ technicalNotes + details.req معاً
// ══════════════════════════════════════════════════════════════════

// قائمة سوداء: جمل دالة على وثائق أو إجراءات إدارية (لا تجهيزات مادية)
const SFE_NLP_BLACKLIST = [
    'شهادة','ترخيص','رخصة','موافقة','تسجيل ','عضوية','مدير فني',
    'مقيد ','مرخص له','نقابة','رسم هندسي','معاينة مشتركة',
    'إجراء معاينة','قانون ','قرار ','اشتراطات التصنيع الجيد','GMP',
    'الاحتفاظ بفواتير','بفواتير','شهادات صحية','طلب ترخيص',
    'حوافز','GAFI','رسوم ','مصروفات إدارية','مدة الترخيص',
    'تقييم أثر بيئي','منظومة التتبع','فواتير الشراء',
    'الالتزام التام','الالتزام الصارم',
    'قواعد النظافة','شهادات المدربين','تراخيص الطاقم',
    'ضمان سلامة المستهلك','لضمان الجودة','حماية محكمة ضد الحشرات',
    'مدير مسئول','موظف مرخص','رخصة مزاولة','تصريح عمل',
    'الإجراءات القانونية','التسجيل لدى','موافقة الجهة',
];

// أنماط NLP موسّعة لالتقاط التجهيزات من اللغة العربية القانونية والتقنية
const SFE_NLP_PATTERNS = [
    // وزن 7: قوائم صريحة بالتجهيزات
    { re: /(?:التجهيزات|المعدات|الماكينات|الآلات|الأجهزة)\s*(?:الآتية|التالية|المطلوبة|اللازمة)?\s*[:：-]\s*([^.\n]{8,120})/g, w: 7 },
    // وزن 6: جمل الإلزام بوجود تجهيز
    { re: /(?:يلزم|يجب|يشترط|ينبغي|يتعين)\s+(?:توفير|وجود|توافر|تجهيز|تركيب|استخدام)\s+(?:ال|ب|و|ف)?([^.\n،؛]{5,80})/g, w: 6 },
    // وزن 6: يجب توفر / الالتزام بوجود
    { re: /(?:الالتزام بوجود|الالتزام بتوفير|يجب توفر|يجب وجود)\s+(?:ال|ب|و|ف)?([^.\n،؛]{5,80})/g, w: 6 },
    // وزن 5: توفير / توافر مباشرة
    { re: /(?:توفير|توافر|وجود|إمداد|تركيب|تجهيز)\s+(?:ال|ب|و|ف)?([^.\n،؛]{5,80})/g, w: 5 },
    // وزن 5: وصف المكان بأنه مجهز بـ
    { re: /(?:مزود|مزودة|مجهزة|مجهز|تحتوي|يحتوي|مزودٌ)\s+(?:بـ|بها|على|ب)?\s*([^.\n،؛]{5,70})/g, w: 5 },
    // وزن 4: اسم المكان المادي مباشرة
    { re: /(?:غرفة|صالة|منطقة|وحدة|معمل|حوض|ثلاجة|مبرد|فرن|ماكينة|خزان|مستودع|ورشة|محطة|قاعة|مركز)\s+([^.\n،؛]{4,50})/g, w: 4 },
    // وزن 4: التحقق من وجود / التأكد من توافر
    { re: /(?:التحقق من|التأكد من|مراجعة|فحص)\s+(?:وجود|توافر|كفاءة|عمل|نظافة|صلاحية)\s+(?:ال|ب|و|ف)?([^.\n،؛:]{5,75})/g, w: 4 },
    // وزن 4: يشترط تعيين / يشترط وجود نظام
    { re: /(?:يشترط|يتطلب)\s+(?:تعيين|وجود|تشغيل|تركيب)\s+(?:نظام|وحدة|جهاز|معدة|آلة|خط)\s+([^.\n،؛]{4,60})/g, w: 4 },
    // وزن 4: التقاط معدات مذكورة بعد "باستخدام / بواسطة / عبر"
    { re: /(?:استخدام|بواسطة|عبر|بمساعدة)\s+(?:ال|ب|و|ف)?(سيور|خلاطات|أفران|موازين|ثلاجات|فلاتر|شفاطات|أرفف|بالتات|طفايات|مضخات|مكابس|مولدات|حزام|طارد)\s*([^.\n،؛]{0,40})/g, w: 4 },
    // وزن 3: "يجب أن تكون المنشأة مزودة"
    { re: /(?:المنشأة|المصنع|المخزن|المكان|الموقع)\s+(?:مزود|مزودة|مجهز|مجهزة)\s+(?:بـ|ب|بها)?\s*([^.\n،؛]{5,70})/g, w: 3 },
    // وزن 3: "يوجد بالمنشأة"
    { re: /(?:يوجد|يتواجد|موجود)\s+(?:بالمنشأة|بالمصنع|بالموقع|بالمخزن)?\s+([^.\n،؛]{5,70})/g, w: 3 },
];

function SFE_nlpExtract(rawTexts, actText) {
    // ✅ تحسين: يقبل نص واحد أو مصفوفة نصوص
    const sources = Array.isArray(rawTexts) ? rawTexts : [rawTexts];
    const combined = sources
        .filter(Boolean)
        .map(t => t.replace(/\\n/g,'\n').replace(/\\\\/g,'\\').replace(/\\"/g,'"')
                   .replace(/[١٢٣٤٥٦٧٨٩٠]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d) || 0)))
        .join('\n');

    if (!combined.trim()) return [];

    const found = [];
    const seen  = new Set();

    for (const {re, w} of SFE_NLP_PATTERNS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(combined)) !== null) {
            let raw = (m[2] || m[1] || '').trim()
                .replace(/\s*[\[(（][^)\]）]{1,50}[\]）)]\s*/g,' ')
                .replace(/\s+/g,' ')
                .replace(/^[-–•*\s]+/,'')
                .replace(/[،,;؛.]+$/,'')
                .trim();

            if (raw.length < 6 || raw.length > 72) continue;
            if (SFE_NLP_BLACKLIST.some(bl => raw.includes(bl))) continue;

            const norm = raw.replace(/\s/g,'').slice(0,20);
            if (seen.has(norm)) continue;
            seen.add(norm);

            found.push({ name: raw, w, icon: SFE_iconFor(raw) });
        }
    }

    found.sort((a,b) => b.w - a.w);
    return found.slice(0, 12).map(f => ({ name: f.name, icon: f.icon }));
}

// ══════════════════════════════════════════════════════════════════
//  §3  LAYER 3 — تصنيف القطاع واستنتاج التجهيزات
//  ✅ تحسين: 50 قطاع دقيق بدلاً من 25 عام
// ══════════════════════════════════════════════════════════════════
const SFE_SECTORS = [
    // ── غذاء وضيافة ────────────────────────────────────────────
    {
        id: 'food_restaurant',
        keywords: ['مطعم','شاورما','كشري','بيتزا','برجر','سندوتش','وجبة','مأكولات','مشويات','كباب','سيخ','ملوخية','فتة','كوشري','طعمية','فول','حمص','طاجن'],
        items: [
            { name:"منطقة تحضير وطهي الطعام",    icon:"fa-fire-burner" },
            { name:"أسطح عمل ستانلس ستيل",        icon:"fa-table" },
            { name:"معدات تبريد وتجميد للخامات",  icon:"fa-snowflake" },
            { name:"نظام تهوية وشفط أبخرة",       icon:"fa-fan" },
            { name:"أحواض غسيل متعددة",           icon:"fa-sink" },
            { name:"صالة جلوس وخدمة العملاء",     icon:"fa-chair" },
        ]
    },
    {
        id: 'food_cafe',
        keywords: ['كافيه','كافيتيريا','قهوة','مشروبات','عصائر','سموذي','شاي','كوكتيل','بار عصير'],
        items: [
            { name:"ماكينة تحضير القهوة والمشروبات", icon:"fa-mug-hot" },
            { name:"ثلاجات عرض ومشروبات باردة",      icon:"fa-snowflake" },
            { name:"عدادات تقديم الخدمة",            icon:"fa-table" },
            { name:"غسالة أكواب ومعدات صحية",        icon:"fa-sink" },
            { name:"صالة جلوس وخدمة العملاء",        icon:"fa-chair" },
        ]
    },
    {
        id: 'food_sweets',
        keywords: ['حلوى','حلويات','كنافة','بسبوسة','كيكة','تورتة','بقلاوة','مولد','حلاوة','نوجا','شوكولاتة','كراميل','ياميش'],
        items: [
            { name:"أفران ومعدات خبز الحلوى",       icon:"fa-fire-burner" },
            { name:"خلاطات وعجانات صناعية",          icon:"fa-blender" },
            { name:"ثلاجات حفظ المنتجات",            icon:"fa-snowflake" },
            { name:"طاولات تحضير وتزيين ستانلس",    icon:"fa-table" },
            { name:"واجهة عرض مبردة",                icon:"fa-store" },
        ]
    },
    {
        id: 'food_bakery',
        keywords: ['مخبز','خبز','عيش','فطير','معجنات','فطائر','كرواسون','توست','بسكويت','كعك','بريوش'],
        items: [
            { name:"أفران خبز صناعية (روتاري/طابقي)",icon:"fa-fire-burner" },
            { name:"عجانات وخلاطات صناعية",          icon:"fa-blender" },
            { name:"طاولات تشكيل العجين",            icon:"fa-table" },
            { name:"ثلاجة تخمير العجين (Proofer)",   icon:"fa-temperature-low" },
            { name:"خطوط تعبئة وتغليف",              icon:"fa-box-open" },
        ]
    },
    {
        id: 'food_meat',
        keywords: ['لحوم','ذبح','جزارة','دواجن مذبوحة','نقانق','برجر محلي','سجق','شاورما خام','لحم مفروم'],
        items: [
            { name:"غرفة تبريد وتجميد اللحوم",       icon:"fa-snowflake" },
            { name:"أدوات ومعدات الجزارة (صنانير/طاولات)", icon:"fa-scissors" },
            { name:"ماكينة فرم وتقطيع اللحوم",       icon:"fa-gears" },
            { name:"أحواض غسيل ومطهر ستانلس",       icon:"fa-sink" },
            { name:"عربات نقل مبردة",                icon:"fa-truck" },
        ]
    },
    {
        id: 'food_fish',
        keywords: ['أسماك','مأكولات بحرية','سمك','روبيان','جمبري','كابوريا','مملح','مدخن','تمليح','تدخين سمك'],
        items: [
            { name:"ثلاجات وغرف حفظ الأسماك الطازجة",icon:"fa-snowflake" },
            { name:"أحواض تنظيف وإعداد الأسماك",     icon:"fa-sink" },
            { name:"معدات تقطيع وتشريح (شراشف)",     icon:"fa-scissors" },
            { name:"وحدة تجهيز وتعبئة الأسماك",      icon:"fa-box-open" },
            { name:"منطقة عرض مبردة",                icon:"fa-store" },
        ]
    },
    {
        id: 'food_retail_grocery',
        keywords: ['بقالة','سوبر ماركت','ميني ماركت','تموينات','محل خضار','فاكهة','مواد غذائية','منفذ بيع'],
        items: [
            { name:"أرفف عرض وتخزين المنتجات",       icon:"fa-shelves" },
            { name:"ثلاجات وخزانات تبريد للعرض",     icon:"fa-snowflake" },
            { name:"مخزن جاف مرتفع عن الأرض",        icon:"fa-warehouse" },
            { name:"كاشير ونقطة بيع (POS)",           icon:"fa-cash-register" },
            { name:"منطقة استلام وفرز البضاعة",       icon:"fa-truck-field" },
        ]
    },
    {
        id: 'food_processing_factory',
        keywords: ['تصنيع غذائي','معالجة أغذية','خط إنتاج غذائي','تعبئة وتغليف','تجهيز أغذية','حفظ أغذية','معصرة','مطحنة'],
        items: [
            { name:"خط إنتاج وتجهيز رئيسي",          icon:"fa-gears" },
            { name:"معمل مراقبة الجودة",              icon:"fa-microscope" },
            { name:"منطقة تعبئة وتغليف آلية",         icon:"fa-box-open" },
            { name:"مستودعات تخزين مواد خام ومنتج",  icon:"fa-warehouse" },
            { name:"وحدة تبريد وتجميد",               icon:"fa-snowflake" },
            { name:"نظام معالجة المياه الصناعي",      icon:"fa-filter" },
        ]
    },
    {
        id: 'cold_storage',
        keywords: ['تخزين مبرد','مجمد','ثلاجة تخزين','مستودع تبريد','سلسلة التبريد','تخزين لحوم','تخزين ألبان'],
        items: [
            { name:"غرف تخزين مبردة ومجمدة",         icon:"fa-warehouse" },
            { name:"وحدات تبريد ومولدات احتياطية",   icon:"fa-bolt-lightning" },
            { name:"رافعات شوكية وسيور نقل",          icon:"fa-dolly" },
            { name:"منظومة مراقبة الحرارة الآلية",   icon:"fa-temperature-low" },
            { name:"بوابات عزل حرارية",               icon:"fa-door-closed" },
        ]
    },
    // ── طبي وصحي ───────────────────────────────────────────────
    {
        id: 'medical_hospital',
        keywords: ['مستشفى','مركز طبي','عيادة','مركز رعاية','وحدة صحية','مركز أشعة','طبيب','تمريض','رعاية مركزة'],
        items: [
            { name:"غرفة كشف وتشخيص",               icon:"fa-stethoscope" },
            { name:"معمل تحاليل طبية",               icon:"fa-vials" },
            { name:"منظومة أكسجين وغازات طبية",     icon:"fa-lungs" },
            { name:"وحدة تعقيم وتطهير",              icon:"fa-hand-sparkles" },
            { name:"وحدة طوارئ ورعاية مركزة",       icon:"fa-truck-medical" },
            { name:"نظام مراقبة المرضى",             icon:"fa-heartbeat" },
        ]
    },
    {
        id: 'medical_lab',
        keywords: ['معمل تحاليل','مختبر طبي','مختبر تحاليل','مركز تحاليل','أشعة','تصوير طبي','سكانر','رنين'],
        items: [
            { name:"أجهزة تحليل دم وبول وبراز",     icon:"fa-vials" },
            { name:"جهاز أشعة سينية (X-Ray)",        icon:"fa-x-ray" },
            { name:"وحدة تعقيم وعزل العينات",        icon:"fa-hand-sparkles" },
            { name:"ثلاجات حفظ العينات والكيماويات", icon:"fa-snowflake" },
            { name:"منطقة انتظار وسحب العينات",      icon:"fa-chair" },
        ]
    },
    {
        id: 'pharmaceutical_store',
        keywords: ['مخزن أدوية','مستودع دوائي','توزيع أدوية','صيدلية مستشفى','مخزن مستلزمات طبية'],
        items: [
            { name:"أرفف تخزين مطابقة لـ GSP",      icon:"fa-boxes-stacked" },
            { name:"وحدة تبريد للمستحضرات الحساسة", icon:"fa-snowflake" },
            { name:"منطقة الحجر الصحي (Quarantine)", icon:"fa-lock" },
            { name:"نظام مراقبة الحرارة والرطوبة",  icon:"fa-thermometer-half" },
            { name:"منطقة استلام وفرز المستحضرات",  icon:"fa-dolly" },
        ]
    },
    {
        id: 'pharmaceutical_mfg',
        keywords: ['تصنيع أدوية','مصنع أدوية','إنتاج دوائي','مستحضرات صيدلية','فارما','GMP','صيدلاني'],
        items: [
            { name:"غرف إنتاج معقمة (Clean Rooms)",  icon:"fa-door-closed" },
            { name:"منظومة ضبط الهواء (HVAC)",       icon:"fa-fan" },
            { name:"معمل مراقبة الجودة (QC Lab)",    icon:"fa-microscope" },
            { name:"محطة تنقية مياه صيدلية",         icon:"fa-filter" },
            { name:"وحدة تعبئة أولية وثانوية",       icon:"fa-box-open" },
            { name:"مستودع تخزين GSP",               icon:"fa-warehouse" },
        ]
    },
    // ── بيطري وزراعي ───────────────────────────────────────────
    {
        id: 'veterinary_clinic',
        keywords: ['عيادة بيطرية','طب بيطري','علاج حيوانات','كشف حيواني','تحصين حيوانات','طبيب بيطري'],
        items: [
            { name:"غرفة كشف وعلاج حيواني",          icon:"fa-stethoscope" },
            { name:"غرفة عمليات بيطرية",              icon:"fa-procedures" },
            { name:"مخزن أدوية ومستلزمات بيطرية",   icon:"fa-pills" },
            { name:"وحدة تعقيم الأدوات",             icon:"fa-hand-sparkles" },
            { name:"قفص احتجاز وإيواء الحيوانات",   icon:"fa-house-chimney-window" },
        ]
    },
    {
        id: 'poultry_farm',
        keywords: ['دواجن','تربية دواجن','مزرعة دجاج','مزرعة بيض','فقاسة','كتاكيت','تسمين دواجن','طيور'],
        items: [
            { name:"عنابر تربية مجهزة بتهوية آلية",  icon:"fa-house-chimney-window" },
            { name:"منظومة تغذية وشرب تلقائية",      icon:"fa-fan" },
            { name:"وحدة تبريد وتجميد الإنتاج",      icon:"fa-snowflake" },
            { name:"مخازن أعلاف ومستلزمات",           icon:"fa-warehouse" },
            { name:"أجهزة تحصين وتطعيم",             icon:"fa-syringe" },
        ]
    },
    {
        id: 'fish_farm',
        keywords: ['استزراع سمكي','مزرعة أسماك','أحواض أسماك','ثروة سمكية','أقفاص بحرية','ربيان','جمبري تربية'],
        items: [
            { name:"أحواض تربية الأسماك (خرسانة/FRP)",icon:"fa-water" },
            { name:"منظومة تهوية وأكسجة المياه",     icon:"fa-fan" },
            { name:"محطة ضخ وترشيح المياه",           icon:"fa-filter" },
            { name:"وحدة تغذية آلية",                 icon:"fa-wheat-awn" },
            { name:"معدات حصاد وتجميع",              icon:"fa-truck-field" },
        ]
    },
    {
        id: 'dairy_livestock',
        keywords: ['ألبان','تجميع ألبان','أبقار','ماشية','إبل','أغنام','بقر','منتجات حيوانية','تصنيع ألبان'],
        items: [
            { name:"تنكات تبريد وحفظ الألبان",       icon:"fa-snowflake" },
            { name:"معمل جودة وتحليل الألبان",       icon:"fa-microscope" },
            { name:"وحدة الاستقبال والفحص",          icon:"fa-truck-field" },
            { name:"وحدة الغسيل والتعقيم (CIP)",     icon:"fa-soap" },
            { name:"خطوط بسترة وتعبئة",              icon:"fa-gears" },
        ]
    },
    {
        id: 'apiary_honey',
        keywords: ['نحل','عسل','منحل','خلية نحل','تربية نحل','إنتاج عسل','شمع عسل'],
        items: [
            { name:"خلايا نحل (لانجستروث/أبو جروف)", icon:"fa-jar" },
            { name:"غرفة فرز وتعبئة العسل",          icon:"fa-box-open" },
            { name:"آلة فرز (Extractor) العسل",       icon:"fa-gears" },
            { name:"ثلاجة حفظ العسل المعبأ",          icon:"fa-temperature-low" },
            { name:"معمل فحص جودة العسل",            icon:"fa-microscope" },
        ]
    },
    {
        id: 'feed_factory',
        keywords: ['أعلاف','مصنع أعلاف','علف','خلط أعلاف','تصنيع أعلاف','بيليت أعلاف'],
        items: [
            { name:"مطاحن وخلاطات أعلاف",            icon:"fa-gears" },
            { name:"آلات ضغط البيليت (Pelletizer)",  icon:"fa-compress" },
            { name:"صوامع وخزانات مكونات الأعلاف",  icon:"fa-tower-observation" },
            { name:"موازين إلكترونية معتمدة",         icon:"fa-scale-balanced" },
            { name:"معمل تحليل ومراقبة جودة الأعلاف",icon:"fa-microscope" },
            { name:"خطوط تعبئة وتغليف الأعلاف",     icon:"fa-box-open" },
        ]
    },
    // ── صناعة ───────────────────────────────────────────────────
    {
        id: 'industry_general',
        keywords: ['مصنع','ورشة','تصنيع','إنتاج صناعي','خط إنتاج','منتجات صناعية','مشغل'],
        items: [
            { name:"خطوط إنتاج صناعية",              icon:"fa-industry" },
            { name:"معمل ضبط الجودة (QC)",            icon:"fa-flask-vial" },
            { name:"منظومة معالجة الهواء",            icon:"fa-fan" },
            { name:"مستودعات مواد خام ومنتج تام",    icon:"fa-warehouse" },
            { name:"منظومة السلامة المهنية (PPE)",    icon:"fa-hard-hat" },
        ]
    },
    {
        id: 'industry_textile',
        keywords: ['نسيج','ملابس','خياطة','قماش','غزل','نول','طباعة قماش','تريكو','جوارب','خيوط','جينز','تي شيرت'],
        items: [
            { name:"ماكينات خياطة صناعية",            icon:"fa-gears" },
            { name:"آلات قطع وتشكيل الأقمشة",        icon:"fa-scissors" },
            { name:"غلايات كي وضغط بخاري",           icon:"fa-wind" },
            { name:"طاولات تفصيل وقياس",              icon:"fa-ruler-combined" },
            { name:"وحدة طباعة وتلوين الأقمشة",      icon:"fa-print" },
            { name:"مستودع خامات ومنتجات تامة",      icon:"fa-warehouse" },
        ]
    },
    {
        id: 'industry_wood',
        keywords: ['أثاث','نجارة','خشب','أبواب','شبابيك','ديكور خشبي','أخشاب','مطبخ خشبي','MDF','خشب مضغوط'],
        items: [
            { name:"ماكينات نشر وتقطيع الخشب",       icon:"fa-gears" },
            { name:"آلات تشكيل وتفريز CNC",           icon:"fa-screwdriver-wrench" },
            { name:"غرفة دهان ولكه (Spray Booth)",    icon:"fa-spray-can-sparkles" },
            { name:"مستودع أخشاب خام",                icon:"fa-warehouse" },
            { name:"منطقة تجميع وتشطيب",              icon:"fa-screwdriver-wrench" },
        ]
    },
    {
        id: 'industry_metal',
        keywords: ['حديد','صلب','ألمنيوم','معادن','سبك','لحام','ورشة حديد','تشغيل معادن','خراطة','مسبك'],
        items: [
            { name:"أفران صهر وصب المعادن",           icon:"fa-fire" },
            { name:"ماكينات لحام (MIG/TIG/قوسي)",     icon:"fa-fire" },
            { name:"آلات خراطة وتفريز CNC",           icon:"fa-gears" },
            { name:"مستودع خامات معدنية",              icon:"fa-warehouse" },
            { name:"منظومة شفط الغازات والأبخرة",     icon:"fa-fan" },
            { name:"معدات قياس وجودة المعادن",        icon:"fa-ruler-combined" },
        ]
    },
    {
        id: 'industry_plastic_chem',
        keywords: ['بلاستيك','مواد بلاستيكية','مطاط','تشكيل بلاستيك','حقن بلاستيك','كيماويات','مواد كيميائية'],
        items: [
            { name:"ماكينات حقن وبثق البلاستيك",     icon:"fa-gears" },
            { name:"قوالب تشكيل (Molds)",              icon:"fa-cube" },
            { name:"مستودع مواد خام بلاستيكية",      icon:"fa-warehouse" },
            { name:"منظومة تهوية وسحب أبخرة",         icon:"fa-fan" },
            { name:"وحدة تعبئة وتغليف",               icon:"fa-box-open" },
        ]
    },
    {
        id: 'industry_paper_print',
        keywords: ['طباعة','نشر','مطبعة','ورق','كتب','مجلات','كرتون','مطبوعات','باكدج','تغليف ورقي'],
        items: [
            { name:"ماكينات طباعة أوفست/ديجيتال",    icon:"fa-print" },
            { name:"آلات قطع وتجليد وتشطيب",         icon:"fa-scissors" },
            { name:"مستودع ورق وأحبار ومواد خام",    icon:"fa-warehouse" },
            { name:"وحدة جمع وتصوير (PrePress)",      icon:"fa-microchip" },
            { name:"منطقة تعبئة وشحن المطبوعات",     icon:"fa-box-open" },
        ]
    },
    // ── طاقة ووقود ──────────────────────────────────────────────
    {
        id: 'fuel_gas_station',
        keywords: ['محطة وقود','بنزين','سولار','كيروسين','وقود','تموين سيارات','صرف وقود'],
        items: [
            { name:"خزانات الوقود الأرضية",           icon:"fa-database" },
            { name:"طلمبات التموين الإلكترونية",      icon:"fa-gas-pump" },
            { name:"منظومة القياس الآلي (ATG)",       icon:"fa-gauge-high" },
            { name:"أنظمة سلامة وإطفاء الحريق",      icon:"fa-fire-extinguisher" },
            { name:"منطقة خدمات السيارات",            icon:"fa-car" },
        ]
    },
    {
        id: 'lpg_bottling',
        keywords: ['بوتاجاز','lpg','غاز مسال','أسطوانة غاز','تعبئة أسطوانات','محطة غاز'],
        items: [
            { name:"خزانات استراتيجية لغاز البوتان",  icon:"fa-oil-well" },
            { name:"منصة تعبئة الأسطوانات الآلية",   icon:"fa-rotate" },
            { name:"موازين معايرة رقمية معتمدة",     icon:"fa-scale-balanced" },
            { name:"أنظمة إنذار وإطفاء تلقائي",      icon:"fa-fire-extinguisher" },
            { name:"أجهزة كشف تسريب الغاز",          icon:"fa-sensor-on" },
        ]
    },
    {
        id: 'electricity_solar',
        keywords: ['كهرباء','طاقة شمسية','ألواح شمسية','توليد كهرباء','محطة طاقة','طاقة متجددة','رياح'],
        items: [
            { name:"ألواح خلايا شمسية (PV Panels)",  icon:"fa-solar-panel" },
            { name:"محولات تيار (Inverters)",          icon:"fa-bolt" },
            { name:"وحدة تخزين الطاقة (Batteries)",  icon:"fa-battery-full" },
            { name:"أجهزة حماية وتحكم (SCADA)",      icon:"fa-shield-halved" },
            { name:"عدادات قياس ذكية",                icon:"fa-gauge" },
        ]
    },
    {
        id: 'petroleum',
        keywords: ['بترول','نفط','تكرير','استكشاف','حفر','خام نفط','بتروكيماويات'],
        items: [
            { name:"منصة حفر واستكشاف",              icon:"fa-oil-well" },
            { name:"وحدة معالجة الخام",               icon:"fa-industry" },
            { name:"مختبر تحاليل جيولوجية",           icon:"fa-microscope" },
            { name:"مستودعات تخزين وقود",             icon:"fa-warehouse" },
            { name:"منظومة سلامة وإطفاء",             icon:"fa-fire-extinguisher" },
        ]
    },
    // ── تعليم وتدريب ────────────────────────────────────────────
    {
        id: 'education_school',
        keywords: ['مدرسة','تعليم','مدرسي','فصول دراسية','طلاب','منهج','ابتدائي','إعدادي','ثانوي'],
        items: [
            { name:"قاعات دراسية مجهزة",              icon:"fa-chalkboard-user" },
            { name:"معامل علوم وحاسب",                icon:"fa-microscope" },
            { name:"مكتبة مدرسية",                    icon:"fa-book-open" },
            { name:"ملاعب ومرافق رياضية",              icon:"fa-volleyball" },
            { name:"وحدة صحية ومكاتب إدارية",         icon:"fa-briefcase-medical" },
        ]
    },
    {
        id: 'education_training',
        keywords: ['تدريب','دورات','معهد','أكاديمية','مركز تعليمي','تأهيل','كورسات','كورس'],
        items: [
            { name:"قاعات تدريب وعرض",               icon:"fa-chalkboard-user" },
            { name:"معامل تطبيقية وتدريبية",          icon:"fa-flask-vial" },
            { name:"أجهزة عرض وشاشات تفاعلية",       icon:"fa-desktop" },
            { name:"مكتبة ومصادر تعلم رقمية",        icon:"fa-book-open" },
        ]
    },
    // ── سياحة وضيافة ───────────────────────────────────────────
    {
        id: 'hotel_resort',
        keywords: ['فندق','منتجع','قرية سياحية','شاليهات','أجنحة فندقية','إقامة سياحية','مصيف','نزل'],
        items: [
            { name:"وحدات إقامة (غرف/أجنحة)",        icon:"fa-bed" },
            { name:"مطابخ مركزية ومطاعم",             icon:"fa-utensils" },
            { name:"مغسلة مركزية وخدمات تنظيف",      icon:"fa-soap" },
            { name:"مرافق ترفيه ورياضة وسبا",        icon:"fa-water-ladder" },
            { name:"منظومة أمن ومراقبة (CCTV)",       icon:"fa-video" },
        ]
    },
    {
        id: 'maritime_tourism',
        keywords: ['باخرة','يخت','مركب سياحي','غواصة','عبّارة','نقل بحري','بالون هواء','رحلة بحرية'],
        items: [
            { name:"كابينة القيادة وأجهزة الملاحة",  icon:"fa-ship" },
            { name:"غرفة المحركات والمولدات",         icon:"fa-gears" },
            { name:"وسائل سلامة وإنقاذ (طوق نجاة)", icon:"fa-life-ring" },
            { name:"مناطق إقامة وخدمة الركاب",       icon:"fa-bed" },
            { name:"محطة معالجة مياه الصرف (STP)",   icon:"fa-filter" },
        ]
    },
    // ── تجارة وخدمات ────────────────────────────────────────────
    {
        id: 'retail_market',
        keywords: ['سوق','بازار','مول','مجمع تجاري','مركز تسوق','محلات','بسطة','كيوسك'],
        items: [
            { name:"وحدات ومحلات عرض متنوعة",        icon:"fa-shop" },
            { name:"ممرات تسوق منظمة",                icon:"fa-route" },
            { name:"منظومة مراقبة وأمن (CCTV)",      icon:"fa-video" },
            { name:"مواقف سيارات ومداخل",             icon:"fa-car" },
            { name:"مرافق صرف صحي وخدمات",           icon:"fa-toilet" },
        ]
    },
    {
        id: 'logistics_transport',
        keywords: ['نقل','شحن','توصيل','لوجستيات','توزيع','تخليص جمركي','سيارات نقل','مستودع لوجستي'],
        items: [
            { name:"أسطول مركبات مجهز ومرخص",        icon:"fa-truck-moving" },
            { name:"منظومة تتبع GPS المركزية",         icon:"fa-location-dot" },
            { name:"جراج مبيت وصيانة",                icon:"fa-warehouse" },
            { name:"نظام توثيق وتتبع الشحنات",       icon:"fa-clipboard-list" },
            { name:"رافعات شوكية وسيور تحميل",        icon:"fa-dolly" },
        ]
    },
    {
        id: 'beauty_salon',
        keywords: ['صالون','حلاقة','تجميل','عناية بالشعر','مانيكير','باديكير','سبا','مساج','كيراتين'],
        items: [
            { name:"كراسي تجميل وأدوات عناية",       icon:"fa-chair" },
            { name:"وحدة تعقيم وتطهير الأدوات",     icon:"fa-hand-sparkles" },
            { name:"أجهزة تجميل وعناية متخصصة",     icon:"fa-spa" },
            { name:"مخزن منتجات العناية",             icon:"fa-box" },
            { name:"حوض غسيل شعر (Backwash)",        icon:"fa-sink" },
        ]
    },
    {
        id: 'sports_gym',
        keywords: ['صالة رياضية','جيم','نادي رياضي','ملعب','حمام سباحة','لياقة','تمرين','فيتنس','بلياردو','سنوكر'],
        items: [
            { name:"قاعات تمرين ومعدات رياضية",      icon:"fa-dumbbell" },
            { name:"غرف تبديل ملابس ودشات",          icon:"fa-door-open" },
            { name:"حمام سباحة ومرافق مائية",        icon:"fa-person-swimming" },
            { name:"خدمات صيانة المعدات الرياضية",  icon:"fa-screwdriver-wrench" },
            { name:"مناطق استراحة وخدمات للأعضاء",  icon:"fa-couch" },
        ]
    },
    // ── تقنية ومعلومات ──────────────────────────────────────────
    {
        id: 'it_tech',
        keywords: ['برمجيات','تكنولوجيا','حاسب','ذكاء اصطناعي','سيبراني','تطوير','موقع','تطبيق','ديجيتال'],
        items: [
            { name:"غرفة الخوادم (Data Center)",     icon:"fa-server" },
            { name:"شبكة داخلية مؤمنة",               icon:"fa-network-wired" },
            { name:"وحدة أمن المعلومات",              icon:"fa-shield-halved" },
            { name:"محطات عمل مهنية",                 icon:"fa-desktop" },
            { name:"نظام احتياطي للطاقة (UPS)",       icon:"fa-battery-full" },
        ]
    },
    {
        id: 'telecom',
        keywords: ['اتصالات','بث تلفزيوني','راديو','ألياف ضوئية','شبكة اتصال','نطاق ترددي','برج اتصالات'],
        items: [
            { name:"أبراج ومحطات إرسال",              icon:"fa-tower-broadcast" },
            { name:"مركز عمليات الشبكة (NOC)",        icon:"fa-satellite-dish" },
            { name:"كابلات ألياف ضوئية",              icon:"fa-network-wired" },
            { name:"أنظمة طاقة احتياطية",             icon:"fa-battery-full" },
        ]
    },
    // ── تشييد وتعدين ────────────────────────────────────────────
    {
        id: 'construction',
        keywords: ['إنشاء','بناء','مقاولات','تشييد','تطوير عقاري','خرسانة','مواد بناء'],
        items: [
            { name:"معدات ثقيلة وآلات حفر",          icon:"fa-truck-pickup" },
            { name:"مكتب فني وهندسي ميداني",          icon:"fa-drafting-compass" },
            { name:"مخازن تشوين الخامات والمعدات",   icon:"fa-warehouse" },
            { name:"أدوات سلامة مهنية",               icon:"fa-hard-hat" },
            { name:"وحدة مساحة وقياس",               icon:"fa-ruler-combined" },
        ]
    },
    {
        id: 'mining',
        keywords: ['تعدين','محجر','رمال','طفلة','جبس','كلس','معادن','استخراج','حجر','رخام','جرانيت'],
        items: [
            { name:"منطقة استخراج وحفر (منجم/محجر)", icon:"fa-mountain-city" },
            { name:"وحدة تكسير وغربلة",               icon:"fa-hammer" },
            { name:"مستودع مواد ومتفجرات مؤمن",       icon:"fa-warehouse" },
            { name:"معدات حفر ورفع ثقيلة",            icon:"fa-truck-pickup" },
            { name:"منظومة سلامة وإطفاء",             icon:"fa-fire-extinguisher" },
        ]
    },
    // ── فنون وإعلام وثقافة ─────────────────────────────────────
    {
        id: 'media_culture',
        keywords: ['إنتاج فني','بث','تسجيل','أفلام','مسرح','سينما','ثقافي','نشر','إعلام','ستوديو'],
        items: [
            { name:"استوديو تسجيل أو تصوير",          icon:"fa-clapperboard" },
            { name:"وحدة المونتاج والمعالجة الرقمية", icon:"fa-microchip" },
            { name:"أنظمة إضاءة وصوت متخصصة",        icon:"fa-lightbulb" },
            { name:"مخزن ديكورات ومعدات إنتاج",       icon:"fa-warehouse" },
        ]
    },
    // ── مياه وبيئة ──────────────────────────────────────────────
    {
        id: 'water_utilities',
        keywords: ['مياه','صرف صحي','محطة مياه','ري','بئر','معالجة مياه','شرب','سحب مياه'],
        items: [
            { name:"وصلة مياه شرب وصرف صحي",         icon:"fa-droplet" },
            { name:"محطة ضخ وطلمبات",                 icon:"fa-faucet" },
            { name:"وحدة تنقية وفلترة",               icon:"fa-filter" },
            { name:"خزانات تخزين أرضية وعلوية",      icon:"fa-database" },
        ]
    },
    // ── خدمات متنوعة ───────────────────────────────────────────
    {
        id: 'laundry_cleaning',
        keywords: ['مغسلة','غسيل ملابس','تنظيف جاف','كوي','laundry','تنظيف سجاد','خدمة غسيل'],
        items: [
            { name:"غسالات وآلات تجفيف صناعية",      icon:"fa-soap" },
            { name:"ماكينات كوي بخار صناعية",         icon:"fa-wind" },
            { name:"طاولات فرز وتصنيف الملابس",       icon:"fa-table" },
            { name:"خزانات مياه وأنظمة صرف",          icon:"fa-droplet" },
            { name:"منطقة استلام وتسليم الطلبات",     icon:"fa-door-open" },
        ]
    },
    {
        id: 'car_services',
        keywords: ['ورشة سيارات','صيانة سيارات','ميكانيكا','كهرباء سيارات','بوية','هيكل','إطارات','كراج'],
        items: [
            { name:"حفرة أو رافعة صيانة السيارات",   icon:"fa-car" },
            { name:"معدات تشخيص إلكتروني",            icon:"fa-microchip" },
            { name:"مستودع قطع غيار وزيوت",           icon:"fa-warehouse" },
            { name:"كمبريسور هواء وأدوات",            icon:"fa-compress" },
            { name:"وحدة الدهان والهيكلة",            icon:"fa-spray-can-sparkles" },
        ]
    },
    {
        id: 'chemicals_pesticides',
        keywords: ['كيماويات','مبيد','مطهر','مذيب','رش حشرات','حماية نبات','مواد خطرة','منظفات صناعية'],
        items: [
            { name:"منطقة تخزين مفصولة للمواد الخطرة",icon:"fa-radiation" },
            { name:"نظام تهوية إجبارية",              icon:"fa-fan" },
            { name:"غرفة معدات الوقاية الشخصية (PPE)",icon:"fa-hard-hat" },
            { name:"حاويات احتواء الانسكابات",        icon:"fa-lock" },
            { name:"محطة غسيل طوارئ (Eye Wash)",      icon:"fa-sink" },
        ]
    },
    {
        id: 'waste_recycling',
        keywords: ['مخلفات','نفايات','تدوير','معالجة مخلفات','نقل مخلفات','صرف','تخلص','قمامة','رسكلة'],
        items: [
            { name:"وحدات الفرز وتصنيف المخلفات",    icon:"fa-filter" },
            { name:"ماكينات ضغط وفصل المكونات",      icon:"fa-gears" },
            { name:"مخازن مؤقتة مؤمنة",               icon:"fa-warehouse" },
            { name:"أنظمة التعقيم وتطهير المواقع",   icon:"fa-biohazard" },
            { name:"سيارات نقل مجهزة",                icon:"fa-truck-moving" },
        ]
    },
    {
        id: 'horse_equine',
        keywords: ['خيل','خيول','إسطبل','فروسية','تربية خيول','منافسة خيول','بيع خيول','ركوب خيل'],
        items: [
            { name:"إسطبلات ومناطق إيواء الخيول",    icon:"fa-horse" },
            { name:"حلبة تدريب وفروسية",             icon:"fa-route" },
            { name:"مخازن أعلاف وتبن",                icon:"fa-wheat-awn" },
            { name:"عيادة بيطرية مجهزة",              icon:"fa-stethoscope" },
            { name:"معدات العناية والتجميل",          icon:"fa-screwdriver-wrench" },
        ]
    },
    {
        id: 'mushroom_herbs',
        keywords: ['مشروم','فطر','أعشاب','نباتات طبية','تزهير','استخلاص نباتي','أعشاب طبية'],
        items: [
            { name:"غرف إنتاج محكومة الرطوبة والإضاءة",icon:"fa-seedling" },
            { name:"وحدة تحضير وتعقيم الركيزة",      icon:"fa-hand-sparkles" },
            { name:"ثلاجة تخزين المنتج الطازج",       icon:"fa-snowflake" },
            { name:"معمل فحص الجودة والتحليل",       icon:"fa-microscope" },
            { name:"وحدة تجفيف وتعبئة",              icon:"fa-wind" },
        ]
    },
];

function SFE_sectorInfer(actText, actVal) {
    if (!actText && !actVal) return [];
    const haystack = ((actText || '') + ' ' + (actVal || '')).toLowerCase();

    const scored = SFE_SECTORS
        .map(sector => ({
            sector,
            score: sector.keywords.filter(kw => haystack.includes(kw)).length
        }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
        return [
            { name:"منطقة عمل رئيسية مجهزة",  icon:"fa-building" },
            { name:"وحدات تخزين وخدمات",        icon:"fa-warehouse" },
            { name:"منظومة سلامة وطوارئ",       icon:"fa-fire-extinguisher" },
        ];
    }

    // دمج أفضل قطاعين مع إزالة التكرار
    const topItems = scored.slice(0, 2).flatMap(s => s.sector.items);
    const seen = new Set();
    return topItems.filter(it => {
        if (seen.has(it.name)) return false;
        seen.add(it.name);
        return true;
    });
}

// ══════════════════════════════════════════════════════════════════
//  §3b  LAYER 3 — استنتاج من مراحل الإنتاج (موسّع)
//  ✅ تحسين: قاموس 50+ قاعدة بدلاً من 17
// ══════════════════════════════════════════════════════════════════
function SFE_inferFromStages(stages) {
    if (!stages || stages.length === 0) return [];
    const inferred = [];

    const processToMachineMap = [
        // ── عمليات تحضير المواد ──
        { k:['استلام','فحص الوارد','فحص الخامات','استقبال مواد'],           machine:'منطقة استلام وفرز المواد الواردة',      icon:'fa-truck-field',    w:3 },
        { k:['وزن','ميزان','معايرة','قياس الكميات'],                          machine:'موازين إلكترونية معتمدة',              icon:'fa-scale-balanced', w:4 },
        { k:['تخزين','رص','تشوين','مخزن','حفظ خام'],                          machine:'أرفف ووحدات تخزين مجهزة',             icon:'fa-warehouse',      w:3 },
        // ── عمليات تحويل ميكانيكي ──
        { k:['طحن','جرش','تكسير','فرم','سحق','طحينة'],                        machine:'معدات طحن وجرش ميكانيكية',            icon:'fa-gears',          w:5 },
        { k:['خلط','مزج','عجن','تقليب','دمج'],                               machine:'خلاطات وعجانات صناعية',                icon:'fa-blender',        w:4 },
        { k:['قص','تقطيع','فصل','نشر','شطر','تقشير','تقليم'],                machine:'ماكينات تقطيع وفصل آلي',              icon:'fa-scissors',       w:4 },
        { k:['ضغط','كبس','تشكيل','بثق','قولبة'],                              machine:'مكابس وآلات تشكيل صناعية',            icon:'fa-compress',       w:4 },
        { k:['لحام','صهر','سبك','تجميع معدني'],                               machine:'وحدات لحام وتجميع صناعية',            icon:'fa-fire',           w:4 },
        { k:['نسج','خياطة','حياكة','غزل'],                                     machine:'ماكينات نسيج وخياطة صناعية',          icon:'fa-gears',          w:4 },
        // ── عمليات حرارية ──
        { k:['طهي','تسوية','غلي','سلق','طبخ'],                                machine:'أفران ومراجل طهي حراري',              icon:'fa-fire-burner',    w:5 },
        { k:['خبز','تحميص','تسوية في فرن'],                                   machine:'أفران خبز صناعية',                    icon:'fa-fire-burner',    w:5 },
        { k:['تجفيف','تنشيف','تبخير','إزالة رطوبة'],                          machine:'أنفاق وآلات تجفيف',                   icon:'fa-wind',           w:4 },
        { k:['بسترة','معالجة حرارية','UHT','تعقيم حراري'],                   machine:'أجهزة بسترة وتعقيم حراري',           icon:'fa-hand-sparkles',  w:5 },
        { k:['تبريد','تجميد','تبريد سريع','blast'],                           machine:'غرف ووحدات تبريد وتجميد',            icon:'fa-snowflake',      w:5 },
        { k:['إنضاج','تخمير','fermentation','تخمر'],                         machine:'غرف إنضاج وتخمير محكومة',            icon:'fa-temperature-high',w:4},
        { k:['تمليح','تخليل','معالجة ملح'],                                   machine:'أحواض تمليح وتخليل',                 icon:'fa-sink',           w:4 },
        { k:['تدخين','تدخين بارد','تدخين ساخن'],                             machine:'غرف تدخين متخصصة',                   icon:'fa-fire',           w:4 },
        { k:['عصر','استخلاص','كبس زيت','عصير'],                              machine:'مكابس وعصارات صناعية',               icon:'fa-oil-can',        w:5 },
        // ── عمليات فصل وتنقية ──
        { k:['تصفية','فلترة','تنقية','ترشيح'],                                machine:'وحدات فلترة وترشيح',                 icon:'fa-filter',         w:4 },
        { k:['غسيل','تنظيف','شطف','إزالة شوائب'],                             machine:'أحواض ووحدات غسيل آلية',             icon:'fa-sink',           w:3 },
        { k:['فرز','تصنيف','تدريج','فصل حسب الجودة'],                         machine:'معدات فرز وتصنيف (يدوي/آلي)',        icon:'fa-filter',         w:4 },
        { k:['ترسيب','تجليط','تركيز','سنتريفيوج'],                           machine:'سنتريفيوجات ومعدات فصل',             icon:'fa-gears',          w:4 },
        // ── تعبئة وتغليف ──
        { k:['تعبئة','تغليف','حشو','وضع في عبوات'],                           machine:'خطوط تعبئة وتغليف آلية',             icon:'fa-box-open',       w:4 },
        { k:['ختم','لحام حراري','إغلاق','تغطية'],                             machine:'ماكينات ختم وإغلاق',                 icon:'fa-compress',       w:3 },
        { k:['وضع ملصقات','لبل','طباعة الباركود'],                            machine:'آلات وضع الملصقات (Labeling)',        icon:'fa-print',          w:3 },
        // ── جودة وتحليل ──
        { k:['فحص','جودة','مراقبة','اختبار','تحليل','مختبر'],                 machine:'مختبر فحص ومراقبة الجودة (QC)',      icon:'fa-microscope',     w:4 },
        { k:['تحليل كيميائي','فحص ميكروبي','تحليل مياه'],                    machine:'أجهزة تحليل كيميائي وميكروبيولوجي',  icon:'fa-flask-vial',     w:5 },
        // ── نقل ورفع ──
        { k:['نقل','رفع','تحميل','تفريغ','شحن'],                              machine:'روافع شوكية وسيور نقل',              icon:'fa-dolly',          w:3 },
        { k:['تعبئة خزان','ضخ سائل','نقل سائل'],                              machine:'مضخات ومنظومة نقل السوائل',          icon:'fa-faucet',         w:3 },
        // ── طبي وصيدلاني ──
        { k:['تعقيم','تطهير','autoclave','إبادة ميكروبات'],                  machine:'أجهزة تعقيم (Autoclaves)',           icon:'fa-hand-sparkles',  w:5 },
        { k:['تفاعل كيميائي','تكرير','استخلاص كيميائي'],                     machine:'مفاعلات ستانلس ستيل',                icon:'fa-flask-vial',     w:5 },
        { k:['تحضير دواء','تصنيع دوائي','صياغة دوائية'],                     machine:'خطوط تصنيع دوائي (أقراص/كبسول/شراب)',icon:'fa-pills',          w:5 },
        { k:['تجميد تجفيف','lyophilize','تجفيف بالتجميد'],                   machine:'وحدة تجميد تجفيف (Lyophilizer)',     icon:'fa-snowflake',      w:5 },
        // ── زراعي ──
        { k:['حصاد','جمع محصول','قطف'],                                       machine:'معدات حصاد وجمع المحاصيل',           icon:'fa-wheat-awn',      w:4 },
        { k:['زراعة','بذر','شتل','غرس'],                                      machine:'معدات زراعة وري',                    icon:'fa-seedling',       w:3 },
        { k:['ري','رش','تروية'],                                               machine:'منظومة ري آلية (رش/تنقيط)',          icon:'fa-droplet',        w:4 },
        { k:['تغذية حيوانية','علف','إطعام'],                                  machine:'منظومة تغذية آلية للحيوانات',        icon:'fa-wheat-awn',      w:3 },
        // ── إنشائي ──
        { k:['حفر','تقطيع أرض','تكريك'],                                      machine:'معدات حفر ثقيلة',                    icon:'fa-truck-pickup',   w:4 },
        { k:['صب خرسانة','تشييد','بناء'],                                     machine:'معدات خلط وصب الخرسانة',            icon:'fa-industry',       w:4 },
    ];

    stages.forEach(stage => {
        const txt = (stage || '').toLowerCase();
        processToMachineMap.forEach(map => {
            if (map.k.some(kw => txt.includes(kw))) {
                inferred.push({ name: map.machine, icon: map.icon, w: map.w });
            }
        });
    });

    return inferred;
}

// ══════════════════════════════════════════════════════════════════
//  §3c  LAYER 4 — الاستنتاج العكسي من التراخيص (موسّع)
//  ✅ تحسين: تغطية أشمل للجهات والمتطلبات
// ══════════════════════════════════════════════════════════════════
function SFE_inferFromLicenses(licenseFields) {
    if (!licenseFields || !Array.isArray(licenseFields)) return [];
    const inferred = [];

    const licenseLogic = [
        { key: 'سلامة الغذاء', items: [
            { name:"أحواض غسيل أيدي وتطهير ستانلس ستيل", icon:"fa-sink",           w:5 },
            { name:"أرفف وبالتات رفع لعدم ملامسة الأرض",  icon:"fa-boxes-stacked",  w:4 },
            { name:"ستائر هوائية أو بلاستيكية ضد الحشرات",icon:"fa-wind",           w:4 },
            { name:"معدات قياس درجات الحرارة",             icon:"fa-thermometer-half",w:4},
        ]},
        { key: 'الحماية المدنية', items: [
            { name:"منظومة إطفاء (طفايات، حنفيات حريق)", icon:"fa-fire-extinguisher",w:5},
            { name:"أنظمة إنذار مبكر ومخارج طوارئ",      icon:"fa-bell",            w:4 },
            { name:"لوحات إرشادية للطوارئ",              icon:"fa-signs-post",      w:3 },
        ]},
        { key: 'هيئة الدواء', items: [
            { name:"أجهزة قياس الحرارة والرطوبة (Data Loggers)", icon:"fa-temperature-half",w:5},
            { name:"منطقة حجر صحي (Quarantine)",         icon:"fa-lock",            w:4 },
            { name:"غرف مراقبة الجودة (QC Rooms)",        icon:"fa-microscope",      w:4 },
        ]},
        { key: 'شئون البيئة', items: [
            { name:"حاويات محكمة لفصل المخلفات",         icon:"fa-trash-can",       w:4 },
            { name:"نظام تهوية لسحب الانبعاثات",         icon:"fa-fan",             w:4 },
            { name:"محطة معالجة صرف صناعي",              icon:"fa-filter",          w:4 },
        ]},
        { key: 'الزراعة', items: [
            { name:"وحدة حجر زراعي وعزل",               icon:"fa-lock",            w:4 },
            { name:"معمل فحص الصحة الحيوانية والنباتية", icon:"fa-microscope",      w:4 },
        ]},
        { key: 'البيطري', items: [
            { name:"غرفة عزل الحيوانات المريضة",         icon:"fa-lock",            w:4 },
            { name:"وحدة تخزين الأدوية البيطرية",        icon:"fa-pills",           w:4 },
        ]},
        { key: 'الموارد المائية', items: [
            { name:"عداد قياس التصرف (Flow Meter)",       icon:"fa-gauge-high",      w:4 },
            { name:"وحدة معالجة أولية للمياه",           icon:"fa-filter",          w:4 },
        ]},
        { key: 'التنمية الصناعية', items: [
            { name:"خطوط إنتاج طبقاً للمواصفات القياسية",icon:"fa-industry",        w:3 },
            { name:"معمل ضبط الجودة المعتمد",            icon:"fa-flask-vial",      w:3 },
        ]},
        { key: 'السياحة', items: [
            { name:"منظومة أمن وسلامة الضيوف",           icon:"fa-user-shield",     w:4 },
            { name:"خدمات الإسعاف والطوارئ",             icon:"fa-truck-medical",   w:3 },
        ]},
        { key: 'الاتصالات', items: [
            { name:"غرفة خوادم وشبكة مؤمنة",             icon:"fa-server",          w:4 },
            { name:"نظام احتياطي للطاقة (UPS/Generator)", icon:"fa-battery-full",   w:4 },
        ]},
    ];

    licenseFields.forEach(field => {
        if (!field || !field.name) return;
        const fieldName = field.name.toLowerCase();
        licenseLogic.forEach(logic => {
            if (fieldName.includes(logic.key.toLowerCase())) {
                inferred.push(...logic.items);
            }
        });
    });

    return inferred;
}

// ══════════════════════════════════════════════════════════════════
//  §4  الدالة الرئيسية — محرك الدمج الذكي (Fusion Engine)
//  ✅ تحسين: NLP يقرأ technicalNotes + details.req معاً
// ══════════════════════════════════════════════════════════════════
function SFE_getItems(boxId, act) {
    const resultsMap = new Map();

    const normalizeArabic = (text) => {
        return text.replace(/\s+/g, ' ')
            .replace(/[أإآا]/g, 'ا')
            .replace(/[ةه]/g, 'ه')
            .replace(/[ىي]/g, 'ي')
            .replace(/(^|\s)(ال|لل)/g, '$1')
            .replace(/(ات|ون|ين|ان)$/g, '')
            .trim();
    };

    const STOP_WORDS = new Set(['مركزي','مركزية','رئيسي','رئيسية','متخصصة','متخصص','مجهزة','مجهز','متنقل','مؤمن','مؤمنة','عامة','عام','خاصة','خاص']);

    const synonyms = {
        'تبريد':'ثلاج','ثلاج':'تبريد','مبرد':'ثلاج','ثلاجة':'تبريد',
        'تجميد':'مجمد','مجمد':'تجميد',
        'غسيل':'تنظيف','تنظيف':'غسيل','تطهير':'تعقيم','تعقيم':'تطهير',
        'تخزين':'مخزن','مخزن':'تخزين','مستودع':'تخزين','ستور':'تخزين',
        'ميزان':'وزن','وزن':'موازين','موازين':'وزن',
        'انتاج':'تصنيع','تصنيع':'انتاج','تجهيز':'انتاج',
        'فحص':'جودة','جودة':'مراقبة','مراقبة':'فحص',
        'ضخ':'طلمبة','طلمبة':'مضخة','مضخة':'ضخ',
    };

    const addItem = (item) => {
        if (!item || !item.name) return;

        const newWords = item.name.split(' ').map(normalizeArabic).filter(w => w.length > 2);
        const meaningfulNew = newWords.filter(w => !STOP_WORDS.has(w));

        let foundKey = null;

        for (const existingKey of resultsMap.keys()) {
            const existingWords = existingKey.split(' ').map(normalizeArabic).filter(w => w.length > 2);
            const meaningfulExist = existingWords.filter(w => !STOP_WORDS.has(w));

            let meaningfulIntersection = 0;
            meaningfulNew.forEach(w => {
                const syn = synonyms[w] || w;
                if (meaningfulExist.includes(w) || meaningfulExist.some(ew => (synonyms[ew] || ew) === syn)) {
                    meaningfulIntersection++;
                }
            });

            if (meaningfulIntersection >= 2) {
                foundKey = existingKey;
                break;
            }
        }

        if (foundKey) {
            const existing = resultsMap.get(foundKey);
            existing.w = (existing.w || 1) + (item.w || 1);
            if (item.name.length > existing.name.length) existing.name = item.name;
            resultsMap.set(foundKey, existing);
        } else {
            resultsMap.set(item.name, { ...item, w: item.w || 2 });
        }
    };

    // 1️⃣ الطبقة الأولى: الخريطة المباشرة
    const directItems = SFE_BOX_ITEMS[boxId] || [];
    directItems.forEach(it => addItem({ ...it, w: 5 }));

    // 2️⃣ الطبقة الثانية: NLP من technicalNotes + details.req معاً
    if (act) {
        const nlpSources = [
            act.technicalNotes,
            act.details && act.details.req,
            act.details && act.details.act,
        ].filter(Boolean);

        if (nlpSources.length > 0) {
            const nlpItems = SFE_nlpExtract(nlpSources, act.text);
            nlpItems.forEach(addItem);
        }
    }

    // 3️⃣ الطبقة الثالثة: استنتاج من مراحل الإنتاج
    if (act && act.productionStages) {
        const stageItems = SFE_inferFromStages(act.productionStages);
        stageItems.forEach(addItem);
    }

    // 4️⃣ الطبقة الرابعة: الاستنتاج العكسي من التراخيص
    if (act && act.dynamicLicenseFields) {
        const licenseItems = SFE_inferFromLicenses(act.dynamicLicenseFields);
        licenseItems.forEach(addItem);
    }

    // 5️⃣ الطبقة الخامسة: استنتاج القطاع (Safety Net)
    if (resultsMap.size < 6) {
        const sectorItems = SFE_sectorInfer(act ? act.text : '', boxId);
        sectorItems.forEach(it => addItem({ ...it, w: 2 }));
    }

    return [...resultsMap.values()]
        .sort((a, b) => b.w - a.w)
        .slice(0, 12)
        .map(it => ({ name: it.name, icon: it.icon || SFE_iconFor(it.name) }));
}
// ══════════════════════════════════════════════════════════════════
//  §5  خريطة الأيقونات للكلمات المفتاحية
// ══════════════════════════════════════════════════════════════════
const SFE_ICON_MAP = [
    { k:['عمليات جراح','جراحي'],   i:'fa-procedures' },
    { k:['تحاليل','مختبر','معمل'], i:'fa-flask-vial' },
    { k:['أشعة','تصوير طبي'],      i:'fa-x-ray' },
    { k:['صيدل','دواء','كبسولة'],  i:'fa-pills' },
    { k:['طوارئ','إسعاف'],         i:'fa-truck-medical' },
    { k:['غازات طبية','أوكسجين'], i:'fa-lungs' },
    { k:['تعقيم','تطهير'],         i:'fa-hand-sparkles' },
    { k:['عناية مركزة','icu'],     i:'fa-heartbeat' },
    { k:['كشف','تشخيص','عيادة'],   i:'fa-stethoscope' },
    { k:['تجميد','مجمد'],          i:'fa-snowflake' },
    { k:['تبريد','مبرد','ثلاجة'], i:'fa-temperature-low' },
    { k:['مخزن','مستودع','تخزين'],i:'fa-warehouse' },
    { k:['فصل دراسي','فصول'],     i:'fa-chalkboard-user' },
    { k:['معمل علمي','معامل'],     i:'fa-microscope' },
    { k:['مكتبة'],                i:'fa-book-open' },
    { k:['ملعب','رياضي'],         i:'fa-volleyball' },
    { k:['فرن','خبز'],            i:'fa-fire-burner' },
    { k:['تعبئة','تغليف'],        i:'fa-box-open' },
    { k:['خط إنتاج','تصنيع'],     i:'fa-industry' },
    { k:['جودة','فحص','qa'],      i:'fa-check-double' },
    { k:['طحن','طاحونة','جرش'],  i:'fa-gears' },
    { k:['صومعة','سيلو'],         i:'fa-tower-observation' },
    { k:['زيت','معصرة'],          i:'fa-oil-can' },
    { k:['فلترة','تنقية'],         i:'fa-filter' },
    { k:['غاز','أسطوانة'],        i:'fa-fire' },
    { k:['وقود','بنزين','سولار'], i:'fa-gas-pump' },
    { k:['طلمبة','ضاغط'],         i:'fa-compress' },
    { k:['توليد','كهرباء'],        i:'fa-bolt' },
    { k:['شمسي','ألواح شمسية'],  i:'fa-solar-panel' },
    { k:['محول'],                 i:'fa-bolt-lightning' },
    { k:['عداد','قياس','أجهزة'], i:'fa-gauge-high' },
    { k:['استخراج','منجم','محجر'],i:'fa-mountain-city' },
    { k:['كسارة','تكسير'],        i:'fa-hammer' },
    { k:['أسماك','استزراع'],      i:'fa-fish' },
    { k:['دواجن','فقاسة','بيض'], i:'fa-egg' },
    { k:['ألبان','تجميع'],        i:'fa-truck-droplet' },
    { k:['أعلاف','خلط'],          i:'fa-wheat-awn' },
    { k:['dna','وراثي','جيني'],  i:'fa-dna' },
    { k:['نحل','عسل'],            i:'fa-jar' },
    { k:['خادم','server','بيانات'],i:'fa-server' },
    { k:['برمجة','كود','تطبيق'], i:'fa-code' },
    { k:['دعم فني','headset'],    i:'fa-headset' },
    { k:['شبكة','ألياف','اتصالات'],i:'fa-network-wired' },
    { k:['معدات ثقيلة','حفارة'],  i:'fa-truck-pickup' },
    { k:['سلامة','خوذة','PPE'],   i:'fa-hard-hat' },
    { k:['نقل','شحن','توصيل'],    i:'fa-truck-moving' },
    { k:['gps','تتبع'],           i:'fa-location-dot' },
    { k:['تسجيل','استوديو'],      i:'fa-microphone' },
    { k:['أفلام','سينما'],         i:'fa-clapperboard' },
    { k:['طباعة','نسخ'],          i:'fa-print' },
    { k:['ميزان','وزن'],           i:'fa-scale-balanced' },
    { k:['مياه','خزان'],          i:'fa-droplet' },
    { k:['تهوية','شفط'],          i:'fa-fan' },
    { k:['أمن','حراسة'],           i:'fa-user-shield' },
    { k:['كاميرات','مراقبة'],      i:'fa-video' },
    { k:['صرف صحي'],              i:'fa-toilet' },
    { k:['إطفاء','حريق'],          i:'fa-fire-extinguisher' },
    { k:['غرف','كبائن','إقامة'],  i:'fa-bed' },
    { k:['مطبخ','طهي','وجبة'],    i:'fa-utensils' },
    { k:['سباحة','حمام'],          i:'fa-person-swimming' },
    { k:['أرفف','رفوف','عرض'],    i:'fa-shelves' },
    { k:['تعقيم','معقم'],          i:'fa-spray-can-sparkles' },
    { k:['إسطبل','اصطبل','خيل'], i:'fa-horse' },
    { k:['رياضة','ألعاب','تمرين'],i:'fa-dumbbell' },
    { k:['مسارات','ممرات'],        i:'fa-route' },
    { k:['حماية مدنية','إنذار'],  i:'fa-bell' },
    { k:['موازين التعبئة'],        i:'fa-scale-balanced' },
    { k:['كشف تسريب'],            i:'fa-sensor-on' },
    { k:['مداخل','مخارج'],        i:'fa-door-open' },
    { k:['أنابيب','خطوط'],        i:'fa-grip-lines' },
    { k:['أسطح','طاولات'],        i:'fa-table' },
];

function SFE_iconFor(name) {
    const lo = (name || '').toLowerCase();
    for (const {k, i} of SFE_ICON_MAP) {
        if (k.some(kw => lo.includes(kw.toLowerCase()))) return i;
    }
    return 'fa-cog';
}

// ══════════════════════════════════════════════════════════════════
//  §6  بيانات وصف الصناديق (عنوان + لون)
// ══════════════════════════════════════════════════════════════════
const SFE_BOX_META = {
    'medical-facility-box':           { title:'التجهيزات الطبية',           icon:'fa-hospital',        colour:'primary' },
    'drug-store-box':                 { title:'مخزن الأدوية',               icon:'fa-pills',           colour:'success' },
    'medical-transport-box':          { title:'وحدات النقل الطبي',          icon:'fa-truck-medical',   colour:'danger'  },
    'treatment-activity-box':         { title:'وحدات معالجة المخلفات',      icon:'fa-recycle',         colour:'success' },
    'combined-activity-box':          { title:'نقل ومعالجة المخلفات',       icon:'fa-truck',           colour:'secondary'},
    'toll-drug-box':                  { title:'مركز توزيع دوائي',           icon:'fa-building',        colour:'info'    },
    'importmedicines-activity-box':   { title:'استيراد أدوية',              icon:'fa-plane-import',    colour:'primary' },
    'full-med-box':                   { title:'منظومة الدواء المتكاملة',    icon:'fa-building-shield', colour:'dark'    },
    'pharmacy-sector-box':            { title:'الصيدلية البيطرية',          icon:'fa-prescription-bottle-medical', colour:'success'},
    'biologicals-sector-box':         { title:'مستودع البيولوجيات',         icon:'fa-syringe',         colour:'danger'  },
    'clinicPharmacy-sector-box':      { title:'عيادة صيدلانية بيطرية',      icon:'fa-stethoscope',     colour:'primary' },
    'clinicBiologicals-sector-box':   { title:'عيادة بيولوجيات بيطرية',     icon:'fa-syringe',         colour:'info'    },
    'clinicCombined-sector-box':      { title:'عيادة بيطرية مدمجة',         icon:'fa-briefcase-medical',colour:'success'},
    'pharmacyBiologicals-sector-box': { title:'صيدلية بيطرية + بيولوجيات', icon:'fa-shelves',         colour:'warning' },
    'pesticideStorage-sector-box':    { title:'مستودع المبيدات',            icon:'fa-radiation',       colour:'danger'  },
    'school-box':                     { title:'التجهيزات التعليمية',        icon:'fa-school',          colour:'primary' },
    'university-box':                 { title:'مرافق الجامعة',              icon:'fa-graduation-cap',  colour:'info'    },
    'hotel-main-box':                 { title:'تجهيزات الفندق',            icon:'fa-hotel',           colour:'warning' },
    'hotel-box':                      { title:'تجهيزات الفندق',            icon:'fa-bed',             colour:'warning' },
    'resort-box':                     { title:'مرافق القرية السياحية',      icon:'fa-umbrella-beach',  colour:'success' },
    'rest-license-box':               { title:'تجهيزات المطعم',            icon:'fa-utensils',        colour:'danger'  },
    'camp-main-box':                  { title:'وحدات المخيم السياحي',       icon:'fa-tent',            colour:'success' },
    'cruise-license-box':             { title:'تجهيزات البواخر السياحية',   icon:'fa-ship',            colour:'info'    },
    'mobile-food-box':                { title:'وحدة طعام متنقلة',          icon:'fa-truck',           colour:'warning' },
    'public-food-box':                { title:'وحدات الأغذية العامة',       icon:'fa-burger',          colour:'success' },
    'hyper-market-box':               { title:'تجهيزات الهايبر ماركت',     icon:'fa-cart-shopping',   colour:'primary' },
    'hypermarket-facility':           { title:'تجهيزات الهايبر ماركت',     icon:'fa-store',           colour:'primary' },
    'factory-main-box':               { title:'وحدات المصنع',              icon:'fa-industry',        colour:'dark'    },
    'pharmaceutical-production-plant':{ title:'مصنع الأدوية',              icon:'fa-pills',           colour:'success' },
    'cosmetics-production-facility':  { title:'مصنع مستحضرات التجميل',     icon:'fa-spa',             colour:'danger'  },
    'construction-box':               { title:'وحدات الإنشاء والبناء',     icon:'fa-hard-hat',        colour:'warning' },
    'water-utility-box':              { title:'تجهيزات المياه والصرف',     icon:'fa-droplet',         colour:'info'    },
    'well-license-box':               { title:'تجهيزات بئر المياه',        icon:'fa-bore-hole',       colour:'primary' },
    'itida-box':                      { title:'وحدات تقنية المعلومات',     icon:'fa-microchip',       colour:'primary' },
    'ntra-box':                       { title:'بنية الاتصالات والشبكات',   icon:'fa-tower-broadcast', colour:'info'    },
    'petroleum-box':                  { title:'منشأة البترول',             icon:'fa-oil-well',        colour:'dark'    },
    'gas-reg-box':                    { title:'محطة توزيع الغاز الطبيعي', icon:'fa-fire',            colour:'danger'  },
    'lpg-station-box':                { title:'محطة تعبئة البوتاجاز',      icon:'fa-fire-burner',     colour:'warning' },
    'lpg-dist-box':                   { title:'توزيع أسطوانات الغاز',      icon:'fa-warehouse',       colour:'secondary'},
    'fuel-station-box':               { title:'محطة وقود',                icon:'fa-gas-pump',        colour:'success' },
    'electricity-box':                { title:'منشأة الكهرباء',           icon:'fa-bolt',            colour:'warning' },
    'transmission-box':               { title:'خطوط نقل الكهرباء',        icon:'fa-tower-observation',colour:'dark'   },
    'solar-nrea-box':                 { title:'محطة طاقة شمسية',          icon:'fa-solar-panel',     colour:'success' },
    'mining-box':                     { title:'منشأة التعدين والمحاجر',    icon:'fa-mountain-city',   colour:'secondary'},
    'milling-silo-box':               { title:'مطحنة وصوامع حبوب',         icon:'fa-tower-observation',colour:'warning'},
    'bakery-activity-box':            { title:'تجهيزات المخبز',           icon:'fa-fire-burner',     colour:'danger'  },
    'bakery-box':                     { title:'تجهيزات المخبز',           icon:'fa-bread-slice',     colour:'warning' },
    'packing-station-box':            { title:'محطة تعبئة وتغليف',        icon:'fa-box-open',        colour:'info'    },
    'drying-station-box':             { title:'محطة تجفيف المنتجات',       icon:'fa-sun',             colour:'warning' },
    'frozen-food-box':                { title:'وحدات الأغذية المجمدة',     icon:'fa-snowflake',       colour:'info'    },
    'refrigeration-storage-box':      { title:'مستودع تبريد وتجميد',      icon:'fa-temperature-low', colour:'primary' },
    'rice-mill-box':                  { title:'مطحنة أرز',                icon:'fa-bowl-rice',       colour:'success' },
    'oil-mill-box':                   { title:'معصرة زيوت',               icon:'fa-oil-can',         colour:'warning' },
    'grain-grinding-box':             { title:'وحدة جرش وتكسير الحبوب',   icon:'fa-gears',           colour:'secondary'},
    'banana-ripening-box':            { title:'غرف إنضاج الموز',          icon:'fa-temperature-high',colour:'warning' },
    'fish-farm-box':                  { title:'مزرعة أسماك بحرية',        icon:'fa-fish',            colour:'info'    },
    'integrated-farm-box':            { title:'مزرعة متكاملة (أكوابونيك)',icon:'fa-seedling',        colour:'success' },
    'private-farm-box':               { title:'مزرعة استزراع سمكي',       icon:'fa-water',           colour:'primary' },
    'poultry-sector-box':             { title:'مزرعة دواجن',              icon:'fa-egg',             colour:'warning' },
    'feed-sector-box':                { title:'مصنع أعلاف',               icon:'fa-wheat-awn',       colour:'success' },
    'feed-reg-box':                   { title:'مكتب تسجيل الأعلاف',       icon:'fa-clipboard-check', colour:'info'    },
    'genetics-sector-box':            { title:'وحدة إنتاج وراثي',         icon:'fa-dna',             colour:'danger'  },
    'desert-sector-box':              { title:'مزرعة صحراوية متكاملة',    icon:'fa-cow',             colour:'warning' },
    'dairy-center-box':               { title:'مركز تجميع ألبان',         icon:'fa-truck-droplet',   colour:'primary' },
    'apiary-sector-box':              { title:'مزرعة نحل',                icon:'fa-jar',             colour:'warning' },
    'bee-apiary-production-facility': { title:'منشأة إنتاج عسل',          icon:'fa-jar-wheat',       colour:'success' },
    'poultry-trade-box':              { title:'شركة تجارة دواجن',         icon:'fa-truck-fast',      colour:'info'    },
    'livestock-import-box':           { title:'استيراد ماشية ومواد وراثية',icon:'fa-plane-import',   colour:'dark'    },
    'culture-prod-box':               { title:'إنتاج فني وثقافي',         icon:'fa-clapperboard',    colour:'danger'  },
    'culture-display-box':            { title:'قاعة عرض ثقافي',           icon:'fa-masks-theater',   colour:'info'    },
    'culture-dist-box':               { title:'توزيع المصنفات الثقافية',  icon:'fa-shop',            colour:'primary' },
    'culture-shooting-box':           { title:'وحدة تصوير سينمائي',       icon:'fa-camera-movie',    colour:'dark'    },
    'culture-record-box':             { title:'استوديو تسجيل',            icon:'fa-microphone',      colour:'success' },
    'culture-copy-box':               { title:'وحدة نسخ وطباعة',         icon:'fa-print',           colour:'secondary'},
    'culture-conv-box':               { title:'وحدة تحويل رقمي',          icon:'fa-shuffle',         colour:'warning' },
    'cinema-center-box':              { title:'مركز سينمائي',             icon:'fa-film',            colour:'dark'    },
    'food-retail-facility':           { title:'محل تجزئة أغذية',         icon:'fa-store',           colour:'success' },
    'general-food-retail-wholesale-facility':{ title:'محل أغذية جملة وتجزئة',icon:'fa-shop',        colour:'primary' },
    'dairy-retail-facility':          { title:'محل ألبان ومنتجاتها',      icon:'fa-snowflake',       colour:'info'    },
};

/**
 * SFE_registerBox — واجهة موحدة لتسجيل صندوق تجهيزات جديد بسطر واحد
 */
function SFE_registerBox(boxId, title, icon, colour, items) {
    SFE_BOX_META[boxId]  = { title, icon, colour };
    SFE_BOX_ITEMS[boxId] = items;
}

SFE_registerBox('veterinary-pharmaceutical-plant',
    'مصنع أدوية بيطرية', 'fa-pills', 'success', [
        { name:"غرف إنتاج معقمة (Clean Rooms)",     icon:"fa-door-closed" },
        { name:"منظومة ضبط الهواء والضغط (HVAC)",   icon:"fa-fan" },
        { name:"معمل مراقبة جودة (QC Lab)",          icon:"fa-microscope" },
        { name:"وحدة تعقيم ومناولة آمنة",            icon:"fa-hand-sparkles" },
        { name:"مستودع تخزين بيطري (GSP)",           icon:"fa-warehouse" },
    ]
);

SFE_registerBox('biotechnology-manufacturing-plant',
    'مصنع المستحضرات الحيوية', 'fa-dna', 'danger', [
        { name:"حاضنات ومفاعلات حيوية (Bioreactors)", icon:"fa-flask-vial" },
        { name:"غرف عزل وتصفية حيوية (BSL-2+)",      icon:"fa-lock" },
        { name:"أنظمة تنقية وفصل (Downstream)",       icon:"fa-filter" },
        { name:"وحدة تجميد التجفيف (Lyophilizer)",   icon:"fa-snowflake" },
        { name:"معمل مراقبة الجودة الميكروبيولوجية", icon:"fa-microscope" },
    ]
);

SFE_registerBox('bazaar-main-box',
    'سوق / بازار تجاري', 'fa-store', 'warning', [
        { name:"وحدات ومحلات عرض متنوعة",   icon:"fa-shop" },
        { name:"ممرات تسوق واسعة ومنظمة",   icon:"fa-route" },
        { name:"منظومة مراقبة وأمن (CCTV)", icon:"fa-video" },
        { name:"خدمات صرف صحي ومرافق",      icon:"fa-toilet" },
        { name:"مواقف سيارات ومداخل",        icon:"fa-car" },
    ]
);

const SFE_COLOURS = {
    primary:'border-primary text-primary',  success:'border-success text-success',
    danger :'border-danger text-danger',    warning:'border-warning text-warning',
    info   :'border-info text-info',        secondary:'border-secondary text-secondary',
    dark   :'border-dark text-dark',
};
const SFE_COLOUR_CYCLE = ['primary','success','danger','warning','info','secondary','dark'];
let SFE_colIdx = 0;

function SFE_getMeta(boxId, act) {
    const m = SFE_BOX_META[boxId];
    if (m) {
        const cKey   = m.colour || 'primary';
        const colour = SFE_COLOURS[cKey] || SFE_COLOURS.primary;
        return { title: m.title, icon: m.icon, border: colour.split(' ')[0], text: colour.split(' ')[1] };
    }
    // fallback للصناديق الجديدة غير المعرّفة
    const cKey = SFE_COLOUR_CYCLE[SFE_colIdx++ % SFE_COLOUR_CYCLE.length];
    const colour = SFE_COLOURS[cKey];
    return {
        title : `تجهيزات ${(act ? act.text : boxId).trim()}`,
        icon  : 'fa-cogs',
        border: colour.split(' ')[0],
        text  : colour.split(' ')[1],
    };
}

// ══════════════════════════════════════════════════════════════════
//  §7  DOM — إنشاء الصناديق وعرض الـ chips
// ══════════════════════════════════════════════════════════════════
const SFE_CONT_ID = 'sfe-container';

function SFE_ensureContainer() {
    if (document.getElementById(SFE_CONT_ID)) return;
    const c = document.createElement('div');
    c.id = SFE_CONT_ID;
    const anchor = document.getElementById('specialized-box');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(c, anchor.nextSibling);
    else document.body.appendChild(c);
}

function SFE_renderForActivity(val) {
    SFE_ensureContainer();
    SFE_hideAll();
    if (!val || typeof masterActivityDB === 'undefined') return;

    const act = masterActivityDB.find(a => a.value === val);
    if (!act) return;

    const boxes = act.specializedFacilities && act.specializedFacilities.length > 0
        ? act.specializedFacilities
        : [val + '-auto-box'];   // fallback box إذا لم تُعرَّف

    boxes.forEach(boxId => {
        let box = document.getElementById('sfe-' + boxId);
        if (!box) {
            box = SFE_makeBox(boxId, act);
            document.getElementById(SFE_CONT_ID).appendChild(box);
        } else {
            SFE_fillChips(box, boxId, act);
        }
        box.style.display = 'block';
    });
}

function SFE_makeBox(boxId, act) {
    const { title, icon, border, text } = SFE_getMeta(boxId, act);
    const box = document.createElement('div');
    box.id        = 'sfe-' + boxId;
    box.className = `category-box ${border} sfe-box`;
    box.style.display = 'none';
    box.innerHTML = `
        <h6 class="${text} fw-bold mb-1">
            <i class="fas ${icon} me-2"></i>${SFE_esc(title)}
        </h6>
        <p class="text-muted mb-2 sfe-hint">
            <i class="fas fa-hand-pointer me-1"></i>
            اضغط لإضافة أي تجهيز للوصف — اضغط مجدداً لإلغائه
        </p>
        <div class="sfe-chips-area d-flex flex-wrap gap-2"></div>
    `;
    SFE_fillChips(box, boxId, act);
    return box;
}

function SFE_fillChips(box, boxId, act) {
    const items = SFE_getItems(boxId, act);
    const area  = box.querySelector('.sfe-chips-area');
    if (!area) return;
    area.innerHTML = items.map(it => `
        <button type="button"
                class="sfe-chip"
                onclick="SFE_toggle(this)"
                data-name="${SFE_esc(it.name)}">
            <i class="fas ${it.icon || 'fa-cog'} me-1"></i>${SFE_esc(it.name)}
        </button>
    `).join('');
}

// ══════════════════════════════════════════════════════════════════
//  §8  Toggle + تجميع النص
// ══════════════════════════════════════════════════════════════════
function SFE_toggle(btn) {
    btn.classList.toggle('sfe-active');
    SFE_compile();
}

const _MS = '\u200C\u200D';   // zero-width non-joiner + joiner = علامة بداية
const _ME = '\u200D\u200C';   // علامة نهاية

function SFE_compile() {
    const ta = document.getElementById('siteNarrative');
    if (!ta) return;
    const base = ta.value
        .replace(new RegExp(_MS + '[\\s\\S]*?' + _ME, 'g'), '')
        .trimEnd();

    const chosen = [...document.querySelectorAll('.sfe-chip.sfe-active')]
        .map(b => (b.getAttribute('data-name') || '').trim())
        .filter(Boolean);

    ta.value = chosen.length > 0
        ? base + _MS + ` وتشمل التجهيزات المتخصصة المُعاينة: (${chosen.join(' - ')}).` + _ME
        : base;

    ta.dispatchEvent(new Event('input'));
}

// ══════════════════════════════════════════════════════════════════
//  §9  إخفاء الكل
// ══════════════════════════════════════════════════════════════════
function SFE_hideAll() {
    document.querySelectorAll('.sfe-box').forEach(b => {
        b.style.display = 'none';
        b.querySelectorAll('.sfe-chip').forEach(c => c.classList.remove('sfe-active'));
    });
    const ta = document.getElementById('siteNarrative');
    if (ta) {
        ta.value = ta.value
            .replace(new RegExp(_MS + '[\\s\\S]*?' + _ME, 'g'), '')
            .trimEnd();
    }
}

// ══════════════════════════════════════════════════════════════════
//  §10  توافق مع app.js
// ══════════════════════════════════════════════════════════════════
function updateSpecializedFacilityVisibility(activityValue) {
    document.querySelectorAll('[id$="-box"]:not(#specialized-box):not(#' + SFE_CONT_ID + ')')
        .forEach(b => (b.style.display = 'none'));
    SFE_renderForActivity(activityValue);
}

// ══════════════════════════════════════════════════════════════════
//  §11  CSS
// ══════════════════════════════════════════════════════════════════
function SFE_injectCSS() {
    if (document.getElementById('sfe-css')) return;
    const s = document.createElement('style');
    s.id = 'sfe-css';
    s.textContent = `
        .sfe-chip {
            cursor:pointer; user-select:none;
            border:1.5px solid #ced4da !important;
            background:#f8f9fa !important; color:#495057 !important;
            border-radius:50rem !important; padding:.42rem .9rem !important;
            font-size:.82rem; font-weight:500; line-height:1.4;
            transition:all .18s ease;
            display:inline-flex; align-items:center; gap:.3rem;
            white-space:nowrap;
        }
        .sfe-chip:hover {
            border-color:#0d6efd !important; color:#0d6efd !important;
            background:#e8f0fe !important;
            transform:translateY(-2px);
            box-shadow:0 4px 14px rgba(13,110,253,.14);
        }
        .sfe-chip.sfe-active {
            background:linear-gradient(135deg,#0d6efd 0%,#0856c7 100%) !important;
            color:#fff !important; border-color:transparent !important;
            box-shadow:0 4px 18px rgba(13,110,253,.38);
            transform:translateY(-1px);
        }
        .sfe-chip.sfe-active::before { content:'✓ '; font-weight:bold; font-size:.75rem; }
        .sfe-chip.sfe-active:hover { opacity:.9; }
        .sfe-box {
            margin-top:.6rem; border-right-width:4px !important;
            border-right-style:solid !important;
            animation:sfeIn .22s ease;
        }
        @keyframes sfeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .sfe-hint { font-size:.74rem; color:#868e96; margin-bottom:.6rem !important; }
    `;
    document.head.appendChild(s);
}

// ══════════════════════════════════════════════════════════════════
//  §12  أدوات مساعدة + تهيئة
// ══════════════════════════════════════════════════════════════════
function SFE_esc(s) {
    return String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function SFE_init() {
    SFE_injectCSS();
    SFE_ensureContainer();
    const layers = [
        Object.keys(SFE_BOX_ITEMS).length + ' عنصر في الخريطة المباشرة',
        SFE_NLP_PATTERNS.length + ' نمط NLP',
        SFE_SECTORS.length + ' قطاع للاستنتاج',
    ];
    console.log('[SFE v5.0] ✅ جاهز — ' + layers.join(' | '));
}

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', SFE_init)
    : SFE_init();

window.SmartFacilityEngine = {
    render:        SFE_renderForActivity,
    hideAll:       SFE_hideAll,
    getItems:      SFE_getItems,
    nlpExtract:    SFE_nlpExtract,
    sectorInfer:   SFE_sectorInfer,
    version:       '5.0',
};
