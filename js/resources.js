// Resource Links & Guide Hub
const GUILD_RESOURCES_DATA = [
    {
        title: "Monsters & Memories Official Portal",
        category: "Game Access",
        url: "https://monstersandmemories.com",
        description: "Official game website, news updates, and test schedule notifications."
    },
    {
        title: "Account & Game Launcher",
        category: "Game Access",
        url: "https://account.monstersandmemories.com",
        description: "Download the latest client launcher and manage your testing account."
    },
    {
        title: "Community Map & World Atlas",
        category: "Tools & Guides",
        url: "https://monstersandmemories.com",
        description: "Interactive zone maps, dungeon layouts, and point-of-interest markers."
    },
    {
        title: "Class & Item Database",
        category: "Tools & Guides",
        url: "https://monstersandmemories.com",
        description: "Reference tables for spell lines, class attributes, and crafting components."
    }
];

function renderResourcesUI() {
    const container = document.getElementById('resources-grid');
    if (!container) return;

    container.innerHTML = GUILD_RESOURCES_DATA.map(res => `
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

window.addEventListener('DOMContentLoaded', () => {
    renderResourcesUI();
});
