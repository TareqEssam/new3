/**
 * main_logic.js - المحرك الموحد
 */

// 1. تهيئة الكائنات العالمية على مستوى النافذة لضمان عدم حدوث SyntaxError
window.licenseDB = window.licenseDB || {};
window.productionStagesDB = window.productionStagesDB || {};
window.technicalNotesDB = window.technicalNotesDB || {};
window.licenseFieldsDB = window.licenseFieldsDB || {};

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 جاري تهيئة النظام الشامل...");

    // 2. بناء جسور البيانات
    if (typeof masterActivityDB !== 'undefined') {
        masterActivityDB.forEach(act => {
            window.licenseDB[act.value] = act.details;
            window.productionStagesDB[act.value] = act.productionStages;
            window.technicalNotesDB[act.value] = act.technicalNotes;
            window.licenseFieldsDB[act.value] = act.dynamicLicenseFields;
        });
        console.log("✅ تم بناء جسور البيانات بنجاح");
    }

    // 3. ملء القائمة
    populateActivitySelect(masterActivityDB);

    // 4. تشغيل البحث العصبي
    if (typeof initializeNeuralSearch === 'function') {
        initializeNeuralSearch('activityTypeSearch', 'activityTypeSearchResults', 'activityTypeSelect', masterActivityDB);
    }
    
    // 5. تهيئة نظام البحث في القرار 104
    if (typeof initializeSearchDB === 'function') {
        initializeSearchDB();
    }
    
    // 6. تهيئة التجهيزات (الشاشة 7)
    if (typeof initSiteDescriptionSystem === 'function') {
        initSiteDescriptionSystem();
    }
});
function populateActivitySelect(database) {
    const selectElement = document.getElementById('activityTypeSelect');
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="">-- اختر النشاط --</option>';
    database.forEach(activity => {
        const option = document.createElement('option');
        option.value = activity.value;
        option.text = activity.text;
        selectElement.appendChild(option);
    });
}

// دالة تحديث التراخيص والمراحل (إصلاح الـ IDs)
function updateLicenseRequirements() {
    const select = document.getElementById('activityTypeSelect');
    const selectedValue = select.value;
    if (!selectedValue) return;

    const activity = masterActivityDB.find(item => item.value === selectedValue);

    if (activity) {
        // تحديث حقول التراخيص (الـ IDs الصحيحة الموجودة في HTML)
        if(document.getElementById('actLicense')) document.getElementById('actLicense').innerText = activity.text;
        if(document.getElementById('reqLicense')) document.getElementById('reqLicense').innerText = activity.details?.req || 'غير متوفر';
        if(document.getElementById('authLicense')) document.getElementById('authLicense').innerText = activity.details?.auth || 'غير متوفر';
        if(document.getElementById('reqLocation')) document.getElementById('reqLocation').innerText = activity.details?.loc || 'غير متوفر';
        if(document.getElementById('legalBasis')) document.getElementById('legalBasis').innerText = activity.details?.leg || 'غير متوفر';
        if(document.getElementById('guideNameDisplay')) document.getElementById('guideNameDisplay').innerText = activity.details?.guid || 'غير متوفر';

        // إظهار منطقة النتائج
        if(document.getElementById('licenseResultArea')) document.getElementById('licenseResultArea').style.display = 'block';

        // تحديث الملاحظات الفنية تلقائياً
        const techNotesArea = document.getElementById('technicalNotesTextarea');
        if (techNotesArea) techNotesArea.value = activity.technicalNotes || '';

        // استدعاء وظائف التحديث الإضافية في HTML
        if (typeof loadDynamicLicenseFields === 'function') loadDynamicLicenseFields(selectedValue);
        if (typeof updateSpecializedFacilityVisibility === 'function') updateSpecializedFacilityVisibility(selectedValue);
        if (typeof initProductionFlow === 'function') initProductionFlow(selectedValue);
    }
}

// -------------------------------------------------------------------
// منظومة التنقل بين الشاشات الرئيسية 
// -------------------------------------------------------------------

// 1. دالة مساعدة لتوحيد عملية التنقل وتنظيف أي ستايلات معلقة تعيق الظهور
function navigateToStep(stepId) {
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = ''; // ✨ تفريغ الستايل المباشر للسماح للـ CSS بالتحكم الصحيح
    });
    
    const targetStep = document.getElementById(stepId);
    if (targetStep) {
        targetStep.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 2. دالة تسجيل الدخول - الانتقال إلى الشاشة الثانية
function handleLogin() {
    navigateToStep('step2');
}

// 3. دالة تسجيل الخروج - الانتقال إلى شاشة الخروج
function handleLogout() {
    navigateToStep('step-logout');
}

// 4. دالة للعودة لصفحة تسجيل الدخول بأمان
function goToLogin() {
    navigateToStep('step1');
}

// دالة إظهار وإخفاء حقول النصوص في شاشة "رأي اللجنة"
function toggleTextArea(elementId, isChecked) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = isChecked ? 'block' : 'none';
    }
}

// ربط الدالة بـ window لتعمل بشكل صحيح مع onchange في الـ HTML
window.toggleTextArea = toggleTextArea;

// ربط الدوال بالكائن window لضمان عمل أزرار onclick في الـ HTML بشكل دائم
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.goToLogin = goToLogin;


