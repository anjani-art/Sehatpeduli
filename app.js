document.addEventListener('DOMContentLoaded', () => {
    // --- PWA Navigation Logic ---
    const navLinks = document.querySelectorAll('.nav-links a');
    const pages = document.querySelectorAll('.page');
    // Select all buttons/links that should navigate to another section
    const navigateButtons = document.querySelectorAll('.navigate-btn');

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

    // Event listener for main navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            showPage(targetId);
            // Hide article detail view if navigating away from info-kesehatan
            if (targetId !== '#info-kesehatan') {
                document.getElementById('article-detail-view').style.display = 'none';
                document.querySelector('.article-list').style.display = 'block';
                document.querySelector('.search-bar').style.display = 'block';
                document.querySelector('.article-categories').style.display = 'block';
            }
        });
    });

    // Event listener for all general navigation buttons (quick access, article headlines, "Atur Target")
    navigateButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-target');
            if (targetId) {
                showPage(targetId);
                // If navigating to an article detail from headline
                if (button.hasAttribute('data-article-id') && targetId === '#info-kesehatan') {
                    const articleId = button.getAttribute('data-article-id');
                    showArticleDetail(articleId);
                }
            }
        });
    });

    // Initialize to Home page
    showPage('#home');

    // --- Data Storage (using localStorage for simplicity) ---
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

    // --- Helper function for daily reset logic (e.g., for medicine reminders and water intake) ---
    function isToday(dateString) {
        if (!dateString) return false;
        return new Date(dateString).toDateString() === new Date().toDateString();
    }

    // --- 1. Home Section Logic ---
    const dailyHealthSummaryEl = document.getElementById('daily-health-summary');
    const dailyHealthTipEl = document.getElementById('daily-health-tip');

    // Load initial data for water and reset if new day
    let waterConsumedToday = getStoredData('waterConsumedToday', 0);
    let lastWaterResetDate = getStoredData('lastWaterResetDate', null);

    if (!lastWaterResetDate || !isToday(lastWaterResetDate)) {
        waterConsumedToday = 0; // Reset for new day
        setStoredData('waterConsumedToday', waterConsumedToday);
        setStoredData('lastWaterResetDate', new Date().toISOString());
    }

    let waterTarget = getStoredData('waterTarget', 2000); // Default 2000ml

    function updateHomeSummary() {
        // Update home page elements
        const reminders = getStoredData('medicineReminders', []);
        // Filter reminders for today that haven't been taken yet
        const activeReminders = reminders.filter(r => {
            // Check if reminder is for today and not yet taken
            return r.schedule.some(time => {
                const reminderDate = new Date(); // Current date
                const [hours, minutes] = time.split(':').map(Number);
                reminderDate.setHours(hours, minutes, 0, 0);

                // Check if the reminder time is today and has not passed yet, and not taken
                return isToday(reminderDate.toISOString()) &&
                       reminderDate.getTime() > Date.now() &&
                       !r.takenDates.some(takenDate => isToday(takenDate));
            });
        });

        let summaryText = `Anda sudah minum ${waterConsumedToday / 1000} liter air hari ini.`;
        if (activeReminders.length > 0) {
            summaryText += `<br>Ada **${activeReminders.length}** pengingat obat aktif.`;
        } else {
            summaryText += `<br>Belum ada pengingat obat aktif hari ini.`;
        }
        dailyHealthSummaryEl.innerHTML = summaryText;

        // Simple daily tip rotation
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
    updateHomeSummary(); // Initial update on load

    // --- 2. Informasi Kesehatan Logic ---
    const articleSearchInput = document.getElementById('article-search');
    const articleListContainer = document.querySelector('.article-list');
    const allArticleItems = document.querySelectorAll('.article-item'); // All static items
    const categoryFilters = document.querySelectorAll('.category-filter');

    const articleDetailView = document.getElementById('article-detail-view');
    const detailArticleTitle = document.getElementById('detail-article-title');
    const detailArticleContent = document.getElementById('detail-article-content');
    const backToArticlesBtn = document.getElementById('back-to-articles');

    // Simulate article content (in a real app, this might come from an API)
    const articlesData = {
        "1": {
            title: "Manfaat Tidur Cukup untuk Produktivitas",
            content: "Tidur yang berkualitas adalah fondasi penting untuk produktivitas dan kesehatan secara keseluruhan. Ketika Anda mendapatkan tidur yang cukup, otak Anda memiliki waktu untuk memproses informasi, mengkonsolidasikan memori, dan membuang racun yang menumpuk selama siang hari. Ini berarti Anda akan merasa lebih fokus, kreatif, dan mampu memecahkan masalah dengan lebih baik. Kurang tidur dapat menyebabkan penurunan konsentrasi, mood yang buruk, dan bahkan masalah kesehatan kronis. Pastikan Anda menciptakan rutinitas tidur yang konsisten, menjaga kamar tetap gelap dan sejuk, serta menghindari kafein dan layar gadget sebelum tidur. Prioritaskan tidur Anda sebagai investasi untuk hari esok yang lebih produktif!"
        },
        "2": {
            title: "Resep Smoothie Sehat untuk Sarapan",
            content: "Memulai hari dengan sarapan bergizi adalah kunci untuk energi sepanjang hari. Smoothie bisa menjadi pilihan yang cepat dan lezat! Coba resep ini: Campurkan 1 buah pisang beku, segenggam bayam (jangan khawatir, rasanya tidak akan dominan!), setengah cangkir buah beri campur (stroberi, blueberry, raspberry), 1 sendok makan selai kacang alami, dan 1 cangkir susu nabati (almond, oat, atau kedelai). Blender semua bahan hingga halus. Smoothie ini kaya akan serat, vitamin, mineral, dan protein yang akan membuat Anda kenyang lebih lama. Anda bisa berkreasi dengan menambahkan biji chia, biji rami, atau bubuk protein untuk nutrisi tambahan. Selamat mencoba!"
        },
        "3": {
            title: "Tips Meningkatkan Kualitas Tidur Anda",
            content: "Kualitas tidur sangat memengaruhi kesehatan dan kesejahteraan Anda. Jika Anda kesulitan tidur nyenyak, ada beberapa kebiasaan yang bisa Anda coba. Pertama, buat jadwal tidur yang teratur, bahkan di akhir pekan. Kedua, ciptakan lingkungan kamar tidur yang ideal: gelap, tenang, dan sejuk. Hindari penggunaan perangkat elektronik setidaknya satu jam sebelum tidur karena cahaya biru dapat mengganggu produksi melatonin. Batasi konsumsi kafein dan alkohol, terutama di sore dan malam hari. Terakhir, pertimbangkan untuk melakukan aktivitas relaksasi sebelum tidur seperti membaca buku, mandi air hangat, atau meditasi ringan. Dengan konsistensi, Anda akan merasakan peningkatan kualitas tidur yang signifikan."
        }
    };

    function filterArticles() {
        const searchTerm = articleSearchInput.value.toLowerCase();
        const activeCategoryFilter = document.querySelector('.category-filter.active');
        const activeCategory = activeCategoryFilter ? activeCategoryFilter.dataset.category : 'all';

        allArticleItems.forEach(item => {
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

    // Initial filter when page loads
    filterArticles();

    articleSearchInput.addEventListener('input', filterArticles);

    categoryFilters.forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();
            categoryFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            filterArticles();
        });
    });

    // Handle showing article detail
    document.querySelectorAll('.article-detail-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const articleId = link.getAttribute('data-article-id');
            showArticleDetail(articleId);
        });
    });

    // Handle "Kembali ke Daftar Artikel" button
    backToArticlesBtn.addEventListener('click', () => {
        articleDetailView.style.display = 'none';
        articleListContainer.style.display = 'block';
        document.querySelector('.search-bar').style.display = 'block';
        document.querySelector('.article-categories').style.display = 'block';
    });


    function showArticleDetail(articleId) {
        const article = articlesData[articleId];
        if (article) {
            detailArticleTitle.textContent = article.title;
            detailArticleContent.textContent = article.content; // Use textContent to avoid XSS if content is from external source

            articleListContainer.style.display = 'none';
            document.querySelector('.search-bar').style.display = 'none';
            document.querySelector('.article-categories').style.display = 'none';
            articleDetailView.style.display = 'block';
            window.scrollTo(0, 0); // Scroll to top
        } else {
            alert('Artikel tidak ditemukan.');
        }
    }


    // Favorites logic
    let favoriteArticles = getStoredData('favoriteArticles', []);

    function updateFavoriteButtons() {
        document.querySelectorAll('.add-to-favorite').forEach(button => {
            const articleItem = button.closest('.article-item');
            const articleId = articleItem.dataset.articleId;
            const favoriteStatusSpan = articleItem.querySelector('.favorite-status');

            if (favoriteArticles.includes(articleId)) {
                button.textContent = 'Hapus dari Favorit';
                button.classList.add('favorited');
                favoriteStatusSpan.textContent = '⭐'; // Or other indicator
            } else {
                button.textContent = 'Tambah ke Favorit';
                button.classList.remove('favorited');
                favoriteStatusSpan.textContent = '';
            }
        });
    }
    updateFavoriteButtons(); // Call on load

    document.querySelectorAll('.add-to-favorite').forEach(button => {
        button.addEventListener('click', () => {
            const articleItem = button.closest('.article-item');
            const articleId = articleItem.dataset.articleId;

            if (favoriteArticles.includes(articleId)) {
                // Remove from favorites
                favoriteArticles = favoriteArticles.filter(id => id !== articleId);
                alert(`Artikel dihapus dari favorit.`);
            } else {
                // Add to favorites
                favoriteArticles.push(articleId);
                alert(`Artikel ditambahkan ke favorit!`);
            }
            setStoredData('favoriteArticles', favoriteArticles);
            updateFavoriteButtons(); // Update button text and status visually
        });
    });


    // --- 3. Tools Section Logic ---

    // Pelacak Air Minum
    const addWaterBtn = document.getElementById('add-water-btn');
    const waterConsumedEl = document.getElementById('water-consumed');
    const waterProgressBar = document.getElementById('water-progress-bar');
    const waterTargetEl = document.getElementById('water-target');

    function updateWaterTrackerUI() {
        waterConsumedEl.textContent = waterConsumedToday;
        waterTargetEl.textContent = waterTarget;
        const progress = (waterConsumedToday / waterTarget) * 100;
        waterProgressBar.style.width = `${Math.min(100, progress)}%`;
        waterProgressBar.style.backgroundColor = progress >= 100 ? '#28a745' : 'var(--color-green-primary)'; // Green if target met
        updateHomeSummary(); // Update home summary immediately
    }
    updateWaterTrackerUI(); // Initial update

    addWaterBtn.addEventListener('click', () => {
        waterConsumedToday += 250;
        setStoredData('waterConsumedToday', waterConsumedToday);
        updateWaterTrackerUI(); // Update UI immediately
    });


    // Pengingat Obat
    const addMedicineForm = document.getElementById('add-medicine-form');
    const activeMedicineRemindersList = document.getElementById('active-medicine-reminders');
    let medicineReminders = getStoredData('medicineReminders', []);

    function renderMedicineReminders() {
        activeMedicineRemindersList.innerHTML = '';
        if (medicineReminders.length === 0) {
            activeMedicineRemindersList.innerHTML = '<li>Belum ada pengingat obat.</li>';
            return;
        }

        medicineReminders.forEach((reminder, index) => {
            const li = document.createElement('li');
            const isTakenToday = reminder.takenDates.some(takenDate => isToday(takenDate));
            const isDisabled = isTakenToday ? 'disabled' : '';
            const buttonText = isTakenToday ? 'Sudah Diminum' : 'Tandai Selesai';
            const buttonClass = isTakenToday ? 'mark-as-taken completed' : 'mark-as-taken';

            li.innerHTML = `
                ${reminder.name} - ${reminder.dose} (${reminder.schedule.join(', ')})
                <button class="${buttonClass}" data-index="${index}" ${isDisabled}>${buttonText}</button>
            `;
            activeMedicineRemindersList.appendChild(li);
        });

        document.querySelectorAll('.mark-as-taken:not(.completed)').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                // Mark as taken for TODAY
                if (!medicineReminders[index].takenDates) {
                    medicineReminders[index].takenDates = [];
                }
                medicineReminders[index].takenDates.push(new Date().toISOString());
                setStoredData('medicineReminders', medicineReminders);
                renderMedicineReminders(); // Re-render to update status
                updateHomeSummary(); // Update home summary
            });
        });
    }
    renderMedicineReminders(); // Initial render

    addMedicineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('medicine-name').value;
        const dose = document.getElementById('medicine-dose').value;
        const scheduleInput = document.getElementById('medicine-schedule').value;
        const schedule = scheduleInput.split(',').map(s => s.trim());

        const isValidSchedule = schedule.every(time => /^\d{2}:\d{2}$/.test(time));
        if (!isValidSchedule) {
            alert('Format jadwal tidak valid. Gunakan HH:MM, HH:MM. Contoh: 08:00, 15:00');
            return;
        }

        const newReminder = { name, dose, schedule, takenDates: [] }; // takenDates to track daily completion
        medicineReminders.push(newReminder);
        setStoredData('medicineReminders', medicineReminders);
        renderMedicineReminders();
        addMedicineForm.reset();
        updateHomeSummary();
    });

    // Reset daily taken status for reminders
    function resetDailyMedicineStatus() {
        let changed = false;
        medicineReminders.forEach(reminder => {
            // Filter out old taken dates, keep only today's (if any)
            const todayTakenDates = reminder.takenDates.filter(takenDate => isToday(takenDate));
            if (todayTakenDates.length !== reminder.takenDates.length) {
                reminder.takenDates = todayTakenDates;
                changed = true;
            }
        });
        if (changed) {
            setStoredData('medicineReminders', medicineReminders);
            renderMedicineReminders();
            updateHomeSummary();
        }
    }
    // Call this daily reset logic periodically or on app start if last reset was yesterday
    // A simple way: check on every app load (as done for water)
    const lastMedicineResetDate = getStoredData('lastMedicineResetDate', null);
    if (!lastMedicineResetDate || !isToday(lastMedicineResetDate)) {
        resetDailyMedicineStatus();
        setStoredData('lastMedicineResetDate', new Date().toISOString());
    }


    // Jurnal Mood Harian
    const moodEmojis = document.querySelectorAll('.mood-emoji');
    const moodNotesInput = document.getElementById('mood-notes');
    const saveMoodBtn = document.getElementById('save-mood-btn');
    const moodHistoryList = document.getElementById('mood-history');
    let moodHistory = getStoredData('moodHistory', []);
    let selectedMood = null;

    function renderMoodHistory() {
        moodHistoryList.innerHTML = '';
        if (moodHistory.length === 0) {
            moodHistoryList.innerHTML = '<li>Belum ada riwayat mood.</li>';
            return;
        }
        moodHistory.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${new Date(entry.date).toLocaleDateString()}</strong> ${entry.emoji} ${entry.mood} - ${entry.notes || ''}`;
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
            // Check if mood for today already exists, if so, update it
            const todayEntryIndex = moodHistory.findIndex(entry => isToday(entry.date));
            if (todayEntryIndex > -1) {
                moodHistory[todayEntryIndex] = newMoodEntry; // Update existing entry
            } else {
                moodHistory.unshift(newMoodEntry); // Add to beginning
            }

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
        if (emergencyContacts.length === 0) {
            emergencyContactsList.innerHTML = '<li>Belum ada kontak darurat.</li>';
            return;
        }
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

        // Ensure water target input is updated when profile page is loaded
        setWaterTargetInput.value = waterTarget;
    }
    loadUserProfile(); // Initial load

    // When profile section becomes active, ensure fields are populated
    document.querySelector('#profile-settings').addEventListener('click', () => {
        loadUserProfile();
    });


    saveUserInfoBtn.addEventListener('click', () => {
        userProfile.name = userNameInput.value;
        userProfile.dob = userDobInput.value;
        userProfile.gender = userGenderSelect.value;
        setStoredData('userProfile', userProfile);
        alert('Informasi pengguna berhasil disimpan!');
    });


    saveWaterTargetBtn.addEventListener('click', () => {
        const newTarget = parseInt(setWaterTargetInput.value);
        if (isNaN(newTarget) || newTarget <= 0) {
            alert('Target air minum harus angka positif.');
            return;
        }
        setStoredData('waterTarget', newTarget);
        waterTarget = newTarget; // Update local variable
        updateWaterTrackerUI(); // Update tracker to reflect new target immediately
        alert('Target air minum berhasil disimpan!');
    });
});
