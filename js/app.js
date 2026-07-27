// Main App Helpers & Initialization
let currentUserProfile = null;

window.addEventListener('DOMContentLoaded', async () => {
    localStorage.removeItem('gms_roster');

    populateClassSelects();
    await fetchRosterFromSupabase();
    await fetchClassPrioritiesFromSupabase();
    await fetchEventsFromSupabase();
    await fetchNewsFromSupabase();

    const { data: { session } } = await supabaseClient.auth.getSession();
    await updateAuthUI(session);

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        await updateAuthUI(session);
    });
});

function showNotification(msg, type = "success") {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 text-sm font-medium ${
        type === "success" 
            ? "bg-slate-900 border-gold-600/50 text-gold-200" 
            : "bg-slate-900 border-red-500/50 text-red-200"
    }`;
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
    const targetSection = document.getElementById(`view-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    document.querySelectorAll('header nav button').forEach(btn => {
        btn.className = "px-4 py-2 rounded-md text-sm font-medium transition-colors text-slate-300 hover:text-gold-400 hover:bg-slate-800/30";
    });
    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.className = "px-4 py-2 rounded-md text-sm font-medium transition-colors text-gold-400 bg-slate-800/60 border border-gold-900/30";
    }
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function populateClassSelects() {
    const rosterFilterSelect = document.getElementById('roster-class-filter');
    const appClassSelect = document.getElementById('app-class');
    const profileClassSelect = document.getElementById('profile-class');

    if (rosterFilterSelect) rosterFilterSelect.innerHTML = `<option value="All">All Classes</option>`;
    if (appClassSelect) appClassSelect.innerHTML = `<option value="" disabled selected>Choose your calling...</option>`;
    if (profileClassSelect) profileClassSelect.innerHTML = ``;

    MM_CLASSES.forEach(cls => {
        if (rosterFilterSelect) {
            const opt = document.createElement('option');
            opt.value = cls; opt.textContent = cls;
            rosterFilterSelect.appendChild(opt);
        }
        if (appClassSelect) {
            const opt = document.createElement('option');
            opt.value = cls; opt.textContent = cls;
            appClassSelect.appendChild(opt);
        }
        if (profileClassSelect) {
            const opt = document.createElement('option');
            opt.value = cls; opt.textContent = cls;
            profileClassSelect.appendChild(opt);
        }
    });
}
