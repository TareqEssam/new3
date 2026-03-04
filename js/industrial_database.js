
// متغيرات المناطق الصناعية
let industrialMap = null;
let industrialCurrentMarker = null;
let industrialFilteredAreas = [];

// تهيئة قسم المناطق الصناعية
// تهيئة قسم المناطق الصناعية
function initIndustrialAreas() {
    const card = document.getElementById('industrialAreasCard');
    const content = document.getElementById('industrialAreasContent');
    
    // إنشاء محتوى المناطق الصناعية
    content.innerHTML = `
        <div class="industrial-styles">
            <div class="container">
                <!-- قسم الفلاتر والإحصائيات -->
                <section class="industrial-filters-section">
                    <h3><i class="fas fa-filter"></i> تصفية المناطق الصناعية وفقاً:-</h3>
                    
                    <div class="industrial-filter-row">
                        <div class="industrial-filter-group">
                            <label for="industrial-dependency-filter"><i class="fas fa-building"></i> الجهة التابعة لها المنطقة</label>
                            <select id="industrial-dependency-filter" class="industrial-filter-select">
                                <option value="">عرض الكل</option>
                            </select>
                        </div>
                        
                        <div class="industrial-filter-group">
                            <label for="industrial-governorate-filter"><i class="fas fa-map-marker-alt"></i> المحافظة</label>
                            <select id="industrial-governorate-filter" class="industrial-filter-select">
                                <option value="">كافة المحافظات</option>
                            </select>
                        </div>
                        
                        <div class="industrial-filter-group">
                            <label for="industrial-search-input"><i class="fas fa-search"></i> بحث باسم المنطقة</label>
                            <input type="text" id="industrial-search-input" class="industrial-search-input" placeholder="ابحث عن منطقة صناعية...">
                        </div>
                    </div>
                    
                    <div class="industrial-stats">
                        <div class="industrial-stat-item">
                            <div class="industrial-stat-value" id="industrial-total-areas">0</div>
                            <div class="industrial-stat-label">منطقة صناعية</div>
                        </div>
                        <div class="industrial-stat-item">
                            <div class="industrial-stat-value" id="industrial-total-governorates">0</div>
                            <div class="industrial-stat-label">محافظة</div>
                        </div>
                        <div class="industrial-stat-item">
                            <div class="industrial-stat-label">إجمالي المساحة</div>
                            <div class="industrial-stat-value" id="industrial-total-area-size">0</div>
                            <div class="industrial-stat-label">فدان</div>
                        </div>
                        <div class="industrial-stat-item">
                            <div class="industrial-stat-label">عدد الجهات</div>
                            <div class="industrial-stat-value" id="industrial-total-dependencies">0</div>
                            <div class="industrial-stat-label">جهة</div>
                        </div>
                    </div>
                </section>

                <!-- جدول المناطق الصناعية -->
                <section class="industrial-table-section">
                    <div class="industrial-table-header">
                        <h3><i class="fas fa-table"></i> قائمة المناطق الصناعية المعتمدة</h3>
                    </div>
                    
                    <div class="industrial-table-container">
                        <table class="industrial-table" id="industrial-areas-table">
                            <thead>
                                <tr>
                                    <th>اسم المنطقة</th>
                                    <th>التبعية</th>
                                    <th>المحافظة</th>
                                    <th>المساحة (فدان)</th>
                                    <th>قرار الإنشاء</th>
                                </tr>
                            </thead>
                            <tbody id="industrial-table-body">
                                <!-- سيتم ملء البيانات ديناميكيًا -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- رسالة عدم وجود نتائج -->
                    <div class="industrial-no-results" id="industrial-no-results">
                        <i class="fas fa-industry"></i>
                        <h4>لا توجد مناطق صناعية تطابق معايير البحث</h4>
                        <p>حاول تغيير معايير التصفية أو البحث</p>
                    </div>
                </section>
            </div>
        </div>
    `;
    
    // تهيئة البيانات والعناصر
    initIndustrialData();
    industrialFilteredAreas = [...industrialAreasData];
    renderIndustrialAreasTable();
    updateIndustrialStats();
    setupIndustrialFilters();
    
    // إعداد المودال - بعد إنشاء المحتوى مباشرة
    setupIndustrialModal();
}

// تهيئة بيانات المناطق الصناعية
function initIndustrialData() {
    // التحقق من وجود العناصر أولاً
    const dependencyFilter = document.getElementById('industrial-dependency-filter');
    const governorateFilter = document.getElementById('industrial-governorate-filter');
    
    if (!dependencyFilter || !governorateFilter) {
        console.error('عناصر الفلتر غير موجودة');
        return;
    }
    
    // ملء قائمة التبعيات
    industrialDependencies.forEach(dependency => {
        const option = document.createElement('option');
        option.value = dependency;
        option.textContent = dependency;
        dependencyFilter.appendChild(option);
    });
    
    // استخراج قيم فريدة للمحافظات
    const governorates = [...new Set(industrialAreasData.map(area => area.governorate))];
    
    // ملء قائمة المحافظات
    governorates.sort().forEach(governorate => {
        const option = document.createElement('option');
        option.value = governorate;
        option.textContent = governorate;
        governorateFilter.appendChild(option);
    });
}

// عرض المناطق في الجدول
function renderIndustrialAreasTable() {
    const tableBody = document.getElementById('industrial-table-body');
    const noResults = document.getElementById('industrial-no-results');
    const table = document.getElementById('industrial-areas-table');
    
    // التحقق من وجود العناصر
    if (!tableBody || !noResults || !table) {
        console.error('عناصر الجدول غير موجودة');
        return;
    }
    
    // مسح المحتوى الحالي
    tableBody.innerHTML = '';
    
    // التحقق إذا كانت هناك نتائج
    if (industrialFilteredAreas.length === 0) {
        table.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    // إظهار الجدول وإخفاء رسالة عدم وجود نتائج
    table.style.display = 'table';
    noResults.style.display = 'none';
    
    // عرض كل منطقة في صف
    industrialFilteredAreas.forEach(area => {
        const row = document.createElement('tr');
        
        // اسم المنطقة مع رابط قابل للنقر
        const nameCell = document.createElement('td');
        const nameLink = document.createElement('a');
        nameLink.href = '#';
        nameLink.className = 'industrial-area-link';
        nameLink.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${area.name}`;
        nameLink.addEventListener('click', (e) => {
            e.preventDefault();
            openIndustrialAreaModal(area);
        });
        nameCell.appendChild(nameLink);
        
        // التبعية
        const dependencyCell = document.createElement('td');
        const badgeClass = getIndustrialDependencyBadgeClass(area.dependency);
        dependencyCell.innerHTML = `<span class="industrial-area-badge ${badgeClass}">${area.dependency}</span>`;
        
        // المحافظة
        const governorateCell = document.createElement('td');
        governorateCell.innerHTML = `<span class="industrial-area-badge industrial-badge-secondary">${area.governorate}</span>`;
        
        // المساحة
        const areaCell = document.createElement('td');
        const areaValue = area.area === 0 || area.area === "0" ? "غير محدد" : formatIndustrialNumber(area.area);
        areaCell.innerHTML = `<span class="industrial-area-size">${areaValue}</span>`;
        
        // قرار الإنشاء (مختصر)
        const decisionCell = document.createElement('td');
        let shortDecision = area.decision || '';
        if (shortDecision.length > 50) {
            shortDecision = shortDecision.substring(0, 50) + '...';
        }
        shortDecision = shortDecision.replace(/\n/g, '، ');
        decisionCell.innerHTML = `<span title="${(area.decision || '').replace(/\n/g, '\n')}">${shortDecision}</span>`;
        
        // إضافة الخلايا إلى الصف
        row.appendChild(nameCell);
        row.appendChild(dependencyCell);
        row.appendChild(governorateCell);
        row.appendChild(areaCell);
        row.appendChild(decisionCell);
        
        // إضافة الصف إلى الجدول
        tableBody.appendChild(row);
    });
}

// تحديد فئة البادج بناءً على التبعية
function getIndustrialDependencyBadgeClass(dependency) {
    const dependencyClasses = {
        "المحافظة": "industrial-badge-primary",
        "الهيئة العامة للتنمية الصناعية": "industrial-badge-secondary",
        "الهيئة العامة للاستثمار والمناطق الحرة": "industrial-badge-tertiary",
        "الهيئة العامة للمنطقة الاقتصادية بمنطقة شمال غرب خليج السويس": "industrial-badge-primary",
        "هيئة المجتمعات العمرانية الجديدة": "industrial-badge-secondary",
        "وزارة الصناعة": "industrial-badge-tertiary",
        "بنك الاستثمار القومي": "industrial-badge-primary",
        "الشركة القومية للتشييد والتعمير": "industrial-badge-secondary"
    };
    
    return dependencyClasses[dependency] || "industrial-badge-primary";
}

// إعداد الفلاتر
function setupIndustrialFilters() {
    const dependencyFilter = document.getElementById('industrial-dependency-filter');
    const governorateFilter = document.getElementById('industrial-governorate-filter');
    const searchInput = document.getElementById('industrial-search-input');
    
    // تحديث القائمة عند تغيير الفلتر
    dependencyFilter.addEventListener('change', applyIndustrialFilters);
    governorateFilter.addEventListener('change', applyIndustrialFilters);
    searchInput.addEventListener('input', applyIndustrialFilters);
}

// تطبيق الفلاتر والبحث
function applyIndustrialFilters() {
    const dependencyFilter = document.getElementById('industrial-dependency-filter').value;
    const governorateFilter = document.getElementById('industrial-governorate-filter').value;
    const searchInput = document.getElementById('industrial-search-input').value.toLowerCase();
    
    // تصفية المناطق
    industrialFilteredAreas = industrialAreasData.filter(area => {
        // فلتر التبعية
        if (dependencyFilter && area.dependency !== dependencyFilter) {
            return false;
        }
        
        // فلتر المحافظة
        if (governorateFilter && area.governorate !== governorateFilter) {
            return false;
        }
        
        // بحث بالنص
        if (searchInput) {
            const searchText = searchInput.trim();
            const nameMatch = area.name.toLowerCase().includes(searchText);
            const governorateMatch = area.governorate.toLowerCase().includes(searchText);
            const dependencyMatch = area.dependency.toLowerCase().includes(searchText);
            
            if (!nameMatch && !governorateMatch && !dependencyMatch) {
                return false;
            }
        }
        
        return true;
    });
    
    // إعادة عرض الجدول
    renderIndustrialAreasTable();
    updateIndustrialStats();
}

// تحديث الإحصائيات
function updateIndustrialStats() {
    // عدد المناطق
    document.getElementById('industrial-total-areas').textContent = industrialFilteredAreas.length;
    
    // عدد المحافظات
    const uniqueGovernorates = [...new Set(industrialFilteredAreas.map(area => area.governorate))];
    document.getElementById('industrial-total-governorates').textContent = uniqueGovernorates.length;
    
    // إجمالي المساحة
    const totalArea = industrialFilteredAreas.reduce((sum, area) => {
        return sum + (area.area && area.area > 0 ? area.area : 0);
    }, 0);
    document.getElementById('industrial-total-area-size').textContent = formatIndustrialNumber(totalArea);
    
    // عدد التبعيات المختلفة
    const uniqueDependencies = [...new Set(industrialFilteredAreas.map(area => area.dependency))];
    document.getElementById('industrial-total-dependencies').textContent = uniqueDependencies.length;
}

// إعداد المودال
// إعداد المودال
function setupIndustrialModal() {
    const modalOverlay = document.getElementById('industrial-modal-overlay');
    const modalClose = document.getElementById('industrial-modal-close');
    
    // التحقق من وجود العناصر
    if (!modalOverlay || !modalClose) {
        console.warn('عناصر المودال غير موجودة أو لم يتم إنشاؤها بعد');
        return;
    }
    
    // إغلاق المودال عند النقر على الزر
    modalClose.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
        // تنظيف الخريطة عند الإغلاق
        if (window.industrialMap) {
            window.industrialMap.remove();
            window.industrialMap = null;
        }
    });
    
    // إغلاق المودال عند النقر خارج المحتوى
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
            // تنظيف الخريطة عند الإغلاق
            if (window.industrialMap) {
                window.industrialMap.remove();
                window.industrialMap = null;
            }
        }
    });
    
    // إغلاق المودال بمفتاح ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
            modalOverlay.style.display = 'none';
            // تنظيف الخريطة عند الإغلاق
            if (window.industrialMap) {
                window.industrialMap.remove();
                window.industrialMap = null;
            }
        }
    });
}


// فتح المودال لعرض تفاصيل المنطقة
function openIndustrialAreaModal(area) {
    const modalOverlay = document.getElementById('industrial-modal-overlay');
    const modalAreaName = document.getElementById('industrial-modal-area-name');
    const modalDependency = document.getElementById('industrial-modal-dependency');
    const modalGovernorate = document.getElementById('industrial-modal-governorate');
    const modalAreaSize = document.getElementById('industrial-modal-area-size');
    const modalDecision = document.getElementById('industrial-modal-decision');
    
    // التحقق من وجود عناصر المودال
    if (!modalOverlay || !modalAreaName || !modalDependency || !modalGovernorate || !modalAreaSize || !modalDecision) {
        console.error('عناصر المودال غير موجودة');
        alert('عذراً، حدث خطأ في تحميل تفاصيل المنطقة. يرجى تحديث الصفحة.');
        return;
    }
    
    // تعيين بيانات المنطقة
    modalAreaName.textContent = area.name;
    modalDependency.textContent = area.dependency;
    modalGovernorate.textContent = area.governorate;
    modalAreaSize.textContent = (area.area === 0 || area.area === "0") ? "غير محدد" : formatIndustrialNumber(area.area) + " فدان";
    modalDecision.textContent = area.decision ? area.decision.replace(/\n/g, '\n') : 'غير محدد';
    
    // إظهار المودال
    modalOverlay.style.display = 'flex';
    
    // تنظيف محتوى الخريطة الحالي
    const mapContainer = document.getElementById('industrial-area-map');
    if (mapContainer) {
        mapContainer.innerHTML = '';
    }
    
    // تهيئة الخريطة (مع إضافة تأخير بسيط لضمان تحميل العنصر)
    setTimeout(() => {
        if (area.x && area.y && area.x !== 0 && area.y !== 0) {
            initIndustrialMap(area.y, area.x, area.name);
        } else {
            // إذا لم تكن هناك إحداثيات
            if (mapContainer) {
                mapContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-map-marker-alt fa-2x mb-3"></i>
                        <p>لا تتوفر إحداثيات دقيقة لهذه المنطقة</p>
                    </div>
                `;
            }
        }
    }, 100);
}

// تهيئة الخريطة
function initIndustrialMap(lat, lng, areaName) {
    // إذا كانت هناك خريطة موجودة، قم بإزالتها أولاً
    if (industrialMap) {
        industrialMap.remove();
    }
    
    // إنشاء الخريطة مع إزالة عناصر التحكم الافتراضية
    industrialMap = L.map('industrial-area-map', {
        attributionControl: false
    }).setView([lat, lng], 13);
    
    // إضافة طبقة OpenStreetMap بدون Attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
    }).addTo(industrialMap);
    
    // إضافة علامة للموقع
    if (industrialCurrentMarker) {
        industrialMap.removeLayer(industrialCurrentMarker);
    }
    
    industrialCurrentMarker = L.marker([lat, lng]).addTo(industrialMap)
        .bindPopup(`<b>${areaName}</b><br>الموقع الجغرافي للمنطقة الصناعية`)
        .openPopup();
    
    // إضافة دائرة لتحديد المنطقة
    L.circle([lat, lng], {
        color: '#1a5f7a',
        fillColor: '#57cc99',
        fillOpacity: 0.2,
        radius: 500
    }).addTo(industrialMap);
    
    // التأكد من إزالة أي عناصر تحكم متبقية
    if (industrialMap.attributionControl) {
        industrialMap.attributionControl.remove();
    }
}

// تنسيق الأرقام (إضافة فواصل)
function formatIndustrialNumber(num) {
    if (typeof num !== 'number') return num;
    // إضافة خاصية numberingSystem: 'latn' لإجبار المتصفح على أرقام 0-9
    return num.toLocaleString('ar-EG', { numberingSystem: 'latn' });
}
//---------

// التحكم في إظهار/إخفاء بطاقة المناطق الصناعية
document.addEventListener('DOMContentLoaded', function() {
    const toggleCheckbox = document.getElementById('toggleIndustrialAreas');
    const industrialCard = document.getElementById('industrialAreasCard');
    
    if (toggleCheckbox && industrialCard) {
        toggleCheckbox.addEventListener('change', function() {
            if (this.checked) {
                industrialCard.style.display = 'block';
                // تأخير بسيط لضمان عرض البطاقة أولاً
                setTimeout(() => {
                    try {
                        initIndustrialAreas();
                    } catch (error) {
                        console.error('خطأ في تهيئة المناطق الصناعية:', error);
                    }
                }, 50);
            } else {
                industrialCard.style.display = 'none';
                // تنظيف الخريطة عند الإخفاء
                if (window.industrialMap) {
                    window.industrialMap.remove();
                    window.industrialMap = null;
                }
            }
        });
    }
});

// بيانات المناطق الصناعية الكاملة
const industrialAreasData = [
        // ============ مناطق تابعة للمحافظة ============
    // القاهرة
    {
        name: "المنطقة الصناعية بالشطر الخامس بزهراء المعادي",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 60,
        decision: "الانشاء : قرار محافظ رقم 186 لسنة 1979  والتعديل : قرار محافظ رقم 44 لسنة 1990",
        x: 31.322423078924,
        y: 29.961006164551
    },
    {
        name: "المنطقة الصناعية ارض عماد نصر ك 18",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 33,
        decision: "قرار محافظ رقم 199 لسنة 1989",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الصناعية بحي المرج",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 0,
        decision: "قرار محافظ رقم 1781 لسنة 2005 - قرار محافظ رقم 10464 لسنة 2018 (اعتماد مخطط التنمية العمرانية لحي المرج)",
        x: 31.36959,
        y: 30.16150
    },
    {
        name: "المنطقة الصناعية بمنطقة الاحلال والتجديد والمحصورة بين ش جوزيف تيتو وسكة حديد السويس- حي النزهة",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 0,
        decision: "قرار محافظ رقم 242 لسنة 1989",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الصناعية ب كيلو 19 والمحصورة بين سكة حديد جسر السويس وش جسر السويس- حي النزهة)",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 0,
        decision: "قرار محافظ رقم 1292 لسنة 1975",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الصناعية كيلو 6.5 مدينة السلام - حي النزهة",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 0,
        decision: "قرار محافظ رقم 1292 لسنة 1975",
        x: 0,
        y: 0
    },
    {
        name: " المنطقة  الصناعية شق الثعبان بطره",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 40,
        decision: "قرار محافظ رقم 672 لسنة 1999",
        x: 31.30955696106,
        y: 29.947542190552
    },
    {
        name: "المنطقة الصناعية بجنوب حلوان",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 15,
        decision: "قرار محافظ رقم 718 لسنة 1998 - قرار محافظ رقم 742 لسنة 2002",
        x: 31.308351516724,
        y: 29.826648712158
    },
    {
        name: "المنطقة الصناعية بالقطامية ـ حي البساتين",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 83,
        decision: "قرار محافظ رقم 668 لسنة 1999",
        x: 0,
        y: 0
    },
    {
        name: "البساتين العمومي- حي البساتين",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 0,
        decision: "قرار محافظ رقم 388 لسنة 2001",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الصناعية كيلو 17ـ حي السلام اول",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 0,
        decision: "قرار محافظ 129 لسنة 1975",
        x: 31.409269332886,
        y: 30.148466110229
    },
    {
        name: "المنطقة الصناعية بجوار سوق العبور",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 77.07,
        decision: "قرار جمهوري رقم 312 لسنة 1993 قرار محافظ رقم 1508 لسنة 2000",
        x: 31.463180541992,
        y: 30.163646697998
    },
    {
        name: "المنطقة الصناعية بالعباسية ـ قسم الوايلي",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 30,
        decision: "قرار رقم 836 لسنة 1957",
        x: 31.279672622681,
        y: 30.060781478882
    },
    {
        name: "المنطقة الصناعية التبين (ارض البودرة/ كفر العلو)",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 428,
        decision: "قرار محافظ رقم 347 لسنة 1967 قرار محافظ رقم 505 لسنة 2000",
        x: 31.32258605957,
        y: 29.782241821289
    },
    {
        name: "منطقة بشرق اتوستراد مصر/ حلوان (بوادي حوف- تقسيم ايكون حي المعصرة)",
        governorate: "القاهرة",
        dependency: "المحافظة",
        area: 150,
        decision: "قرار محافظ رقم 222 لسنة 1978",
        x: 31.310842514038,
        y: 29.892339706421
    },

    // القليوبية
    {
        name: "أبى زعبل مركز الخانكة (منطقة الشروق الصناعية)",
        governorate: "القليوبية",
        dependency: "المحافظة",
        area: 149.5,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 4309 لسنة 1999\nالامتداد: قرار محافظ القليوبية رقم 35 لسنة 2010",
        x: 31.392440795898,
        y: 30.244958877563
    },
    {
        name: "حوض الزهار نمره 27 (منطقة الصفا الصناعية للمسابك)",
        governorate: "القليوبية",
        dependency: "المحافظة",
        area: 142,
        decision: "قرار محافظ رقم 134 لسنة 2000",
        x: 31.366167068481,
        y: 30.28458404541
    },
    {
        name: "المنطقة الصناعية بالعكرشة",
        governorate: "القليوبية",
        dependency: "المحافظة",
        area: 494.4,
        decision: "الانشاء: قرار محافظ رقم 208 لسنة 2008\nالتعديل: قرار جمهوري رقم 555 لسنة 2020",
        x: 31.374273300171,
        y: 30.245584487915
    },
    {
        name: "المنطقة الصناعية بجهة ابو زعبل ـ مركز الخانكة (ارض جمعية النصر)",
        governorate: "القليوبية",
        dependency: "المحافظة",
        area: 738.84,
        decision: "الانشاء: قرار جمهوري رقم 210 لسنة 2017",
        x: 31.40353012085,
        y: 30.274181365967
    },

    // الجيزة
    {
        name: "المنطقة الصناعية بأبو رواش وتوسعاتها",
        governorate: "الجيزة",
        dependency: "المحافظة",
        area: 1404,
        decision: "الانشاء: قرارجمهورى رقم 41 لسنة 1992\nالامتداد: قرار محافظ رقم 2065 لسنة 1996\nالامتداد: قرار رئيس مجلس الوزراء بتاريخ 2002/5/26",
        x: 31.036252975464,
        y: 30.073699951172
    },
    {
        name: "المنطقة الصناعية ناحية وصلة جرزا مركز العياط",
        governorate: "الجيزة",
        dependency: "المحافظة",
        area: 1785.75,
        decision: "الانشاء: قرار جمهوري رقم 254 لسنة 2017",
        x: 31.166841506958,
        y: 29.448080062866
    },
    {
        name: "المنطقة الصناعية ناحية عرب ابو ساعد - مركز الصف",
        governorate: "الجيزة",
        dependency: "المحافظة",
        area: 6328.69,
        decision: "الانشاء: قرار جمهوري رقم 618 لسنة 2020\nقرار محافظ رقم 832 لسنة 2021",
        x: 31.365188598633,
        y: 29.74808883667
    },

    // بورسعيد
    {
        name: "جنوب بورسعيد (الرسوة) المنطقة الصناعية الحوض السمكي",
        governorate: "بورسعيد",
        dependency: "المحافظة",
        area: 240,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 542 لسنة 1994",
        x: 32.288326263428,
        y: 31.221786499023
    },
    {
        name: "جنوب بورسعيد (الرسوة) المنطقة الصناعية بحري الحوض السمكي",
        governorate: "بورسعيد",
        dependency: "المحافظة",
        area: 212,
        decision: "الامتداد: قرار رئيس مجلس الوزراء رقم 350 لسنة 2004",
        x: 32.288326263428,
        y: 31.221786499023
    },
    {
        name: "جنوب بورسعيد (الرسوة) المنطقة الصناعية C7",
        governorate: "بورسعيد",
        dependency: "المحافظة",
        area: 18.8,
        decision: "الامتداد: قرار رئيس مجلس الوزراء رقم 478 لسنة 1997",
        x: 32.288326263428,
        y: 31.221786499023
    },
    {
        name: "جنوب بورسعيد (الرسوة) المنطقة الصناعية C9",
        governorate: "بورسعيد",
        dependency: "المحافظة",
        area: 45.2,
        decision: "الامتداد: قرار رئيس مجلس الوزراء رقم 900 لسنة 2002\nقرار محافظ بورسعيد رقم 153 لسنة 2002",
        x: 32.288326263428,
        y: 31.221786499023
    },
    {
        name: "جنوب بورسعيد (الرسوة) المنطقة الصناعية C8",
        governorate: "بورسعيد",
        dependency: "المحافظة",
        area: 111,
        decision: "الامتداد: قرار رئيس مجلس الوزراء رقم 350 لسنة 2004",
        x: 32.288326263428,
        y: 31.221786499023
    },
    {
        name: "جنوب بورسعيد (الرسوة) المنطقة الصناعية قبلي C9",
        governorate: "بورسعيد",
        dependency: "المحافظة",
        area: 170,
        decision: "الامتداد: قرار رئيس مجلس الوزراء رقم 350 لسنة 2004",
        x: 32.288326263428,
        y: 31.221786499023
    },

    // شمال سيناء
    {
        name: "المنطقة الصناعية ببئر العبد",
        governorate: "شمال سيناء",
        dependency: "المحافظة",
        area: 238,
        decision: "قرار رئيس مجلس الوزراء رقم 271 لسنة 1993",
        x: 33.044658660889,
        y: 31.008220672607
    },
    {
        name: "المنطقة الصناعية بوسط سيناء",
        governorate: "شمال سيناء",
        dependency: "المحافظة",
        area: 78386.5,
        decision: "قرار رئيس الجمهورية رقم 70 لسنة 2017",
        x: 33.904319763184,
        y: 30.643241882324
    },

    // جنوب سيناء
    {
        name: "المنطقة الصناعية بابو زنيمة",
        governorate: "جنوب سيناء",
        dependency: "المحافظة",
        area: 3908.93,
        decision: "قرار جمهورى رقم 61 لسنة 2015",
        x: 33.223209381104,
        y: 28.967582702637
    },

    // الإسماعيلية
    {
        name: "المنطقة الصناعية بالقنطرة شرق",
        governorate: "الإسماعيلية",
        dependency: "المحافظة",
        area: 910,
        decision: "الإنشاء: قرار رئيس مجلس الوزراء رقم 813 لسنة 1993\nالامتداد: قرار رئيس مجلس الوزراء رقم 2568 لسنة 1997",
        x: 32.373748779297,
        y: 30.8919506073
    },
    {
        name: "المنطقة الصناعية الاولي",
        governorate: "الإسماعيلية",
        dependency: "المحافظة",
        area: 365,
        decision: "قرار محافظ رقم 185 لسنة 1997",
        x: 32.209838867188,
        y: 30.583831787109
    },
    {
        name: "المنطقة الصناعية الثانية",
        governorate: "الإسماعيلية",
        dependency: "المحافظة",
        area: 262,
        decision: "قرار محافظ رقم 1272 لسنة 1981",
        x: 32.209838867188,
        y: 30.583831787109
    },

    // الشرقية
    {
        name: "منطقة بلبيس الصناعية (طريق بلبيس/العاشر ك 5)",
        governorate: "الشرقية",
        dependency: "المحافظة",
        area: 289.6,
        decision: "الإنشاء: قرار رئيس مجلس الوزراء رقم 2110 لسنه 2000\nالامتداد: قرار رئيس مجلس الوزراء رقم 884 لسنة 2001\nالامتداد: قرار جمهوري رقم 173 لسنة 2017",
        x: 31.601150512695,
        y: 30.345279693604
    },
    {
        name: "المنطقة الصناعية ببساتين الإسماعيلية (الزوامل)",
        governorate: "الشرقية",
        dependency: "المحافظة",
        area: 1484.98,
        decision: "قرار جمهوري 494 لسنة 2017",
        x: 31.424760818481,
        y: 30.311389923096
    },
    {
        name: "منطقة ال (105) فدان ناحية الحسينية",
        governorate: "الشرقية",
        dependency: "المحافظة",
        area: 105.18,
        decision: "قرار جمهوري 336 لسنة 2022",
        x: "",
        y: ""
    },

    // السويس
    {
        name: "منطقة الصناعات المتوسطة",
        governorate: "السويس",
        dependency: "المحافظة",
        area: 550,
        decision: "قرار محافظ رقم 219 لسنة 2015 (باعتماد المخطط الاستراتيجي العام)",
        x: 0,
        y: 0
    },

    // كفر الشيخ
    {
        name: "المنطقة الصناعية ببلطيم",
        governorate: "كفر الشيخ",
        dependency: "المحافظة",
        area: 114,
        decision: "قرار رئيس مجلس الوزراء رقم 1770 لسنة 1997",
        x: 31.10472869873,
        y: 31.543109893799
    },
    {
        name: "المنطقة الصناعية بمطوبس",
        governorate: "كفر الشيخ",
        dependency: "المحافظة",
        area: 1857.91,
        decision: "الإنشاء: قرار رئيس مجلس الوزراء رقم 1770 لسنة 1997\nالامتداد: قرار جمهورى رقم 165 لسنة 2009\nالتعديل: قرار جمهوري رقم 312 لسنة 2022",
        x: 30.486528396606,
        y: 31.442031860352
    },

    // الدقهلية
    {
        name: "المنطقة الصناعية جنوب غرب جمصة",
        governorate: "الدقهلية",
        dependency: "المحافظة",
        area: 727.14,
        decision: "قرار رئيس مجلس الوزراء رقم 206 لسنة 1997",
        x: 31.494424819946,
        y: 31.436557769775
    },
    {
        name: "المنطقة الصناعية بالعصافرة (مجمع الصناعات الصغيرة)",
        governorate: "الدقهلية",
        dependency: "المحافظة",
        area: 60,
        decision: "قرار رئيس مجلس الوزراء رقم 815 لسنة 1993 - التعديل: قرار جمهوري رقم 157 لسنة 2016",
        x: 32.0080909729,
        y: 31.144128799438
    },

    // المنوفية
    {
        name: "كفور الرمل مركز قويسنا (منطقة مبارك الصناعية) - المرحلة الاولي",
        governorate: "المنوفية",
        dependency: "المحافظة",
        area: 103,
        decision: "الإنشاء: قرار رئيس مجلس الوزراء رقم 543 لسنة 1994",
        x: 31.175849914551,
        y: 30.542394638062
    },
    {
        name: "كفور الرمل مركز قويسنا (منطقة مبارك الصناعية) - المرحلة الثانية",
        governorate: "المنوفية",
        dependency: "المحافظة",
        area: 104,
        decision: "الامتداد: قرار رئيس مجلس الوزراء رقم 3682 لسنة 1999",
        x: 31.175849914551,
        y: 30.542394638062
    },
    {
        name: "كفور الرمل مركز قويسنا (منطقة مبارك الصناعية) - المرحلة الثالثة",
        governorate: "المنوفية",
        dependency: "المحافظة",
        area: 100,
        decision: "الامتداد: قرار رئيس مجلس الوزراء رقم 3682 لسنة 1999",
        x: 31.175849914551,
        y: 30.542394638062
    },
    {
        name: "كفور الرمل مركز قويسنا (منطقة مبارك الصناعية) - المرحلة الرابعة",
        governorate: "المنوفية",
        dependency: "المحافظة",
        area: 103,
        decision: "الامتداد: قرار محافظ رقم 651 لسنة 2010\nالتعديل: قرار محافظ رقم 1004 لسنة 2014",
        x: 31.175849914551,
        y: 30.542394638062
    },
    {
        name: "المنطقة الصناعية القديمة بقويسنا",
        governorate: "المنوفية",
        dependency: "المحافظة",
        area: 225,
        decision: "قرار محافظ رقم 264 لسنة 1978",
        x: 31.169258117676,
        y: 30.535839080811
    },

    // البحيرة
    {
        name: "المنطقة الصناعية بوادى النطرون",
        governorate: "البحيرة",
        dependency: "المحافظة",
        area: 498.3,
        decision: "قرار رئيس مجلس الوزراء رقم 2016 لسنة 1994",
        x: 30.331497192383,
        y: 30.349031448364
    },
    {
        name: "المنطقة الصناعية بناحية الطرانة ــ مركز حوش عيسي بمساحة اجمالية 346 ف - المنطقة الصناعية",
        governorate: "البحيرة",
        dependency: "المحافظة",
        area: 330.56,
        decision: "قرار رئيس مجلس الوزراء رقم 2131 لسنة 2015",
        x: 30.381540298462,
        y: 30.911731719971
    },
    {
        name: "المنطقة الصناعية بناحية الطرانة ــ مركز حوش عيسي بمساحة اجمالية 346 ف المجمع الصناعي",
        governorate: "البحيرة",
        dependency: "المحافظة",
        area: 15.44,
        decision: "قرار رئيس مجلس الوزراء رقم 2131 لسنة 2015",
        x: 30.381540298462,
        y: 30.911731719971
    },

    // الأسكندرية
    {
        name: "المنطقة الصناعية بالمنشية الجديدة الجديدة حي غرب",
        governorate: "الأسكندرية",
        dependency: "المحافظة",
        area: 843.5,
        decision: "قرار وزاري رقم 523 لسنة 1990(بإعتماد المخطط العام لسنة 2005) قرار وزاري رقم 336 لسنة 1998(بإعتماد المخطط العام لسنة 2017)",
        x: 29.906805038452,
        y: 31.175497055054
    },
    {
        name: "المنطقة الصناعية بالمنشية الجديدة المنشية الجديدة حي وسط",
        governorate: "الأسكندرية",
        dependency: "المحافظة",
        area: 0,
        decision: "قرار وزاري رقم 523 لسنة 1990(بإعتماد المخطط العام لسنة 2005) قرار وزاري رقم 336 لسنة 1998(بإعتماد المخطط العام لسنة 2017)",
        x: 29.906805038452,
        y: 31.175497055054
    },
    {
        name: "المنطقة الصناعية بمرغم قبلي وبحرى المنطقة الصناعية بمرغم بحري",
        governorate: "الأسكندرية",
        dependency: "المحافظة",
        area: 2702,
        decision: "قرار وزاري رقم 523 لسنة 1990 (بإعتماد المخطط العام لسنة 2005) قرار وزاري رقم 185 لسنة 1996(بإعتماد المخطط العام لسنة 2017)",
        x: 29.832302093506,
        y: 31.062118530273
    },
    {
        name: "المنطقة الصناعية بمرغم قبلي وبحرى المنطقة الصناعية بمرغم قبلي",
        governorate: "الأسكندرية",
        dependency: "المحافظة",
        area: 2149,
        decision: "قرار وزاري رقم 523 لسنة 1990 (بإعدام المخطط العام لسنة 2005)",
        x: 29.832302093506,
        y: 31.062118530273
    },
    {
        name: "المنطقة الصناعية أم زغيوقبلي وبحري العجمى قبلى بيطاش - بحري ام زغيو",
        governorate: "الأسكندرية",
        dependency: "المحافظة",
        area: 2.98,
        decision: "قرار رئيس مجلس الوزراء رقم 1828 لسنة 2002",
        x: 29.8040599823,
        y: 31.118062973022
    },
    {
        name: "المنطقة الصناعية أم زغيوقبلي وبحري ام زغيو قبلي",
        governorate: "الأسكندرية",
        dependency: "المحافظة",
        area: 2851,
        decision: "قرار محافظ رقم 906 لسنة 1997",
        x: 29.8040599823,
        y: 31.118062973022
    },
    {
        name: "المنطقة الصناعية وادي القمر والمكس",
        governorate: "الأسكندرية",
        dependency: "المحافظة",
        area: 0,
        decision: "",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الصناعية بأم زغيو (قبلي ام زغيو وغرب وصلة الذراع البحري وقبلي محور التعمير)",
        governorate: "الأسكندرية",
        dependency: "المحافظة",
        area: 0,
        decision: "",
        x: 0,
        y: 0
    },

    // مطروح
    {
        name: "المنطقة الصناعية بجهة جنوب فوكة ـ مركز الضبعة",
        governorate: "مطروح",
        dependency: "المحافظة",
        area: 289,
        decision: "قرار رئيس مجلس الوزراء رقم 1089 لسنة 2015",
        x: 27.9476146698,
        y: 30.914203643799
    },

    // الفيوم
    {
        name: "المنطقة الصناعية بكوم أوشيم",
        governorate: "الفيوم",
        dependency: "المحافظة",
        area: 1153,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 2901 لسنة 1996\nالامتداد: قرار رئيس مجلس الوزراء رقم 2955 لسنة 1997\nالامتداد: رئيس مجلس الوزراء رقم 928 لسنة 2015",
        x: 30.894691467285,
        y: 29.530694961548
    },
    {
        name: "المنطقة الصناعية بقوته",
        governorate: "الفيوم",
        dependency: "المحافظة",
        area: 2000,
        decision: "قرار رئيس مجلس الوزراء رقم 976 لسنة 1998",
        x: 30.356960296631,
        y: 29.406629562378
    },

    // بني سويف
    {
        name: "المنطقة الصناعية ببياض العرب",
        governorate: "بني سويف",
        dependency: "المحافظة",
        area: 750,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 207 لسنة 1997",
        x: 31.176086425781,
        y: 29.109209060669
    },
    {
        name: "المنطقة الصناعية بكوم أبو راضى",
        governorate: "بني سويف",
        dependency: "المحافظة",
        area: 799.7,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 207 لسنة 1997\nالتعديل: قرار محافظ رقم 991 لسنة 2001",
        x: 31.111545562744,
        y: 29.352653503418
    },
    {
        name: "المنطقة الصناعية 31/1",
        governorate: "بني سويف",
        dependency: "المحافظة",
        area: 6428.57,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 2091 لسنة 2000\nالتعديل: قرار جمهورى رقم 13 لسنة 2011",
        x: 31.267337799072,
        y: 29.132789611816
    },
    {
        name: "المنطقة الصناعية 31/2",
        governorate: "بني سويف",
        dependency: "المحافظة",
        area: 3581.3,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 2091 لسنة 2000\nالتعديل: قرار جمهورى رقم 13 لسنة 2011",
        x: 31.234869003296,
        y: 29.049209594727
    },
    {
        name: "المنطقة الصناعية 31/3",
        governorate: "بني سويف",
        dependency: "المحافظة",
        area: 3116,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 2091 لسنة 2000\nالتعديل: قرار جمهورى رقم 13 لسنة 2011",
        x: 31.211313247681,
        y: 28.991798400879
    },
    {
        name: "المنطقة الصناعية 31/4",
        governorate: "بني سويف",
        dependency: "المحافظة",
        area: 2855,
        decision: "قرار رئيس مجلس الوزراء رقم 2091 لسنة 2000",
        x: 31.093200683594,
        y: 28.926416397095
    },
    {
        name: "المنطقة الاستثمارية بمركز سمسطا",
        governorate: "بني سويف",
        dependency: "المحافظة",
        area: 147.14,
        decision: "قرار جمهوري رقم 111 لسنة 2022",
        x: 0,
        y: 0
    },

    // المنيا
    {
        name: "المنطقة الصناعية بالمطاهرة شرق النيل - المجمع الصناعي",
        governorate: "المنيا",
        dependency: "المحافظة",
        area: 19.1,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 323 لسنة 1994\nالامتداد: قرار رئيس مجلس الوزراء رقم 2004 لسنة 2007",
        x: 30.868923187256,
        y: 28.007535934448
    },
    {
        name: "المنطقة الصناعية بالمطاهرة شرق النيل - المنطقة الصناعية",
        governorate: "المنيا",
        dependency: "المحافظة",
        area: 1889.2,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 323 لسنة 1994\nالامتداد: قرار رئيس مجلس الوزراء رقم 2004 لسنة 2007",
        x: 30.868923187256,
        y: 28.007535934448
    },

    // أسيوط
    {
        name: "المنطقة الصناعية عرب العوامر بابنوب - المنطقة الصناعية",
        governorate: "أسيوط",
        dependency: "المحافظة",
        area: 540,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 1406 لسنة 1994\nالامتداد: قرار مجلس الوزراء رقم 4474 لسنة 1998",
        x: 31.211759567261,
        y: 27.328039169312
    },
    {
        name: "المنطقة الصناعية بالزرابى بأبوتيج - المنطقة الاولي",
        governorate: "أسيوط",
        dependency: "المحافظة",
        area: 35,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 1407 لسنة 1994\nالتعديل: قرار رئيس مجلس الوزراء رقم 409 لسنة 1995\nالامتداد: قرار محافظ رقم 662 لسنة 2009\nقرار مجلس الوزراء رقم 1624 لسنة 2015",
        x: 31.268924713135,
        y: 26.974782943726
    },
    {
        name: "المنطقة الصناعية بالزرابى بأبوتيج - الامتداد",
        governorate: "أسيوط",
        dependency: "المحافظة",
        area: 19.1,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 1407 لسنة 1994\nالتعديل: قرار رئيس مجلس الوزراء رقم 409 لسنة 1995\nالامتداد: قرار محافظ رقم 662 لسنة 2009\nقرار مجلس الوزراء رقم 1624 لسنة 2015",
        x: 31.268924713135,
        y: 26.974782943726
    },
    {
        name: "المنطقة الصناعية بالصفا (بنى غالب)",
        governorate: "أسيوط",
        dependency: "المحافظة",
        area: 424,
        decision: "قرار رئيس مجلس الوزراء رقم 1408 لسنة 1994",
        x: 31.062892913818,
        y: 27.176177978516
    },
    {
        name: "المنطقة الصناعية دشلوط بديروط",
        governorate: "أسيوط",
        dependency: "المحافظة",
        area: 108.22,
        decision: "قرار رئيس مجلس الوزراء رقم 254 لسنة 1997",
        x: 30.690095901489,
        y: 27.582672119141
    },
    {
          name: "المنطقة الصناعية عرب العوامر بابنوب - المجمع الصناعي",
       governorate: "أسيوط",
       dependency: "المحافظة",
       area: 74,
     decision: "الانشاء : قرار رئيس مجلس الوزراء رقم 1406 لسنة 1994\nالامتداد : قرار مجلس الوزراء رقم 4474 لسنة 1998",
       x: 31.211759567261,
      y: 27.328039169312
       },
       {
        name: "المنطقة الصناعية بالبدارى (الكوم الاحمر)",
        governorate: "أسيوط",
        dependency: "المحافظة",
        area: 39.23,
        decision: "قرار رئيس مجلس الوزراء رقم 1354 لسنة 1998",
        x: 31.40140914917,
        y: 26.990005493164
    },

    // الوادي الجديد
    {
        name: "المنطقة الصناعية بالخارجة",
        governorate: "الوادي الجديد",
        dependency: "المحافظة",
        area: 181,
        decision: "قرار رئيس مجلس الوزراء رقم 2069 لسنة 1996",
        x: 30.522350311279,
        y: 25.437078475952
    },
    {
        name: "المنطقة الصناعية الداخلة بموط",
        governorate: "الوادي الجديد",
        dependency: "المحافظة",
        area: 71,
        decision: "قرار رئيس مجلس الوزراء رقم 2069 لسنة 1996",
        x: 28.976716995239,
        y: 25.476276397705
    },

    // الأقصر
    {
        name: "المنطقة الصناعية بالبغدادي - المرحلة الثالثة",
        governorate: "الأقصر",
        dependency: "المحافظة",
        area: 145,
        decision: "قرار رئيس المجلس الاعلى للاقصر رقم 234 لسنة 2009\nقرار جمهورى رقم 36 لسنة 2014\nالامتداد: قرار رئيس مجلس الوزراء رقم 2122لسنة 2015",
        x: 32.620719909668,
        y: 25.621831893921
    },
       {
        name: "المنطقة الصناعية بالبغدادي- المرحلة الاولى (المجمع الصناعي)",
       governorate: "الأقصر",
       dependency: "المحافظة",
       area: 49.17,
        decision: "قرار رئيس المجلس الاعلى للاقصر رقم 234 لسنة 2009\nقرار جمهورى رقم 36 لسنة 2014\nالامتداد: قرار رئيس مجلس الوزراء رقم 2122لسنة 2015",
        x: 32.620719909668,
     y: 25.621831893921
      },
      {
      name: "المنطقة الصناعية بالبغدادي - المرحلة الثانية",
        governorate: "الأقصر",
       dependency: "المحافظة",
        area: 95,
         decision: "قرار رئيس المجلس الاعلى للاقصر رقم 234 لسنة 2009\nقرار جمهورى رقم 36 لسنة 2014\nالامتداد: قرار رئيس مجلس الوزراء رقم 2122لسنة 2015",
        x: 32.620719909668,
      y: 25.621831893921
      },
      {
       name: "المنطقة الصناعية بالبغدادي - خدمات ومعارض",
       governorate: "الأقصر",
       dependency: "المحافظة",
       area: 22.23,
       decision: "قرار رئيس المجلس الاعلى للاقصر رقم 234 لسنة 2009\nقرار جمهورى رقم 36 لسنة 2014\nالامتداد: قرار رئيس مجلس الوزراء رقم 2122لسنة 2015",
       x: 32.620719909668,
     y: 25.621831893921
       },

    // أسوان
    {
        name: "المنطقة الصناعية بالشلالات طريق وادى العلاقى",
        governorate: "اسوان",
        dependency: "المحافظة",
        area: 272.6,
        decision: "قرار رئيس مجلس الوزراء رقم 1409 لسنة 1994\nالامتداد: قرار رقم 138 لسنة 2015",
        x: 32.934154510498,
        y: 24.050201416016
    },
    {
        name: "المنطقة الصناعية بوادي هلال السباعية",
        governorate: "اسوان",
        dependency: "المحافظة",
        area: 5115,
        decision: "قرار جمهورى رقم 483 لسنة 2014",
        x: 32.875,
        y: 25.187223434448
    },

    // ============ مناطق تابعة للهيئة العامة للتنمية الصناعية ============
    {
        name: "المنطقة الصناعية بالروبيكي (أ) المرحله الاولي",
        governorate: "القاهرة",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 176,
        decision: "الإنشاء: قرار محافظ رقم 161 لسنة 1995\nالتعديل: قرار جمهورى رقم 184 لسنة 2014\nالتعديل: قرار رئيس مجلس الوزراء رقم 1622 لسنة 2015\nالتعديل: قرار جمهوري رقم 115 لسنة 2018\nالتعديل: قرار جمهوري رقم 617 لسنة 2019\nالتعديل: قرار جمهوري رقم 61 لسنة 2022",
        x: 31.762113571167,
        y: 30.174114227295
    },
    {
        name: "المنطقة الصناعية بالروبيكي (أ) المرحلة الثانية",
        governorate: "القاهرة",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 109,
        decision: "الإنشاء: قرار محافظ رقم 161 لسنة 1995\nالتعديل: قرار جمهورى رقم 184 لسنة 2014\nالتعديل: قرار رئيس مجلس الوزراء رقم 1622 لسنة 2015\nالتعديل: قرار جمهوري رقم 115 لسنة 2018\nالتعديل: قرار جمهوري رقم 617 لسنة 2019\nالتعديل: قرار جمهوري رقم 61 لسنة 2022",
        x: 31.762113571167,
        y: 30.174114227295
    },
    {
        name: "المنطقة الصناعية بالروبيكي (أ) المرحلة الثالثة",
        governorate: "القاهرة",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 141,
        decision: "الإنشاء: قرار محافظ رقم 161 لسنة 1995\nالتعديل: قرار جمهورى رقم 184 لسنة 2014\nالتعديل: قرار رئيس مجلس الوزراء رقم 1622 لسنة 2015\nالتعديل: قرار جمهوري رقم 115 لسنة 2018\nالتعديل: قرار جمهوري رقم 617 لسنة 2019\nالتعديل: قرار جمهوري رقم 61 لسنة 2022",
        x: 31.762113571167,
        y: 30.174114227295
    },
    {
        name: "المنطقة الصناعية بالروبيكي (ب)",
        governorate: "القاهرة",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 282.03,
        decision: "الانشاء: قرار جمهوري رقم 115 لسنة 2018\nالتعديل: قرار جمهوري رقم 617 لسنة 2019",
        x: 31.782030105591,
        y: 30.17820930481
    },
    {
        name: "امتداد المنطقة الصناعية جنوب بورسعيد (الرسوة) - المجمع الصناعي",
        governorate: "بورسعيد",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 43.2,
        decision: "الانشاء: قرار جمهورى رقم 91 لسنة 2009\nالتعديل: قرارجمهوري رقم 577 لسنة 2022",
        x: 32.284763336182,
        y: 31.218265533447
    },
    {
        name: "امتداد المنطقة الصناعية جنوب بورسعيد (الرسوة) - المنطقة الصناعية",
        governorate: "بورسعيد",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 324.24,
        decision: "لانشاء: قرار جمهورى رقم 91 لسنة 2009\nالتعديل: قرارجمهوري رقم 577 لسنة 2022",
        x: 32.284763336182,
        y: 31.218265533447
    },
    {
        name: "المنطقة الصناعية شمال الفيوم (كوم اوشيم)",
        governorate: "الفيوم",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 7872,
        decision: "الانشاء: قرار جمهورى رقم 17 لسنة 2010\nالتعديل: قرار جمهورى رقم 170 لسنة 2017",
        x: 30.932043075562,
        y: 29.641397476196
    },
    {
        name: "توسعات المنطقة الصناعية ببياض العرب - المجمع الصناعي",
        governorate: "بني سويف",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 70,
        decision: "قرار جمهوري رقم 99 لسنة 2017\nالتعديل: قرار جمهوري رقم 134 لسنة 2023",
        x: 31.179901123047,
        y: 29.09951210022
    },
    {
        name: "توسعات المنطقة الصناعية ببياض العرب - المراحل الاخرى",
        governorate: "بني سويف",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 574.24,
        decision: "قرار جمهوري رقم 99 لسنة 2017\nالتعديل: قرار جمهوري رقم 134 لسنة 2023",
        x: 31.179901123047,
        y: 29.09951210022
    },
    {
        name: "توسعات المنطقة الصناعية بكوم أبو راضى",
        governorate: "بني سويف",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 60.26,
        decision: "قرار جمهوري رقم 506 لسنة 2022",
        x: 31.12163734436,
        y: 29.35552406311
    },
    {
        name: "المنطقة الصناعية بطريق سفاجا ـ قنا",
        governorate: "البحر الأحمر",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 57.14,
        decision: "الانشاء: قرار محافظ رقم 820 لسنة 2017\nالتعديل: قرار محافظ رقم 1025 لسنة 2017",
        x: 33.879261016846,
        y: 26.774538040161
    },
    {
        name: "المنطقة الصناعية بحى الكوثر",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 375.08,
        decision: "قرار رئيس مجلس الوزراء رقم 814 لسنة 1993\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 31.80298614502,
        y: 26.606494903564
    },
    {
        name: "المنطقة الصناعية بالاحايوه ـ مركز اخميم",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 269,
        decision: "قرار رئيس مجلس الوزراء رقم 251 لسنة 2000\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 31.85751914978,
        y: 26.478910446167
    },
    {
        name: "المنطقة الصناعية ببيت داوود -غرب جرجا - المرحلة الأولى",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 186,
        decision: "قرار رئيس مجلس الوزراء رقم 251 لسنة 2000\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 31.772239685059,
        y: 26.275684356689
    },
    {
        name: "المنطقة الصناعية ببيت داوود -غرب جرجا - مجمع صناعي",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 64.5,
        decision: "قرار رئيس مجلس الوزراء رقم 251 لسنة 2000\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 31.772239685059,
        y: 26.275684356689
    },
    {
        name: "المنطقة الصناعية ببيت داوود -غرب جرجا - مجزر الي للقوات المسلحة",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 21.5,
        decision: "قرار رئيس مجلس الوزراء رقم 251 لسنة 2000\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 31.772239685059,
        y: 26.275684356689
    },
    {
        name: "المنطقة الصناعية ببيت داوود -غرب جرجا - باقي المساحة",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 824.34,
        decision: "قرار رئيس مجلس الوزراء رقم 251 لسنة 2000\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 31.772239685059,
        y: 26.275684356689
    },
    {
        name: "المنطقة الصناعية غرب طهطا - المرحلة الاولى",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 230,
        decision: "قرار رئيس مجلس الوزراء رقم 251 لسنة 2000\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 31.383224487305,
        y: 26.729808807373
    },
    {
        name: "المنطقة الصناعية غرب طهطا المرحلة الثانية",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 170,
        decision: "قرار رئيس مجلس الوزراء رقم 251 لسنة 2000\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 31.383224487305,
        y: 26.729808807373
    },
    {
        name: "المنطقة الصناعية غرب طهطا باقي المراحل",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 393.09,
        decision: "قرار رئيس مجلس الوزراء رقم 251 لسنة 2000\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 31.383224487305,
        y: 26.729808807373
    },
    {
        name: "المنطقة الصناعية بجهة غرب مدينتي طهطا وجهينة (القطعة الاولي)",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 515.57,
        decision: "قرار جمهوري رقم 185 لسنة 2017",
        x: 31.320627212524,
        y: 26.660718917847
    },
    {
        name: "المنطقة الصناعية بجهة غرب مدينتي طهطا وجهينة (القطعة الثانية)",
        governorate: "سوهاج",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 1010.29,
        decision: "قرار جمهوري رقم 185 لسنة 2017",
        x: 31.30224609375,
        y: 26.650829315186
    },
    {
        name: "المنطقة الصناعية بالكلاحين ــ مركز قفط",
        governorate: "قنا",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 354,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 2017 لسنة 1994\nالتعديل: قرار رئيس مجلس الوزراء رقم 4308 لسنة 1998\nالتعديل: قرار جمهوري رقم 195 لسنة 2024",
        x: 32.881008148193,
        y: 25.979742050171
    },
    {
        name: "المنطقة الصناعية بناحية هو بمركز نجع حمادي المرحلة الاولى + المجمع الصناعي",
        governorate: "قنا",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 500,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 2018 لسنة 1994\nالتعديل: قرار رئيس مجلس الوزراء رقم 4309 لسنة 1998\nالامتداد: قرار جمهوري رقم 206 لسنة 2017\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 32.326751708984,
        y: 25.911848068237
    },
    {
        name: "المنطقة الصناعية بناحية هو بمركز نجع حمادي - التوسعات",
        governorate: "قنا",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 533.68,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 2018 لسنة 1994\nالتعديل: قرار رئيس مجلس الوزراء رقم 4309 لسنة 1998\nالامتداد: قرار جمهوري رقم 206 لسنة 2017\nالتعديل: قرار جمهوري رقم 54 لسنة 2023",
        x: 32.326751708984,
        y: 25.911848068237
    },
    {
        name: "المنطقة الصناعية بأرمنت",
        governorate: "الأقصر",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 1011.73,
        decision: "قرار جمهوري رقم 59 لسنة 2016",
        x: 32.366451263428,
        y: 25.57149887085
    },
    {
        name: "المنطقة الصناعية / الحرفية بمركز نصر النوبة شرق الجنينة (مجمع صناعي)",
        governorate: "اسوان",
        dependency: "الهيئة العامة للتنمية الصناعية",
        area: 56.5,
        decision: "قرار جمهوري رقم 208 لسنة 2017",
        x: 33.059356689453,
        y: 24.513158798218
    },

    // ============ مناطق تابعة للهيئة العامة للاستثمار والمناطق الحرة ============
    {
        name: "المنطقة الحرة العامة بمدينة نصر",
        governorate: "القاهرة",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 180,
        decision: "قرار جمهورى رقم 2038 لسنة 1973",
        x: 31.346168518066,
        y: 30.031839370728
    },
    {
        name: "منطقة استثمارية ببنها بناحية الفاروقية عزبة نجيب",
        governorate: "القليوبية",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 46,
        decision: "قرار رئيس مجلس الوزراء رقم 2424 لسنة 2016",
        x: 31.217962265015,
        y: 30.478637695312
    },
    {
        name: "المنطقة الحرة العامة الإعلامية بمدينة 6 أكتوبر",
        governorate: "الجيزة",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 694,
        decision: "قرار رئيس مجلس الوزراء رقم 411 لسنة 2000",
        x: 31.015832901001,
        y: 29.964561462402
    },
    {
        name: "منطقة استثمارية بناحية الوادي ــ مركز الصف",
        governorate: "الجيزة",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 40.483,
        decision: "قرار رئيس مجلس الوزراء رقم 2485 لسنة 2010",
        x: 31.2759404,
        y: 29.5103696
    },
    {
        name: "المنطقة الحرة العامة ببورسعيد",
        governorate: "بورسعيد",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 191,
        decision: "قرار رئيس مجلس الوزراء لسنة 1975",
        x: 32.294780731201,
        y: 31.245414733887
    },
    {
        name: "المنطقة الحرة العامة بالاسماعيلية",
        governorate: "الإسماعيلية",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 775,
        decision: "قرار رئيس مجلس الوزراء رقم 904 لسنة 1995",
        x: 32.193344116211,
        y: 30.603137969971
    },
    {
        name: "المنطقة الحرة العامة بور توفيق",
        governorate: "السويس",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 21,
        decision: "قرار رئيس مجلس الوزراء رقم 1688 لسنة 1993",
        x: 32.539989471436,
        y: 29.992128372192
    },
    {
        name: "المنطقة الحرة العامة الأدبية",
        governorate: "السويس",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 68,
        decision: "قرار رئيس مجلس الوزراء رقم 1688 لسنة 1993",
        x: 32.4643904,
        y: 29.9180726
    },
    {
        name: "المنطقة الحرة العامة عتاقة",
        governorate: "السويس",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 214,
        decision: "قرار مجلس وزراء رقم 1962لسنة 1995",
        x: 32.4415631,
        y: 29.9075523
    },
    {
        name: "المنطقة الحرة العامة بدمياط",
        governorate: "دمياط",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 190,
        decision: "قرار رئيس مجلس الوزراء رقم 60 لسنة 1993",
        x: 31.780637741089,
        y: 31.462907791138
    },
    {
        name: "المنطقة الصناعية الاستثمارية بميت غمر",
        governorate: "الدقهلية",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 17.7,
        decision: "قرار رئيس مجلس الوزراء رقم 2616 لسنة 2009",
        x: 31.271978378296,
        y: 30.699672698975
    },
    {
        name: "المنطقة الحرة العامة بشبين الكوم",
        governorate: "المنوفية",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 20,
        decision: "قرار رئيس مجلس الوزراء رقم 1143 لسنة 2004",
        x: 30.997646331787,
        y: 30.572988510132
    },
    {
        name: "المنطقة الحرة العامة بالإسكندرية",
        governorate: "الأسكندرية",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 1357,
        decision: "قرار جمهورى رقم 2038 لسنة 1973",
        x: 29.770502090454,
        y: 31.031944274902
    },
    {
        name: "المنطقة الحرة العامة بقفط",
        governorate: "قنا",
        dependency: "الهيئة العامة للاستثمار والمناطق الحرة",
        area: 216,
        decision: "قرار رئيس مجلس الوزراء رقم 321 لسنة 2005",
        x: 32.8895624,
        y: 25.981741
    },

    // ============ مناطق تابعة للهيئة العامة للمنطقة الاقتصادية بمنطقة شمال غرب خليج السويس ============
    {
        name: "المنطقة الصناعية بشرق بورسعيد (منطقة اقتصادية)",
        governorate: "بورسعيد",
        dependency: "الهيئة العامة للمنطقة الاقتصادية بمنطقة شمال غرب خليج السويس",
        area: 23574,
        decision: "قرار جمهوري رقم 330 لسنة 2015",
        x: 32.412612915039,
        y: 31.093353271484
    },
    {
        name: "وادى التكنولوجيا (منطقة اقتصادية)",
        governorate: "الإسماعيلية",
        dependency: "الهيئة العامة للمنطقة الاقتصادية بمنطقة شمال غرب خليج السويس",
        area: 16500,
        decision: "قرار جمهوري رقم 330 لسنة 2015",
        x: 32.41353225708,
        y: 30.577163696289
    },
    {
        name: "المنطقة الصناعية بأبو خليفة (منطقة اقتصادية)",
        governorate: "الإسماعيلية",
        dependency: "الهيئة العامة للمنطقة الاقتصادية بمنطقة شمال غرب خليج السويس",
        area: 1838.6,
        decision: "قرار جمهوري رقم 330 لسنة 2015",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الإقتصادية شمال غرب خليج السويس",
        governorate: "السويس",
        dependency: "الهيئة العامة للمنطقة الاقتصادية بمنطقة شمال غرب خليج السويس",
        area: 48333,
        decision: "الإنشاء: قرار رئيس مجلس الوزراء رقم 3757 لسنة 1999\nامتداد: قرار رئيس مجلس الوزراء رقم 1775 لسنه 2000",
        x: 32.29655456543,
        y: 29.71515083313
    },

    // ============ مناطق تابعة لهيئة المجتمعات العمرانية الجديدة ============
    {
        name: "المنطقة الصناعية بمدينة بدر المجمع الصناعي",
        governorate: "القاهرة",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 21.43,
        decision: "قرار رئيس مجلس الوزراء رقم 335 لسنة 1982",
        x: 31.75365447998,
        y: 30.138710021973
    },
    {
        name: "المنطقة الصناعية بمدينة بدر المنطقه الصناعيه",
        governorate: "القاهرة",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 2294.57,
        decision: "قرار رئيس مجلس الوزراء رقم 335 لسنة 1982",
        x: 31.75365447998,
        y: 30.138710021973
    },
    {
        name: "منطقة الصناعات الصغيرة ـــ والجديدة بمدينة 15 مايو",
        governorate: "القاهرة",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 371,
        decision: "قرار جمهورى رقم 119 لسنة 1978",
        x: 31.362035751343,
        y: 29.813228607178
    },
    {
        name: "المنطقة الصناعية بالقاهرة الجديدة",
        governorate: "القاهرة",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 1090,
        decision: "قرار جمهورى رقم 191 لسنة 2000",
        x: 31.489572525024,
        y: 29.966510772705
    },
    {
        name: "المنطقة الصناعية بالشروق",
        governorate: "القاهرة",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 33,
        decision: "",
        x: 31.619287490845,
        y: 30.163953781128
    },
    {
        name: "المنطقة الصناعية بمدينة العبور",
        governorate: "القليوبية",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 4066,
        decision: "قرار رئيس مجلس الوزراء رقم 1290 لسنة 1982",
        x: 31.46040725708,
        y: 30.217582702637
    },
    {
        name: "المنطقة الصناعية بمدينة 6 أكتوبر",
        governorate: "الجيزة",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 7619,
        decision: "قرار جمهورى رقم 504 لسنة 1979",
        x: 30.883016586304,
        y: 29.928405761719
    },
    {
        name: "المنطقة الصناعية 6اكتوبر الجديدة",
        governorate: "الجيزة",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 1804,
        decision: "",
        x: 30.706069946289,
        y: 29.806428909302
    },
    {
        name: "المنطقة الصناعية بورسعيد الجديدة (سلام)",
        governorate: "بورسعيد",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 1289,
        decision: "",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الصناعية بالصالحية الجديدة",
        governorate: "الشرقية",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 623.28,
        decision: "قرار رئيس مجلس الوزراء رقم 1237 لسنة 1982",
        x: 31.937990188599,
        y: 30.63295173645
    },
    {
        name: "المنطقة الصناعية بالعاشر من رمضان",
        governorate: "الشرقية",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 14055.4,
        decision: "قرار جمهورى رقم 249 لسنة 1977",
        x: 31.774227142334,
        y: 30.252882003784
    },
    {
        name: "المنطقة الصناعية (السويس الجديدة) شمال خليج السويس سابقا",
        governorate: "السويس",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 1654,
        decision: "",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الصناعية بمدينة دمياط الجديدة",
        governorate: "دمياط",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 558.01,
        decision: "قرار رئيس مجلس الوزراء رقم 546 لسنة 1980",
        x: 31.694076538086,
        y: 31.421737670898
    },
    {
        name: "المنطقة الصناعية بالسادات بمساحة 9063 فدان - المجمع الصناعي",
        governorate: "المنوفية",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 71.43,
        decision: "قرار جمهورى 123 لسنة 1978",
        x: 30.589874267578,
        y: 30.410848617554
    },
    {
        name: "المنطقة الصناعية بالسادات بمساحة 9063 فدان - المنطقة الصناعية",
        governorate: "المنوفية",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 8991.6,
        decision: "قرار جمهورى 123 لسنة 1978",
        x: 30.589874267578,
        y: 30.410848617554
    },
    {
        name: "المنطقة الصناعية بالنوبارية ــ الاولي والثانية",
        governorate: "البحيرة",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 146,
        decision: "قرار رئيس مجلس الوزراء رقم 375 لسنة 1986",
        x: 30.08052444458,
        y: 30.6611328125
    },
    {
        name: "المنطقة الصناعية ببرج العرب",
        governorate: "الأسكندرية",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 3388.61,
        decision: "قرار جمهورى رقم 506 لسنة 1979",
        x: 29.616634368896,
        y: 30.869476318359
    },
    {
        name: "المنطقة الصناعية الكيلو 26 جنوب شرق طريق مطروح",
        governorate: "مطروح",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 803,
        decision: "الانشاء: قرار رئيس مجلس الوزراء رقم 463 لسنة 1993\nالتعديل: قرار جمهوري رقم 361 لسنة 2020",
        x: 27.445425033569,
        y: 31.189691543579
    },
    {
        name: "المنطقة الصناعية بالعلمين الجديدة",
        governorate: "مطروح",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 6626,
        decision: "",
        x: 28.888019561768,
        y: 30.788688659668
    },
    {
        name: "المنطقة الصناعية بالفيوم الجديدة",
        governorate: "الفيوم",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 83.52,
        decision: "قرار جمهورى رقم 193 لسنة 2000",
        x: 30.906436920166,
        y: 29.18625831604
    },
    {
        name: "المنطقة الصناعية بمدينة بني سويف الجديدة",
        governorate: "بني سويف",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 1043,
        decision: "قرار رئيس مجلس الوزراء رقم 643 لسنة 1986",
        x: 31.163681030273,
        y: 29.02650642395
    },
    {
        name: "المنطقة الصناعية بالفشن الجديدة",
        governorate: "بني سويف",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 1875,
        decision: "الانشاء: قرار جمهوري رقم 347 لسنة 2018\nقرار وزاري رقم 80 لسنة 2020 (باعتماد المخطط الاستراتيجي العام)",
        x: 30.615509033203,
        y: 28.79186630249
    },
    {
        name: "المنطقة الصناعية بالمنيا الجديده",
        governorate: "المنيا",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 68.73,
        decision: "قرار رئيس مجلس الوزراء رقم 278 لسنة 1986",
        x: 30.825309753418,
        y: 28.075841903687
    },
    {
        name: "المنطقة الصناعية بملوي الجديدة",
        governorate: "المنيا",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 1310,
        decision: "الانشاء: قرار جمهوري رقم 347 لسنة 2018\nقرار وزاري رقم 79 لسنة 2020 (باعتماد المخطط الاستراتيجي العام)",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الصناعية يأسيوط الجديدة",
        governorate: "أسيوط",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 471.75,
        decision: "قرار جمهورى رقم 194 لسنة 2000",
        x: 31.315462112427,
        y: 27.256406784058
    },
    {
        name: "المنطقة الصناعية بمدينة غرب أسيوط (ناصر)",
        governorate: "أسيوط",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 639,
        decision: "قرار جمهوري رقم 78 لسنة 2017\nقرار وزير الإسكان بإعتماد المخطط الاستراتيجي رقم 1056 لسنة 2017",
        x: 0,
        y: 0
    },
    {
        name: "المنطقة الصناعية بسوهاج الجديدة",
        governorate: "سوهاج",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 97.37,
        decision: "قرار جمهورى رقم 196 لسنة 2000",
        x: 31.643182754517,
        y: 26.384994506836
    },
    {
        name: "المنطقة الصناعية باخميم الجديدة",
        governorate: "سوهاج",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 203,
        decision: "قرار جمهوري رقم 195 لسنة 2000\nالتعديل: قرار جمهوري رقم 1623 لسنة 2015",
        x: 31.84034538269,
        y: 26.505844116211
    },
    {
        name: "المنطقة الصناعية والحرفية بمدينة قنا الجديدة",
        governorate: "قنا",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 618,
        decision: "قرار جمهورى رقم 197 لسنة 2000",
        x: 32.823616027832,
        y: 26.17872428894
    },
    {
        name: "المنطقة الصناعية بمدينة غرب قنا",
        governorate: "قنا",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 130,
        decision: "",
        x: 0,
        y: 0
    },
    {
        name: "مدينة طيبة الجديدة",
        governorate: "الأقصر",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 382.71,
        decision: "قرار جمهورى رقم 198 لسنة 2000",
        x: 32.764583587646,
        y: 25.720167160034
    },
    {
        name: "المنطقة الصناعية باسوان الجديدة",
        governorate: "اسوان",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 2384,
        decision: "الانشاء: قرار رئيس الجمهورية رقم 96 لسنة 1999",
        x: 32.800163269043,
        y: 24.149909973145
    },
    {
        name: "المنطقة الصناعية بمدينة توشكى الجديدة",
        governorate: "اسوان",
        dependency: "هيئة المجتمعات العمرانية الجديدة",
        area: 57,
        decision: "الانشاء: قرار جمهوري رقم 355 لسنة 2016",
        x: 31.555902481079,
        y: 22.859762191772
    },

    // ============ مناطق تابعة لوزارة الصناعة ============
    {
        name: "الواحات",
        governorate: "الجيزة",
        dependency: "وزارة الصناعة",
        area: 272119,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 29.249273300171,
        y: 28.361103057861
    },
    {
        name: "شمال عتاقة",
        governorate: "السويس",
        dependency: "وزارة الصناعة",
        area: 18896.5,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 32.332809448242,
        y: 30.053195953369
    },
    {
        name: "غرب عتاقة",
        governorate: "السويس",
        dependency: "وزارة الصناعة",
        area: 31381.5,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 32.046035766602,
        y: 29.900096893311
    },
    {
        name: "جبل غراب",
        governorate: "بني سويف",
        dependency: "وزارة الصناعة",
        area: 161374,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 31.317817687988,
        y: 28.934986114502
    },
    {
        name: "وادي سريريه",
        governorate: "المنيا",
        dependency: "وزارة الصناعة",
        area: 22676.4,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 30.914497375488,
        y: 28.25493812561
    },
    {
        name: "غرب وادي واعر",
        governorate: "الوادي الجديد",
        dependency: "وزارة الصناعة",
        area: 231158,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 32.086826324463,
        y: 24.171268463135
    },
    {
        name: "العلاقي (1)",
        governorate: "البحر الأحمر",
        dependency: "وزارة الصناعة",
        area: 61840.7,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 33.807964324951,
        y: 23.559272766113
    },
    {
        name: "العلاقي (2)",
        governorate: "البحر الأحمر",
        dependency: "وزارة الصناعة",
        area: 306750,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 33.562446594238,
        y: 23.094186782837
    },
    {
        name: "برنيس(1)",
        governorate: "البحر الأحمر",
        dependency: "وزارة الصناعة",
        area: 120485,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 34.955890655518,
        y: 23.979835510254
    },
    {
        name: "المنطقة الصناعية بالزرابي بجبل وادي سرجة",
        governorate: "أسيوط",
        dependency: "وزارة الصناعة",
        area: 261.32,
        decision: "قرار جمهورى رقم 86 لسنة 2013",
        x: 31.152614593506,
        y: 26.968873977661
    },
    {

        name: "برنيس(2)",
        governorate: "البحر الأحمر",
        dependency: "وزارة الصناعة",
        area: 89615.8,
        decision: "قرار جمهورى رقم 358 لسنة 2008",
        x: 34.287326812744,
        y: 23.927354812622
    },

    // ============ مناطق تابعة لبنك الاستثمار القومي ============
    {
        name: "المنطقة الصناعية بساحل سليم (مجمع صناعات صغيرة)",
        governorate: "أسيوط",
        dependency: "بنك الاستثمار القومي",
        area: 48,
        decision: "قرار رئيس مجلس الوزراء رقم 253 لسنة 1997 - التعديل: قرار جمهوري رقم 157 لسنة 2016",
        x: "",
        y: ""
    },

    // ============ مناطق تابعة للشركة القومية للتشييد والتعمير ============
    {
        name: "المنطقة الصناعية الاستثمارية بالمطاهير",
        governorate: "سوهاج",
        dependency: "الشركة القومية للتشييد والتعمير",
        area: 52278.6,
        decision: "قرار جمهورى رقم 356 لسنة 2008",
        x: 32.187023162842,
        y: 26.391384124756
    },
    {
        name: "المنطقة الاستثمارية بجبل الجير",
        governorate: "قنا",
        dependency: "الشركة القومية للتشييد والتعمير",
        area: 60530,
        decision: "قرار جمهورى رقم 356 لسنة 2008",
        x: 32.942478179932,
        y: 26.143478393555
    }

        
];

// تعريف جميع التبعيات
const industrialDependencies = [
    "المحافظة",
    "الهيئة العامة للتنمية الصناعية", 
    "الهيئة العامة للاستثمار والمناطق الحرة",
    "الهيئة العامة للمنطقة الاقتصادية بمنطقة شمال غرب خليج السويس",
    "هيئة المجتمعات العمرانية الجديدة",
    "وزارة الصناعة",
    "بنك الاستثمار القومي",
    "الشركة القومية للتشييد والتعمير"
];

// هذا السطر مهم جداً لكي يرى المساعد البيانات
window.industrialAreasData = industrialAreasData;

