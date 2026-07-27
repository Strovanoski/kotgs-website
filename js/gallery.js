// Victory Archive & Screenshot Gallery
let galleryItems = [
    {
        id: "1",
        title: "Dungeon Excursion Victory",
        date: "May 12, 2026",
        caption: "The vanguard squad clearing the deeper crypts during the test phase.",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: "2",
        title: "Sierra's The Realm Legacy (1996)",
        date: "Est. 1996",
        caption: "Founding members of the Knights of the Golden Spoon gathered in Sierra's online realm.",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80"
    }
];

function renderGalleryUI() {
    const container = document.getElementById('gallery-grid');
    if (!container) return;

    if (galleryItems.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic col-span-full text-center py-12">No memories recorded yet.</p>`;
        return;
    }

    container.innerHTML = galleryItems.map(item => `
        <div class="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl group hover:border-gold-800/60 transition-all">
            <div class="h-48 overflow-hidden bg-slate-950 relative">
                <img src="${item.imageUrl}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-gold-400 font-mono">${item.date}</div>
            </div>
            <div class="p-5">
                <h3 class="text-lg font-bold font-serif text-slate-100 group-hover:text-gold-300 transition-colors">${item.title}</h3>
                <p class="text-slate-400 text-xs mt-2 leading-relaxed">${item.caption}</p>
            </div>
        </div>
    `).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    renderGalleryUI();
});
