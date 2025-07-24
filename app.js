document.addEventListener('DOMContentLoaded', () => {
    // --- PWA Navigation Logic ---
    const navLinks = document.querySelectorAll('.nav-links a');
    const pages = document.querySelectorAll('.page');
    const navigateButtons = document.querySelectorAll('.navigate-btn'); // For main nav buttons, and "Atur Target"

    function showPage(id) {
        pages.forEach(page => page.classList.remove('active'));
        document.querySelector(id).classList.add('active');

        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-links a[href="${id}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        window.scrollTo(0, 0); // Scroll to top when changing page
        // If navigating to home, update quick access
        if (id === '#home') {
            updateQuickAccessContent();
        }
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

    // Event listener for all general navigation buttons (like "Atur Target" or article headlines)
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
    const quickAccessContentEl = document.getElementById('quick-access-content'); // New element

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
        const now = new Date();
        const activeReminders = reminders.filter(r => {
            // Check if reminder is for today and not yet taken for the *current* schedule time
            return r.schedule.some(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const reminderTime = new Date();
                reminderTime.setHours(hours, minutes, 0, 0);

                // Reminder is active if it's for today, hasn't passed, and isn't marked as taken for this specific schedule
                return isToday(reminderTime.toISOString()) &&
                       reminderTime.getTime() > now.getTime() && // Reminder time is in the future
                       !r.takenDates.some(takenEntry => isToday(takenEntry.date) && takenEntry.time === time); // Not taken for this time today
            });
        });

        let summaryText = `Anda sudah minum **${waterConsumedToday / 1000} liter** air hari ini.`;
        if (activeReminders.length > 0) {
            summaryText += `<br>Ada **${activeReminders.length}** pengingat obat yang akan datang.`;
        } else {
            summaryText += `<br>Tidak ada pengingat obat yang akan datang hari ini.`;
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

    // --- New: Update Quick Access Content ---
    function updateQuickAccessContent() {
        const reminders = getStoredData('medicineReminders', []);
        const now = new Date();
        const upcomingReminders = [];

        reminders.forEach(r => {
            r.schedule.forEach(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const reminderDateTime = new Date();
                reminderDateTime.setHours(hours, minutes, 0, 0);

                // Filter for reminders that are for today and in the future
                if (isToday(reminderDateTime.toISOString()) && reminderDateTime.getTime() > now.getTime()) {
                    // Check if this specific schedule for today has already been taken
                    const alreadyTaken = r.takenDates.some(takenEntry => isToday(takenEntry.date) && takenEntry.time === time);
                    if (!alreadyTaken) {
                        upcomingReminders.push({
                            name: r.name,
                            dose: r.dose,
                            time: time,
                            dateTime: reminderDateTime // Store the full date object for sorting
                        });
                    }
                }
            });
        });

        // Sort upcoming reminders by time
        upcomingReminders.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

        let contentHtml = '';
        if (upcomingReminders.length > 0) {
            contentHtml += '<p>Pengingat obat yang akan datang:</p><ul>';
            // Show up to 3 upcoming reminders
            for (let i = 0; i < Math.min(3, upcomingReminders.length); i++) {
                const r = upcomingReminders[i];
                contentHtml += `<li><strong>${r.name}</strong> (${r.dose}) pada **${r.time}**</li>`;
            }
            contentHtml += '</ul>';
            // Add a button to navigate to the full medicine reminder section
            contentHtml += `<button class="btn-primary navigate-btn" data-target="#tools-medicine">Lihat Semua Pengingat Obat</button>`;
        } else {
            contentHtml = '<p>Tidak ada pengingat obat yang akan datang hari ini.</p>';
            contentHtml += `<button class="btn-primary navigate-btn" data-target="#tools-medicine">Tambah Pengingat Obat</button>`;
        }
        quickAccessContentEl.innerHTML = contentHtml;

        // Re-attach event listeners for newly created navigate buttons
        document.querySelectorAll('#quick-access-content .navigate-btn').forEach(button => {
            button.removeEventListener('click', handleNavigateButtonClick); // Remove old listener if exists
            button.addEventListener('click', handleNavigateButtonClick); // Add new one
        });
    }

    // Helper function for navigate button click (to avoid duplication)
    function handleNavigateButtonClick(e) {
        e.preventDefault();
        const targetId = this.getAttribute('data-target');
        if (targetId) {
            showPage(targetId);
        }
    }

    updateQuickAccessContent(); // Initial update on load

    // --- 2. Informasi Kesehatan Logic ---
    const articleSearchInput = document.getElementById('article-search');
    const articleListContainer = document.querySelector('.article-list');
    const allArticleItems = document.querySelectorAll('.article-item');
    const categoryFilters = document.querySelectorAll('.category-filter');

    const articleDetailView = document.getElementById('article-detail-view');
    const detailArticleTitle = document.getElementById('detail-article-title');
    const detailArticleContent = document.getElementById('detail-article-content');
    const backToArticlesBtn = document.getElementById('back-to-articles');

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

    filterArticles(); // Initial filter when page loads
    articleSearchInput.addEventListener('input', filterArticles);

    categoryFilters.forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();
            categoryFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            filterArticles();
        });
    });

    document.querySelectorAll('.article-detail-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const articleId = link.getAttribute('data-article-id');
            showArticleDetail(articleId);
        });
    });

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
            detailArticleContent.textContent = article.content;

            articleListContainer.style.display = 'none';
            document.querySelector('.search-bar').style.display = 'none';
            document.querySelector('.article-categories').style.display = 'none';
            articleDetailView.style.display = 'block';
            window.scrollTo(0, 0);
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
                favoriteStatusSpan.textContent = '⭐';
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
                favoriteArticles = favoriteArticles.filter(id => id !== articleId);
                alert(`Artikel dihapus dari favorit.`);
            } else {
                favoriteArticles.push(articleId);
                alert(`Artikel ditambahkan ke favorit!`);
            }
            setStoredData('favoriteArticles', favoriteArticles);
            updateFavoriteButtons();
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
        waterProgressBar.style.backgroundColor = progress >= 100 ? '#28a745' : 'var(--color-green-primary)';
        updateHomeSummary(); // Update home summary immediately
    }
    updateWaterTrackerUI(); // Initial update

    addWaterBtn.addEventListener('click', () => {
        waterConsumedToday += 250;
        setStoredData('waterConsumedToday', waterConsumedToday);
        updateWaterTrackerUI();
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

        const now = new Date();
        medicineReminders.forEach((reminder, index) => {
            const li = document.createElement('li');
            let statusHtml = '';
            let isAnyScheduleTakenToday = false;
            let nextScheduleTime = null;

            reminder.schedule.forEach(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const reminderDateTime = new Date();
                reminderDateTime.setHours(hours, minutes, 0, 0);

                const isThisScheduleTakenToday = reminder.takenDates.some(takenEntry => isToday(takenEntry.date) && takenEntry.time === time);

                if (isThisScheduleTakenToday) {
                    statusHtml += `<span class="completed-schedule">${time} ✔️</span> `;
                    isAnyScheduleTakenToday = true;
                } else if (reminderDateTime.getTime() < now.getTime() && isToday(reminderDateTime.toISOString())) {
                    // Schedule passed for today and not taken
                    statusHtml += `<span class="missed-schedule">${time} ❌</span> `;
                } else {
                    // Upcoming schedule
                    statusHtml += `<span class="upcoming-schedule">${time}</span> `;
                    if (!nextScheduleTime) { // Find the very next upcoming schedule
                        nextScheduleTime = time;
                    }
                }
            });

            const isDisabled = isAnyScheduleTakenToday ? 'disabled' : ''; // Disable if at least one schedule taken
            const buttonText = nextScheduleTime ? `Tandai ${nextScheduleTime} Selesai` : (isAnyScheduleTakenToday ? 'Semua Selesai Hari Ini' : 'Tandai Selesai');
            const buttonClass = isAnyScheduleTakenToday ? 'mark-as-taken completed' : 'mark-as-taken';
            
            li.innerHTML = `
                ${reminder.name} - ${reminder.dose} <br> Jadwal: ${statusHtml}
                <button class="${buttonClass}" data-index="${index}" ${isDisabled}>${buttonText}</button>
                <button class="btn-link remove-medicine" data-index="${index}">Hapus</button>
            `;
            activeMedicineRemindersList.appendChild(li);
        });

        document.querySelectorAll('.mark-as-taken:not(.completed)').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const reminder = medicineReminders[index];
                const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

                // Find the closest upcoming schedule to mark as taken
                let closestScheduleToMark = null;
                let minDiff = Infinity;

                reminder.schedule.forEach(time => {
                    const [hours, minutes] = time.split(':').map(Number);
                    const scheduleDateTime = new Date();
                    scheduleDateTime.setHours(hours, minutes, 0, 0);

                    const isThisScheduleTakenToday = reminder.takenDates.some(takenEntry => isToday(takenEntry.date) && takenEntry.time === time);

                    if (!isThisScheduleTakenToday && isToday(scheduleDateTime.toISOString())) {
                        const diff = Math.abs(scheduleDateTime.getTime() - new Date().getTime());
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestScheduleToMark = time;
                        }
                    }
                });

                if (closestScheduleToMark) {
                    if (!reminder.takenDates) {
                        reminder.takenDates = [];
                    }
                    reminder.takenDates.push({ date: new Date().toISOString(), time: closestScheduleToMark });
                    setStoredData('medicineReminders', medicineReminders);
                    renderMedicineReminders();
                    updateHomeSummary();
                    updateQuickAccessContent(); // Update quick access after medicine reminder changes
                    alert(`Pengingat obat ${reminder.name} (${closestScheduleToMark}) ditandai selesai!`);
                } else {
                    alert('Tidak ada jadwal yang bisa ditandai selesai saat ini.');
                }
            });
        });

        document.querySelectorAll('.remove-medicine').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const confirmDelete = confirm(`Yakin ingin menghapus pengingat obat "${medicineReminders[index].name}"?`);
                if (confirmDelete) {
                    medicineReminders.splice(index, 1);
                    setStoredData('medicineReminders', medicineReminders);
                    renderMedicineReminders();
                    updateHomeSummary();
                    updateQuickAccessContent(); // Update quick access after medicine reminder changes
                }
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

        const newReminder = { name, dose, schedule, takenDates: [] }; // takenDates to track daily completion per schedule
        medicineReminders.push(newReminder);
        setStoredData('medicineReminders', medicineReminders);
        renderMedicineReminders();
        addMedicineForm.reset();
        updateHomeSummary();
        updateQuickAccessContent(); // Update quick access after adding new reminder
    });

    // Reset daily taken status for reminders
    function resetDailyMedicineStatus() {
        let changed = false;
        medicineReminders.forEach(reminder => {
            // Filter out old taken dates, keep only today's (if any)
            const todayTakenEntries = reminder.takenDates.filter(takenEntry => isToday(takenEntry.date));
            if (todayTakenEntries.length !== reminder.takenDates.length) {
                reminder.takenDates = todayTakenEntries;
                changed = true;
            }
        });
        if (changed) {
            setStoredData('medicineReminders', medicineReminders);
            renderMedicineReminders();
            updateHomeSummary();
            updateQuickAccessContent(); // Update quick access after daily reset
        }
    }
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
                emoji: emoji.textContent.trim().split(' ')[0]
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
            const todayEntryIndex = moodHistory.findIndex(entry => isToday(entry.date));
            if (todayEntryIndex > -1) {
                moodHistory[todayEntryIndex] = newMoodEntry;
            } else {
                moodHistory.unshift(newMoodEntry);
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

        let bmr;
        if (gender === 'male') {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        } else {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        }

        let tdee;
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

        setWaterTargetInput.value = waterTarget;
    }
    loadUserProfile();

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
        waterTarget = newTarget;
        updateWaterTrackerUI();
        alert('Target air minum berhasil disimpan!');
    });

    // --- PWA Notification Logic (Tambahan untuk Notifikasi) ---
    // Pastikan Service Worker terdaftar dengan benar
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // Fungsi untuk meminta izin notifikasi
    function requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Browser ini tidak mendukung notifikasi.');
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Izin notifikasi diberikan.');
                // Anda bisa menyimpan status izin di localStorage jika diperlukan
                setStoredData('notificationPermission', 'granted');
            } else {
                console.warn('Izin notifikasi ditolak.');
                setStoredData('notificationPermission', 'denied');
            }
        });
    }

    // Panggil ini di suatu tempat, misalnya saat aplikasi dimuat atau di pengaturan
    // Anda bisa tambahkan tombol di halaman pengaturan untuk ini
    // requestNotificationPermission(); // Jangan langsung panggil di sini, lebih baik di trigger user

    // Fungsi untuk menampilkan notifikasi
    // Ini adalah notifikasi *browser*, bukan notifikasi sistem operasi yang terjadwal
    function showNotification(title, options = {}) {
        if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
            });
        } else if (Notification.permission === 'denied') {
            console.warn('Tidak dapat menampilkan notifikasi: izin ditolak.');
            alert('Izinkan notifikasi di pengaturan browser Anda untuk menerima pengingat.');
        } else {
            // Jika izin belum diminta, minta izin terlebih dahulu
            requestNotificationPermission().then(() => {
                if (Notification.permission === 'granted') {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, options);
                    });
                }
            });
        }
    }

    // --- Scheduling Notifications (Lebih kompleks, butuh Service Worker) ---
    // Fungsi untuk menjadwalkan notifikasi menggunakan Service Worker
    async function scheduleMedicineNotifications() {
        if (Notification.permission !== 'granted') {
            console.warn('Tidak bisa menjadwalkan notifikasi: izin tidak diberikan.');
            return;
        }
        if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
            console.warn('Browser tidak mendukung Service Worker Notifications.');
            return;
        }
        if (!('getNotifications' in ServiceWorkerRegistration.prototype)) {
            console.warn('Browser tidak mendukung Service Worker getNotifications.');
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        const now = new Date();
        const reminders = getStoredData('medicineReminders', []);

        // Hapus notifikasi yang sudah ada untuk menghindari duplikasi
        const existingNotifications = await registration.getNotifications({ tag: 'medicine-reminder' });
        existingNotifications.forEach(notif => notif.close());

        reminders.forEach(reminder => {
            reminder.schedule.forEach(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const reminderDateTime = new Date();
                reminderDateTime.setHours(hours, minutes, 0, 0);

                // Hanya jadwalkan jika waktu belum lewat hari ini dan belum ditandai selesai
                const isThisScheduleTakenToday = reminder.takenDates.some(takenEntry => isToday(takenEntry.date) && takenEntry.time === time);

                if (isToday(reminderDateTime.toISOString()) && reminderDateTime.getTime() > now.getTime() && !isThisScheduleTakenToday) {
                    const timeToNotify = reminderDateTime.getTime() - now.getTime(); // Waktu dalam milidetik

                    // Perlu cara untuk menunda notifikasi dari Service Worker
                    // Ini adalah bagian yang kompleks dan memerlukan event di service-worker.js
                    // Untuk PWA yang benar-benar menjadwalkan notifikasi, biasanya melibatkan:
                    // 1. Mengirim data jadwal ke Service Worker.
                    // 2. Service Worker menggunakan settimeout atau alarm API (jika ada) untuk memicu notifikasi.
                    // 3. Atau, cara yang lebih modern: Web Periodic Background Sync API (masih dalam pengembangan)
                    //    atau Web Notifications API dengan 'showTrigger' (masih sangat terbatas dukungannya).

                    // Untuk saat ini, kita akan menggunakan setTimeout sederhana di main thread.
                    // Ini tidak akan berfungsi jika PWA ditutup sepenuhnya, tetapi akan bekerja jika PWA berjalan di latar belakang.
                    setTimeout(() => {
                        showNotification(`Waktunya Minum ${reminder.name}!`, {
                            body: `Jangan lupa minum ${reminder.name} dosis ${reminder.dose} pada pukul ${time}.`,
                            icon: 'icon-192x192.png',
                            badge: 'icon-192x192.png',
                            vibrate: [200, 100, 200],
                            tag: `medicine-reminder-${reminder.name.replace(/\s/g, '-')}-${time}`, // Unique tag for each reminder instance
                            renotify: true,
                            data: { reminderId: reminder.name + time } // Bisa dilewatkan data tambahan
                        });
                    }, timeToNotify);
                    console.log(`Pengingat untuk ${reminder.name} pada ${time} dijadwalkan.`);
                }
            });
        });
    }

    // Panggil penjadwalan notifikasi setiap kali pengingat diubah atau pada start aplikasi
    addMedicineForm.addEventListener('submit', (e) => {
        // ... (kode yang sudah ada) ...
        scheduleMedicineNotifications(); // Panggil setelah menambahkan pengingat
    });

    document.querySelectorAll('.mark-as-taken').forEach(button => {
        button.addEventListener('click', (e) => {
            // ... (kode yang sudah ada) ...
            scheduleMedicineNotifications(); // Panggil setelah menandai selesai
        });
    });

    // Panggil saat aplikasi dimuat dan setiap kali page home aktif
    showPage('#home'); // Initial call to update quick access and home summary
    scheduleMedicineNotifications(); // Initial schedule for notifications on load
    // Tambahkan event listener untuk meminta izin notifikasi di profil/pengaturan
    // Misalnya, tambahkan tombol di HTML: <button id="request-notif-perm">Aktifkan Notifikasi</button>
    // document.getElementById('request-notif-perm').addEventListener('click', requestNotificationPermission);

});
