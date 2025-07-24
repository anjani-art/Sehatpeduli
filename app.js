document.addEventListener('DOMContentLoaded', () => {
    // --- PWA Navigation Logic ---
    const navLinks = document.querySelectorAll('.nav-links a');
    const pages = document.querySelectorAll('.page');
    const quickAccessButtons = document.querySelectorAll('.quick-access button');
    const btnLinks = document.querySelectorAll('.btn-link');

    function showPage(id) {
        pages.forEach(page => page.classList.remove('active'));
        document.querySelector(id).classList.add('active');

        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-links a[href="${id}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        window.scrollTo(0, 0); // Scroll to top when changing page
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            showPage(targetId);
        });
    });

    quickAccessButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-target');
            showPage(targetId);
        });
    });

    btnLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            if (targetId) { // Check if data-target exists
                showPage(targetId);
            } else { // For privacy policy/terms, just show alert as they are placeholders
                alert('Halaman ini belum tersedia. Data Anda disimpan secara lokal di perangkat Anda.');
            }
        });
    });


    // Initialize to Home page
    showPage('#home');

    // --- Data Storage (using localStorage for simplicity) ---
    // A more robust app might use IndexedDB for larger data sets.

    const getStoredData = (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error retrieving ${key} from localStorage:`, e);
            return defaultValue;
        }
    };

    const setStoredData = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving ${key} to localStorage:`, e);
        }
    };

    // --- 1. Home Section Logic ---
    const dailyHealthSummaryEl = document.getElementById('daily-health-summary');
    const dailyHealthTipEl = document.getElementById('daily-health-tip');
    const waterConsumedToday = getStoredData('waterConsumedToday', 0);
    const waterTarget = getStoredData('waterTarget', 2000); // Default 2000ml

    function updateHomeSummary() {
        // Example: Update daily summary based on water intake and medicine reminders
        const reminders = getStoredData('medicineReminders', []);
        const activeReminders = reminders.filter(r => !r.isTaken && isToday(r.nextDoseDate)); // Assuming nextDoseDate is set
        let summaryText = `Anda sudah minum ${waterConsumedToday / 1000} liter air hari ini.`;
        if (activeReminders.length > 0) {
            summaryText += `<br>Ada ${activeReminders.length} pengingat obat aktif.`;
        } else {
            summaryText += `<br>Belum ada pengingat obat aktif.`;
        }
        dailyHealthSummaryEl.innerHTML = summaryText;

        // Simple daily tip rotation (for demonstration)
        const tips = [
            "Mulailah hari dengan segelas air putih!",
            "Variasikan menu makanmu dengan sayuran berwarna!",
            "Sempatkan peregangan ringan setiap 1-2 jam kerja.",
            "Prioritaskan tidur 7-9 jam setiap malam untuk energi optimal.",
            "Lakukan aktivitas fisik yang kamu nikmati, jangan hanya sebagai kewajiban."
        ];
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        dailyHealthTipEl.textContent = tips[dayOfYear % tips.length];
    }
    updateHomeSummary(); // Initial update

    // --- 2. Informasi Kesehatan Logic ---
    const articleSearchInput = document.getElementById('article-search');
    const articleListContainer = document.querySelector('.article-list');
    const articleItems = document.querySelectorAll('.article-item');
    const categoryFilters = document.querySelectorAll('.category-filter');

    function filterArticles() {
        const searchTerm = articleSearchInput.value.toLowerCase();
        const activeCategory = document.querySelector('.category-filter.active')?.dataset.category || 'all';

        articleItems.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const category = item.dataset.category;

            const matchesSearch = title.includes(searchTerm);
            const matchesCategory = (activeCategory === 'all' || category === activeCategory);

            if (matchesSearch && matchesCategory) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    articleSearchInput.addEventListener('input', filterArticles);

    categoryFilters.forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();
            categoryFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            filterArticles();
        });
    });

    // Favorites (simple example)
    document.querySelectorAll('.add-to-favorite').forEach(button => {
        button.addEventListener('click', () => {
            const articleTitle = button.previousElementSibling.previousElementSibling.textContent;
            alert(`"${articleTitle}" ditambahkan ke favorit! (Fitur ini perlu diimplementasikan lebih lanjut)`);
            // In a real app, you'd store this in localStorage/IndexedDB
        });
    });


    // --- 3. Tools Section Logic ---

    // Pelacak Air Minum
    const addWaterBtn = document.getElementById('add-water-btn');
    const waterConsumedEl = document.getElementById('water-consumed');
    const waterProgressBar = document.getElementById('water-progress-bar');
    const waterTargetEl = document.getElementById('water-target');

    function updateWaterTracker() {
        waterConsumedEl.textContent = waterConsumedToday;
        waterTargetEl.textContent = waterTarget;
        const progress = (waterConsumedToday / waterTarget) * 100;
        waterProgressBar.style.width = `${Math.min(100, progress)}%`;
        updateHomeSummary(); // Update home summary when water changes
    }
    updateWaterTracker();

    addWaterBtn.addEventListener('click', () => {
        const newConsumed = waterConsumedToday + 250;
        setStoredData('waterConsumedToday', newConsumed);
        waterConsumedToday = newConsumed; // Update local variable for immediate use
        updateWaterTracker();
    });

    // Reset water daily (simple logic, could be more robust with date checks)
    const lastWaterReset = getStoredData('lastWaterReset', null);
    if (!lastWaterReset || new Date(lastWaterReset).toDateString() !== new Date().toDateString()) {
        setStoredData('waterConsumedToday', 0);
        setStoredData('lastWaterReset', new Date().toISOString());
        waterConsumedToday = 0; // Reset local variable
        updateWaterTracker();
    }


    // Pengingat Obat
    const addMedicineForm = document.getElementById('add-medicine-form');
    const activeMedicineRemindersList = document.getElementById('active-medicine-reminders');
    let medicineReminders = getStoredData('medicineReminders', []);

    function renderMedicineReminders() {
        activeMedicineRemindersList.innerHTML = '';
        medicineReminders.forEach((reminder, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${reminder.name} - ${reminder.dose} (${reminder.schedule.join(', ')})
                <button class="mark-as-taken" data-index="${index}" ${reminder.isTaken ? 'disabled' : ''}>${reminder.isTaken ? 'Sudah Diminum' : 'Tandai Selesai'}</button>
            `;
            activeMedicineRemindersList.appendChild(li);
        });

        document.querySelectorAll('.mark-as-taken').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                medicineReminders[index].isTaken = true;
                medicineReminders[index].takenDate = new Date().toISOString(); // Record when taken
                setStoredData('medicineReminders', medicineReminders);
                renderMedicineReminders();
                updateHomeSummary(); // Update home summary
            });
        });
    }
    renderMedicineReminders();

    addMedicineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('medicine-name').value;
        const dose = document.getElementById('medicine-dose').value;
        const scheduleInput = document.getElementById('medicine-schedule').value;
        const schedule = scheduleInput.split(',').map(s => s.trim());

        // Simple check to ensure HH:MM format (can be more robust)
        const isValidSchedule = schedule.every(time => /^\d{2}:\d{2}$/.test(time));
        if (!isValidSchedule) {
            alert('Format jadwal tidak valid. Gunakan HH:MM, HH:MM. Contoh: 08:00, 15:00');
            return;
        }

        const newReminder = { name, dose, schedule, isTaken: false, nextDoseDate: new Date().toDateString() }; // Simple next dose logic for example
        medicineReminders.push(newReminder);
        setStoredData('medicineReminders', medicineReminders);
        renderMedicineReminders();
        addMedicineForm.reset();
        updateHomeSummary(); // Update home summary
    });

    // Jurnal Mood Harian
    const moodEmojis = document.querySelectorAll('.mood-emoji');
    const moodNotesInput = document.getElementById('mood-notes');
    const saveMoodBtn = document.getElementById('save-mood-btn');
    const moodHistoryList = document.getElementById('mood-history');
    let moodHistory = getStoredData('moodHistory', []);
    let selectedMood = null;

    function renderMoodHistory() {
        moodHistoryList.innerHTML = '';
        moodHistory.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `${new Date(entry.date).toLocaleDateString()} ${entry.emoji} ${entry.mood} - ${entry.notes || ''}`;
            moodHistoryList.appendChild(li);
        });
    }
    renderMoodHistory();

    moodEmojis.forEach(emoji => {
        emoji.addEventListener('click', () => {
            moodEmojis.forEach(e => e.classList.remove('selected'));
            emoji.classList.add('selected');
            selectedMood = {
                mood: emoji.dataset.mood,
                emoji: emoji.textContent.trim().split(' ')[0] // Get just the emoji char
            };
        });
    });

    saveMoodBtn.addEventListener('click', () => {
        if (selectedMood) {
            const newMoodEntry = {
                date: new Date().toISOString(),
                mood: selectedMood.mood,
                emoji: selectedMood.emoji,
                notes: moodNotesInput.value.trim()
            };
            moodHistory.unshift(newMoodEntry); // Add to beginning
            setStoredData('moodHistory', moodHistory);
            renderMoodHistory();
            selectedMood = null;
            moodNotesInput.value = '';
            moodEmojis.forEach(e => e.classList.remove('selected'));
            alert('Mood Anda berhasil disimpan!');
        } else {
            alert('Silakan pilih mood Anda terlebih dahulu.');
        }
    });

    // Kalkulator BMI
    const bmiHeightInput = document.getElementById('bmi-height');
    const bmiWeightInput = document.getElementById('bmi-weight');
    const calculateBmiBtn = document.getElementById('calculate-bmi-btn');
    const bmiResultEl = document.getElementById('bmi-result');
    const bmiCategoryEl = document.getElementById('bmi-category');

    calculateBmiBtn.addEventListener('click', () => {
        const heightCm = parseFloat(bmiHeightInput.value);
        const weightKg = parseFloat(bmiWeightInput.value);

        if (isNaN(heightCm) || isNaN(weightKg) || heightCm <= 0 || weightKg <= 0) {
            alert('Mohon masukkan tinggi dan berat badan yang valid.');
            return;
        }

        const heightM = heightCm / 100;
        const bmi = (weightKg / (heightM * heightM)).toFixed(2);
        let category = '';

        if (bmi < 18.5) {
            category = 'Kurus';
        } else if (bmi >= 18.5 && bmi <= 24.9) {
            category = 'Normal';
        } else if (bmi >= 25 && bmi <= 29.9) {
            category = 'Gemuk (Overweight)';
        } else {
            category = 'Sangat Gemuk (Obese)';
        }

        bmiResultEl.textContent = bmi;
        bmiCategoryEl.textContent = category;
        setStoredData('lastBMI', { heightCm, weightKg, bmi, category });
    });

    // Load last BMI
    const lastBMI = getStoredData('lastBMI', null);
    if (lastBMI) {
        bmiHeightInput.value = lastBMI.heightCm;
        bmiWeightInput.value = lastBMI.weightKg;
        bmiResultEl.textContent = lastBMI.bmi;
        bmiCategoryEl.textContent = lastBMI.category;
    }


    // Kalkulator Kebutuhan Kalori Estimasi
    const calorieAgeInput = document.getElementById('calorie-age');
    const calorieGenderSelect = document.getElementById('calorie-gender');
    const calorieHeightInput = document.getElementById('calorie-height');
    const calorieWeightInput = document.getElementById('calorie-weight');
    const calorieActivitySelect = document.getElementById('calorie-activity');
    const calculateCalorieBtn = document.getElementById('calculate-calorie-btn');
    const calorieResultEl = document.getElementById('calorie-result');

    calculateCalorieBtn.addEventListener('click', () => {
        const age = parseInt(calorieAgeInput.value);
        const gender = calorieGenderSelect.value;
        const heightCm = parseFloat(calorieHeightInput.value);
        const weightKg = parseFloat(calorieWeightInput.value);
        const activityLevel = calorieActivitySelect.value;

        if (isNaN(age) || isNaN(heightCm) || isNaN(weightKg) || age <= 0 || heightCm <= 0 || weightKg <= 0) {
            alert('Mohon masukkan data yang valid untuk perhitungan kalori.');
            return;
        }

        let bmr; // Basal Metabolic Rate
        if (gender === 'male') {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        } else { // female
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        }

        let tdee; // Total Daily Energy Expenditure (estimated calories)
        switch (activityLevel) {
            case 'sedentary': tdee = bmr * 1.2; break;
            case 'light': tdee = bmr * 1.375; break;
            case 'moderate': tdee = bmr * 1.55; break;
            case 'active': tdee = bmr * 1.725; break;
            case 'very-active': tdee = bmr * 1.9; break;
            default: tdee = bmr * 1.2;
        }

        calorieResultEl.textContent = Math.round(tdee);
        setStoredData('lastCalorieCalc', { age, gender, heightCm, weightKg, activityLevel, tdee: Math.round(tdee) });
    });

    // Load last Calorie Calculation
    const lastCalorieCalc = getStoredData('lastCalorieCalc', null);
    if (lastCalorieCalc) {
        calorieAgeInput.value = lastCalorieCalc.age;
        calorieGenderSelect.value = lastCalorieCalc.gender;
        calorieHeightInput.value = lastCalorieCalc.heightCm;
        calorieWeightInput.value = lastCalorieCalc.weightKg;
        calorieActivitySelect.value = lastCalorieCalc.activityLevel;
        calorieResultEl.textContent = lastCalorieCalc.tdee;
    }


    // Daftar Kontak Darurat
    const addContactForm = document.getElementById('add-contact-form');
    const emergencyContactsList = document.getElementById('emergency-contacts-list');
    let emergencyContacts = getStoredData('emergencyContacts', []);

    function renderEmergencyContacts() {
        emergencyContactsList.innerHTML = '';
        emergencyContacts.forEach((contact, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${contact.name}: ${contact.number}
                <button class="btn-link remove-contact" data-index="${index}">Hapus</button>
            `;
            emergencyContactsList.appendChild(li);
        });

        document.querySelectorAll('.remove-contact').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                emergencyContacts.splice(index, 1);
                setStoredData('emergencyContacts', emergencyContacts);
                renderEmergencyContacts();
            });
        });
    }
    renderEmergencyContacts();

    addContactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value;
        const number = document.getElementById('contact-number').value;

        if (name && number) {
            emergencyContacts.push({ name, number });
            setStoredData('emergencyContacts', emergencyContacts);
            renderEmergencyContacts();
            addContactForm.reset();
        } else {
            alert('Nama dan nomor kontak tidak boleh kosong.');
        }
    });

    // --- 4. Profile & Settings Logic ---
    const userNameInput = document.getElementById('user-name');
    const userDobInput = document.getElementById('user-dob');
    const userGenderSelect = document.getElementById('user-gender');
    const saveUserInfoBtn = document.getElementById('save-user-info');
    const setWaterTargetInput = document.getElementById('set-water-target');
    const saveWaterTargetBtn = document.getElementById('save-water-target');

    let userProfile = getStoredData('userProfile', {});

    function loadUserProfile() {
        if (userProfile.name) userNameInput.value = userProfile.name;
        if (userProfile.dob) userDobInput.value = userProfile.dob;
        if (userProfile.gender) userGenderSelect.value = userProfile.gender;
    }
    loadUserProfile();

    saveUserInfoBtn.addEventListener('click', () => {
        userProfile.name = userNameInput.value;
        userProfile.dob = userDobInput.value;
        userProfile.gender = userGenderSelect.value;
        setStoredData('userProfile', userProfile);
        alert('Informasi pengguna berhasil disimpan!');
    });

    // Load water target setting
    setWaterTargetInput.value = waterTarget; // Use the already loaded waterTarget variable

    saveWaterTargetBtn.addEventListener('click', () => {
        const newTarget = parseInt(setWaterTargetInput.value);
        if (isNaN(newTarget) || newTarget <= 0) {
            alert('Target air minum harus angka positif.');
            return;
        }
        setStoredData('waterTarget', newTarget);
        waterTarget = newTarget; // Update local variable
        updateWaterTracker(); // Update tracker to reflect new target
        alert('Target air minum berhasil disimpan!');
    });


    // Helper function for daily reset logic (e.g., for medicine reminders)
    function isToday(dateString) {
        if (!dateString) return false;
        return new Date(dateString).toDateString() === new Date().toDateString();
    }
});
