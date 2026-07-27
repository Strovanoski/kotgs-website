// Victory Archive & Screenshot Gallery with Officer Management
let defaultGallery = [
    {
        id: "gal-1",
        title: "Dungeon Excursion Victory",
        date: "May 12, 2026",
        caption: "The vanguard squad clearing the deeper crypts during the test phase.",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "gal-2",
        title: "Sierra's The Realm Legacy (1996)",
        date: "Est. 1996",
        caption: "Founding members of the Knights of the Golden Spoon gathered in Sierra's online realm.",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80"
    }
];

let galleryItems = JSON.parse(localStorage.getItem('kotgs_guild_gallery')) || defaultGallery;
let editingGalleryId = null;

async function fetchGalleryFromSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('guild_gallery')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
            galleryItems = data;
            localStorage.setItem('kotgs_guild_gallery', JSON.stringify(data));
        }
    } catch (e) {
        console.warn("Could not fetch gallery from Supabase:", e);
    }

    renderGalleryUI();
    renderOfficerGalleryManagerUI();
}

function renderGalleryUI() {
    const container = document.getElementById('gallery-grid');
    if (!container) return;

    if (galleryItems.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic col-span-full text-center py-12">No memories recorded yet.</p>`;
        return;
    }

    container.innerHTML = galleryItems.map(item => `
        <div class="bg-[#0a0f1d] rounded-xl overflow-hidden border border-gold-900/30 shadow-xl group hover:border-gold-800/60 transition-all">
            <div class="h-48 overflow-hidden bg-[#070b12] relative">
                <img src="${item.imageUrl || item.image_url}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="absolute bottom-2 right-2 bg-[#070b12]/80 px-2 py-0.5 rounded text-[10px] text-gold-400 font-mono">${item.date}</div>
            </div>
            <div class="p-5">
                <h3 class="text-lg font-bold font-serif text-slate-100 group-hover:text-gold-300 transition-colors">${item.title}</h3>
                <p class="text-slate-400 text-xs mt-2 leading-relaxed">${item.caption || ''}</p>
            </div>
        </div>
    `).join('');
}

function renderOfficerGalleryManagerUI() {
    const container = document.getElementById('officer-gallery-manager-list');
    if (!container) return;

    if (galleryItems.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic">No gallery items.</p>`;
        return;
    }

    container.innerHTML = galleryItems.map(item => `
        <div class="p-3 bg-[#070b12] rounded-lg border border-gold-900/30 flex items-center justify-between gap-3 text-xs">
            <div class="truncate">
                <span class="text-gold-500 font-bold">${item.title}</span>
                <span class="text-slate-400 block text-[10px]">${item.date}</span>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="openEditGallery('${item.id}')" class="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded border border-amber-800/40">
                    Edit
                </button>
                <button onclick="deleteGalleryItem('${item.id}')" class="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded border border-red-800/40">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openEditGallery(id) {
    const item = galleryItems.find(g => String(g.id) === String(id));
    if (!item) return;

    editingGalleryId = id;
    document.getElementById('gallery-form-title').textContent = "Edit Victory Memory";
    document.getElementById('new-gal-title').value = item.title || '';
    document.getElementById('new-gal-date').value = item.date || '';
    document.getElementById('new-gal-url').value = item.imageUrl || item.image_url || '';
    document.getElementById('new-gal-caption').value = item.caption || '';

    document.getElementById('publish-gal-btn').textContent = "Save Memory Changes";
    document.getElementById('cancel-gal-btn').classList.remove('hidden');
}

function cancelEditGallery() {
    editingGalleryId = null;
    document.getElementById('gallery-form-title').textContent = "Add Screenshot / Victory Memory";
    document.getElementById('new-gal-title').value = '';
    document.getElementById('new-gal-date').value = '';
    document.getElementById('new-gal-url').value = '';
    document.getElementById('new-gal-caption').value = '';
    document.getElementById('publish-gal-btn').textContent = "Add Memory to Gallery";
    document.getElementById('cancel-gal-btn').classList.add('hidden');
}

async function addNewGalleryItem() {
    const titleIn = document.getElementById('new-gal-title');
    const dateIn = document.getElementById('new-gal-date');
    const urlIn = document.getElementById('new-gal-url');
    const capIn = document.getElementById('new-gal-caption');

    if (!titleIn.value || !urlIn.value) {
        showNotification("Gallery item requires a Title and Image URL.", "error");
        return;
    }

    const payload = {
        title: titleIn.value.trim(),
        date: dateIn.value.trim() || "Campaign Event",
        image_url: urlIn.value.trim(),
        caption: capIn.value.trim()
    };

    if (editingGalleryId) {
        showNotification("Updating gallery memory...");

        const idx = galleryItems.findIndex(g => String(g.id) === String(editingGalleryId));
        if (idx !== -1) {
            galleryItems[idx] = { ...galleryItems[idx], ...payload, imageUrl: payload.image_url };
        }
        localStorage.setItem('kotgs_guild_gallery', JSON.stringify(galleryItems));

        if (!String(editingGalleryId).startsWith('gal-')) {
            const { error } = await supabaseClient.from('guild_gallery').update(payload).eq('id', editingGalleryId);
            if (error) console.error("Supabase update error:", error);
        } else {
            const { data: newRow } = await supabaseClient.from('guild_gallery').insert([payload]).select().maybeSingle();
            if (newRow && idx !== -1) {
                galleryItems[idx] = newRow;
                localStorage.setItem('kotgs_guild_gallery', JSON.stringify(galleryItems));
            }
        }

        showNotification("Gallery item updated successfully!");
        cancelEditGallery();
    } else {
        showNotification("Adding gallery memory...");

        const localObj = { id: 'gal-' + Date.now(), ...payload, imageUrl: payload.image_url };
        galleryItems.push(localObj);
        localStorage.setItem('kotgs_guild_gallery', JSON.stringify(galleryItems));

        const { data: newRow, error } = await supabaseClient.from('guild_gallery').insert([payload]).select().maybeSingle();
        if (newRow) {
            const idx = galleryItems.findIndex(g => g.id === localObj.id);
            if (idx !== -1) galleryItems[idx] = newRow;
            localStorage.setItem('kotgs_guild_gallery', JSON.stringify(galleryItems));
        }

        showNotification("New memory added to Gallery!");
        titleIn.value = "";
        dateIn.value = "";
        urlIn.value = "";
        capIn.value = "";
    }

    renderGalleryUI();
    renderOfficerGalleryManagerUI();
}

async function deleteGalleryItem(id) {
    if (!confirm("Are you sure you want to delete this screenshot/memory?")) return;

    showNotification("Deleting gallery item...");

    galleryItems = galleryItems.filter(g => String(g.id) !== String(id));
    localStorage.setItem('kotgs_guild_gallery', JSON.stringify(galleryItems));

    if (!String(id).startsWith('gal-')) {
        const { error } = await supabaseClient.from('guild_gallery').delete().eq('id', id);
        if (error) console.error("Supabase delete error:", error);
    }

    showNotification("Gallery item deleted.");
    renderGalleryUI();
    renderOfficerGalleryManagerUI();
}

window.addEventListener('DOMContentLoaded', () => {
    fetchGalleryFromSupabase();
});
