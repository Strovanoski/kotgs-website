// Resource Links & Guide Hub with Officer Management
let guildResourcesList = [
    {
        id: "1",
        title: "Monsters & Memories Official Portal",
        category: "Game Access",
        url: "https://monstersandmemories.com",
        description: "Official game website, news updates, and test schedule notifications."
    },
    {
        id: "2",
        title: "Account & Game Launcher",
        category: "Game Access",
        url: "https://account.monstersandmemories.com",
        description: "Download the latest client launcher and manage your testing account."
    },
    {
        id: "3",
        title: "Community Map & World Atlas",
        category: "Tools & Guides",
        url: "https://monstersandmemories.com",
        description: "Interactive zone maps, dungeon layouts, and point-of-interest markers."
    },
    {
        id: "4",
        title: "Class & Item Database",
        category: "Tools & Guides",
        url: "https://monstersandmemories.com",
        description: "Reference tables for spell lines, class attributes, and crafting components."
    }
];

let editingResourceId = null;

async function fetchResourcesFromSupabase() {
    const { data, error } = await supabaseClient
        .from('guild_resources')
        .select('*')
        .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
        guildResourcesList = data;
    }

    renderResourcesUI();
    renderOfficerResourcesManagerUI();
}

function renderResourcesUI() {
    const container = document.getElementById('resources-grid');
    if (!container) return;

    container.innerHTML = guildResourcesList.map(res => `
        <a href="${res.url}" target="_blank" class="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-gold-700/60 shadow-xl transition-all block group">
            <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-gold-500 uppercase tracking-widest bg-gold-950 px-2 py-0.5 rounded border border-gold-900/50">${res.category}</span>
                <span class="text-slate-500 group-hover:text-gold-400 transition-colors">↗</span>
            </div>
            <h3 class="text-lg font-bold font-serif text-slate-100 group-hover:text-gold-300 transition-colors">${res.title}</h3>
            <p class="text-slate-400 text-xs mt-2 leading-relaxed">${res.description}</p>
        </a>
    `).join('');
}

function renderOfficerResourcesManagerUI() {
    const container = document.getElementById('officer-resource-manager-list');
    if (!container) return;

    if (guildResourcesList.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic">No resource links added.</p>`;
        return;
    }

    container.innerHTML = guildResourcesList.map(res => `
        <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div class="truncate">
                <span class="text-gold-500 font-bold">[${res.category}]</span>
                <span class="text-slate-200 font-bold ml-1">${res.title}</span>
                <span class="text-slate-500 block text-[10px] truncate">${res.url}</span>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="openEditResource('${res.id}')" class="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded border border-amber-800/40">
                    Edit
                </button>
                <button onclick="deleteResource('${res.id}')" class="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded border border-red-800/40">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openEditResource(id) {
    const res = guildResourcesList.find(r => r.id === id);
    if (!res) return;

    editingResourceId = id;
    document.getElementById('resource-form-title').textContent = "Edit Resource Link";
    document.getElementById('new-res-title').value = res.title || '';
    document.getElementById('new-res-category').value = res.category || 'Tools & Guides';
    document.getElementById('new-res-url').value = res.url || '';
    document.getElementById('new-res-desc').value = res.description || '';

    document.getElementById('publish-res-btn').textContent = "Save Resource Changes";
    document.getElementById('cancel-res-btn').classList.remove('hidden');
}

function cancelEditResource() {
    editingResourceId = null;
    document.getElementById('resource-form-title').textContent = "Add New Resource Link";
    document.getElementById('new-res-title').value = '';
    document.getElementById('new-res-url').value = '';
    document.getElementById('new-res-desc').value = '';
    document.getElementById('publish-res-btn').textContent = "Add Resource Link";
    document.getElementById('cancel-res-btn').classList.add('hidden');
}

async function addNewResource() {
    const titleIn = document.getElementById('new-res-title');
    const catIn = document.getElementById('new-res-category');
    const urlIn = document.getElementById('new-res-url');
    const descIn = document.getElementById('new-res-desc');

    if (!titleIn.value || !urlIn.value) {
        showNotification("Resource requires a Title and URL.", "error");
        return;
    }

    if (editingResourceId) {
        showNotification("Updating resource...");
        await supabaseClient.from('guild_resources').update({
            title: titleIn.value.trim(),
            category: catIn.value,
            url: urlIn.value.trim(),
            description: descIn.value.trim()
        }).eq('id', editingResourceId);

        showNotification("Resource link updated successfully!");
        cancelEditResource();
    } else {
        showNotification("Adding resource...");
        await supabaseClient.from('guild_resources').insert([{
            title: titleIn.value.trim(),
            category: catIn.value,
            url: urlIn.value.trim(),
            description: descIn.value.trim()
        }]);

        showNotification("New resource link added!");
        titleIn.value = "";
        urlIn.value = "";
        descIn.value = "";
    }

    await fetchResourcesFromSupabase();
}

async function deleteResource(id) {
    if (!confirm("Are you sure you want to delete this resource link?")) return;

    showNotification("Deleting resource...");
    await supabaseClient.from('guild_resources').delete().eq('id', id);
    showNotification("Resource link deleted.");
    await fetchResourcesFromSupabase();
}

window.addEventListener('DOMContentLoaded', () => {
    fetchResourcesFromSupabase();
});
